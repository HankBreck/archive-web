import { Ownership } from "archive-client-ts/archive.cda/types"
import User from "./User"

export type LocalCDA = {
  creatorWalletAddress: string
  propertyCid: string
  owners: Ownership[]
  s3Key: string
  contractCid: string
  status: "draft" | "pending" | "finalized"
}

export function createCda(): LocalCDA {
  return {
    creatorWalletAddress: '',
    propertyCid: '',
    owners: [],
    s3Key: '',
    contractCid: '',
    status: 'draft',
  }
}

export function createUser(): User {
  return {
    wallet_address: '',
    legal_name: '',
    street_address: '',
    city: '',
    state: '',
    zipcode: '',
    birth_date: '',
    email: '',
  }
}
