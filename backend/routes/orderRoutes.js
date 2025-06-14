// orderRoutes.js - Fixed implementation with orderId generation
import express from "express";
import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import mongoose from "mongoose";

const router = express.Router();

// Place a new order - FIXED VERSION
router.post('/place', async (req, res) => {
  try {
    console.log('📦 Order placement request received:', JSON.stringify(req.body, null, 2));
    
    const { items, totalAmount, canteenId, customerInfo, notes, paymentMethod, paymentStatus } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Items array is required and cannot be empty' 
      });
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid total amount is required' 
      });
    }
    
    // Process and validate each item
    const processedItems = [];
    let calculatedTotal = 0;
    
    for (const item of items) {
      console.log('Processing item:', item);
      
      // Handle both menuItemId and _id formats
      const menuItemId = item.menuItemId || item._id || item.menuItem;
      
      if (!menuItemId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Menu item ID is required for each item' 
        });
      }
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid menu item ID format: ${menuItemId}` 
        });
      }
      
      // Fetch menu item details from database
      const menuItem = await Menu.findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ 
          success: false, 
          error: `Menu item not found: ${menuItemId}` 
        });
      }
      
      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || menuItem.price;
      const itemTotal = price * quantity;
      
      processedItems.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price: price,
        quantity: quantity,
        total: itemTotal
      });
      
      calculatedTotal += itemTotal;
    }
    
    // Verify total amount matches calculated total (allow small floating point differences)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.warn(`Total amount mismatch: provided ${totalAmount}, calculated ${calculatedTotal}`);
    }
    
    // Create order data with GENERATED orderId - THIS IS THE KEY FIX!
    const orderData = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      items: processedItems,
      totalAmount: calculatedTotal,
      status: 'pending',
      paymentStatus: paymentStatus || 'pending'
    };
    
    // Add optional fields if provided
    if (canteenId && mongoose.Types.ObjectId.isValid(canteenId)) {
      orderData.canteenId = canteenId;
    }
    
    if (customerInfo && customerInfo.name && customerInfo.phone) {
      orderData.customerInfo = {
        name: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email ? customerInfo.email.trim() : undefined,
        address: customerInfo.address ? customerInfo.address.trim() : undefined
      };
    }
    
    if (notes) {
      orderData.notes = notes.trim();
    }
    
    if (paymentMethod) {
      orderData.paymentMethod = paymentMethod;
    }
    
    console.log('📋 Final order data:', JSON.stringify(orderData, null, 2));
    
    // Create and save the order
    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log('✅ Order saved successfully:', savedOrder._id);
    
    // Populate the saved order with menu item details
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.menuItem', 'name category type imageUrl')
      .populate('canteenId', 'businessName location contact');
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId: populatedOrder.orderId,
        _id: populatedOrder._id,
        items: populatedOrder.items,
        totalAmount: populatedOrder.totalAmount,
        status: populatedOrder.status,
        paymentStatus: populatedOrder.paymentStatus,
        paymentMethod: populatedOrder.paymentMethod,
        canteen: populatedOrder.canteenId,
        customerInfo: populatedOrder.customerInfo,
        createdAt: populatedOrder.createdAt,
        estimatedDeliveryTime: populatedOrder.estimatedDeliveryTime
      }
    });
    
  } catch (error) {
    console.error('❌ Error placing order:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to place order', 
      message: error.message 
    });
  }
});

// Get orders by phone number (for customer to track orders)
router.get('/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid phone number is required' 
      });
    }
    
    const orders = await Order.find({ 'customerInfo.phone': phone })
      .populate('items.menuItem', 'name category type imageUrl')
      .populate('canteenId', 'businessName location contact')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
    
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by MongoDB _id first, then by custom orderId
    let order = null;
    
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
        .populate('items.menuItem', 'name category type imageUrl')
        .populate('canteenId', 'businessName location contact');
    }
    
    if (!order) {
      order = await Order.findOne({ orderId })
        .populate('items.menuItem', 'name category type imageUrl')
        .populate('canteenId', 'businessName location contact');
    }
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      data: order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch order' 
    });
  }
});

// Get all orders (for admin/canteen)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      canteenId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (canteenId && mongoose.Types.ObjectId.isValid(canteenId)) {
      query.canteenId = canteenId;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('items.menuItem', 'name category type imageUrl')
      .populate('canteenId', 'businessName location contact')
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalOrders: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, estimatedDeliveryTime } = req.body;
    
    const updateData = {};
    
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        });
      }
      updateData.status = status;
      
      // Set actual delivery time when status is delivered
      if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
      }
    }
    
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid payment status value' 
        });
      }
      updateData.paymentStatus = paymentStatus;
    }
    
    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    }
    
    // Find by MongoDB _id or custom orderId
    let order = null;
    
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findByIdAndUpdate(
        orderId, 
        updateData, 
        { new: true, runValidators: true }
      );
    }
    
    if (!order) {
      order = await Order.findOneAndUpdate(
        { orderId }, 
        updateData, 
        { new: true, runValidators: true }
      );
    }
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    // Populate the updated order
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name category type imageUrl')
      .populate('canteenId', 'businessName location contact');
    
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: populatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update order' 
    });
  }
});

// Cancel order
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find by MongoDB _id or custom orderId
    let order = null;
    
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findByIdAndUpdate(
        orderId,
        { 
          status: 'cancelled',
          actualDeliveryTime: new Date()
        },
        { new: true }
      );
    }
    
    if (!order) {
      order = await Order.findOneAndUpdate(
        { orderId },
        { 
          status: 'cancelled',
          actualDeliveryTime: new Date()
        },
        { new: true }
      );
    }
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel order' 
    });
  }
});

// Debug route to test order creation
router.post('/debug/test', async (req, res) => {
  try {
    console.log('🧪 Testing order creation...');
    
    const testOrder = new Order({
      orderId: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      items: [{
        menuItem: new mongoose.Types.ObjectId(),
        name: 'Test Item',
        price: 10.00,
        quantity: 1,
        total: 10.00
      }],
      totalAmount: 10.00,
      customerInfo: {
        name: 'Test Customer',
        phone: '1234567890'
      }
    });
    
    const savedOrder = await testOrder.save();
    console.log('✅ Test order created:', savedOrder._id);
    
    res.json({
      success: true,
      message: 'Test order created successfully',
      data: savedOrder
    });
    
  } catch (error) {
    console.error('❌ Test order creation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.errors
    });
  }
});

export default router;