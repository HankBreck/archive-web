import mongoose from "mongoose"


const getUserSchema = () => {
  // User is the schema used to store user information within our MongoDB
  const UserSchema = new mongoose.Schema({
    legalName: {
      // The name of the legal entity behind the user

      type: String,
      required: [true, "Legal name field is required."],
      // maxlength: [256, "Legal name cannot be more than 256 characters"],
    }, 
    address: {
      // The legal address for the user

      type: String,
      required: [true, "Address field is required."],
      // maxlength: [256, "Address filed cannot be more than 256 characters"],
    },
    birthdate: {
      // The DOB of the user

      type: String,
      required: false,
      maxlength: [10, "Date of birth cannot exceed 10 characters."],
    },
    email: {
      // The email address of the user

      type: String,
      required: [true, "Email field is required."],
      maxlength: [254, "Email address cannot exceed 254 characters."],
    },
    walletAddress: {
      // The wallet address of the user

      type: String,
      unique: true,
      required: [true, "Wallet address field is required."],
      maxlength: [64, "Wallet address cannot exceed 64 characters"],
    },
  })
  return UserSchema
}

export default mongoose.models.User || mongoose.model("User", getUserSchema())
