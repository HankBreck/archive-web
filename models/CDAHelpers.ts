
export function createCda(): CDA {
  return {
    createdAt: new Date().toISOString(),
    propertyCid: '',
    creatorWalletAddress: '',
    status: '',
  }
}

export interface CDA {
  createdAt: string
  propertyCid: string
  creatorWalletAddress: string
  status: string // "draft" | "pending" | "finalized"
  // TODO: 
    // total % ownership of copyright
    // parties
    // % owned by each party
}