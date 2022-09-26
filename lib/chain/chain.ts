import { Window as KeplrWindow } from '@keplr-wallet/types'
import { PubKeySecp256k1 } from '@keplr-wallet/crypto'
import { StdSignDoc, decodeSignature, AminoSignResponse } from '@cosmjs/launchpad'
import { serializeSignDoc} from '@cosmjs/amino'

import api from '../utils/api-client'
import { signingString } from '../utils/constants'
import { setSessionId } from '../utils/cookies'
import { Signer } from './useKeplr'
import { Ownership } from 'archive-client-ts/archive.cda'
import { OwnersRow } from '../../pages/cdas/[id]'
import { MsgApproveCda } from 'archive-client-ts/archive.cda/module'

// Helper functions

export type VerifiableSignature = {
  signRes: AminoSignResponse
}

export const createMsgApproveCda = async (cdaId: number, signer: Signer, ownersInfo: OwnersRow[]) => {
  const account = (await signer.getAccounts())[0]
  const ownership: Ownership[] = ownersInfo.map((owner) => { 
      return { 
          owner: owner.owner_wallet, 
          ownership: parseInt(owner.percent_ownership)
      }
  })
  return { creator: account.address, cdaId, ownership } as MsgApproveCda
}

/**
 * Requests user to sign arbitrary bytes offline using Keplr wallet
 * @param walletAddr the user's wallet address as a string
 * @param windowKeplr the Keplr Window instace
 * @returns a boolean determining whether or not the signature was validated and a payload used to verify the signature on the server
 */
export const validateAddress = async (walletAddr: string, windowKeplr: Window & KeplrWindow): Promise<boolean> => {
  if (walletAddr == "" || !windowKeplr || !windowKeplr.keplr) { return false }

  try {
    // Build msg and prompt user for signature
    const key = await windowKeplr.keplr.getKey('casper-1')
    const signDoc = getADR36SignDoc(walletAddr, Buffer.from(signingString).toString('base64'))
    const signRes = await windowKeplr.keplr.signAmino('casper-1', walletAddr, signDoc)
    
    // Transform signature and serialize message
    const signBytes = serializeSignDoc(signRes.signed)
    const signature = decodeSignature(signRes.signature)
    const accPubKey = new PubKeySecp256k1(signature.pubkey)

    const success = accPubKey.verify(signBytes, signature.signature)
    if (!success) { return false }

    try {
      const res = await api.post('/user/authenticate', { accAddr: walletAddr, sig: { signRes } })
      const { sessionId } = (await res.json()) as { sessionId: string }
      setSessionId(sessionId)
    } catch (err) {
      console.error(err)
    }
    
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

function getADR36SignDoc(signer: string, data: string): StdSignDoc {
  return {
    chain_id: "",
    account_number: "0",
    sequence: "0",
    fee: {
      gas: "0",
      amount: [],
    },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer,
          data,
        },
      },
    ],
    memo: "",
  };
}

// Config options
export const chainConfig = {
  chainId: 'casper-1',
  chainName: 'archive',
  rpc: 'http://0.0.0.0:25567',
  rest: 'http://0.0.0.0:1317',
  stakeCurrency: {
      coinDenom: 'stake',
      coinMinimalDenom: 'stake',
      coinDecimals: 6,
      // coinGeckoId: null,
  },
  bip44: {
      coinType: 118, // should this be changed?
  },
  bech32Config: {
      bech32PrefixAccAddr: "archive",
      bech32PrefixAccPub: "archivepub",
      bech32PrefixValAddr: "archivevaloper",
      bech32PrefixValPub: "archivevaloperpub",
      bech32PrefixConsAddr: "archivevalcons",
      bech32PrefixConsPub: "archivevalconspub"
  },
  currencies: [{
      coinDenom: 'token',
      coinMinimalDenom: 'token',
      coinDecimals: 6,
      // coinGeckoId: null,
  }, {
      coinDenom: 'stake',
      coinMinimalDenom: 'stake',
      coinDecimals: 6,
  }],
  feeCurrencies: [{
      coinDenom: 'token',
      coinMinimalDenom: 'token',
      coinDecimals: 6,
      // coinGeckoId: null,
  }],
}
