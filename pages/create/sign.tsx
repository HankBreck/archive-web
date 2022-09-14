import { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { Document, Page, pdfjs } from "react-pdf";
import { Window as KeplrWindow } from '@keplr-wallet/types'

import { fillContract, fillContractCdaId } from "../../lib/utils/pdf";
import { getIPFSClient } from "../../lib/utils/ipfs";
import api from "../../lib/utils/api-client";
import { fetchOrSetTempCDA } from "../../lib/utils/cookies";
import { bytesToUtf8 } from "../../lib/utils/binary"

import { queryClient, txClient } from "archive-client-ts/archive.cda"
import { MsgCreateCDA } from "archive-client-ts/archive.cda/types/cda/tx"
import { Ownership } from "archive-client-ts/archive.cda/types"
import { chainConfig } from "../../lib/chain/chain";

import styles from "../../styles/Home.module.css";
import { StdFee } from "@cosmjs/stargate";

const SignPage: NextPage = () => {
    return <h1>Not yet implemented</h1>
}

export default SignPage