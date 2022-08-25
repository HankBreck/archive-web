// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { PutObjectCommand, GetObjectCommand, PutObjectCommandInput, AbortMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

import dbConnect from '../../../lib/mongodb'
import CDA from '../../../models/CDA'
import { s3Client } from '../../../lib/utils/s3'
import { randomUUID } from 'crypto'

// export type UserResponse = {
//   _id: ObjectId
//   legalName: string
//   address: string
//   birthdate: string
//   email: string
//   walletAddress: string
//   __v: number
// }

type PostBody = {
  pdfString: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req 
  let params

  switch (method) {
    case 'GET':
      // Fetch the contract bytes from storage

      const success = new Promise(async (resolve, reject) => {
        try {
          params = {
            Bucket: "archive-contract-storage",
            Key: "",
          }

          const results = await s3Client.send(new GetObjectCommand(params))
          if (!results.Body) { return }
          let wrStream = new WritableStream<Uint8Array>()
          const body = results.Body as ReadableStream<Uint8Array> // might fail on cast
          const reader = body.getReader()
          const result = await reader.read()

          if (!result.value) {
            return res.status(400).json({ success: false, message: "Could not read contract bytes from S3" })
          }

          res.status(200).json({ success: true, pdfBytes: result.value })
          
          
          // TODO: 
            // Extract bytes from body and return to f/e

        } catch (error) {
          
        }
      })
      
      return res.status(200).json({ success: true })

    case 'POST':
      // Save the contract bytes in storage
      const body = req.body as PostBody
      const pdfString = body.pdfString

      params = {
        Bucket: "archive-contract-storage",
        Key: randomUUID(), // How to generate file name?
        Body: pdfString,
      }

      try {
        const upload = new Upload({
          params,
          client: s3Client
        })
        upload.on('httpUploadProgress', (progress) => console.log(progress))
        const life = (await upload.done()) as any // unsafe
        return res.status(200).json({ success: true, key: "storage-key" })//life.Key as string })
      } catch (error) {
        console.error(error)
        return res.status(400).json({ success: false, message: error })
      }

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST'])
        .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  }
}

const streamToUint8Array = (stream: ReadableStream<Uint8Array>) => new Promise((resolve, reject) => {
  const chunks = []
})