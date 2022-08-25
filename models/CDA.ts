import { Ownership } from "./helpers"

type CDA = {
  // PK, VARCHAR(40), NOT NULL
  id: string
  // FK, VARCHAR(64), NOT NULL
  creator_wallet: string
  // VARCHAR(64), NOT NULL
  contract_cid: string
  // VARCHAR(64), NOT NULL
  contract_s3_key: string
  // VARCHAR(16), NOT NULL
  status: "draft" | "pending" | "finalized"
  // TIMESTAMP
  created_at?: string

  // NOT IN DATABASE!
  property_cid?: string
}

export default CDA