import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { PDFDocument } from 'pdf-lib'

import { fillContract } from "../../lib/utils/pdf";
import styles from "../../styles/Home.module.css";

const ReviewPage: NextPage = () => {
    const router = useRouter()
    const [isPdfLoaded, setIsPdfLoaded] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(false)

    useEffect(() => {
        const setPdfBytes = async () => {
            const pdfBytes = await fillContract()
            if (!pdfBytes) { 
                // alert('A serious error has occurred') // TODO: Pass errors better
                console.log("no bytes found")
                return
            }
            console.log("found them bytes!")
            return PDFDocument.load(pdfBytes)
        }
        setPdfBytes()
    }, [])

    const handleNext = () => {
        router.push('/cda/review')
    }

    const submit = () => {

    }

    const reviewPdf = () => {

    }

    return (
        <div className={styles.main}>
            <h1>Review the assignment of rights contract below</h1>
            
            <p>The legal contract will be finalized once all parties have signed with their ARC-H1VE wallets.</p>

            {/* Data entry section */}
            <div className={styles.container}>

            { hasReviewed ? (
                <button
                    className={styles.button}
                    onClick={submit}
                >
                    {"Sign & Submit"}
                </button>
            ) : (
                <button
                    className={styles.button}
                    onClick={reviewPdf}
                >
                    {"Review PDF"}
                </button>
            )}


            </div>
        </div>
    )
}

export default ReviewPage