// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import format from 'pg-format'

import { s3Client } from '../../../lib/utils/s3'
import { randomUUID } from 'crypto'
import { query } from '../../../lib/postgres'
import { Readable } from 'stream'
import { bodyStreamToNodeStream } from 'next/dist/server/body-streams'
import { decodeFromBase64, encodeToBase64 } from 'pdf-lib'

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
      const s3Key = req.query.s3Key as string

      // TODO: Validate s3Key is legal

      const getParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
      }
      const getObjCommand = new GetObjectCommand(getParams)
      const response = await s3Client.send(getObjCommand)
      if (!response.Body) {
        return res.status(400).json({ message: "PDF bytes could not be recovered from s3." })
      }

      const file_stream = response.Body!

      if (!(file_stream instanceof Readable)) {
        console.error("Unknown file stream type")
        return res.status(400).json({ message: "Could not parse file" })
      }

      const dataFetch = () => {
        return new Promise<string>((resolve, reject) => {
          const chunks: Uint8Array[] = []
          file_stream.on("data", (chunk: any) => chunks.push(chunk as Uint8Array))
          file_stream.on("error", (err: any) => reject(err))
          file_stream.on("end", () => {
            resolve(Buffer.concat(chunks).toString('utf8'))
          })
        })
      }

      const pdfStr = await dataFetch()

      if (!pdfStr) {
        return res.status(400).json({ message: "Could not parse file" })
      }
      
      return res.status(200).json({ data: pdfStr })

    case 'POST':
      // Store a contract in S3 and update the corresponding Contracts entry in Postgress
      body = req.body as PostBody
      const invalidFields = validatePostParams(req.body)
      if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Bad request. The following fields were incorrectly passed to the API: ${invalidFields.join(', ')}` })
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
        // Special Postgres formatting to prevent SQL injections
        format("UPDATE Contracts SET %I = $1 WHERE id = $2", body.updateField),
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
    await client.send(new PutObjectCommand(params))
    return { key: params.Key, err: undefined }
  } catch (error) {
    console.error(error)
    return { key: undefined, err: error as Error }
  }
}

/**
 * Checks the params and returns a list of any incorrect fields
 * @param body the request body to check
 * @returns a list of fields that are incorrectly passed to the API
 */
const validatePostParams = (body: PostBody) => {
  let invalids = new Set<string>()
  if (!body.pdfString || body.pdfString === "") {
    invalids.add("pdfString")
  // The PDF string should be the same when decoded to bytes then re-encoded to a string
  } else if (encodeToBase64(decodeFromBase64(body.pdfString)) !== body.pdfString)
  if (!body.contractId || body.contractId === "") {
    invalids.add("contractId")
  } else if (!body.contractId.match(new RegExp('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'))) {
    console.log("Not a uuid!"), body.contractId
    invalids.add("contractId")
  }
  if (!body.updateField || !["cid", "original_s3_key", "pending_s3_key", "final_s3_key"].includes(body.updateField)) {
    invalids.add("updateField")
  }
  return Array.from(invalids)
}
