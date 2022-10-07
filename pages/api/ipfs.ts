// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getIPFSClient } from '../../lib/utils/ipfs'

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
  const client = await getIPFSClient()

  switch (method) {
    case 'GET':
      // Fetch the CDA from postgres by ID
      
      return res.status(200).json({  })

    case 'POST':
      // Save the signature in Postgres

      const content = req.body.content as string
      if (!content || content === "") {
        return res.status(400).json({ message: "content body parameter is required!" })
      }

      const result = await client.add(content, { pin: true })
      return res.status(200).json({ cid: result.cid.toString() })

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST'])
        .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  } 
}