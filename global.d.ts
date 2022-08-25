import { Mongoose } from "mongoose"
import { S3Client } from '@aws-sdk/client-s3'

export declare global {
  var mongoose: {
    conn: Mongoose | undefined,
    promise: Promise<Mongoose> | undefined, // Hacky solution, fix
  }
  var s3Client: S3Client | undefined
}