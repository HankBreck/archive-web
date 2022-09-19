import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { Window as KeplrWindow } from '@keplr-wallet/types'
import { Coin, isDeliverTxSuccess, StdFee } from "@cosmjs/stargate";

import { fillContract, fillContractCdaId } from "../../lib/utils/pdf";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"

import { Ownership } from "archive-client-ts/archive.cda/types"
import { chainConfig } from "../../lib/chain/chain";

import styles from "../../styles/Home.module.css";

import { getArchiveClient } from '../../lib/utils/archive'
import { MsgCreateCDA } from 'archive-client-ts/archive.cda/types/cda/tx'
import { PostBody } from "../api/cda/contract";

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
            setKeplrWindow(window as Window & KeplrWindow )
            console.log("set keplrWindow")
        }
    }, [])

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
        const s3Promise = api.put('/cda/contract', { pdfString })
            .then(res => res.json())
            .catch(console.error)
        const [ipfsResult, s3Json] = await Promise.all([ipfsPromise, s3Promise])
        
        // Update the CDA and store in Postgres
        const cda = fetchOrSetTempCDA()
        cda.s3Key = s3Json.key as string
        cda.contractCid = ipfsResult.cid.toString()
        const dbResponse = await api.post('/cda/cda', { cda })
        // TODO: Figure out error handling here. It currently displays success, even if the DB post failed
        if (!dbResponse.ok) {
            throw new Error("postgres post failed")
        }
        const { contract_id } = await dbResponse.json() 
        if (typeof contract_id === 'undefined') {
            throw new Error("contract_id cannot be undefined")
        }


        // TODO: Figure out best way to do this.
        // TODO: Probably want to connect before uploading to postgres
        await keplrWindow.keplr.experimentalSuggestChain(chainConfig)
        await keplrWindow.keplr.enable('casper-1')
        const signer = keplrWindow.keplr.getOfflineSigner('casper-1')
        const [account] = await signer.getAccounts()
        const archiveClient = getArchiveClient(signer)

        // Build the blockchain message to broadcast
        const msg: MsgCreateCDA = {
            creator: account.address,
            cid: cda.contractCid,
            ownership: cda.owners as Ownership[],
            expiration: 4818163585000, // TODO: Add field to set contract terms
        }
        const fee = {
            amount: [{
                denom: 'token',
                amount: '100000'
            } as Coin],
            // TODO: Don't hardcode gas fees
            gas: "100000",
        } as StdFee
        const tx = archiveClient.ArchiveCda.tx.msgCreateCDA({ value: msg })
        const result = await archiveClient.signAndBroadcast([tx], fee, "")

        // Check if the transaction succeeded
        if (result.code != 0
            || !result.rawLog) {
            console.log(result)
            throw new Error("Issue broadcasting transaction.")
        }
        const rawLog = JSON.parse(result.rawLog) as RawLog
        const cdaId = extractIdFromRawLog(rawLog)
        console.log("CDA Id", cdaId)

        // Should this be the TX hash? CdaId can be changed, but txhash is immutable by consensus
        const newPdfBytes = await fillContractCdaId(cdaId, pdfBytes)

        // Update store the updated contract in S3 & update Postgres
        const request: PostBody = {
            pdfString: bytesToUtf8(newPdfBytes),
            updateField: "pending_s3_key",
            contractId: contract_id,
        }
        const contractRes = await api.post('/cda/contract', request)
        if (!contractRes.ok) {
            throw new Error("Could not store the new contract in S3.")
        }

        // Finally... we can move to the next page
        router.push('/create/success')
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

type RawLog = [{ 
    events: [{
        type: string
        attributes: {
            key: string
            value: string
        }[]
    }]
}]

// TODO: make this more general (expect changes in attribute order)
const extractIdFromRawLog = (rawLog: RawLog) => {
    const idAttr = rawLog[0].events[0].attributes[3]
    if (idAttr.key !== 'cda-id') {
        throw new Error('Cda ID not found in logs')
    }
    return idAttr.value
}

export default ReviewPage