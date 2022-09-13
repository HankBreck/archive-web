import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { Window as KeplrWindow } from '@keplr-wallet/types'

import { fillContract, fillContractCdaId } from "../../lib/utils/pdf";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"

import { queryClient, txClient } from "../../lib/chain/generated/archive/archive.cda/module"
import { MsgCreateCDA } from "../../lib/chain/generated/archive/archive.cda/module/types/cda/tx";
import { Ownership } from "../../lib/chain/generated/archive/archive.cda";
import { chainConfig } from "../../lib/chain/chain";

import styles from "../../styles/Home.module.css";
import { StdFee } from "@cosmjs/stargate";

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReviewPage: NextPage = () => {
    const router = useRouter()

    // Keplr Helpers
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
        router.push('/create/review')
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

        // TODO: Ensure cda.CreatorWalletAddress === account.address

        // Upload PDF to IPFS and S3
        const ipfs = await getIPFSClient()
        const ipfsPromise = ipfs.add(pdfBytes, { pin: true, timeout: 5000 }) // 5 second timeout
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
        // TODO: Probably want to connect before uploading to postgres
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
            // TODO: Don't hardcode gas fees
            gas: "80000",
        } as StdFee
        const result = await client.signAndBroadcast(msgs, {fee})

        // Check if the transaction succeeded
        if (result.code != 0) {
            console.log(result)
            throw new Error("Issue broadcasting transaction.")
        }

        const qClient = await queryClient()

        // What is the case when cda.CreatorWalletAddress != account.address
        // What is the case when a wallet is used create two CDAs at the same time?
        const res = await qClient.queryCdasOwned(account.address, {
            "pagination.limit": '1',
            "pagination.reverse": true,
        })
        if (res.status != 200) {
            throw new Error("CDA Query failed! Unable to find the CDA id")
        }
        const {ids} = res.data
        if (ids?.length != 1) {
            throw new Error("CDA Query failed! Unable to find the CDA id")
        }

        const cdaId = ids[0]
        console.log("CDA Id", cdaId)


        // Should this be the TX hash?
            // cdaId can be changed, but txhash is immutable by consensus
        const newPdfBytes = await fillContractCdaId(cdaId, pdfBytes)
        setPdfUrl(
            window.URL.createObjectURL(new Blob([newPdfBytes], { type: 'application/pdf' }))
        )

        // TODO: save the new bytes to S3
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