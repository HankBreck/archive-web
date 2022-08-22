
export function createCda(): CDA {
  return {
    createdAt: new Date().toISOString(),
    propertyCid: '',
    creatorWalletAddress: '',
    status: 'draft',
  }
}

export type CDA = {
  createdAt: string
  propertyCid: string
  creatorWalletAddress: string
  status: string // "draft" | "pending" | "finalized"
  owners?: Array<Ownership>
  copyrightOwnership?: number
}

export type Ownership = {
  walletAddress: string
  ownershipPerc: number
}