import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  type: { 
    type: String, 
    required: true,
    enum: ['Veg', 'Non-Veg', 'Vegan', 'Egg']
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Drinks', 'Dessert']
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 300
  },
  imageUrl: { 
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty URLs
        
        try {
          const urlObj = new URL(url);
          // Check if it's a valid HTTP/HTTPS URL
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
          }
          
          // Check if URL ends with common image extensions or contains common image hosting domains
          const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
          const imageHosts = ['googleapis.com', 'googleusercontent.com', 'imgur.com', 'unsplash.com', 'pexels.com'];
          
          return imageExtensions.test(url) || imageHosts.some(host => urlObj.hostname.includes(host));
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid image URL'
    }
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  canteenId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CanteenRequest', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  spicyLevel: { 
    type: String,
    enum: ['Mild', 'Medium', 'Spicy', 'Not Applicable'],
    default: 'Not Applicable'
  },
  prepTime: { 
    type: String,
    trim: true
  }, // e.g., "15 mins"
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  ratingCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }], // Additional tags like "Popular", "New", "Chef's Special"
  nutritionInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 }
  },
  allergens: [{
    type: String,
    enum: ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish', 'Fish']
  }],
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
menuSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate average rating
menuSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.ratingCount) + newRating;
  this.ratingCount += 1;
  this.rating = Math.round((totalRating / this.ratingCount) * 10) / 10; // Round to 1 decimal
};

// Static method to find available items by category
menuSchema.statics.findAvailableByCategory = function(canteenId, category) {
  return this.find({ 
    canteenId, 
    category, 
    available: true 
  }).sort({ name: 1 });
};

// Static method to search menu items
menuSchema.statics.searchItems = function(canteenId, searchTerm) {
  return this.find({
    canteenId,
    available: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  });
};

// Create compound indexes for better query performance
menuSchema.index({ canteenId: 1, category: 1 });
menuSchema.index({ canteenId: 1, available: 1 });
menuSchema.index({ userId: 1, createdAt: -1 });
menuSchema.index({ name: 'text', description: 'text' });

export default mongoose.model("Menu", menuSchema);