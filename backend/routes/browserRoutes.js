import express from "express";
import Menu from "../models/Menu.js";
import CanteenRequest from "../models/CanteenRequest.js";

const router = express.Router();

// 🔍 Get canteens with their menu items
router.get("/canteens-with-menu", async (req, res) => {
  try {
    // Get all approved canteens
    const canteens = await CanteenRequest.find({ status: 'approved' })
      .select('name location contactEmail contactPhone description');
    
    const canteensWithMenu = [];
    
    for (const canteen of canteens) {
      // Get menu items for this canteen
      const menuItems = await Menu.find({ 
        canteenId: canteen._id, 
        available: true 
      }).populate('canteenId', 'name location contactEmail contactPhone');
      
      if (menuItems.length > 0) {
        canteensWithMenu.push({
          canteenId: canteen._id,
          canteenName: canteen.name,
          canteenLocation: canteen.location,
          canteenContact: canteen.contactEmail || canteen.contactPhone,
          canteenDescription: canteen.description,
          menuItems: menuItems
        });
      }
    }
    
    res.json({
      success: true,
      data: canteensWithMenu
    });
  } catch (error) {
    console.error("Get canteens with menu error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch canteens with menu' 
    });
  }
});

// ⭐ Get featured menu items
router.get("/featured-items", async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    // Get highly rated or recently added items
    const featuredItems = await Menu.find({ 
      available: true,
      $or: [
        { rating: { $gte: 4 } }, // High rated items
        { tags: { $in: ['Featured', 'Popular', 'Chef\'s Special'] } }
      ]
    })
    .populate('canteenId', 'name location')
    .sort({ rating: -1, createdAt: -1 })
    .limit(parseInt(limit));
    
    // If not enough featured items, fill with recent items
    if (featuredItems.length < limit) {
      const recentItems = await Menu.find({ 
        available: true,
        _id: { $nin: featuredItems.map(item => item._id) }
      })
      .populate('canteenId', 'name location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) - featuredItems.length);
      
      featuredItems.push(...recentItems);
    }
    
    // Format the response to match frontend expectations
    const formattedItems = featuredItems.map(item => ({
      ...item.toObject(),
      canteen: item.canteenId
    }));
    
    res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error("Get featured items error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured items' 
    });
  }
});

// 🔧 Get filter options
router.get("/filters", async (req, res) => {
  try {
    // Get distinct categories and types from available menu items
    const categories = await Menu.distinct('category', { available: true });
    const types = await Menu.distinct('type', { available: true });
    
    res.json({
      success: true,
      data: {
        categories: ['All', ...categories],
        types: ['All', ...types]
      }
    });
  } catch (error) {
    console.error("Get filters error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch filters' 
    });
  }
});

// 🔍 Search menu items across all canteens
router.get("/search", async (req, res) => {
  try {
    const { query, category, type, limit = 50 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }
    
    // Build search filter
    const searchFilter = {
      available: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };
    
    // Add category filter
    if (category && category !== 'All') {
      searchFilter.category = category;
    }
    
    // Add type filter
    if (type && type !== 'All') {
      searchFilter.type = type;
    }
    
    const searchResults = await Menu.find(searchFilter)
      .populate('canteenId', 'name location contactEmail contactPhone')
      .sort({ rating: -1, name: 1 })
      .limit(parseInt(limit));
    
    // Format the response to match frontend expectations
    const formattedResults = searchResults.map(item => ({
      ...item.toObject(),
      canteen: item.canteenId
    }));
    
    res.json({
      success: true,
      data: {
        results: formattedResults,
        total: formattedResults.length,
        query: query
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Search failed' 
    });
  }
});

export default router;