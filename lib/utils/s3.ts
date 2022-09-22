import { S3Client } from '@aws-sdk/client-s3'

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

  global.s3Client = client

  return client
}

let s3Client = global.s3Client || createS3Client()

export { s3Client, createS3Client }
