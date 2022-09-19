// import { SignDoc } from '@cosmjs/stargate'
import { Window as KeplrWindow } from '@keplr-wallet/types'
import { PubKeySecp256k1 } from '@keplr-wallet/crypto'
import { signingString } from '../utils/constants'
import { StdSignDoc, decodeSignature } from '@cosmjs/launchpad'

// import { makeAuthInfoBytes, makeSignBytes, makeSignDoc } from '@cosmjs/proto-signing'
import { serializeSignDoc} from '@cosmjs/amino'

// Helper functions

/**
 * Requests user to sign arbitrary bytes offline using Keplr wallet
 * @param walletAddr the user's wallet address as a string
 * @param windowKeplr the Keplr Window instace
 * @returns true if the wallet was validated, false if not or an error or occured 
 */
export const validateAddress = async (walletAddr: string, windowKeplr: Window & KeplrWindow) => {
  if (walletAddr == "" || !windowKeplr || !windowKeplr.keplr) { return }

  try {
    // Build msg and prompt user for signature
    const key = await windowKeplr.keplr.getKey('casper-1')
    const signDoc = getADR36SignDoc(walletAddr, Buffer.from(signingString).toString('base64'))
    const signRes = await windowKeplr.keplr.signAmino('casper-1', walletAddr, signDoc)
    
    // Transform signature and serialize message
    const signBytes = serializeSignDoc(signRes.signed)
    const signature = decodeSignature(signRes.signature)
    const accPubKey = new PubKeySecp256k1(key.pubKey)
    
    return accPubKey.verify(signBytes, signature.signature)
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
