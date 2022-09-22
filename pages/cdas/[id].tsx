import { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";
import { decodeFromBase64 } from "pdf-lib";
import { useEffect, useState } from "react";

import { Document, Page, pdfjs } from "react-pdf";
import { query } from "../../lib/postgres";
import api from "../../lib/utils/api-client";
import { getSessionId } from "../../lib/utils/cookies";

import styles from "../../styles/Home.module.css";

interface Props {
    cdaAndContracts: CdaAndContractRow
}

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const CdaPage: NextPage<Props> = ({ cdaAndContracts }) => {
    const router = useRouter()
    const id = router.query.id as string

    const [pdfBytes, setPdfBytes] = useState<Uint8Array | undefined>()
    const [pageCount, setPageCount] = useState<number>()

    // TODO: Add a hook to use Keplr better

    const onDocumentLoadSuccess = (numPages: number) => {
        setPageCount(numPages)
    }

    // Initial Load
    useEffect(() => {

        /*
        TODO:
         - Fetch owner information from Postgres
        */

        const fetchPrereqs = async () => {
            // Fetch CDAs record, joined with Contracts record from Postgres
            const queryResult = cdaAndContracts
            switch(queryResult.status) {
                case "draft":
                    // Idk dude... return maybe?
                case "pending":
                    const s3Key = queryResult.pending_s3_key || queryResult.original_s3_key
                    const res = await api.get('/cda/contract', { s3Key })
                    const data = (await res.json()).data as string
                    const bytes = decodeFromBase64(data)
                    setPdfBytes(bytes)
            }

            // Then fetch all owners

            // Do we need to query the blockchain state?
                // yes, should we use an indexer tho?

        }
        fetchPrereqs()
    }, [])

    if (!pdfBytes) {
        return <h1>Loading...</h1>
    }

    return (
        <div className={styles.main}>
            <h1>{`Copyright Digital Asset #${id}`}</h1>

            {/* Show the contract's status */}

            {/* PDF View Component */}
            <div className={styles.container}>
                <Document
                    file={{ data: pdfBytes }}
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
            </div>

            {/* 
            
            Owners section 
                - Show signing status
                - Show name 
                - Show wallet address

            */}

            {/* 
            
            If the requesting user hasn't signed, show a button to sign
            
            */}
        </div>
    )
}

export async function getServerSideProps(ctx: NextPageContext) {
    const cdaId = ctx.query.id as string
    const sessionId = getSessionId(ctx)
    console.log(sessionId)
    if (!sessionId) {
        // redirect to login page
        return {
            redirect: {
                permanent: false,
                destination: '/login'
            },
            props: {}
        }
    }

    if (!cdaId) {
        return {
            props: {}
        }
    }

    const cdaAndContracts = await fetchCdaAndContracts(cdaId)

    return {
        props: {
            cdaAndContracts
        }
    }

}

const fetchCdaAndContracts = async (id: string) => {
    // TODO: Name columns to ensure correct parsing
    const text = "SELECT cda.id as cda_id, cda.status as status, cda.creator_wallet as creator_wallet, cda.contract_id as contract_id, cda.created_at as created_at, \
    con.cid as cid, con.original_s3_key as original_s3_key, con.pending_s3_key as pending_s3_key, con.final_s3_key as final_s3_key \
    FROM CDAs cda \
    LEFT JOIN contracts con \
        on cda.contract_id = con.id \
    WHERE cda.id = $1"
    const rows = await query<CdaAndContractRow>(text, [id])
    console.log("Rows:", rows)
    if (!rows || rows?.length != 1) {
        return null
    }

    rows[0].created_at = rows[0].created_at.toString()
    return rows[0]
}

type CdaAndContractRow = {
    // CDAs(id)
    cda_id: string
    // CDAs(status)
    status: "draft" | "pending" | "finalized"
    // CDAs(creator_wallet)
    creator_wallet: string
    // CDAs(contract_id) & Contracts(id)
    contract_id: string
    // CDAs(created_at)
    created_at: string // What is this type?
    // Contracts(cid)
    cid: string
    // Contracts(original_s3_key)
    original_s3_key: string
    // Contracts(pending_s3_key)
    pending_s3_key: string | undefined
    // Contracts(final_s3_key)
    final_s3_key: string | undefined
}

export default CdaPage