import { isDeliverTxSuccess } from "@cosmjs/stargate";
import { CdaCDA } from "archive-client-ts/archive.cda/rest";
import { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";
import { decodeFromBase64 } from "pdf-lib";
import { useEffect, useState } from "react";

import { Document, Page, pdfjs } from "react-pdf";
import { createMsgApproveCda, haveAllApproved } from "../../lib/chain/chain";
import useKeplr from "../../lib/chain/useKeplr";
import { query } from "../../lib/postgres";
import api from "../../lib/utils/api-client";
import { getArchiveClient } from "../../lib/utils/archive";
import { getSessionId } from "../../lib/utils/cookies";
import { fillContractFinalizeHash, fillContractNames } from "../../lib/utils/pdf";
import User from "../../models/User";

import styles from "../../styles/Home.module.css";

interface Props {
    cdaAndContracts: CdaAndContractRow
    ownersInfo: OwnersRow[]
    userInfo: User
}

// Set global PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const CdaPage: NextPage<Props> = ({ cdaAndContracts, ownersInfo, userInfo }) => {
    const [keplr, signer] = useKeplr()
    const router = useRouter()
    const id = router.query.id as string

    // Blockchain state variables
    const [cda, setCda] = useState<CdaCDA>()
    const [owners, setOwners] = useState<OwnersRow[]>()
    const [allApproved, setAllApproved] = useState(false)

    // PDF state variables
    const [pdfString, setPdfString] = useState<string>()
    const [pdfUri, setPdfUri] = useState<string>()
    const [filledPdfUri, setFilledPdfUri] = useState<string>()
    const [pageCount, setPageCount] = useState<number>()

    const onDocumentLoadSuccess = (numPages: number) => {
        setPageCount(numPages)
    }

    // Load PDF bytes from S3
    useEffect(() => {
        const fetchS3 = async () => {
            // Fetch CDAs record, joined with Contracts record from Postgres
            const s3Key = cdaAndContracts.status === "finalized" 
                ? cdaAndContracts.final_s3_key
                : cdaAndContracts.pending_s3_key
            if (!s3Key) { 
                console.error(`Pdf could not be fetched from s3 for the status of ${cdaAndContracts.status}`)
                return 
            }
            const res = await api.get('/cda/contract', { s3Key })
            const pdf = (await res.json()).data as string
            const pdfBytes = decodeFromBase64(pdf)

            setPdfString(pdf)
            setPdfUri(
                window.URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
            )
        }
        if (!pdfString) {
            fetchS3()
        }
    }, [])

    // Load CDA data from the blockchain
    useEffect(() => {
        const fetchOnchain = async () => {
            if (!signer) { return }

            // Set CDA in state
            const client = getArchiveClient(signer)
            const res = await client.ArchiveCda.query.queryCda(`${cdaAndContracts.onchain_id}`)
            const _cda = res.data.cda
            if (!_cda) {
                console.error("Could not fetch CDA...")
                return
            }
            setCda(_cda)

            // Set all approved and finalized
            const allHaveApproved = await haveAllApproved(signer, _cda)
            setAllApproved(allHaveApproved || false)

            // Set owners in state (same order as on chain)
            if (!_cda.ownership) { throw Error("The onchain CDA does not have a valid ownership set.") }
            let orderedOwners = []
            for (let i = 0; i < _cda.ownership.length; i++) {
                const onchainOwner = _cda.ownership[i]
                if (!onchainOwner || !onchainOwner.owner || !onchainOwner.ownership) {
                    throw Error(`Onchain owner missing owner or ownership field: ${onchainOwner}`)
                }

                const match = ownersInfo.find((row) => { return row.owner_wallet === onchainOwner.owner })
                if (!match) {
                    throw Error(`No owner found in Postgres for ${onchainOwner.owner}`)
                }
                orderedOwners.push(match)
            }
            setOwners(orderedOwners)
        }
        fetchOnchain()
    }, [signer])

    const populateContract = async () => {
        if (!owners) {
            console.log("No owners found")
            return
        }
        if (!pdfString) {
            console.log("No pdf string found")
            return
        }
        const userFields = owners.map((owner) => {
            return {
                wallet_address: owner.owner_wallet,
                legal_name: owner.legal_name,
                signature_hash: owner.signature_hash || undefined,
            }
        })
        const pdfStr = await fillContractNames(userFields, pdfString)
        const pdfBytes = decodeFromBase64(pdfStr)
        const uri = window.URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
        setFilledPdfUri(uri)
        return uri
    }

    // Populate the contract with owner details
    useEffect(() => {
        populateContract()
    }, [owners, pdfString])

    // Check if we should show finalize
    useEffect(() => {
        // Ensure all dependencies are set
        if (!owners || !signer || !cda || allApproved) { return }

        // Check if we show that all owners have signed
        for (let owner of owners) {
            if (!owner.signature_hash) { return }
        }

        haveAllApproved(signer, cda).then(approved => setAllApproved(approved || false))
        
    }, [owners, signer, cda])

    const signContract = async () => {
        if (!keplr) {
            console.error("Keplr window not found")
            return
        }
        if (!signer) {
            console.error("Signer not found")
            return
        }
        if (!cda?.ownership) {
            console.error("Cda Ownership not found")
            return
        }

        // Build and broadcast MsgApproveCda
        const client = getArchiveClient(signer)
        const msg = await createMsgApproveCda(cdaAndContracts.onchain_id, signer, cda.ownership)
        const response = await client.ArchiveCda.tx.sendMsgApproveCda({ value: msg, fee: { amount: [], gas: "100000" } })
        if (!isDeliverTxSuccess(response)) {
            console.error(response.rawLog)
            return
        }

        // Store signature hash in Postgres
        const payload = { 
            cda_id: id, 
            owner_wallet: userInfo.wallet_address, 
            hash: response.transactionHash 
        }
        const pgResponse = await api.post('/cda/sign', payload)
        if (!pgResponse.ok) {
            const { message } = await pgResponse.json()
            throw Error(message)
        }

        // Update the UI with the new signature
        await updateOwnersWithSig(userInfo.wallet_address, response.transactionHash)
        await populateContract()

        // 
        const allHaveApproved = await haveAllApproved(signer, cda)
        setAllApproved(allHaveApproved || false)
    }

    const finalizeContract = async () => {
        if (!keplr) {
            console.error("Keplr window not found")
            return
        }
        if (!signer) {
            console.error("Signer not found")
            return
        }
        if (!cda?.id) {
            console.error("Cda ID not found")
            return
        }

        const client = getArchiveClient(signer)
        const [account] = await signer.getAccounts()
        const cdaId = parseInt(cda.id)
        const response = await client.ArchiveCda.tx.sendMsgFinalizeCda({ value: { creator: account.address, cdaId: cdaId }})
        if (!isDeliverTxSuccess(response)) {
            console.error("Could not broadcast MsgFinalizeCda")
            console.error(response.rawLog)
        }
        
        if (!pdfString) {
            return
        }

        const pdf = await fillContractFinalizeHash(pdfString, response.transactionHash)
        setPdfString(pdf)
        setFilledPdfUri(pdf)

        const s3Res = await api.post('/cda/contract', {
            pdfString: pdf,
            updateField: "final_s3_key",
            contractId: cdaAndContracts.contract_id,
        })
        if (!s3Res.ok) {
            const resJson = await s3Res.json()
            console.error(resJson.message)
            return
        }

        const postgresRes = await api.post('/cda/update', {
            cda_id: id,
            status: "finalized",
            wallet_address: account.address,
        }, true)
        if (!postgresRes.ok) {
            const pgJson = await postgresRes.json()
            console.error(pgJson.message)
        }
        
        const _cda = cda
        _cda.approved = true
        setCda(_cda)
    }

    const renderSignButton = () => {
        if (!owners) { return }

        for (let owner of owners) {
            if (owner.owner_wallet === userInfo.wallet_address && !owner.signature_hash) {
                return (
                    <button 
                        className={styles.button}
                        onClick={signContract}
                    >
                        Sign Contract
                    </button>
                )
            }
        }
    }

    const renderFinalizeButton = () => {
        // if all owners have signed, show finalize
        if (!allApproved) { return }
        return (
            <button 
                className={styles.button}
                onClick={finalizeContract}
            >
                Finalize Contract
            </button>
        )
    }

    const updateOwnersWithSig = async (wallet_address: string, txHash: string) => {
        if (!owners) {
            console.error("OwnerRows not found in updateOwnersWithSig")
            return 
        }
        let _owners = owners
        for (let i = 0; i < _owners.length; i++) {
            if (_owners[i].owner_wallet === wallet_address) {
                _owners[i].signature_hash = txHash
            }
        }
        setOwners(_owners)
    }

    if (!pdfUri) {
        return <h1>Loading PDF...</h1>
    }

    return (
        <div className={styles.main}>
            <h1>{`Copyright Digital Asset #${id}`}</h1>

            <div className={styles.horizContainer}>

                {/* PDF View Component */}
                <div className={styles.container}>
                    <Document
                        file={filledPdfUri || pdfUri}
                        className={styles.pdfDoc}
                        onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf.numPages)}
                        onLoadError={(err) => console.error(err)}
                    >
                        {Array.from({ length: pageCount || 0 }, (_, idx) => (
                            <Page 
                                key={`page_${idx}`}
                                height={842}
                                className={styles.pdfPage}
                                pageNumber={idx+1}
                                renderAnnotationLayer={false}
                                renderTextLayer={true}
                            />
                        ))}
                    </Document>
                </div>
                
                {/* List of owners with signing status */}
                <div className={styles.container}>
                    <div className={styles.container}>
                        <h2>CDA Owners</h2>
                        { owners && owners.map( (ownersRow, idx) => (
                            <div key={`owner-${idx}`}>
                                <h3>{ownersRow.legal_name}</h3>
                                <p>{ownersRow.owner_wallet}</p>
                                <p>Ownership: {`${ownersRow.percent_ownership}%`}</p>
                                <p>{ownersRow.signature_hash === null ? 'Awaiting signature' : 'Signed'}</p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Button to sign contract */}
                    { userInfo && renderSignButton() }

                    {/* Button to finalize contract */}
                    { allApproved && !cda?.approved && renderFinalizeButton() }
                </div>
            </div>
        </div>
    )
}

export async function getServerSideProps(ctx: NextPageContext) {
    const cdaId = ctx.query.id as string
    const sessionId = getSessionId(ctx)
    if (!sessionId) {
        // redirect to login page
        return {
            redirect: {
                permanent: false,
                destination: '/login'
            },
            props: {}
        }
    }
    if (!cdaId) { return { props: {} } }

    // Fetches user info iff sessionId is for the user and has not expired
    const userInfoPromise = fetchUserInfo(sessionId)
    const cdaAndContractsPromise = fetchCdaAndContracts(cdaId)
    const ownersInfoPromise = fetchOwnersInfo(cdaId)
    const [cdaAndContracts, ownersInfo, userInfo] = await Promise.all([cdaAndContractsPromise, ownersInfoPromise, userInfoPromise])

    // TODO: do we need to redirect?
    if (!cdaAndContracts || !ownersInfo || !userInfo) { 
        return { redirect: { permanent: false, destination: '/login' }, props: {} } 
    }
    let includesUser = false
    for (let owner of ownersInfo) {
        if (owner.owner_wallet === userInfo.wallet_address) {
            includesUser = true
        }
    }
    if (!includesUser) { 
        return { redirect: { permanent: false, destination: '/login' }, props: {} }
    }

    return {
        props: { cdaAndContracts, ownersInfo, userInfo }
    }

}

const fetchUserInfo = async (sessionId: string) => {
    // TODO: Don't call the API here
    const res = await api.get('/user', { sessionId })
    const { user } = await res.json()
    if (!user) { return null }
    return user as User
}

const fetchOwnersInfo = async (cdaId: string) => {
    const text = "SELECT cda_id, owner_wallet, percent_ownership, signature_hash, legal_name \
    FROM CdaOwnership o \
    JOIN Users u on o.owner_wallet = u.wallet_address \
    WHERE cda_id = $1"
    const rows = await query<OwnersRow>(text, [cdaId])
    if (!rows || rows?.length < 1) {
        return null
    }
    return rows
}

const fetchCdaAndContracts = async (id: string) => {
    // TODO: Name columns to ensure correct parsing
    const text = "SELECT cda.id as cda_id, cda.status as status, cda.creator_wallet as creator_wallet, cda.contract_id as contract_id, cda.onchain_id as onchain_id, \
    cda.created_at as created_at, con.cid as cid, con.original_s3_key as original_s3_key, con.pending_s3_key as pending_s3_key, con.final_s3_key as final_s3_key \
    FROM CDAs cda \
    LEFT JOIN contracts con \
        on cda.contract_id = con.id \
    WHERE cda.id = $1"
    const rows = await query<CdaAndContractRow>(text, [id])
    if (!rows || rows?.length != 1) {
        return null
    }
    // Shouldn't have to do this...
    rows[0].created_at = rows[0].created_at.toString()
    return rows[0]
}

// Query row types

export type OwnersRow = {
    // CdaOwnership(cda_id)
    cda_id: string
    // CdaOwnership(owner_wallet) & Users(wallet_address)
    owner_wallet: string
    // CdaOwnership(percent_ownership)
    percent_ownership: string
    // CdaOwnership(signature_hash)
    signature_hash: string | null
    // Users(legal_name)
    legal_name: string
}

type CdaAndContractRow = {
    // CDAs(id)
    cda_id: string
    // CDAs(status)
    status: "draft" | "pending" | "finalized"
    // CDAs(creator_wallet)
    creator_wallet: string
    // CDAs(contract_id) & Contracts(id)
    contract_id: string
    // CDAs(onchain_id)
    onchain_id: number
    // CDAs(created_at)
    created_at: string // What is this type?
    // Contracts(cid)
    cid: string
    // Contracts(original_s3_key)
    original_s3_key: string
    // Contracts(pending_s3_key)
    pending_s3_key: string | undefined
    // Contracts(final_s3_key)
    final_s3_key: string | undefined
}

export default CdaPage