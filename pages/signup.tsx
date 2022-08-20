import cs from "classnames"
import { useState } from "react"
import { NextPage } from "next"
import { useRouter } from "next/router"

import api from "../lib/utils/api-client"

import styles from '../styles/Home.module.css'

const SignUp: NextPage = () => {

    // Nav hooks
    const router = useRouter()

    // State variables
    const [name, setName] = useState('')
    const [email, setEmail] = useState('email')
    const [address, setAddress] = useState('')
    const [birthdate, setBirthdate] = useState('')

    // TODO: Ensure user is authenticated
    

    const formatBirthdate = (rawDate: string) => {
        // TODO: Ensure the birthdate is in the correct format
        setBirthdate(rawDate)
    }

    

    const createAccount = async (e: any) => {
        e.preventDefault()
        const res = await api.post('user', { walletAddress: "addr", legalName: name, address, birthdate, email })
                            .then(res => res.json())

        // TODO: store user ID locally
            // Is there a way to store it securely? Don't want to risk an attack vector for an optimization

        if (res.ok) {
            router.push('/cdas/asset')
        } else {
            alert("User could not be created. Please try again later.")
        }
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
                onSubmit={(e) => createAccount(e)}
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