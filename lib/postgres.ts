import { Pool, QueryResult } from 'pg'

const dbName = process.env.PGDATABASE
const dbPort = process.env.PGPORT
const dbUser = process.env.PGUSER
const dbPass = process.env.PGPASSWORD
const dbHost = process.env.PGHOST

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

let pool = new Pool({
  user: dbUser,
  database: dbName,
  password: dbPass,
  port: parseInt(dbPort),
  host: dbHost,
})

// const dbConnect = async () => {
//   if (pool) {
//     pool = new Pool()
//   }
//   await pool.connect()
//   return pool
// }

const query = (
  text: string, 
  values?: any, 
) => {
  return pool.query(text, values)
}

export { query }
