import { useEffect } from "react";
import { NextPage } from "next";
import Image from "next/image"

import { useFilePicker } from "use-file-picker"

import { getIPFSClient } from "../../lib/utils/ipfs"
import styles from "../../styles/Home.module.css"

const AssetUpload: NextPage = () => {
    /**
     * TODO
     *  Ensure user is logged in
     *  Grab file
     *  Upload file to IPFS using known endpoint
     */

    const [openFileSelector, { filesContent, errors, plainFiles }] = useFilePicker({
        multiple: false, // this can probably be multiple in the future. Discuss with lawyers
        readAs: 'DataURL',
        accept: 'image/*', // helpful for testing [NEED TO ACCEPT AUDIO FILES]
        readFilesContent: true, // we could read immediately and upload to IPFS if needed
    })

    useEffect( () => {
        const uploadFile = async (content: string) => {
            // Load IPFS client
            const ipfsClient = await getIPFSClient()
    
            // Add and pin the file to our external IPFS node
            const res = await ipfsClient.add(content, { pin: true })
            
            // TODO: Store the CID in the DB
        }

        if (filesContent.length > 1) {
            alert("There should only be one file")
        } else if (filesContent[0]) {
            uploadFile(filesContent[0].content).then( () => {
                // Navigate
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

export default AssetUpload