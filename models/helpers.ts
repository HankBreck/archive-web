export type CDA = {
  createdAt: string
  propertyCid: string
  creatorWalletAddress: string
  status: string // "draft" | "pending" | "finalized"
  owners?: Array<Ownership>
  copyrightOwnership?: number
}

export function createCda(): CDA {
  return {
    createdAt: new Date().toISOString(),
    propertyCid: '',
    creatorWalletAddress: '',
    status: 'draft',
  }
}

export type User = {
  legalName: string
  address: string
  birthdate: string
  email: string
  walletAddress: string
}

export function createUser(): User {
  return {
    legalName: '',
    address: '',
    birthdate: '',
    email: '',
    walletAddress: '',
  }
}

export type Ownership = {
  walletAddress: string
  ownershipPerc: number
}