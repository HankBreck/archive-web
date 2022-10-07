import { useEffect, useState } from "react";
import { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";

import { Ownership } from "archive-client-ts/archive.cda/types"
import { MsgCreateCDA } from 'archive-client-ts/archive.cda/types/cda/tx'
import { Coin, StdFee } from "@cosmjs/stargate";
import { Document, Page, pdfjs } from "react-pdf";
import { decodeFromBase64 } from "pdf-lib";

import api from "../../lib/utils/api-client";
import { PostBody } from "../api/cda/contract";
import { getArchiveClient } from '../../lib/utils/archive'
import { fetchOrSetTempCDA, fetchOrSetUser, getSessionId } from "../../lib/utils/cookies";
import { getIPFSClient } from "../../lib/utils/ipfs";
import { fillContract, fillContractCdaId, fillContractNames, UserFields } from "../../lib/utils/pdf";

import styles from "../../styles/Home.module.css";
import useKeplr from "../../lib/chain/useKeplr";
import { LocalCDA } from "../../models/helpers";
import { transaction } from "../../lib/postgres";
import { isSessionValid } from "../../lib/session";

interface Props {
    owners: UserFields[]
}

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReviewPage: NextPage<Props> = ({ owners }) => {
    const router = useRouter()

    // Keplr Helpers
    const [keplr, signer] = useKeplr()

    // PDF state variables
    const [pdfUrl, setPdfUrl] = useState<string | undefined>()
    const [pdfString, setPdfString] = useState<string | undefined>()
    const [pageCount, setPageCount] = useState<number>()

    useEffect(() => {
        const fetchContract = async () => {
            let basePdf = await fillContract()
            if (!basePdf) { 
                console.log("fillContract has failed. No bytes returned")
                return
            }
            let pdf = await fillContractNames(owners, basePdf)
            const bytes = decodeFromBase64(pdf)

            setPdfString(pdf)
            setPdfUrl(
                window.URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
            )
        }
        fetchContract()
    }, [])

    const publishToChain = async (cda: LocalCDA): Promise<[number, string]> => {
        if (!keplr || !signer) { 
            throw new Error("Keplr window missing!")
        }

        // TODO: Ensure cda.CreatorWalletAddress === account.address
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
        if (result.code != 0 || !result.rawLog) {
            console.log(result)
            throw new Error("Issue broadcasting transaction.")
        }
        const rawLog = JSON.parse(result.rawLog) as RawLog
        const cdaId = extractIdFromRawLog(rawLog)

        return [cdaId, result.transactionHash]
    }

    const submit = async () => {
        // Ensure pdf uploaded and wallet connected
        if (!pdfString) {
            throw new Error("pdf string not set!")
        }

        // Upload PDF to IPFS and S3
        const ipfsPromise = api.post('/ipfs', { content: pdfString })
            .then(res => res.json())
            .catch(console.error)
        const s3Promise = api.put('/cda/contract', { pdfString })
            .then(res => res.json())
            .catch(console.error)
        const [ipfsResult, s3Json] = await Promise.all([ipfsPromise, s3Promise])
        
        // Load CDA and pubish to the blockchain
        const cda = fetchOrSetTempCDA()
        cda.s3Key = s3Json.key as string
        cda.contractCid = ipfsResult.cid
        const [onchainId, txHash] = await publishToChain(cda)

        // Update the CDA object and store in Postgres
        cda.onchainId = onchainId
        const dbResponse = await api.post('/cda/cda', { cda })
        if (!dbResponse.ok) {
            throw new Error("postgres post failed")
        }
        const { cda_id, contract_id } = await dbResponse.json() 
        if (typeof contract_id === 'undefined') {
            throw new Error("contract_id cannot be undefined")
        }

        // Should this be the TX hash? CdaId can be changed, but txhash is immutable by consensus
        const newPdf = await fillContractCdaId(`${cda.onchainId}`, txHash, pdfString)

        // Update store the updated contract in S3 & update Postgres
        const request: PostBody = {
            pdfString: newPdf,
            updateField: "pending_s3_key",
            contractId: contract_id,
        }
        const contractRes = await api.post('/cda/contract', request)
        if (!contractRes.ok) {
            throw new Error("Could not store the new contract in S3.")
        }

        // Finally... we can move to the next page
        router.push(`/cdas/${cda_id}`)
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
                    className={styles.pdfDoc}
                    onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf.numPages)}
                    onLoadError={(err) => console.error(err)}
                >
                    {Array.from({ length: pageCount || 0 }, (_, idx) => (
                        <Page 
                            key={`page_${idx}`}
                            height={842}
                            className={styles.pdfPage}
                            pageNumber={idx+1}
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

export async function getServerSideProps(ctx: NextPageContext) {
    const sessionId = getSessionId(ctx)
    const cda = fetchOrSetTempCDA(ctx)
    const user = fetchOrSetUser(ctx)

    // Ensure session is valid
    if (!sessionId || !(await isSessionValid(sessionId, user.wallet_address))) { 
        return { redirect: { permanent: false, destination: '/login' }, props: {} } 
    }

    // Fetch owner names to use in contract
    const queries = []
    for (let owner of cda.owners) {
        queries.push({
            text: "SELECT wallet_address, legal_name FROM Users WHERE wallet_address = $1",
            values: [owner.owner]
        })
    }
    const result = await transaction<UserFields>(queries)
    const owners = result.map((rows) => { return rows.length > 0 ? rows[0] : null })

    return { props: { owners } }
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
    return parseInt(idAttr.value)
}

export default ReviewPage