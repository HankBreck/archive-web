import { NextPage } from "next";
import { useState } from "react";
import { useFilePicker } from "use-file-picker"
import styles from "../../styles/Home.module.css"

const AssetUpload: NextPage = () => {
    /**
     * TODO
     *  Ensure user is logged in
     *  Grab file
     *  Upload file to IPFS using known endpoint
     */

    const [openFileSelector, { errors, plainFiles }] = useFilePicker({
        multiple: false, // this can probably be multiple in the future. Discuss with lawyers
        readAs: 'DataURL',
        accept: ['.wav', '.mp3', // officially supported extensions
                '.jpg', '.png', '.jpeg', '.JPG', '.pdf'], // helpful for testing
        readFilesContent: false, // we could read immediately and upload to IPFS if needed
    })

    return (
        <div className={styles.main}>
            <h1>Upload your intellectual property now!</h1>
            <button
                className={styles.button}
                onClick={(_) => openFileSelector()}
            >
                Select
            </button>

            {errors.map((err) => (
                err.name
            ))}

            {plainFiles.map((file, idx) => (
                <p key={file.name}>{`${idx + 1}. ${file.name}`}</p>
            ))}
        </div>
    )
}

export default AssetUpload