
type Contract = {
  // PK, VARCHAR(64), NOT NULL
  id: string
  // VARCHAR(64), NOT NULL
  cid: string
  // VARCHAR(64), NOT NULL
  original_s3_key: string
  // VARCHAR(64)
  pending_s3_key: string | undefined
  // VARCHAR(64)
  final_s3_key: string | undefined
}

export default Contract
