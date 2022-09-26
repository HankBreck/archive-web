// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { randomUUID } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { QueryType, transaction } from '../../../lib/postgres'

import CDA from '../../../models/CDA'
import Contract from '../../../models/Contract'
import { LocalCDA } from '../../../models/helpers'

type PostResponse = {
  cda_id: string
  contract_id: string
}

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

      // Build the Contract DB Model
      const contractModel: Contract = {
        id: randomUUID(),
        cid: cda.contractCid,
        original_s3_key: cda.s3Key,
        pending_s3_key: undefined,
        final_s3_key: undefined,
      }

      // Convert LocalCDA type into CDA DB Model
      const cdaModel: CDA = {
        id: randomUUID(),
        status: 'pending',
        creator_wallet: cda.creatorWalletAddress,
        contract_id: contractModel.id,
        onchain_id: cda.onchainId,
        created_at: new Date().toISOString()
      }

      // Build query for Contract
      const contractQuery: QueryType = {
        text: "INSERT INTO Contracts (id, cid, original_s3_key) VALUES ($1, $2, $3)",
        values: [contractModel.id, contractModel.cid, contractModel.original_s3_key],
      }

      // Build query for CDA
      const cdasQuery: QueryType = {
        text: "INSERT INTO CDAs (id, status, creator_wallet, contract_id, onchain_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        values: [cdaModel.id, cdaModel.status, cdaModel.creator_wallet, cdaModel.contract_id, cdaModel.onchain_id, cdaModel.created_at],
      }

      // Build list of queries for each owner of the CDA
      const ownershipQueries: QueryType[] = cda.owners.map((ownership) => {
        return {
          text: "INSERT INTO CdaOwnership (id, cda_id, owner_wallet, percent_ownership) VALUES ($1, $2, $3, $4)",
          values: [randomUUID(), cdaModel.id, ownership.owner, ownership.ownership],
        }
      })

      try {
        // Insert the contract data into Contracts table
          // The Contracts query should run before the CDAs query
        // Insert CDA into CDAs table
        // Insert each ownership object into CdaOwnership table
        await transaction([contractQuery, cdasQuery].concat(ownershipQueries), true)
        let response: PostResponse = {
          cda_id: cdaModel.id,
          contract_id: contractModel.id,
        }
        return res.status(200).json(response)
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
  if (!cda.owners) { result.add("owners") }
  if (cda.owners.length < 1) { result.add("owners") }
  for (let owner of cda.owners) {
    if (!owner.owner || !owner.ownership || owner.owner === "" || owner.ownership <= 0) {
      result.add("owners")
    }
  }
  if (!cda.s3Key) { result.add("s3Key") }
  if (!cda.contractCid) { result.add("contractCid") }
  if (!cda.onchainId) { result.add("onchainId") }
  if (!cda.status) { result.add("status") }
  if (!["draft", "pending", "finalized"].includes(cda.status)) { result.add("status") }

  return result
}
