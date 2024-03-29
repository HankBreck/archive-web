import { OfflineSigner } from '@cosmjs/proto-signing'
import { Client } from 'archive-client-ts'

const getArchiveClient = (signer: OfflineSigner) => {
  const apiUri = process.env.NEXT_PUBLIC_ARCHIVE_API_URI 
  const rpcUri = process.env.NEXT_PUBLIC_ARCHIVE_RPC_URI

  if (!apiUri || !rpcUri) {
    throw new Error("Missing environment variables for ARCHIVE_API_URI or ARCHIVE_RPC_URI")
  }

  return new Client({
      apiURL: apiUri,
      rpcURL: rpcUri,
      prefix: "archive",
    }, 
    signer
  )
}

export { getArchiveClient }