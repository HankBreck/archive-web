type Session = {
  // PK, VARCHAR(40), NOT NULL
  id: string
  // FK, VARCHAR(64), NOT NULL
  wallet_address: string
  // TIMESTAMP, NOT NULL
}

export default Session