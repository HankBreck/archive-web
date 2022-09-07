// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { query, transaction } from '../../../lib/postgres'

import CDA from '../../../models/CDA'
import { LocalCDA } from '../../../models/helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req 

  switch (method) {
    case 'GET':
      // Fetch the CDA from postgres by ID
      
      return res.status(200).json({ success: true })

    case 'POST':
      // Save the CDA in postgres
      // Assumes contract is already stored in S3

      // Grab LocalCDA instance from request body
      const cda = req.body.cda as LocalCDA | undefined
      if (!cda) { 
        return res.status(400).json({ success: false, message: "CDA object required in request body." })
      }

      // Ensure all fields are set
      const incorrectFields = checkCdaFields(cda)
      if (incorrectFields.size > 0) {
        return res.status(400).json({ success: false, message: `One or more CDA field incorrectly set: ${incorrectFields}` })
      }

      // Convert LocalCDA type to CDA model
      const cdaModel: CDA = {
        id: randomUUID(),
        creator_wallet: cda.creatorWalletAddress,
        contract_cid: cda.contractCid,
        contract_s3_key: cda.s3Key,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      // TODO: 
        // Store ownership data in CdaOwnership DB

      // Build list of queries for each owner of the CDA
      const ownershipQueries = cda.owners.map((ownership) => {
        // This feels silly
        return {
          text: "INSERT INTO CdaOwnership VALUES ($1, $2, $3)",
          values: [cdaModel.id, ownership.owner, ownership.ownership],
        }
      })

      // Build query for CDA
      const cdasQueryStr = "INSERT INTO CDAs VALUES ($1, $2, $3, $4, $5, $6)"
      const cdasQueryValues = [cdaModel.id, cdaModel.creator_wallet, cdaModel.contract_cid, cdaModel.contract_s3_key, cdaModel.status, cdaModel.created_at]

      try {
        // Insert CDA into CDAs table
        await query(cdasQueryStr, cdasQueryValues)
        
        // Insert each ownership object into CdaOwnership table
        await transaction(ownershipQueries)

        return res.status(200).json({ id: cdaModel.id })
      } catch (error) {
        console.error(error)
        return res.status(400).json({ error })
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
  if (!cda.propertyCid) { result.add("propertyCid") }
  if (!cda.owners) { result.add("owners") }
  if (cda.owners.length < 1) { result.add("owners") }
  if (!cda.s3Key) { result.add("s3Key") }
  if (!cda.contractCid) { result.add("contractCid") }
  if (!cda.status) { result.add("status") }
  if (!["draft", "pending", "finalized"].includes(cda.status)) { result.add("status") }

  return result
}
