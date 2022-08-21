import { useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { useFilePicker } from "use-file-picker"

import { getIPFSClient } from "../../lib/utils/ipfs"
import { fetchOrSetTempCDA, updateTempCDA } from "../../lib/utils/cookies";
import styles from "../../styles/Home.module.css"

const AssetUploadPage: NextPage = () => {
    /**
     * TODO
     *  Ensure user is logged in
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

        cda.propertyCid = cid
        cda.creatorWalletAddress = "UPDATE WITH THE REAL WALLET ADDRESS"

        updateTempCDA(cda)
    }

    useEffect( () => {
        const uploadFile = async (content: string) => {
            // Load IPFS client
            const ipfsClient = await getIPFSClient()
    
            // Add and pin the file to our external IPFS node
            const res = await ipfsClient.add(content, { pin: true })
            
            return res.cid.toString()
        }

        if (filesContent.length > 1) {
            alert("There should only be one file")
        } else if (filesContent[0]) {
            uploadFile(filesContent[0].content).then( (cid) => {
                saveTempCda(cid)
                router.push('cda/rights')
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