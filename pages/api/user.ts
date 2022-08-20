// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/mongodb'
import User from '../../models/User'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method } = req

  await dbConnect()

  switch (method) {
    case 'GET':
      if (!body.id) {
        res.status(400).json({success: false, message: "ID field is required."})
        return
      }
      const user = User.findById(body.id, (err: Error, result: any) => {
        res.status(200).json({ success: true, user: result})
      })
      // res.status
      break

    case 'POST':
      // Ensure all fields are properly set
      if (!body.walletAddress ||
          !body.legalName ||
          !body.address ||
          !body.birthdate ||
          !body.email) {
            res.status(400).json({ success: false, message: "Invalid argument supplied." })
            return
      }

      // Create new user in the db & capture the ID for local storage
      const result = await User.create({
        walletAddress: body.walletAddress,
        legalName: body.legalName,
        address: body.address,
        birthdate: body.birthdate,
        email: body.email,
      }, function(err: Error, addedUser: any) { // TODO: Add user type
        console.log("Added User:", addedUser)
        // addedUser._id
      })
      console.log(result)
      break
  }
  
  res.status(200).json({ success: false }) // Should this be removed?
}
