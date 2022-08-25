import { randomUUID } from "crypto"
import CDA from "./CDA"
import User from "./User"

export function createCda(): CDA {
  return {
    id: randomUUID(),
    contract_cid: '',
    creator_wallet: '',
    contract_s3_key: '',
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