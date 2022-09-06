import { SigningCosmosClient } from '@cosmjs/launchpad'
import { EncodeObject } from '@cosmjs/proto-signing'
import { Window as KeplrWindow } from '@keplr-wallet/types'

// Helper functions

export const validateAddress = async (wallet: SigningCosmosClient, windowKeplr: Window & KeplrWindow) => {
  if (!wallet || !windowKeplr || !windowKeplr.keplr) { return }

  try {
    const arb = "This is a random ass test string. If you are seeing this, Hank fucked up."
    const sig = await windowKeplr.keplr.signArbitrary('casper-1', wallet.signerAddress, arb)
    const success = await windowKeplr.keplr.verifyArbitrary('casper-1', wallet.signerAddress, arb, sig)
    return success
  } catch (error) {
    console.error(error)
    return false
  }
  
}

// Config options

export const chainConfig = {
  chainId: 'casper-1',
  chainName: 'archive',
  rpc: 'http://0.0.0.0:1317',
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
      coinDecimals: 0,
      // coinGeckoId: null,
  }, {
      coinDenom: 'stake',
      coinMinimalDenom: 'stake',
      coinDecimals: 0,
  }],
  feeCurrencies: [{
      coinDenom: 'token',
      coinMinimalDenom: 'token',
      coinDecimals: 0,
      // coinGeckoId: null,
  }],
}
