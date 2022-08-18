import { useState } from "react"
import { NextPage } from "next"

import styles from '../styles/Home.module.css'

const SignUp: NextPage = () => {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [birthdate, setBirthdate] = useState('')

    const formatBirthdate = (rawDate: string) => {
        // TODO: Ensure the birthdate is in the correct format
        setBirthdate(rawDate)
    }

    const createAccount = () => {
        // TODO: Send the payload to the API
    }
    
    return (
        <div
            className={styles.main}
        > {/* Screen level div */}
            {/* <div
                className={styles.main}
            > Inside container div */}
                <h1>Create Account</h1>

                <p>Fill out the form below to create your ARC-H1VE account!</p>

                <form className={styles.form}>
                    
                    {/* Full legal name */}
                    <label htmlFor="name">Legal Name</label>
                    <input 
                        name="name"
                        placeholder="Legal name (e.g. Henry J. Breckenridge)"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {/* Address */}
                    <label htmlFor="address">Legal Address</label>
                    <input 
                        name="address"
                        placeholder="Address (e.g. 123 E Main St, Bozeman, MT 59715)"
                        className={styles.input}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />

                    {/* Birth date */}
                    <label htmlFor="birthdate">Birthdate</label>
                    <input 
                        name="birthdate"
                        placeholder="Birthdate (e.g. 09/10/2000)"
                        className={styles.input}
                        value={birthdate}
                        onChange={(e) => formatBirthdate(e.target.value)}
                    />

                    <button
                        onClick={createAccount}
                        className={styles.button}
                    >
                        Submit
                    </button>
                </form>
            {/* </div> */}
        </div>
    )
}

export default SignUp