const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Remove multer and file upload related code since we're using URLs now

// Connect MongoDB
mongoose.connect('mongodb://localhost:27017/canteenDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ----------- SCHEMAS -----------

// 📌 Canteen Request Schema (Updated with userId field)
const canteenRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  owner: String,
  licenseNumber: String,
  location: String,
  contactEmail: String,
  contactPhone: String,
  foodType: String,
  openingHours: String,
  description: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const CanteenRequest = mongoose.model('CanteenRequest', canteenRequestSchema);

// 📌 Menu Schema (Updated to use image URL instead of file path)
const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
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
  description: { type: String, required: true },
  imageUrl: { type: String }, // Changed from 'image' to 'imageUrl' to store Google image URLs
  available: { type: Boolean, default: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'CanteenRequest', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spicyLevel: { 
    type: String,
    enum: ['Mild', 'Medium', 'Spicy', 'Not Applicable'],
    default: 'Not Applicable'
  },
  prepTime: { type: String }, // e.g., "15 mins"
  rating: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Menu = mongoose.model('Menu', menuSchema);

// 📌 User Schema for Login/Signup
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  username: { type: String, unique: true },
  password: String,
  role: String,
  canteenRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CanteenRequest' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Helper function to validate image URL
const isValidImageUrl = (url) => {
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
};

// ----------- CANTEEN REQUEST ROUTES -----------

// 🧾 Submit a canteen request
app.post('/api/canteen/request', async (req, res) => {
  try {
    const { userId, ...requestData } = req.body;
    
    const existingRequest = await CanteenRequest.findOne({ userId });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'You have a pending request. Please wait for admin review.' });
      }
      
      if (existingRequest.status === 'approved') {
        return res.status(400).json({ message: 'Your canteen is already approved.' });
      }
      
      if (existingRequest.status === 'rejected') {
        const newRequest = new CanteenRequest({
          userId,
          ...requestData
        });
        
        await newRequest.save();
        await User.findByIdAndUpdate(userId, { canteenRequestId: newRequest._id });

        return res.status(200).json({
          message: 'New request submitted successfully',
          requestId: newRequest._id,
          status: newRequest.status,
        });
      }
    }

    const newRequest = new CanteenRequest({
      userId,
      ...requestData
    });
    
    await newRequest.save();
    await User.findByIdAndUpdate(userId, { canteenRequestId: newRequest._id });

    res.status(200).json({
      message: 'Request submitted successfully',
      requestId: newRequest._id,
      status: newRequest.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 📊 Get canteen request by user ID
app.get('/api/canteen/request-by-user/:userId', async (req, res) => {
  try {
    const request = await CanteenRequest.findOne({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    if (!request) {
      return res.status(404).json({ message: 'No request found for this user' });
    }
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 📊 Get status of a request by ID
app.get('/api/canteen/status/:id', async (req, res) => {
  try {
    const request = await CanteenRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ status: request.status });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 🧾 Get all canteen requests (admin view)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const requests = await CanteenRequest.find()
      .populate('userId', 'name email username')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// ✅ Approve canteen request
app.put('/api/admin/approve/:id', async (req, res) => {
  try {
    const request = await CanteenRequest.findByIdAndUpdate(
      req.params.id, 
      { status: 'approved' },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await User.findByIdAndUpdate(request.userId, { canteenRequestId: request._id });
    
    res.json({ message: 'Canteen approved', status: request.status });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed' });
  }
});

// ❌ Reject canteen request
app.put('/api/admin/reject/:id', async (req, res) => {
  try {
    const request = await CanteenRequest.findByIdAndUpdate(
      req.params.id, 
      { status: 'rejected' },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Canteen rejected', status: request.status });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed' });
  }
});

// ----------- MENU MANAGEMENT ROUTES -----------

// 🍽️ Add new menu item
app.post('/api/menu/add', async (req, res) => {
  try {
    const { userId, canteenId, name, price, type, category, description, spicyLevel, prepTime, available, imageUrl } = req.body;
    
    // Verify that the canteen belongs to this user and is approved
    const canteenRequest = await CanteenRequest.findOne({ 
      _id: canteenId, 
      userId: userId, 
      status: 'approved' 
    });
    
    if (!canteenRequest) {
      return res.status(403).json({ message: 'Unauthorized: Canteen not found or not approved' });
    }

    // Validate image URL if provided
    if (imageUrl && !isValidImageUrl(imageUrl)) {
      return res.status(400).json({ message: 'Invalid image URL. Please provide a valid image URL.' });
    }

    const menuItem = new Menu({
      name,
      price: parseFloat(price),
      type,
      category,
      description,
      imageUrl: imageUrl || null,
      available: available === 'true' || available === true,
      canteenId,
      userId,
      spicyLevel: spicyLevel || 'Not Applicable',
      prepTime: prepTime || null
    });

    await menuItem.save();

    res.status(201).json({
      message: 'Menu item added successfully',
      menuItem: menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add menu item' });
  }
});

// 🍽️ Get all menu items for a canteen
app.get('/api/menu/canteen/:canteenId', async (req, res) => {
  try {
    const menuItems = await Menu.find({ canteenId: req.params.canteenId })
      .populate('canteenId', 'name')
      .sort({ category: 1, name: 1 });
    
    res.json(menuItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// 🍽️ Get menu items by user (for canteen owner)
app.get('/api/menu/user/:userId', async (req, res) => {
  try {
    const menuItems = await Menu.find({ userId: req.params.userId })
      .populate('canteenId', 'name')
      .sort({ category: 1, name: 1 });
    
    res.json(menuItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// 🍽️ Update menu item
app.put('/api/menu/update/:menuId', async (req, res) => {
  try {
    const { userId, name, price, type, category, description, spicyLevel, prepTime, available, imageUrl } = req.body;
    const { menuId } = req.params;
    
    // Verify that the menu item belongs to this user
    const existingMenuItem = await Menu.findOne({ _id: menuId, userId: userId });
    
    if (!existingMenuItem) {
      return res.status(403).json({ message: 'Unauthorized: Menu item not found' });
    }

    // Validate image URL if provided
    if (imageUrl && !isValidImageUrl(imageUrl)) {
      return res.status(400).json({ message: 'Invalid image URL. Please provide a valid image URL.' });
    }

    const updateData = {
      name,
      price: parseFloat(price),
      type,
      category,
      description,
      available: available === 'true' || available === true,
      spicyLevel: spicyLevel || 'Not Applicable',
      prepTime: prepTime || null,
      imageUrl: imageUrl || null,
      updatedAt: new Date()
    };

    const updatedMenuItem = await Menu.findByIdAndUpdate(
      menuId,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});

// 🍽️ Delete menu item
app.delete('/api/menu/delete/:menuId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { menuId } = req.params;
    
    // Verify that the menu item belongs to this user
    const existingMenuItem = await Menu.findOne({ _id: menuId, userId: userId });
    
    if (!existingMenuItem) {
      return res.status(403).json({ message: 'Unauthorized: Menu item not found' });
    }

    await Menu.findByIdAndDelete(menuId);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

// 🍽️ Toggle menu item availability
app.put('/api/menu/toggle-availability/:menuId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { menuId } = req.params;
    
    const existingMenuItem = await Menu.findOne({ _id: menuId, userId: userId });
    
    if (!existingMenuItem) {
      return res.status(403).json({ message: 'Unauthorized: Menu item not found' });
    }

    const updatedMenuItem = await Menu.findByIdAndUpdate(
      menuId,
      { 
        available: !existingMenuItem.available,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: `Menu item ${updatedMenuItem.available ? 'enabled' : 'disabled'} successfully`,
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle availability' });
  }
});

// 🍽️ Get menu item by ID
app.get('/api/menu/item/:menuId', async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.menuId)
      .populate('canteenId', 'name location')
      .populate('userId', 'name');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

// ----------- USER AUTHENTICATION ROUTES -----------

// 👤 User Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists' });

    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ 
      message: 'Signup successful',
      userId: newUser._id,
      role: newUser.role 
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

// 🔑 User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await User.findOne({ username, role });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ 
      message: 'Login successful',
      userId: user._id,
      role: user.role,
      canteenRequestId: user.canteenRequestId
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// 📊 Get user profile
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('canteenRequestId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        canteenRequest: user.canteenRequestId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});
app.get('/api/admin/request/:id', async (req, res) => {
  try {
    const request = await CanteenRequest.findById(req.params.id).populate('userId', 'username email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      _id: request._id,
      name: request.name,
      owner: request.owner,
      licenseNumber: request.licenseNumber,
      location: request.location,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
      foodType: request.foodType,
      openingHours: request.openingHours,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      user: request.userId, // populated username and email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch request details' });
  }
});


// Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
  console.log('Now using Google Image URLs instead of file uploads');
});