import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";

import { fillContract } from "../../lib/utils/pdf";
import styles from "../../styles/Home.module.css";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReviewPage: NextPage = () => {
    const router = useRouter()
    const [pdfUrl, setPdfUrl] = useState<string | undefined>()
    const [pdfString, setPdfString] = useState<string | undefined>()
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | undefined>()
    // const [pdf]
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
        if (!pdfBytes) {
            throw new Error("pdf bytes not set!")
        }

        console.log("Uploading to IPFS & S3")

        const ipfs = await getIPFSClient()
        const ipfsPromise = ipfs.add(pdfBytes, { pin: true })
        const s3Promise = api.post('/cda/contract', { pdfString })
        const [ipfsResult, s3Response] = await Promise.all([ipfsPromise, s3Promise])

        console.log("IPFS & S3 responded")
        
        if (!s3Response.ok) { 
            throw new Error("s3 upload failed!")
        }
        
        // Store CID and S3 key in CDA object
        const cda = fetchOrSetTempCDA()
        const s3Json = await s3Response.json()
        cda.s3Key = s3Json.key as string
        cda.contractCid = ipfsResult.cid.toString()

        console.log("CDA Payload:", cda)

        // Store CDA in db
        const dbResponse = await api.post('/cda/cda', { cda })

        if (!dbResponse.ok) {
            throw new Error("mongodb post failed")
        }

        const mongoJson = await dbResponse.json()
        const cdaId = mongoJson.id as string

        console.log("cdaId:", cdaId)

        // TODO:
            // Sign with wallet
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