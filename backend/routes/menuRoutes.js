import express from "express";
import Menu from "../models/Menu.js";
import CanteenRequest from "../models/CanteenRequest.js";

const router = express.Router();

// 🍽️ Add new menu item
router.post("/add", async (req, res) => {
  try {
    const { 
      userId, 
      canteenId, 
      name, 
      price, 
      type, 
      category, 
      description, 
      spicyLevel, 
      prepTime, 
      available, 
      imageUrl,
      tags,
      allergens,
      nutritionInfo
    } = req.body;
    
    // Validation
    if (!userId || !canteenId || !name || !price || !type || !category || !description) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Verify that the canteen belongs to this user and is approved
    const canteenRequest = await CanteenRequest.findOne({ 
      _id: canteenId, 
      userId: userId, 
      status: 'approved' 
    });
    
    if (!canteenRequest) {
      return res.status(403).json({ message: 'Unauthorized: Canteen not found or not approved' });
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
      prepTime: prepTime || null,
      tags: tags || [],
      allergens: allergens || [],
      nutritionInfo: nutritionInfo || {}
    });

    await menuItem.save();

    const populatedMenuItem = await Menu.findById(menuItem._id)
      .populate('canteenId', 'name location')
      .populate('userId', 'name');

    res.status(201).json({
      message: 'Menu item added successfully',
      menuItem: populatedMenuItem
    });
  } catch (error) {
    console.error("Add menu item error:", error);
    res.status(500).json({ message: 'Failed to add menu item' });
  }
});

// 🍽️ Get all menu items for a canteen
router.get("/canteen/:canteenId", async (req, res) => {
  try {
    const { category, type, available, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    const filter = { canteenId: req.params.canteenId };
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (available !== undefined) filter.available = available === 'true';
    
    let query = Menu.find(filter).populate('canteenId', 'name location');
    
    // Search functionality
    if (search) {
      query = Menu.searchItems(req.params.canteenId, search);
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortOptions);
    
    const menuItems = await query;
    
    res.json({
      menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// 🍽️ Get menu items by user (for canteen owner)
router.get("/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const menuItems = await Menu.find({ userId: req.params.userId })
      .populate('canteenId', 'name location')
      .sort({ category: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Menu.countDocuments({ userId: req.params.userId });
    
    res.json({
      menuItems,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get user menu items error:", error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// 🍽️ Update menu item
router.put("/update/:menuId", async (req, res) => {
  try {
    const { 
      userId, 
      name, 
      price, 
      type, 
      category, 
      description, 
      spicyLevel, 
      prepTime, 
      available, 
      imageUrl,
      tags,
      allergens,
      nutritionInfo
    } = req.body;
    const { menuId } = req.params;
    
    // Verify that the menu item belongs to this user
    const existingMenuItem = await Menu.findOne({ _id: menuId, userId: userId });
    
    if (!existingMenuItem) {
      return res.status(403).json({ message: 'Unauthorized: Menu item not found' });
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
      tags: tags || [],
      allergens: allergens || [],
      nutritionInfo: nutritionInfo || {},
      updatedAt: new Date()
    };

    const updatedMenuItem = await Menu.findByIdAndUpdate(
      menuId,
      updateData,
      { new: true, runValidators: true }
    ).populate('canteenId', 'name location');

    res.json({
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});

// 🍽️ Delete menu item
router.delete("/delete/:menuId", async (req, res) => {
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
    console.error("Delete menu item error:", error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

// 🍽️ Toggle menu item availability
router.put("/toggle-availability/:menuId", async (req, res) => {
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
    ).populate('canteenId', 'name location');

    res.json({
      message: `Menu item ${updatedMenuItem.available ? 'enabled' : 'disabled'} successfully`,
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error("Toggle availability error:", error);
    res.status(500).json({ message: 'Failed to toggle availability' });
  }
});

// 🍽️ Get menu item by ID
router.get("/item/:menuId", async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.menuId)
      .populate('canteenId', 'name location contactEmail contactPhone')
      .populate('userId', 'name');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

// 🍽️ Rate menu item
router.post("/rate/:menuId", async (req, res) => {
  try {
    const { rating, userId } = req.body;
    const { menuId } = req.params;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const menuItem = await Menu.findById(menuId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Update rating
    menuItem.updateRating(rating);
    await menuItem.save();
    
    res.json({
      message: 'Rating submitted successfully',
      newRating: menuItem.rating,
      ratingCount: menuItem.ratingCount
    });
  } catch (error) {
    console.error("Rate menu item error:", error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// 🍽️ Get menu categories for a canteen
router.get("/categories/:canteenId", async (req, res) => {
  try {
    const categories = await Menu.distinct('category', { 
      canteenId: req.params.canteenId,
      available: true 
    });
    
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

export default router;