import { useEffect, useState } from "react"
import { NextPage } from "next"
import { useRouter } from "next/router"
import { Window as KeplrWindow } from '@keplr-wallet/types'
import { SigningCosmosClient } from '@cosmjs/launchpad'

import User from "../models/User"
import { fetchOrSetUser, updateUser } from "../lib/utils/cookies"
import api from "../lib/utils/api-client"
import styles from '../styles/Home.module.css'
import { chainConfig, validateAddress } from "../lib/chain"

const SignUp: NextPage = () => {

    // Keplr Helpers
    const [wallet, setWallet] = useState<SigningCosmosClient | undefined>()
    const [keplrWindow, setKeplrWindow] = useState<Window & KeplrWindow>()

    // Nav hooks
    const router = useRouter()

    // State variables
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [zip, setZip] = useState('')
    const [birthdate, setBirthdate] = useState('')

    // TODO: Ensure user is authenticated

    const formatBirthdate = (rawDate: string) => {
        // TODO: Ensure the birthdate is in the correct format
        setBirthdate(rawDate)
    }

    const submitForm = async (e: any) => {
        e.preventDefault()

        if (!wallet || !keplrWindow) { return }

        const isUserValidated = await validateAddress(wallet, keplrWindow)
        if (!isUserValidated) { return }

        // If we make it to here, we are fully authenticated
        const user: User = {
            wallet_address: wallet.signerAddress, 
            legal_name: name, 
            birth_date: birthdate, 
            street_address: address, 
            zipcode: zip,
            state,
            city,
            email,
        }

        const res = await api.post('user', { user })
        updateUser(user)
        
        if (res.ok) {
            router.push('/cda/upload')
        } else {
            alert("User could not be created. Please try again later.")
        }
    }

    const configureKeplr = async () => {
        if (typeof keplrWindow === 'undefined') { return }

        // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
        if (!keplrWindow.keplr || !keplrWindow.getOfflineSigner) { return }
        
        try {
            await keplrWindow.keplr.experimentalSuggestChain(chainConfig)
            await keplrWindow.keplr.enable('casper-1')
            const signer = keplrWindow.keplr.getOfflineSigner('casper-1')
            const accounts = await signer.getAccounts()
            const cosmJs = new SigningCosmosClient(
                "http://0.0.0.0:1317",
                accounts[0].address,
                signer,
            )
            setWallet(cosmJs)
        } catch (error) {
            console.error(error)
            alert("Failed to suggest the chain")
        }
    }

    // Set keplrWindow on initial load
    useEffect(() => {
        if (!keplrWindow?.keplr) {
            console.log("setting keplrWindow")
            setKeplrWindow(window as Window & KeplrWindow )
            console.log("set keplrWindow")
        }
    }, [])

    // Configure Keplr client once keplrWindow is set
    useEffect(() => {
        if (typeof keplrWindow !== 'undefined') {
            console.log("Configuring Keplr")
            configureKeplr().then(() => console.log("Configured Keplr"))
        }
    }, [keplrWindow])

    // Prevent user from accessing without a wallet
    if (!wallet) {
        return <h1>Please install Keplr before continuing</h1>
    }
    
    return (
        <div
            className={styles.main}
        > {/* Screen level div */}
            <div className={styles.container}>
                <h1 className={styles.title}>Create Account</h1>

                <p>Fill out the form below to create your ARC-H1VE account!</p>
            </div>

            <form 
                className={styles.form}
                onSubmit={(e) => submitForm(e)}
            >
                
                {/* TODO:
                        Capture wallet address
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
                <label htmlFor="address">Street Address</label>
                <input 
                    name="address"
                    placeholder="Address (e.g. 123 E Main St)"
                    className={styles.input}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />

                {/* City */}
                <label htmlFor="city">City</label>
                <input 
                    name="city"
                    placeholder="City (e.g. Bozeman)"
                    className={styles.input}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />

                {/* State */}
                <label htmlFor="state">State</label>
                <input 
                    name="state"
                    placeholder="State (e.g. MT)"
                    className={styles.input}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                />

                {/* Zip code */}
                <label htmlFor="zipcode">ZIP Code</label>
                <input 
                    name="zipcode"
                    placeholder="ZIP Code (e.g. 59715)"
                    className={styles.input}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.trim())}
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

                {/* Email */}
                <label htmlFor="email">Email</label>
                <input 
                    name="email"
                    placeholder="Email address (e.g. archive@gmail.com)"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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