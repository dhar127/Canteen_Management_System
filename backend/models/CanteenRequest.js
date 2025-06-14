import mongoose from "mongoose";

const canteenRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  owner: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  licenseNumber: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  location: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  contactEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
contactPhone: { 
  type: String, 
  required: true,
  trim: true,
  validate: {
    validator: function(v) {
      // Remove all non-digit characters and check if it's 10 digits
      const cleaned = v.replace(/\D/g, '');
      return cleaned.length === 10;
    },
    message: 'Please enter a valid 10-digit phone number'
  },
  // Store only digits
  set: function(v) {
    return v.replace(/\D/g, '');
  }
},
  foodType: { 
    type: String, 
    required: true,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Mixed', 'Vegan', 'Speciality'],
    trim: true
  },
  openingHours: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' 
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
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
canteenRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set approval/rejection timestamps
  if (this.isModified('status')) {
    if (this.status === 'approved') {
      this.approvedAt = new Date();
    } else if (this.status === 'rejected') {
      this.rejectedAt = new Date();
    }
  }
  
  next();
});

// Instance method to check if canteen can be reapplied
canteenRequestSchema.methods.canReapply = function() {
  return this.status === 'rejected';
};

// Static method to find latest request by user
canteenRequestSchema.statics.findLatestByUser = function(userId) {
  return this.findOne({ userId }).sort({ createdAt: -1 });
};

export default mongoose.model("CanteenRequest", canteenRequestSchema);