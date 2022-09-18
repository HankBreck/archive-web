#!/usr/bin/env ts-node

// import dotenv from 'dotenv'
// import { Client } from 'pg'

const dotenv = require('dotenv')
const { Client } = require('pg')

dotenv.config({ path: '.env.local'})
let env = process.argv[2]
let dbName: string, dbPort: string, dbUser: string, dbPass: string, dbHost: string

if (env === 'production') {
  console.log("Using production credentials")
  dbName = process.env.PGDATABASE!
  dbPort = process.env.PGPORT!
  dbUser = process.env.PGUSER!
  dbPass = process.env.PGPASSWORD!
  dbHost = process.env.PGHOST!
} else {
  console.log("Using development credentials")
  dbName = process.env.DEV_PGDATABASE!
  dbPort = process.env.DEV_PGPORT!
  dbUser = process.env.DEV_PGUSER!
  dbPass = process.env.DEV_PGPASSWORD!
  dbHost = process.env.DEV_PGHOST!
}

if (!dbName) {
  throw new Error("dbName envirnonment variable required.")
}
if (!dbPort) {
  throw new Error("dbPort envirnonment variable required.")
}
if (!dbUser) {
  throw new Error("dbUser envirnonment variable required.")
}
if (!dbPass) {
  throw new Error("dbPass envirnonment variable required.")
}
if (!dbHost) {
  throw new Error("dbHost envirnonment variable required.")
}

let client = new Client({
  user: dbUser,
  database: dbName,
  password: dbPass,
  port: parseInt(dbPort),
  host: dbHost,
})

const createUsersTableQuery = "CREATE TABLE Users( \
  wallet_address VARCHAR(64) NOT NULL, \
  legal_name VARCHAR(256) NOT NULL, \
  street_address VARCHAR(256) NOT NULL, \
  city VARCHAR(64) NOT NULL, \
  state VARCHAR(16) NOT NULL, \
  zipcode VARCHAR(16) NOT NULL, \
  birth_date DATE NOT NULL, \
  email VARCHAR(256) NOT NULL, \
  created_at TIMESTAMP NOT NULL, \
  PRIMARY KEY(wallet_address) \
)"

const createContractsTableQuery = "CREATE TABLE Contracts( \
  id VARCHAR(64) NOT NULL, \
  cid VARCHAR(64) NOT NULL, \
  original_s3_key VARCHAR(64) NOT NULL, \
  pending_s3_key VARCHAR(64), \
  final_s3_key VARCHAR(64), \
  PRIMARY KEY(id) \
)"

// FK creator_wallet -> Users(wallet_address)
// FK contract_id -> Contracts(id)
const createCDAsTableQuery = "CREATE TABLE CDAs( \
  id VARCHAR(64) NOT NULL, \
  status VARCHAR(16) NOT NULL, \
  creator_wallet VARCHAR(64) NOT NULL, \
  contract_id VARCHAR(64) NOT NULL, \
  created_at TIMESTAMP, \
  PRIMARY KEY(id) \
)"

// FK cda_id -> CDAs(id)
// FK owner_wallet -> Users(wallet_address)
const createCdaOwnershipTableQuery = "CREATE TABLE CdaOwnership( \
  id VARCHAR(64), \
  cda_id VARCHAR(64) NOT NULL, \
  owner_wallet VARCHAR(64) NOT NULL, \
  percent_ownership INT NOT NULL, \
  PRIMARY KEY(id) \
)"

client.connect().then(async () => {
  const createUsersTableQueryResult = await client.query(createUsersTableQuery)
  console.log("Users table created!")
  
  const createContractsTableQueryResult = await client.query(createContractsTableQuery)
  console.log("Contracts table created!")

  const createCDAsTableQueryResult = await client.query(createCDAsTableQuery)
  console.log("CDAs table created!")
  
  const createCdaOwnershipTableQueryResult = await client.query(createCdaOwnershipTableQuery)
  console.log("CdaOwnership table created!")
}).finally(async () => await client.end())
