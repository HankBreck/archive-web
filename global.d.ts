import { Mongoose } from "mongoose"

export declare global {
  var mongoose: {
    conn: Mongoose | undefined,
    promise: Promise<Mongoose> | undefined, // Hacky solution, fix
  }
}