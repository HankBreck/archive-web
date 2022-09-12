import { S3Client } from '@aws-sdk/client-s3'

export declare global {
  var s3Client: S3Client | undefined
}