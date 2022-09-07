import { Pool, QueryResult, QueryResultRow } from 'pg'

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

let pool: Pool = new Pool({
  user: dbUser,
  database: dbName,
  password: dbPass,
  port: parseInt(dbPort),
  host: dbHost,
})

// const dbConnect = async () => {
//   if (!pool) {
//     console.log("connecting to pool")
//     pool = new Pool({
//       user: dbUser,
//       database: dbName,
//       password: dbPass,
//       port: parseInt(dbPort),
//       host: dbHost,
//     })
//   }
//   console.log("conneced to pool!")
//   // return pool
// }

const query = async <R = any>(
  text: string, 
  values?: any, 
) => {
  let result: R[] | undefined
  const client = await pool.connect()

  try {
    const res = await client.query<R>(text, values)
    result = res.rows
  } catch (error) {
    console.error(error)
  } finally {
    client.release()
  }
  
  return result
}

/**
 * Executes all `queries` as a transaction. Rolls back changes on failure of any query.
 * @param queries A list of objects containing SQL string, values mappings
 * @param enforceOrder Awaits each query before starting the next if true
 */
const transaction = async (
  queries: {
    text: string, 
    values?: any,
  }[],
  enforceOrder?: boolean,
) => {
  const client = await pool.connect()
  
  try {
    // Begin the transation
    await client.query('BEGIN')

    // Process every query
    if (enforceOrder) {
      // Wait for each query to finish before sending the next one
      for (let { text, values } of queries) {
        await client.query(text, values)
      }
    } else {
      // Run all queries concurrently
      const promises: Promise<QueryResult>[] = []
      for (let { text, values } of queries) {
        promises.push(client.query(text, values))
      }
      await Promise.all(promises)
    }

    // Commit the transaction if no errors
    await client.query('COMMIT')
  } catch (error) {
    // Rollback changes made during the transaction
    await client.query('ROLLBACK')
    console.error(error)
  } finally {
    // Release the client back to the pool
    client.release()
  }
}

export { query, transaction }
