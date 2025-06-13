import express from "express";
import mongoose from "mongoose";
import CanteenRequest from "../models/CanteenRequest.js";
import User from "../models/User.js";

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

// 🧾 Submit a canteen request
router.post("/request", async (req, res) => {
  try {
    const {
      userId,
      name,
      owner,
      licenseNumber,
      location,
      contactEmail,
      contactPhone,
      foodType,
      openingHours,
      description
    } = req.body;

    // Log incoming request
    console.log("📥 Received canteen request with userId:", userId);

    // Validation
    if (
      !userId || !name || !owner || !licenseNumber || !location ||
      !contactEmail || !contactPhone || !foodType || !openingHours || !description
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for valid ObjectId format
    if (!isValidObjectId(userId)) {
      console.log("❌ Invalid userId format:", userId);
      return res.status(400).json({ 
        message: "Invalid user ID format. Please log in again.",
        debug: {
          received: userId,
          type: typeof userId,
          isValidObjectId: isValidObjectId(userId)
        }
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please log in again." });
    }

    // Check for existing request by user
    const existingRequest = await CanteenRequest.findLatestByUser(userId);
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({
          message: 'You have a pending request. Please wait for admin review.',
          requestId: existingRequest._id,
          status: existingRequest.status
        });
      }

      if (existingRequest.status === 'approved') {
        return res.status(400).json({
          message: 'Your canteen is already approved.',
          requestId: existingRequest._id,
          status: existingRequest.status
        });
      }
    }

    // Check for duplicate license number
    const duplicateLicense = await CanteenRequest.findOne({
      licenseNumber,
      status: { $in: ['pending', 'approved'] }
    });

    if (duplicateLicense) {
      return res.status(400).json({ message: "License number already exists" });
    }

    // Create new request
    const newRequest = new CanteenRequest({
      userId,
      name,
      owner,
      licenseNumber,
      location,
      contactEmail,
      contactPhone,
      foodType,
      openingHours,
      description
    });

    await newRequest.save();
    await User.findByIdAndUpdate(userId, { canteenRequestId: newRequest._id });

    res.status(201).json({
      message: 'Canteen request submitted successfully',
      requestId: newRequest._id,
      status: newRequest.status,
    });

  } catch (error) {
    console.error("Canteen request error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }

    res.status(500).json({ message: 'Server error while submitting request' });
  }
});

// 📊 Get canteen request by user ID
router.get("/request-by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📥 Request to get canteen by userId:", userId);

    // Enhanced validation for userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log("❌ Invalid userId - received:", userId);
      return res.status(400).json({ 
        message: "User ID is required. Please log in again.",
        debug: {
          received: userId,
          type: typeof userId
        }
      });
    }

    if (!isValidObjectId(userId)) {
      console.log("❌ Invalid ObjectId format - received:", userId);
      return res.status(400).json({ 
        message: "Invalid user ID format. Please log in again.",
        debug: {
          received: userId,
          type: typeof userId,
          isValidObjectId: isValidObjectId(userId),
          expectedFormat: "24-character hex string"
        }
      });
    }

    const request = await CanteenRequest.findLatestByUser(userId);
    if (!request) {
      return res.status(404).json({ message: 'No request found for this user' });
    }

    res.json(request);
  } catch (err) {
    console.error("Get request error:", err);
    
    // Handle specific MongoDB cast errors
    if (err.name === 'CastError' && err.path === 'userId') {
      return res.status(400).json({ 
        message: 'Invalid user ID format. Please log in again.',
        debug: {
          error: err.message,
          received: err.value,
          expectedFormat: "24-character hex string"
        }
      });
    }
    
    res.status(500).json({ message: 'Server error while fetching request' });
  }
});

// 📊 Get status of a request by ID
router.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: "Invalid request ID format",
        debug: {
          received: id,
          type: typeof id,
          isValidObjectId: isValidObjectId(id)
        }
      });
    }

    const request = await CanteenRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      status: request.status,
      requestId: request._id,
      updatedAt: request.updatedAt
    });
  } catch (err) {
    console.error("Get status error:", err);
    
    // Handle specific MongoDB cast errors
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid request ID format',
        debug: {
          error: err.message,
          received: err.value
        }
      });
    }
    
    res.status(500).json({ message: 'Server error while fetching status' });
  }
});

// 📊 Get all approved canteens (public endpoint)
router.get("/approved", async (req, res) => {
  try {
    const { page = 1, limit = 10, foodType, location } = req.query;

    const filter = { status: 'approved' };
    if (foodType) filter.foodType = foodType;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const canteens = await CanteenRequest.find(filter)
      .populate('userId', 'name username')
      .sort({ approvedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CanteenRequest.countDocuments(filter);

    res.json({
      canteens,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get approved canteens error:", error);
    res.status(500).json({ message: 'Server error while fetching canteens' });
  }
});

// 📊 Get canteen details by ID
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: "Invalid canteen ID format",
        debug: {
          received: id,
          type: typeof id,
          isValidObjectId: isValidObjectId(id)
        }
      });
    }

    const canteen = await CanteenRequest.findById(id)
      .populate('userId', 'name username email');

    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    res.json(canteen);
  } catch (error) {
    console.error("Get canteen details error:", error);
    
    // Handle specific MongoDB cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid canteen ID format',
        debug: {
          error: error.message,
          received: error.value
        }
      });
    }
    
    res.status(500).json({ message: 'Server error while fetching canteen details' });
  }
});

export default router;