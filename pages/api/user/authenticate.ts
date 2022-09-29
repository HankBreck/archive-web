// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PubKeySecp256k1 } from '@keplr-wallet/crypto'
import { pubkeyType, decodeSignature, serializeSignDoc, AminoSignResponse } from '@cosmjs/launchpad'
import { toBech32 } from '@cosmjs/encoding'

import { createSession } from '../../../lib/session'

type VerifiableSignature = {
  signRes: AminoSignResponse
}

export type UserResponse = {
  _id: string
  legalName: string
  address: string
  birthdate: string
  email: string
  walletAddress: string
  __v: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req // refactor

  switch (method) {
    case 'POST':
      // Authenticates a user
      
      // Parse body objects and validate pubkey
      const accAddr = req.body.accAddr as string
      const { signRes } = req.body.sig as VerifiableSignature
      if (signRes.signature.pub_key.type !== pubkeyType.secp256k1) {
        return res.status(400).json({ message: "Public key must be of type secp256k1" })
      }

      // Verify the user's signature
      const signBytes = serializeSignDoc(signRes.signed)
      const signature = decodeSignature(signRes.signature)
      const accPubKey = new PubKeySecp256k1(signature.pubkey)
      if (!accPubKey.verify(signBytes, signature.signature)) {
        return res.status(500).json({ message: "Account signature could not be resolved." })
      }

      // Verify accAddr's integrity by recovering the signing address
      const rawAddr = accPubKey.getAddress()
      const recoveredAddr = toBech32("archive", rawAddr)
      if (recoveredAddr !== accAddr) {
        return res.status(400).json({ message: 'Illegal operation. accAddr must be the address that signed the message.' })
      }

      // Create the session for the user
      const id = await createSession(recoveredAddr)
      if (!id) {
        return res.status(400).json({ message: 'umm... postgres broke'})
      }
      return res.status(200).json({ sessionId: id })

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['POST'])
        .json({ message: "Method not allowed. Try 'POST' instead." })
  }

  const validateAddress = () => {

  }
}
