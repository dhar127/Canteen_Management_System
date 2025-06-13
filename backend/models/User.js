import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetCode: { type: String, default: null },
  role: { type: String, enum: ["customer", "admin", "canteen"], required: true },
});

export default mongoose.model("User", userSchema);
