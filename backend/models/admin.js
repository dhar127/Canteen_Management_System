// routes/admin.js - Backend routes matching your current API structure
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CanteenRequest = require('../models/CanteenRequest');

// GET /api/admin/requests - Main endpoint that's being called
router.get('/requests', async (req, res) => {
  try {
    console.log('Fetching all canteen requests...');
    
    // Method 1: If you have a separate CanteenRequest collection
    let requests = await CanteenRequest.find({})
      .populate('userId', 'username email phone name role')
      .sort({ createdAt: -1 });

    // Method 2: If canteen requests are embedded in User documents
    if (!requests || requests.length === 0) {
      const users = await User.find({ 
        role: 'canteen',
        canteenRequestId: { $exists: true }
      }).populate('canteenRequestId');
      
      requests = users.map(user => ({
        _id: user.canteenRequestId?._id || user._id,
        name: user.name,
        owner: user.name,
        contactEmail: user.email,
        contactPhone: user.phone,
        location: user.canteenRequestId?.location || 'Not specified',
        status: user.canteenRequestId?.status || 'pending',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        user: {
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }));
    }

    console.log(`Found ${requests.length} canteen requests`);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching canteen requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch canteen requests',
      details: error.message 
    });
  }
});

// Alternative endpoint - GET /api/admin/canteen-requests
router.get('/canteen-requests', async (req, res) => {
  try {
    // Redirect to the main requests endpoint
    return router.handle({ ...req, url: '/requests' }, res);
  } catch (error) {
    console.error('Error in canteen-requests endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/admin/request/:id - Get specific request details
router.get('/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching request details for ID: ${id}`);
    
    let request = await CanteenRequest.findById(id)
      .populate('userId', 'username email phone name role');
    
    // If not found in CanteenRequest, try finding by user ID
    if (!request) {
      const user = await User.findById(id).populate('canteenRequestId');
      if (user && user.canteenRequestId) {
        request = {
          ...user.canteenRequestId.toObject(),
          user: {
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        };
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Format the response for frontend compatibility
    const formattedRequest = {
      ...request.toObject ? request.toObject() : request,
      user: request.userId || request.user
    };

    res.json(formattedRequest);
  } catch (error) {
    console.error('Error fetching request details:', error);
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
});

// PUT /api/admin/approve/:id - Approve a canteen request
router.put('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Approving request ID: ${id}`);
    
    // Find and update the canteen request
    let request = await CanteenRequest.findByIdAndUpdate(id, {
      status: 'approved',
      approvedAt: new Date()
    }, { new: true });

    // If not found in CanteenRequest, try updating user record
    if (!request) {
      const user = await User.findById(id);
      if (user && user.canteenRequestId) {
        request = await CanteenRequest.findByIdAndUpdate(user.canteenRequestId, {
          status: 'approved',
          approvedAt: new Date()
        }, { new: true });
        
        // Update user status
        await User.findByIdAndUpdate(id, {
          isActive: true,
          status: 'approved'
        });
      }
    } else {
      // Update associated user
      await User.findByIdAndUpdate(request.userId, {
        isActive: true,
        status: 'approved'
      });
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('Request approved successfully');
    res.json({ 
      message: 'Canteen request approved successfully',
      request: request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// PUT /api/admin/reject/:id - Reject a canteen request
router.put('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log(`Rejecting request ID: ${id}`);
    
    // Find and update the canteen request
    let request = await CanteenRequest.findByIdAndUpdate(id, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason || 'No reason provided'
    }, { new: true });

    // If not found in CanteenRequest, try updating user record
    if (!request) {
      const user = await User.findById(id);
      if (user && user.canteenRequestId) {
        request = await CanteenRequest.findByIdAndUpdate(user.canteenRequestId, {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason || 'No reason provided'
        }, { new: true });
        
        // Update user status
        await User.findByIdAndUpdate(id, {
          isActive: false,
          status: 'rejected'
        });
      }
    } else {
      // Update associated user
      await User.findByIdAndUpdate(request.userId, {
        isActive: false,
        status: 'rejected'
      });
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('Request rejected successfully');
    res.json({ 
      message: 'Canteen request rejected',
      request: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await CanteenRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await CanteenRequest.countDocuments();
    
    const formattedStats = {
      total: totalRequests,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      if (stat._id) {
        formattedStats[stat._id] = stat.count;
      }
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Debug endpoint to check data structure
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'canteen' }).limit(5);
    const canteenRequests = await CanteenRequest.find({}).limit(5);
    
    res.json({
      users: users,
      canteenRequests: canteenRequests,
      userCount: await User.countDocuments({ role: 'canteen' }),
      requestCount: await CanteenRequest.countDocuments()
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/requests/:id/status - Update request status (generic endpoint)
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    console.log(`Updating request ${id} status to: ${status}`);
    
    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason || 'No reason provided';
    }

    let request = await CanteenRequest.findByIdAndUpdate(id, updateData, { new: true });

    // If not found in CanteenRequest, try updating user record
    if (!request) {
      const user = await User.findById(id);
      if (user && user.canteenRequestId) {
        request = await CanteenRequest.findByIdAndUpdate(user.canteenRequestId, updateData, { new: true });
        
        // Update user status
        await User.findByIdAndUpdate(id, {
          isActive: status === 'approved',
          status: status
        });
      }
    } else {
      // Update associated user
      await User.findByIdAndUpdate(request.userId, {
        isActive: status === 'approved',
        status: status
      });
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`Request ${id} status updated to ${status}`);
    res.json({ 
      message: `Request ${status} successfully`,
      request: request
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// DELETE /api/admin/requests/:id - Delete a canteen request
router.delete('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting request ID: ${id}`);
    
    // Find and delete the canteen request
    let request = await CanteenRequest.findByIdAndDelete(id);

    // If not found in CanteenRequest, try finding by user ID
    if (!request) {
      const user = await User.findById(id);
      if (user && user.canteenRequestId) {
        request = await CanteenRequest.findByIdAndDelete(user.canteenRequestId);
        
        // Remove canteenRequestId from user
        await User.findByIdAndUpdate(id, {
          $unset: { canteenRequestId: 1 },
          isActive: false,
          status: 'inactive'
        });
      }
    } else {
      // Remove canteenRequestId from associated user
      await User.findByIdAndUpdate(request.userId, {
        $unset: { canteenRequestId: 1 },
        isActive: false,
        status: 'inactive'
      });
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('Request deleted successfully');
    res.json({ 
      message: 'Canteen request deleted successfully',
      deletedRequest: request
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// GET /api/admin/requests/status/:status - Get requests by status
router.get('/requests/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    console.log(`Fetching requests with status: ${status}`);
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    const requests = await CanteenRequest.find({ status })
      .populate('userId', 'username email phone name role')
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} requests with status: ${status}`);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests by status:', error);
    res.status(500).json({ error: 'Failed to fetch requests by status' });
  }
});

module.exports = router;