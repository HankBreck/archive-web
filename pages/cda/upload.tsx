import { useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useFilePicker } from "use-file-picker"

import { fetchOrSetTempCDA, updateTempCDA } from "../../lib/utils/cookies";
import { getIPFSClient } from "../../lib/utils/ipfs"

import styles from "../../styles/Home.module.css"

const AssetUploadPage: NextPage = () => {
    /**
     * TODO
     *  Ensure user is signed in w/ wallet
     */

    const router = useRouter()
    const [openFileSelector, { filesContent, errors, plainFiles }] = useFilePicker({
        multiple: false, // this can probably be multiple in the future. Discuss flexibility with lawyers
        readAs: 'DataURL',
        accept: 'image/*', // helpful for testing [NEED TO ACCEPT AUDIO FILES]
        readFilesContent: true,
    })

    const saveTempCda = (cid: string) => {
        const cda = fetchOrSetTempCDA()

        cda.status = "draft"
        cda.propertyCid = cid

        updateTempCDA(cda)
    }

    // Attempt to upload when a user selects a file
    useEffect( () => {
        const uploadFile = async (content: string) => {
            // Load IPFS client
            const ipfsClient = await getIPFSClient()
    
            // Add and pin the file to our external IPFS node
            const res = await ipfsClient.add(content, { pin: true })
            
            return res.cid.toString()
        }

        // Check if files are correctish then upload, store, and navigate
        if (filesContent.length > 1) {
            alert("There should only be one file")
        } else if (filesContent[0]) {
            uploadFile(filesContent[0].content).then( (cid) => {
                saveTempCda(cid)
                router.push('/cda/rights')
            })
        }
    }, [filesContent])

    return (
        <div className={styles.main}>
            <h1>Upload your intellectual property now!</h1>
            <button
                className={styles.button}
                onClick={(_) => openFileSelector()}
            >
                Select
            </button>

            {plainFiles.map((file, idx) => (
                <p key={file.name}>{`${idx + 1}. ${file.name}`}</p>
            ))}
        </div>
    )
}

export default AssetUploadPage