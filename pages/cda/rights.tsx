import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { fetchOrSetTempCDA, updateTempCDA } from "../../lib/utils/cookies";
import { Ownership } from "../../lib/chain/generated/archive/archive.cda";
import styles from "../../styles/Home.module.css";
import css from "styled-jsx/css";

const RightsPage: NextPage = () => {
    const router = useRouter()

    // State variables
    // TODO: prepopulate with creator's wallet address
    const [owners, setOwners] = useState<Ownership[]>([])

    // New owner state variables
    const [newWalletAddress, setNewWalletAddress] = useState<string | undefined>()
    const [newOwnershipPerc, setNewOwnershipPerc] = useState<number | undefined>()

    const handleAddOwner = () => {
        // TODO: ensure the owner's address is contained in `owners`

        // Ensure both required fields are set
        if (!newWalletAddress || !newOwnershipPerc) { return }

        const newOwner: Ownership = {
            owner: newWalletAddress,
            ownership: newOwnershipPerc,
        }
        // Ensure both required fields are correctish
        if (!checkWalletAddr(newWalletAddress) || !checkNewOwner(newOwner, owners)) { return }

        // If we get to here, fields are valid
        setOwners([...owners, newOwner])

        // Reset input fields
        setNewWalletAddress(undefined)
        setNewOwnershipPerc(undefined)
    }

    const handleNext = () => {
        saveTempCda()
        router.push('/cda/review')
    }

    const saveTempCda = () => {
        const cda = fetchOrSetTempCDA()

        // Ensure fields are set
        if (!owners || owners.length < 1) { return }
        
        cda.owners = owners

        updateTempCDA(cda)
    }

    const renderNewOwnerForm = () => {
        return (
            <div className={styles.container}>
                <label htmlFor="wallet-addr">Wallet Address</label>
                <input 
                    name="wallet-addr"
                    placeholder="archive1ps3rtvcqw3p9megamtg8mrq3nn7fvzw2de6e62"
                    className={styles.input}
                    value={newWalletAddress || ''}
                    onChange={(e) => setNewWalletAddress(e.target.value.trim())}
                />
                <label htmlFor="ownership">Percent Ownership</label>
                <input 
                    name="ownership"
                    placeholder="100"
                    className={styles.input}
                    value={newOwnershipPerc || ''}
                    onChange={(e) => setNewOwnershipPerc(parseInt(e.target.value, 10) || 0)}
                />
                <button
                    onClick={handleAddOwner}
                    className={styles.button}
                >
                    Add Owner
                </button>
            </div>
        )
    }

    return (
        <div className={styles.main}>
            <div className={styles.container}>
                <h1>Define your copyright distribution below</h1>

                {/* Existing parties */}
                {owners.map( (ownership, idx) => (
                    <div
                        className={styles.container}
                        key={idx}
                    >
                        <label htmlFor={`owner-${idx}`}>CDA ownership for {ownership.owner}</label>
                        <input 
                            name={`owner-${idx}`}
                            className={styles.input}
                            value={ownership.ownership}
                            disabled={true}
                        />
                    </div>
                ))}

                {/* Add owner form */}
                { renderNewOwnerForm() }

                <button
                    className={styles.button}
                    disabled={owners.length == 0}
                    onClick={handleNext}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

/**
 * Ensures address starts with "archive" and is between 40 & 50 chars
 * 
 * @param address - the archive wallet address being registered
 * @returns true if ok, false if invalid
 */
const checkWalletAddr = (address: string): boolean => {
    if (!address.startsWith("archive")) { return false }
    if (address.length < 40 || address.length > 50) { return false } // Observed address length: 46

    return true
}

/**
 * Ensures owner addresses are not repeated and the total percent ownership is not greater than 100
 * 
 * @param newOwner the wallet address and ownership percent for the new owner 
 * @param owners the list of existing owners' wallet addresses & ownership percentages
 * @returns true if ok, false if invalid
 */
const checkNewOwner = (newOwner: Ownership, owners: Ownership[]) => {
    let ownerWalletSet = new Set<string>([newOwner.owner])
    let totalPerc = newOwner.ownership

    for (const owner of owners) {
        ownerWalletSet.add(owner.owner)
        totalPerc += owner.ownership
    }

    // Ensure we do not have an ownership % above 100
    if (totalPerc > 100) { return false }
    // Ensure we do not have repeated wallet addresses
    if (ownerWalletSet.size != owners.length + 1) { return false }

    return true
}

export default RightsPage