import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const customerInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    // SOLUTION 1: Add a default function that generates the orderId
    default: function() {
      return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CanteenRequest',
    required: false
  },
  customerInfo: {
    type: customerInfoSchema,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
  type: String,
  enum: ['cash', 'card', 'upi', 'wallet', 'cash_on_delivery'], // Added cash_on_delivery
  required: false
},
  notes: {
    type: String,
    trim: true
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ canteenId: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// SOLUTION 2: Use pre-validate instead of pre-save
orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

// Pre-save middleware for validation and debugging
orderSchema.pre('save', function(next) {
  console.log('Order pre-save middleware triggered');
  console.log('Order data:', JSON.stringify(this.toObject(), null, 2));
  
  // Validate total amount matches items total
  const calculatedTotal = this.items.reduce((total, item) => total + item.total, 0);
  if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
    console.warn(`Total amount mismatch: provided ${this.totalAmount}, calculated ${calculatedTotal}`);
  }
  
  next();
});

// Post-save middleware for debugging
orderSchema.post('save', function(doc, next) {
  console.log('Order saved successfully:', doc._id);
  next();
});

// Error handling middleware
orderSchema.post('save', function(error, doc, next) {
  if (error) {
    console.error('Error saving order:', error);
    if (error.code === 11000) {
      next(new Error('Order ID already exists'));
    } else {
      next(error);
    }
  } else {
    next();
  }
});

// Instance method to calculate total
orderSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => total + item.total, 0);
};

// Static method to find orders by phone number
orderSchema.statics.findByPhone = function(phone) {
  return this.find({ 'customerInfo.phone': phone }).sort({ createdAt: -1 });
};

// Static method to find recent orders
orderSchema.statics.findRecentOrders = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit).populate('items.menuItem');
};

const Order = mongoose.model('Order', orderSchema);

export default Order;

// SOLUTION 3: Helper function to create orders with generated orderId
export async function createOrder(orderData) {
  try {
    // Generate orderId if not provided
    if (!orderData.orderId) {
      orderData.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    console.log('Order created successfully:', savedOrder._id);
    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// DEBUGGING HELPER FUNCTIONS
export async function testOrderCreation() {
  try {
    console.log('Testing order creation...');
    
    const testOrder = new Order({
      items: [{
        menuItem: new mongoose.Types.ObjectId(),
        name: 'Test Item',
        price: 10.00,
        quantity: 2,
        total: 20.00
      }],
      totalAmount: 20.00,
      customerInfo: {
        name: 'Test Customer',
        phone: '1234567890'
      }
    });
    
    console.log('Attempting to save test order...');
    const savedOrder = await testOrder.save();
    console.log('Test order saved successfully:', savedOrder._id);
    return savedOrder;
  } catch (error) {
    console.error('Error creating test order:', error);
    throw error;
  }
}

// USAGE EXAMPLE FOR YOUR ROUTE (Alternative approach)
export async function createOrderExample(orderData) {
  try {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Generate orderId before creating the order
    if (!orderData.orderId) {
      orderData.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    console.log('Order created successfully:', savedOrder._id);
    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}