type CDA = {
  // PK, VARCHAR(40), NOT NULL
  id: string
  // VARCHAR(16), NOT NULL
  status: "draft" | "pending" | "finalized"
  // FK, VARCHAR(64), NOT NULL
  creator_wallet: string
  // VARCHAR(64), NOT NULL
  contract_id: string
  // INT
  onchain_id?: number
  // TIMESTAMP
  created_at?: string

  // NOT IN DATABASE!
  property_cid?: string
}

export default CDA