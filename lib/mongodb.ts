import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || ""
const options = {
  // useUnifiedTopology: true,
  // useNewUrlParser: true,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In dev mode, use a global variable so we can persist our instance across hot reloads
  let globalWithMongo = global as typeof globalThis & { mongo: Promise<MongoClient> | undefined }
  if (!globalWithMongo.mongo) {
    client = new MongoClient(uri, options)
    globalWithMongo.mongo = client.connect()
  }
  clientPromise = globalWithMongo.mongo
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
