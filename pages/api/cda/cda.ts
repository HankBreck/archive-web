// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../../../lib/postgres'

// import dbConnect from '../../../lib/mongodb'
// import CDA from '../../../models/CDA'
// import { CDA as CDAType } from '../../../models/helpers'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // const { method } = req 

  query("users", "null", (err, result) => {
    if (!err) {
        throw err
    }
    console.log(result.rows[0])
  })

  return res.status(200)

  // switch (method) {
  //   case 'GET':
  //     // Fetch the CDA from mongodb by ID
      
  //     return res.status(200).json({ success: true })

  //   case 'POST':
  //     // Save the CDA in mongodb
  //     // Assumes contract is already stored in S3

  //     const cda = req.body.cda as CDAType | undefined

  //     if (!cda) { 
  //       return res.status(400).json({ success: false, message: "CDA object required in request body." })
  //     }

  //     console.log("CDA:", cda)

  //     // Ensure all fields are set
  //     if (!checkCdaFields(cda)) {
  //       return res.status(400).json({ success: false, message: "One or more CDA field incorrectly set." })
  //     }

  //     const result = await CDA.create({
  //       ContractCid: cda.contractCid,
  //       CreatorWalletAddress: cda.creatorWalletAddress,
  //       Status: cda.status,
  //       Owners: cda.owners,
  //       CopyrightOwnership: cda.copyrightOwnership,
  //       S3Key: cda.s3Key,
  //       CreatedAt: cda.createdAt,
  //     })
  //     res.status(200).json({ success: true, id: result._id.toString() })

  //   default:
  //     // Method not allowed

  //     return res
  //       .status(100)
  //       .setHeader("Allow", ['GET', 'POST'])
  //       .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  // }
}

// const checkCdaFields = (cda: CDAType) => {
//   if (!cda.copyrightOwnership) { return false }
//   if (!cda.createdAt) { return false }
//   if (!cda.creatorWalletAddress) { return false }
//   if (!cda.owners) { return false }
//   if (cda.owners.length < 1) { return false }
//   if (!cda.propertyCid) { return false }
//   if (!cda.s3Key) { return false }
//   if (!cda.status) { return false }
//   if (!["draft", "pending", "finalized"].includes(cda.status)) { return false }

//   return true
// }
