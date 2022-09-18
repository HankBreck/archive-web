
type CdaOwnership = {
  // PK, VARCHAR(64), NOT NULL
  id: string
  // VARCHAR(64), NOT NULL
  cda_id: string
  // VARCHAR(64), NOT NULL
  owner_wallet: string
  // INT, NOT NULL
  percent_ownership: number
}

export default CdaOwnership
