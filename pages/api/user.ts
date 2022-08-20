// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ObjectId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { resolve } from 'path'
import dbConnect from '../../lib/mongodb'
import User from '../../models/User'

export type UserResponse = {
  _id: ObjectId
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
  const { body, method } = req // refactor

  await dbConnect()

  switch (method) {
    case 'GET':
      // Get the user for a specific ID

      // Safely grab url params
      if (!req.query || !req.query.id) {
        return res.status(400).json({ success: false, message: "ID field is required."})
      }
      const { id } = req.query

      // Fetch user from db
      const user = await User.findById<UserResponse>(id)
      if (!user) {
        return res.status(404).json({ success: true, message: "User not found" })
      }
      return res.status(200).json({ success: true, user: user })

    case 'POST':
      // Create a new user

      // Ensure all fields are properly set
      if (!body.walletAddress ||
          !body.legalName ||
          !body.address ||
          !body.birthdate ||
          !body.email) {
            return res.status(400).json({ success: false, message: "Invalid argument supplied." })
      }

      // Create new user in the db & capture the ID for local storage
      // let id
      const result = await User.create({
        walletAddress: body.walletAddress,
        legalName: body.legalName,
        address: body.address,
        birthdate: body.birthdate,
        email: body.email,
      })
      return res.status(200).json({ success: true, id: result.id })

    default:
      // Method not allowed

      return res
        .status(100)
        .setHeader("Allow", ['GET', 'POST'])
        .json({ success: false, message: "Method not allowed. Try 'GET' or 'SET' instead." })
  }
}
