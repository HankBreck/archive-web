import mongoose from "mongoose"

const uri = process.env.NODE_ENV === "production"
  ? process.env.MONGO_URI
  : process.env.MONGO_DEV_URI

const dbName = process.env.MONGO_DB // Same on prod and dev

if (!uri) {
  throw new Error(
    "Please define MONGO_URI in the environment variables"
  )
}

let cached = global.mongoose 

if (!cached) {
  cached = global.mongoose = { conn: undefined, promise: undefined }
}

/**
 * Manages and connects the MongoDB client to external DB via singleton pattern
 * 
 * @returns promise of the connected client
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      autoCreate: true,
    }

    // Can force unwrap because of check above
    cached.promise = mongoose.connect(uri!, opts).then( mongoosePromise => {
      return mongoosePromise
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
