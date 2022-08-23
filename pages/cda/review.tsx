import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";

import { fillContract } from "../../lib/utils/pdf";
import styles from "../../styles/Home.module.css";

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ReviewPage: NextPage = () => {
    const router = useRouter()
    const [pdfUrl, setPdfUrl] = useState<string | undefined>()
    const [pageCount, setPageCount] = useState<number>()

    useEffect(() => {
        const fetchContract = async () => {
            const pdfBytes = await fillContract()
            if (!pdfBytes) { 
                console.log("fillContract has failed. No bytes returned")
                return
            }
            setPdfUrl(
                window.URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
            )
        }
        fetchContract()
    }, [])

    const handleNext = () => {
        router.push('/cda/review')
    }

    const submit = () => {
        // TODO:
            // Upload to IPFS 
            // Store in DB for updating after all signing
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
                    onLoadProgress={(data) => console.log(`${data.loaded} / ${data.total}`)}
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