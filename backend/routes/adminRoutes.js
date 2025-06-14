import express from "express";
import CanteenRequest from "../models/CanteenRequest.js";
import User from "../models/User.js";
import Menu from "../models/Menu.js";

const router = express.Router();

// 🧾 Get all canteen requests (admin view) with filtering, pagination, and sorting
router.get("/requests", async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = CanteenRequest.find(filter)
      .populate('userId', 'name email username phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Add search functionality if search term is provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { owner: searchRegex },
        { location: searchRegex },
        { contactEmail: searchRegex },
        { foodType: searchRegex }
      ];
      query = CanteenRequest.find(filter)
        .populate('userId', 'name email username phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
    }

    const requests = await query;
    const total = await CanteenRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRequests: total,
        hasNext: skip + requests.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// 📊 Get specific canteen request details by ID
router.get("/request/:id", async (req, res) => {
  try {
    const request = await CanteenRequest.findById(req.params.id)
      .populate('userId', 'username email name phone createdAt');

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
      user: request.userId, // populated user details
    });
  } catch (error) {
    console.error('Error fetching request details:', error);
    res.status(500).json({ message: 'Failed to fetch request details' });
  }
});

// ✅ Approve canteen request
router.put("/approve/:id", async (req, res) => {
  try {
    const request = await CanteenRequest.findByIdAndUpdate(
      req.params.id, 
      { status: 'approved' },
      { new: true }
    ).populate('userId', 'name email username');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update user's canteenRequestId
    await User.findByIdAndUpdate(request.userId._id, { 
      canteenRequestId: request._id 
    });
    
    res.json({ 
      message: 'Canteen approved successfully', 
      status: request.status,
      canteen: request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
});

// ❌ Reject canteen request
router.put("/reject/:id", async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const request = await CanteenRequest.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'rejected',
        rejectionReason: rejectionReason || 'No reason provided'
      },
      { new: true }
    ).populate('userId', 'name email username');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ 
      message: 'Canteen rejected', 
      status: request.status,
      canteen: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Rejection failed' });
  }
});

// 📊 Get admin dashboard statistics
router.get("/dashboard-stats", async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalUsers,
      totalMenuItems,
      recentRequests
    ] = await Promise.all([
      CanteenRequest.countDocuments(),
      CanteenRequest.countDocuments({ status: 'pending' }),
      CanteenRequest.countDocuments({ status: 'approved' }),
      CanteenRequest.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      Menu.countDocuments(),
      CanteenRequest.find()
        .populate('userId', 'name email username')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      stats: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalUsers,
        totalMenuItems
      },
      recentRequests
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// 👥 Get all users (admin view)
router.get("/users", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter, '-password') // Exclude password
      .populate('canteenRequestId', 'name status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 🍽️ Get all menu items (admin view)
router.get("/menu-items", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      type,
      available,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (available !== undefined && available !== 'all') {
      filter.available = available === 'true';
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await Menu.find(filter)
      .populate('canteenId', 'name location')
      .populate('userId', 'name username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Menu.countDocuments(filter);

    res.json({
      menuItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + menuItems.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// 🗑️ Delete menu item (admin action)
router.delete("/menu-item/:menuId", async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.menuId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await Menu.findByIdAndDelete(req.params.menuId);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

// 🚫 Delete user (admin action)
router.delete("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has a canteen request, delete it and associated menu items
    if (user.canteenRequestId) {
      await Menu.deleteMany({ userId: req.params.userId });
      await CanteenRequest.findByIdAndDelete(user.canteenRequestId);
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// 📊 Get request status summary
router.get("/request-summary", async (req, res) => {
  try {
    const summary = await CanteenRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    summary.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    res.json(statusCounts);
  } catch (error) {
    console.error('Error fetching request summary:', error);
    res.status(500).json({ message: 'Failed to fetch request summary' });
  }
});

// 🔄 Bulk action on requests
router.put("/bulk-action", async (req, res) => {
  try {
    const { action, requestIds } = req.body;

    if (!action || !requestIds || !Array.isArray(requestIds)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    let updateData = {};
    if (action === 'approve') {
      updateData = { status: 'approved' };
    } else if (action === 'reject') {
      updateData = { status: 'rejected' };
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await CanteenRequest.updateMany(
      { _id: { $in: requestIds } },
      updateData
    );

    // If approving, update users' canteenRequestId
    if (action === 'approve') {
      const approvedRequests = await CanteenRequest.find({
        _id: { $in: requestIds },
        status: 'approved'
      });

      for (const request of approvedRequests) {
        await User.findByIdAndUpdate(request.userId, {
          canteenRequestId: request._id
        });
      }
    }

    res.json({
      message: `${result.modifiedCount} requests ${action}d successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Bulk action failed' });
  }
});

export default router;