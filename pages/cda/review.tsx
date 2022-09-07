import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { SigningCosmosClient } from "@cosmjs/launchpad";
import { Window as KeplrWindow } from '@keplr-wallet/types'

import { fillContract } from "../../lib/utils/pdf";
import styles from "../../styles/Home.module.css";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"
import { chainConfig } from "../../lib/chain/chain";
import { MsgCreateCDA } from "../../lib/chain/generated/archive/archive.cda/module/types/cda/tx";
import { Ownership } from "../../lib/chain/generated/archive/archive.cda";
import { txClient } from "../../lib/chain/generated/archive/archive.cda/module"

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReviewPage: NextPage = () => {
    const router = useRouter()

    // Keplr Helpers
    const [wallet, setWallet] = useState<SigningCosmosClient | undefined>()
    const [keplrWindow, setKeplrWindow] = useState<Window & KeplrWindow>()

    // PDF state variables
    // TODO: Manage these data structures better
    const [pdfUrl, setPdfUrl] = useState<string | undefined>()
    const [pdfString, setPdfString] = useState<string | undefined>()
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | undefined>()
    const [pageCount, setPageCount] = useState<number>()

    useEffect(() => {
        const fetchContract = async () => {
            const bytes = await fillContract()
            if (!bytes) { 
                console.log("fillContract has failed. No bytes returned")
                return
            }

            setPdfUrl(
                window.URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
            )

            const stringBytes = bytesToUtf8(bytes)
            setPdfString(stringBytes)
            setPdfBytes(bytes)
        }
        fetchContract()
    }, [])

    const handleNext = () => {
        router.push('/cda/review')
    }

    const submit = async () => {
        // Ensure pdf uploaded and wallet connected
        if (!pdfBytes) {
            throw new Error("pdf bytes not set!")
        }
        if (!keplrWindow || // TODO: Display popup to download or connect with Keplr
            !keplrWindow.keplr) { return }

        // Upload PDF to IPFS and S3
        const ipfs = await getIPFSClient()
        const ipfsPromise = ipfs.add(pdfBytes, { pin: true })
        const s3Promise = api.post('/cda/contract', { pdfString })
        const [ipfsResult, s3Response] = await Promise.all([ipfsPromise, s3Promise])
        if (!s3Response.ok) { 
            throw new Error("s3 upload failed!")
        }
        
        // Store CID and S3 key in CDA object
        const cda = fetchOrSetTempCDA()
        const s3Json = await s3Response.json()
        cda.s3Key = s3Json.key as string
        cda.contractCid = ipfsResult.cid.toString()

        // Store CDA in Postgres
        const dbResponse = await api.post('/cda/cda', { cda })
        if (!dbResponse.ok) {
            throw new Error("postgres post failed")
        }

        const dbJson = await dbResponse.json()
        // const cdaId = dbJson.id as string

        // TODO: Figure out best way to do this.
        await keplrWindow.keplr.experimentalSuggestChain(chainConfig)
        await keplrWindow.keplr.enable('casper-1')

        const signer = keplrWindow.keplr.getOfflineSigner('casper-1')
        const [account] = await signer.getAccounts()

        const msg: MsgCreateCDA = {
            creator: account.address,
            cid: "QmSrnQXUtGqsVRcgY93CdWXf8GPE9Zjj7Tg3SZUgLKDN5W",
            ownership: [{
                owner: account.address,
                ownership: 100,
            } as Ownership],
            expiration: 4818163585000,
        }

        // TODO: Add message to sign the CDA

        const client = await txClient(signer, {addr: "http://localhost:26657"})
        const msgs = [client.msgCreateCDA(msg)]
        const tx = await client.signAndBroadcast(msgs) 
        
        // Check if the transaction succeeded
        if (tx.code != 0) {
            alert("Issue broadcasting transaction...")
        }
        console.log("Success! Tx hash:", tx.transactionHash)
        

    }

    const onDocumentLoadSuccess = (numPages: number) => {
        setPageCount(numPages)
    }

    if (!pdfUrl) {
        return <h1>Filling contract with user details...</h1>
    }

    return (
        <div className={styles.main}>
            <h1>Review the assignment of rights contract below</h1>
            
            <p>The legal contract will be finalized once all parties have signed with their ARC-H1VE wallets.</p>

            {/* Data entry section */}
            <div className={styles.container}>
                <Document
                    file={pdfUrl}
                    onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf.numPages)}
                    onLoadError={(err) => console.error(err)}
                >
                    {Array.from({ length: pageCount || 0 }, (_, idx) => (
                        <Page 
                            key={`page_${idx}`}
                            pageIndex={idx}
                            renderAnnotationLayer={false}
                            renderTextLayer={true}
                        />
                    ))}
                </Document>

                <button
                    className={styles.button}
                    onClick={submit}
                >
                    {"Sign & Submit"}
                </button>
            </div>
        </div>
    )
}

export default ReviewPage