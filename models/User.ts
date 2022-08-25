
type User = {
  // PK, VARCHAR(64), NOT NULL
  wallet_address: string
  // VARCHAR(256), NOT NULL
  legal_name: string
  // VARCHAR(256), NOT NULL
  street_address: string
  // VARCHAR(64), NOT NULL
  city: string
  // VARCHAR(16), NOT NULL
  state: string
  // VARCHAR(16), NOT NULL
  zipcode: string
  // DATE, NOT NULL
  birth_date: string
  // VARCHAR(256), NOT NULL
  email: string
  // TIMESTAMP
  created_at?: string 
}

export default User
