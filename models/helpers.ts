import User from "./User"

export type LocalCDA = {
  creatorWalletAddress: string
  propertyCid: string
  ipOwnership: number // renamed from copyrightOwnership
  owners: Ownership[]
  s3Key: string
  contractCid: string
  status: "draft" | "pending" | "finalized"
}

export function createCda(): LocalCDA {
  return {
    creatorWalletAddress: '',
    propertyCid: '',
    ipOwnership: 0,
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

export type Ownership = {
  walletAddress: string
  ownershipPerc: number
}