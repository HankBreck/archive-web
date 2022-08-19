import { useState } from "react"
import { NextPage } from "next"
import cs from "classnames"

import styles from '../styles/Home.module.css'
import { useRouter } from "next/router"

const SignUp: NextPage = () => {

    // Nav hooks
    const router = useRouter()

    // State variables
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [birthdate, setBirthdate] = useState('')

    // TODO: Ensure user is authenticated
    

    const formatBirthdate = (rawDate: string) => {
        // TODO: Ensure the birthdate is in the correct format
        setBirthdate(rawDate)
    }

    

    const createAccount = () => {
        // TODO: Send the payload to the API
        // TODO: Ensure all fields are set
        const payload = { name, address, birthdate, email }
        console.log("create account")
        router.push('cdas/asset')
        
    }
    
    return (
        <div
            className={styles.main}
        > {/* Screen level div */}
            <div className={cs(styles.container, styles.title)}>
                <h1>Create Account</h1>

                <p>Fill out the form below to create your ARC-H1VE account!</p>
            </div>

            <form 
                className={styles.form}
                onSubmit={(_) => createAccount()}
            >
                
                {/* TODO:
                        Capture wallet address
                        Add field for the user's email
                */}
                
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
                    type="submit"
                    className={styles.button}
                >
                    Submit
                </button>
            </form>
        </div>
    )
}

export default SignUp