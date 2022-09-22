// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import User from '../../../models/User'
import { query } from '../../../lib/postgres'
import { isSessionValid } from '../../../lib/session'
import { title } from 'process'

export type UserResponse = {
  _id: string
  legalName: string
  address: string
  birthdate: string
  email: string
  walletAddress: string
  __v: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req // refactor
  let sessionId: string

  switch (method) {
    case 'GET':
      // Get the user for a specific wallet address & sessionId

      // Safely grab url params
      if (!req.query.sessionId) {
        return res.status(400).json({ message: "Session id query param is required."})
      }
      sessionId = req.query.sessionId as string

      // Fetch user from db
      const text = "SELECT u.wallet_address as wallet_address, legal_name, street_address, city, state, \
        zipcode, birth_date, email, created_at, s.ttl as ttl \
        FROM Sessions s \
        JOIN Users u \
          on s.wallet_address = u.wallet_address \
        WHERE s.id = $1"
      const rows = await query<User & { ttl: Date }>(
        text,
        [sessionId]
      )
      if (!rows || rows.length != 1) {
        return res.status(400).json({ message: "Could not find user"})
      }
      if (rows[0].ttl.valueOf() < Date.now()) {
        return res.status(401).json({ message: "session expired." })
      }
      
      const recUser: User = {
        wallet_address: rows[0].wallet_address,
        legal_name: rows[0].legal_name,
        street_address: rows[0].street_address,
        city: rows[0].city,
        state: rows[0].state,
        zipcode: rows[0].zipcode,
        birth_date: rows[0].birth_date,
        email: rows[0].email,
        created_at: rows[0].created_at, 
      }
      return res.status(200).json({ user: recUser })

    case 'POST':
      // Create a new user
      // Assumes the user has already created a session through the authentication endpoint

      const user = req.body.user as User
      sessionId = req.body.sessionId as string

      if (!sessionId) {
        return res.status(400).json({ message: "sessionId cookie required" })
      }
      const valid = await isSessionValid(sessionId, user.wallet_address)
      if (!valid) {
        return res.status(401).json({ message: "Session invalid. Please reauthenticate and try again later." })
      }

      // Ensure all fields are properly set
      if (!user.wallet_address ||
          !user.legal_name ||
          !user.street_address ||
          !user.city ||
          !user.state ||
          !user.zipcode ||
          !user.birth_date ||
          !user.email) {
            return res.status(400).json({ message: "Invalid argument supplied." })
      }

      // Create new user in the db & capture the ID for local storage
      user.created_at = new Date().toISOString()
      const birth_date = new Date(user.birth_date).toDateString()

      // Build query objects
      const queryStr = `INSERT INTO Users (wallet_address, legal_name, street_address, city, state, zipcode, birth_date, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
      const queryValues = [user.wallet_address, user.legal_name, user.street_address, user.city, user.state, user.zipcode, birth_date, user.email, user.created_at]
      
      try {
        const queryRes = await query(queryStr, queryValues)
        if (!queryRes) {
          throw new Error()
        }
        return res.status(200).json({})
      } catch (error) {
        console.error(error)
        return res.status(400).json({ error })
      }

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST'])
        .json({ message: "Method not allowed. Try 'GET' or 'SET' instead." })
  }
}
