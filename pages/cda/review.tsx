import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { SigningCosmosClient } from "@cosmjs/launchpad";
import { Window as KeplrWindow } from '@keplr-wallet/types'

import { fillContract, fillContractCdaId } from "../../lib/utils/pdf";
import styles from "../../styles/Home.module.css";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"
import { chainConfig } from "../../lib/chain/chain";
import { MsgCreateCDA, MsgCreateCDAResponse } from "../../lib/chain/generated/archive/archive.cda/module/types/cda/tx";
import { Ownership } from "../../lib/chain/generated/archive/archive.cda";
import { txClient } from "../../lib/chain/generated/archive/archive.cda/module"
import { StdFee } from "@cosmjs/stargate";

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
        
        // Load the Keplr window
        if (!keplrWindow?.keplr) {
            console.log("setting keplrWindow")
            setKeplrWindow(window as Window & KeplrWindow )
            console.log("set keplrWindow")
        }
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
            !keplrWindow.keplr) { 
                throw new Error("Keplr window missing!")
             }

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

        // TODO: Figure out best way to do this.
        await keplrWindow.keplr.experimentalSuggestChain(chainConfig)
        await keplrWindow.keplr.enable('casper-1')

        const signer = keplrWindow.keplr.getOfflineSigner('casper-1')
        const [account] = await signer.getAccounts()

        const msg: MsgCreateCDA = {
            creator: account.address,
            cid: cda.contractCid,
            ownership: cda.owners as Ownership[],
            expiration: 4818163585000, // TODO: Add field to set contract terms
        }

        // TODO: Add message for other parties to sign the CDA
        console.log(account.address)

        const client = await txClient(signer, {addr: "http://localhost:26657"})
        const msgs = [client.msgCreateCDA(msg)]
        const fee = {
            amount: [],
            gas: "75000"
        } as StdFee
        const tx = await client.signAndBroadcast(msgs, {fee})

        
        // Check if the transaction succeeded
        if (tx.code != 0) {
            console.log(tx.rawLog)
            console.log(tx.code)
            console.log(tx.data)
            throw new Error("Issue broadcasting transaction.")
        }


        // TODO: save the new bytes
        // TODO: Figure out how to get cda ID from Cosmos



        console.log("TX", tx)
        console.log("TX raw log", tx.rawLog)

        // Ensure msg response was returned
        // if (!tx.data) {
        //     throw new Error("Msg response data expected.")
        // }
        // const msgRes = MsgCreateCDAResponse.decode(tx.data[0].data)
        console.log("Success! CDA ID:", tx.data)
        
        // const newPdfBytes = await fillContractCdaId(msgRes.id.toString()!, pdfBytes)
        // setPdfUrl(
        //     window.URL.createObjectURL(new Blob([newPdfBytes], { type: 'application/pdf' }))
        // )
        
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