import mongoose from "mongoose"
import { Ownership } from "./helpers"

const getCdaSchema = () => {
  // User is the schema used to store user information within our MongoDB
  const CDASchema = new mongoose.Schema({
    ContractCid: {
      // The IPFS cid of the IP protected by the CDA

      type: String,
      required: [true, "Contract CID field is required."],
      maxlength: [64, "IPFS CID cannot be more than 64 characters"],
    }, 
    CreatorWalletAddress: {
      // The wallet address of the creating party

      type: String,
      required: [true, "Creator wallet address field is required."],
      maxlength: [64, "Creator wallet address cannot exceed 64 characters"],
    },
    Status: {
      // The status of the CDA registration process

      type: String,
      required: [true, "Status field is required."],
    },
    Owners: {
      // The collection of Ownerships for the CDA

      type: Array<Ownership>,
      require: false,
    },
    CopyrightOwnership: {
      // The total % of the copyright asset that the CDA owners

      type: Number,
      require: false,
    },
    S3Key: {
      // The key for the legal contract in our S3 bucket ("archive-contract-storage")

      type: String,
      required: false,
    },
    CreatedAt: {
      // The time this CDA was uploaded to IPFS

      type: String,
      required: [true, "Created at field is required."],
    },
  })
  return CDASchema
} 

export default mongoose.models.CDA || mongoose.model("User", getCdaSchema())