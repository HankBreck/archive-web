// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { query, QueryType, transaction } from '../../../lib/postgres'

import CDA from '../../../models/CDA'
import Contract from '../../../models/Contract'
import { LocalCDA } from '../../../models/helpers'

type PostRequest = {
  cda_id: string | undefined
  owner_wallet: string | undefined
  hash: string | undefined
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req 

  const validatePostFields = () => {
    const { cda_id, owner_wallet, hash } = req.body as PostRequest

    if (!cda_id || cda_id === "") {
      return false
    }

    if (!owner_wallet || owner_wallet === "") {
      return false
    }

    if (!hash || hash.length != 64) {
      return false
    }

    return true
  }

  switch (method) {
    case 'GET':
      // Fetch the CDA from postgres by ID
      
      return res.status(200).json({  })

    case 'POST':
      // Save the signature in Postgres

      const { cda_id, owner_wallet, hash } = req.body as PostRequest
      if (!validatePostFields()) {
        return res.status(400).json({ message: "Invalid body parameters. Please ensure all fields have been correctly filled." })
      }

      try {
        await query("UPDATE CdaOwnership SET signature_hash = $1 WHERE cda_id = $2 AND owner_wallet = $3", [hash, cda_id, owner_wallet])
        return res.status(200).json({})
      } catch (error) {
        console.error(error)
        return res.status(400).json({ message: error })
      }

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST'])
        .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  }

  
}