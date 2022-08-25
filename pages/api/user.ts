// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import User from '../../models/User'
import { query } from '../../lib/postgres'

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

  let queryStr: string

  switch (method) {
    case 'GET':
      // Get the user for a specific ID

      // Safely grab url params
      if (!req.query || !req.query.id) {
        return res.status(400).json({ success: false, message: "ID field is required."})
      }
      const { id } = req.query

      // Fetch user from db
      queryStr = " \ "
      const queryResult = await query(queryStr)

      return res.status(200).json({ success: true, user: "user" })

    case 'POST':
      // Create a new user

      const user = req.body.user as User

      // Ensure all fields are properly set
      if (!user.wallet_address ||
          !user.legal_name ||
          !user.street_address ||
          !user.city ||
          !user.state ||
          !user.zipcode ||
          !user.birth_date ||
          !user.email) {
            return res.status(400).json({ success: false, message: "Invalid argument supplied." })
      }

      // Create new user in the db & capture the ID for local storage
      user.created_at = new Date().toISOString()
      const birth_date = new Date(user.birth_date).toDateString()
      const queryValues = [user.wallet_address, user.legal_name, user.street_address, user.city, user.state, user.zipcode, birth_date, user.email, user.created_at]
      queryStr = `INSERT INTO Users VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
      
      try {
        await query(queryStr, queryValues)
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
        .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  }
}
