import { randomUUID } from 'crypto'
import { query } from './postgres'

/**
 * Creates a session for the user in Postgres. Only to be used from the Next API after a signature has been confirmed.
 * 
 * @param wallet_address the wallet address of the user being authenticated
 * @returns the session id if successful
 */
async function createSession(wallet_address: string) {
  // Set time to live as 24 hours from now
  const timeNow = Date.now()
  const ttl = new Date(timeNow + 24 * 60 * 60 * 1000).toISOString() // one day into the future 
  const id = randomUUID()

  try {
    await query(
      "INSERT INTO Sessions(id, wallet_address, ttl) VALUES ($1, $2, $3)", 
      [id, wallet_address, ttl]
    )
  } catch (err) {
    console.error(err)
    return 
  }

  return id
}

/**
 * Removes a session for the user from Postgres. Only to be used from the Next API.
 * 
 * @param wallet_address the wallet address to close the session for
 * @returns the true if successful, false if not
 */
async function deleteSession(wallet_address: string) {
 try {
   await query("DELETE FROM Sessions WHERE wallet_address = $1", [wallet_address])
 } catch (err) {
   console.error(err)
   return false
 }

 return true
}

type SessionsRow = {
  id: string
  wallet_address: string
  ttl: Date // UTC ISO string
}

/**
 * Determines whether or not the session is valid
 * 
 * @param sessionId 
 * @param wallet_address 
 * @returns true if `sessionId` marks a valid session with `wallet_address`, else false
 */
async function isSessionValid(sessionId: string, wallet_address: string) {
  try {
    const ttl = new Date(Date.now()).toISOString()
    const rows = await query<SessionsRow>(
      "SELECT * FROM Sessions WHERE id = $1 AND wallet_address = $2 AND ttl > $3", 
      [sessionId, wallet_address, ttl]
    )
    if (!rows || rows.length < 1) { return false }
    
    return true

  } catch (err) {
    console.error(err)
    return false
  }
}

export { createSession, deleteSession, isSessionValid }
