#!/usr/bin/env ts-node

const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const { randomUUID } = require('crypto')
const { Readable } = require('stream')
// import { PDFDocument, encodeToBase64, decodeFromBase64 } from 'pdf-lib'
const { PDFDocument, encodeToBase64, decodeFromBase64 } = require('pdf-lib')
// import * as fs from 'fs'
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config({ path: '.env.local'})

const createS3Client = () => {
  if (!process.env.AWS_S3_REGION) { 
    throw new Error("Environment variable AWS_S3_REGION is required.")
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID) { 
    throw new Error("Environment variable AWS_ACCESS_KEY_ID is required.")
  }
  
  if (!process.env.AWS_ACCESS_KEY_SECRET) { 
    throw new Error("Environment variable AWS_ACCESS_KEY_SECRET is required.")
  }

  const client = new S3Client({ 
    // TODO: Create new credentials for an admin specifically for PutObject/GetObject 
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
    },
    region: process.env.AWS_S3_REGION, 
  })

  // global.s3Client = client

  return client
}

const bytesToStr = (bytes: Uint8Array) => {
  const u8 = Buffer.from(bytes).toString('utf8')
  console.log(u8)
  return u8
}

const strToBytes = (input: string) => {
  return Buffer.from(input) as Uint8Array
}

type S3PutParams = {
  Bucket: string
  Key: string
  Body: string // pdf bytes
}

const putFileInS3 = async (params: S3PutParams, client: any): Promise<{key?: string, err?: Error}> => {
  try {
    const data = await client.send(new PutObjectCommand(params))
    return { key: params.Key, err: undefined }
  } catch (error) {
    console.error(error)
    return { key: undefined, err: error as Error }
  }
}

const getFileFromS3 = async (key:string, client:any) => {
  const getParams = {
    Bucket: "archive-contract-storage",
    Key: key,
  }
  const getObjCommand = new GetObjectCommand(getParams)
  const response = await client.send(getObjCommand)

  const file_stream = response.Body!
  let pdfStr: string | undefined

  if (!(file_stream instanceof Readable)) {
    console.error("Unknown file stream type")
    return 
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
  const x = await dataFetch()
  return x
}

const getPdf = async () => {
  const pdf = fs.readFileSync('./public/contract-template.pdf')
  const pdfDoc = await PDFDocument.load(pdf)
  return pdfDoc.saveAsBase64()
}

const getPdfFromBytes = async (bytes: Uint8Array) => {
  const pdfDoc = await PDFDocument.load(bytes)
  return pdfDoc.save()
}
const getPdfFromStr = async (bytes: String) => {
  const pdfDoc = await PDFDocument.load(bytes)
  return pdfDoc.save()
}

const main = async () => {
  const client = createS3Client() 
  const pdfBytes = await getPdf()
  const inputStr = pdfBytes//encodeToBase64(pdfBytes)

  const bucket = "archive-contract-storage"
  const putKey = randomUUID()

  const putParams = {
    Bucket: bucket,
    Key: putKey,
    Body: inputStr,
  }
  const {key, err} = await putFileInS3(putParams, client)
  if (!key){ throw Error("No key :(") }
  
  const recStr = await getFileFromS3(key, client)
  if (!recStr) { throw Error("No rec str :(")}

  const recByte = decodeFromBase64(recStr)

  console.log("str match", inputStr === recStr)

  const bz1 = await getPdfFromStr(recStr)
  const bz2 = await getPdfFromBytes(recByte)

  console.log(encodeToBase64(bz1) === recStr)
  console.log(encodeToBase64(bz2) === recStr)
  // console.log(bz1 === bz2)
}
main()