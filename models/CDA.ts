import mongoose from "mongoose"

// User is the schema used to store user information within our MongoDB
const CDASchema = new mongoose.Schema({
  propertyCid: {
    // The IPFS cid of the IP protected by the CDA

    type: String,
    required: [true, "Property CID field is required."],
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
  CreatedAt: {
    // The time this CDA was uploaded to IPFS

    type: String,
    required: [true, "Created At field is required."],
  },
})

export default mongoose.model("CDA", CDASchema) || mongoose.models.CDASchema
