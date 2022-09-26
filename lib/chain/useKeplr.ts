import { useState, useEffect } from "react";
import { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
import { chainConfig } from "./chain";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { OfflineSigner } from "@cosmjs/launchpad";

export type Signer = OfflineSigner & OfflineDirectSigner

export default function useKeplr(): [Keplr | undefined, Signer | undefined] {
  const [keplr, setKeplr] = useState<Keplr>()
  const [signer, setSigner] = useState<Signer>()

  useEffect(() => {
    const keplrWindow = window as Window & KeplrWindow
    setKeplr(keplrWindow.keplr)
  }, [])

  useEffect(() => {
    const activateKeplr = async () => {
      if (!keplr) {
        return
      }
      await keplr.experimentalSuggestChain(chainConfig)
      await keplr.enable('casper-1')
      setSigner(keplr.getOfflineSigner('casper-1'))
    }
    activateKeplr()
  }, [keplr])
  
  return [keplr, signer]
}