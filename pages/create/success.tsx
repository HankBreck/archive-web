import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { Window as KeplrWindow } from '@keplr-wallet/types'
import { Coin, isDeliverTxSuccess, StdFee } from "@cosmjs/stargate";

import { fillContract, fillContractCdaId } from "../../lib/utils/pdf";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"

import { Ownership } from "archive-client-ts/archive.cda/types"
import { chainConfig } from "../../lib/chain/chain";

import styles from "../../styles/Home.module.css";

import { getArchiveClient } from '../../lib/utils/archive'
import { MsgCreateCDA } from 'archive-client-ts/archive.cda/types/cda/tx'
import { PostBody } from "../api/cda/contract";

const SuccessPage: NextPage = () => {
    const router = useRouter()

    return (
        <div className={styles.main}>
            <h1>Copyright = Protected</h1>
            
            <p>Your legal contract will be finalized once all parties have signed with their ARC-H1VE wallets.</p>
        </div>
    )
}

export default SuccessPage