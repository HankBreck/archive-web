#!/usr/bin/env ts-node

// import dotenv from 'dotenv'
// import { Client } from 'pg'

const dotenv = require('dotenv')
const { Client } = require('pg')

dotenv.config({ path: '.env.local'})

const dbName = process.env.PGDATABASE
const dbPort = process.env.PGPORT
const dbUser = process.env.PGUSER
const dbPass = process.env.PGPASSWORD
const dbHost = process.env.PGHOST

// console.log(process.env)

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

const createCDAsTableQuery = "CREATE TABLE CDAs( \
  id VARCHAR(64) NOT NULL, \
  creator_wallet VARCHAR(64) NOT NULL, \
  contract_cid VARCHAR(64) NOT NULL, \
  contract_s3_key VARCHAR(16) NOT NULL, \
  status VARCHAR(16) NOT NULL, \
  created_at TIMESTAMP, \
  PRIMARY KEY(id), \
  CONSTRAINT fk_creator \
    FOREIGN KEY(creator_wallet) \
      REFERENCES Users(wallet_address) \
)"

const createCdaOwnershipTableQuery = "CREATE TABLE CdaOwnership( \
  cda_id VARCHAR(64) NOT NULL, \
  owner_wallet VARCHAR(64) NOT NULL, \
  percent_ownership INT NOT NULL, \
  PRIMARY KEY(cda_id, owner_wallet), \
  CONSTRAINT fk_cda \
    FOREIGN KEY(cda_id) \
      REFERENCES CDAs(id), \
  CONSTRAINT fk_wallet \
    FOREIGN KEY(owner_wallet) \
      REFERENCES Users(wallet_address) \
)"

client.connect().then(async () => {
  const createUsersTableQueryResult = await client.query(createUsersTableQuery)
  console.log("Users table created!")
  
  const createCDAsTableQueryResult = await client.query(createCDAsTableQuery)
  console.log("CDAs table created!")
  
  const createCdaOwnershipTableQueryResult = await client.query(createCdaOwnershipTableQuery)
  console.log("CdaOwnership table created!")
}).finally(async () => await client.end())
