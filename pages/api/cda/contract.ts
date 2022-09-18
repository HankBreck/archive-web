// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import format from 'pg-format'

import { s3Client } from '../../../lib/utils/s3'
import { randomUUID } from 'crypto'
import { query } from '../../../lib/postgres'


export type PutBody = {
  pdfString: string
}

export type PostBody = {
  s3Key?: string
  pdfString: string
  updateField: "cid" | "original_s3_key" | "pending_s3_key" | "final_s3_key"
  contractId: string
}

type S3PutParams = {
  Bucket: string
  Key: string
  Body: string // pdf bytes
}

const BUCKET_NAME = "archive-contract-storage"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req 
  let params: S3PutParams
  let body

  switch (method) {
    case 'GET':
      // Fetch the contract bytes from S3

      const success = await new Promise(async (resolve, reject) => {

        // TODO: Probably completely redo this...

        try {
          const getParams = {
            Bucket: "archive-contract-storage",
            Key: "",
            // Body: "",
          }

          const results = await s3Client.send(new GetObjectCommand(getParams))
          if (!results.Body) { reject() }

          const body = results.Body as ReadableStream<Uint8Array> // might fail on cast
          const reader = body.getReader()
          const result = await reader.read()

          if (!result.value) {
            reject(res.status(400).json({ success: false, message: "Could not read contract bytes from S3" }))
          }

          resolve(res.status(200).json({ success: true, pdfBytes: result.value }))

        } catch (error) {
          
        }
      })
      
      return res.status(200).json({ success: true })

    case 'POST':
      // Store a contract in S3 and update the corresponding Contracts entry in Postgress
      body = req.body as PostBody
      if (body.pdfString === "" || body.s3Key === "") {
        return res.status(400).json({ message: "Bad request. pdfString and s3Key must not be empty strings" })
      }

      params = {
        Bucket: BUCKET_NAME,
        // If s3Key is not specified, don't overwrite the old contract
        Key: body.s3Key || randomUUID(),
        Body: body.pdfString,
      }

      let s3Res = await putFileInS3(params, s3Client)
      if (s3Res.err) {
        return res.status(400).json({ message: s3Res.err.message })
      }

      
      await query(
        format("UPDATE Contracts SET %s = $1 WHERE id = $2", body.updateField),
        [params.Key, body.contractId]
      )

      return res.status(200).json({ key: params.Key })


    case 'PUT':
      // Store a new contract in S3 and response with the Key
      body = req.body as PutBody

      params = {
        Bucket: BUCKET_NAME,
        Key: randomUUID(),
        Body: body.pdfString,
      }

      let { key, err } = await putFileInS3(params, s3Client)
      if (err) {
        return res.status(400).json({ message: err.message })
      }
      return res.status(200).json({ key: key || params.Key })

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST', 'PUT'])
        .json({ success: false, message: "Method not allowed. Try 'GET', 'POST', or 'PUT' instead." })
  }
}

const putFileInS3 = async (params: S3PutParams, client: S3Client): Promise<{key?: string, err?: Error}> => {
  try {
    const data = await client.send(new PutObjectCommand(params))
    return { key: params.Key, err: undefined }
  } catch (error) {
    console.error(error)
    return { key: undefined, err: error as Error }
  }
}
