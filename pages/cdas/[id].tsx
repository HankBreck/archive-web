import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Document, Page, pdfjs } from "react-pdf";

import styles from "../../styles/Home.module.css";

const CdaPage: NextPage = () => {
    const router = useRouter()
    const { id } = router.query

    const [pdfUrl, setPdfUrl] = useState<string | undefined>()
    const [pageCount, setPageCount] = useState<number>()

    // TODO: Add a hook to use Keplr better

    const onDocumentLoadSuccess = (numPages: number) => {
        setPageCount(numPages)
    }

    // Initial Load
    useEffect(() => {

        /*

        TODO:
         - First, authenticate user (https://daily.dev/blog/authentication-in-nextjs)
         - Fetch CDA record from Postgres
         - Fetch owner information from Postgres
         - Fetch PDF bytes from S3

        */
    }, [])

    return (
        <div className={styles.main}>
            <h1>{`Copyright Digital Asset #${id}`}</h1>

            {/* Show the contract's status */}

            {/* PDF View Component */}
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
            </div>

            {/* 
            
            Owners section 
                - Show name with wallet address
                - Show signing status
                - 

            */}

            {/* 
            
            If the requesting user hasn't signed, show a button to sign
            
            */}
        </div>
    )
}

export default CdaPage