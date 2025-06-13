import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  resetCode: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ["customer", "admin", "canteen"],
    required: true,
    default: "customer"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  canteenRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CanteenRequest' 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if reset code is valid (expires after 10 minutes)
userSchema.methods.isResetCodeValid = function() {
  if (!this.resetCode) return false;
  // In a real app, you'd also check expiration time
  return true;
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = function(emailOrPhone) {
  return this.findOne({
    $or: [
      { email: emailOrPhone },
      { phone: emailOrPhone }
    ]
  });
};

export default mongoose.model("User", userSchema);