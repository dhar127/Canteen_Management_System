import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import canteenRoutes from "./routes/canteenRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for image URLs
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (optional - useful for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// MongoDB connection with enhanced options
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/canteenDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
   //
   //    bufferMaxEntries: 0 // Disable mongoose buffering
    });
    
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/canteen", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/admin", adminRoutes);

// Health check route with more detailed info
app.get("/", (req, res) => {
  res.json({ 
    message: "Canteen Management Server is running successfully!",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    features: [
      "User Authentication",
      "Canteen Registration & Approval System",
      "Menu Management with Image URLs", 
      "Admin Panel with Analytics",
      "Google Image URL Support",
      "Role-based Access Control"
    ],
    endpoints: {
      auth: "/api/auth",
      canteen: "/api/canteen", 
      menu: "/api/menu",
      admin: "/api/admin"
    }
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error occurred: ${err.message}`);
  console.error(err.stack);
  
  // Send different error responses based on environment
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ 
      message: "Something went wrong!",
      error: "Internal Server Error"
    });
  } else {
    res.status(err.status || 500).json({ 
      message: err.message,
      error: err.stack
    });
  }
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    requestedPath: req.originalUrl,
    availableRoutes: ["/api/auth", "/api/canteen", "/api/menu", "/api/admin"]
  });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Features: Authentication + Canteen Management + Menu System + Admin Panel');
  console.log(`📡 Health check: http://localhost:${PORT}/`);
  console.log(`⚡ API status: http://localhost:${PORT}/api/status`);
});