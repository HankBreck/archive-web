// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../../../lib/postgres'
import { isSessionValid } from '../../../lib/session'

import { LocalCDA } from '../../../models/helpers'

type PostRequest = {
  cda_id: string
  wallet_address: string
  status: "draft" | "pending" | "finalized"
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req 

  switch (method) {
    case 'GET':
      // Fetch the CDA from postgres by ID
      
      return res.status(200).json({})

    case 'POST':
      // Update the CDA in postgres
      
      const body = req.body as PostRequest
      const sessionId = req.cookies.sessionId

      if (!sessionId) {
        return res.status(401).json({ message: "sessionId cookie not set. Please return again with a valid sessionId." })
      }

      const isValid = await isSessionValid(sessionId, body.wallet_address)
      if (!isValid) {
        return res.status(403).json({ message: "session is invalid. Please log in again and retry." })
      }

      try {
        // Confirm ownership of CDA before updating
        const rows = await query("SELECT id FROM CdaOwnership WHERE cda_id = $1 and owner_wallet = $2", [body.cda_id, body.wallet_address])
        if (!rows || rows.length < 1) {
          throw Error(`Owner wallet ${body.wallet_address} is not an owner of the CDA with an id of ${body.cda_id}`)
        }

        // Update CDA's status        
        await query("UPDATE CDAs SET status = $1 WHERE id = $2", [body.status, body.cda_id])
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

/**
 * Checks the CDA's fields and returns a list of any incorrect fields
 * @param cda the LocalCDA object to check
 * @returns a list of fields that are not correctly configured.
 */
const checkCdaFields = (cda: LocalCDA) => {
  let result = new Set<string>()
  if (!cda.creatorWalletAddress) { result.add("creatorWalletAddress") }
  if (!cda.owners) { result.add("owners") }
  if (cda.owners.length < 1) { result.add("owners") }
  for (let owner of cda.owners) {
    if (!owner.owner || !owner.ownership || owner.owner === "" || owner.ownership <= 0) {
      result.add("owners")
    }
  }
  if (!cda.s3Key) { result.add("s3Key") }
  if (!cda.contractCid) { result.add("contractCid") }
  if (typeof cda.onchainId === 'undefined') { result.add("onchainId") }
  if (!cda.status) { result.add("status") }
  if (!["draft", "pending", "finalized"].includes(cda.status)) { result.add("status") }

  return result
}
