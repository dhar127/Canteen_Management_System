import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMenu.css";

const ManageMenu = () => {
  const userId = localStorage.getItem("userId");
  
  const [menuItems, setMenuItems] = useState([]);
  const [canteenRequest, setCanteenRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "",
    category: "",
    description: "",
    spicyLevel: "Not Applicable",
    prepTime: "",
    available: true,
    imageUrl: ""
  });

  const categories = ["Breakfast", "Lunch", "Snacks", "Dinner", "Drinks", "Dessert"];
  const types = ["Veg", "Non-Veg", "Vegan", "Egg"];
  const spicyLevels = ["Not Applicable", "Mild", "Medium", "Spicy"];

  useEffect(() => {
    fetchCanteenRequest();
  }, [userId]);

  useEffect(() => {
    if (canteenRequest) {
      fetchMenuItems();
    }
  }, [canteenRequest]);

  const fetchCanteenRequest = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/canteen/request-by-user/${userId}`);
      if (response.data.status === 'approved') {
        setCanteenRequest(response.data);
      }
    } catch (error) {
      console.error('Error fetching canteen request:', error);
    }
    setLoading(false);
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/menu/user/${userId}`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Handle image URL preview
    if (name === 'imageUrl') {
      handleImagePreview(value);
    }
  };

  const handleImagePreview = (url) => {
    if (!url) {
      setImagePreview("");
      return;
    }

    setImageLoading(true);
    const img = new Image();
    
    img.onload = () => {
      setImagePreview(url);
      setImageLoading(false);
    };
    
    img.onerror = () => {
      setImagePreview("");
      setImageLoading(false);
      showErrorMessage('Invalid image URL or image failed to load');
    };
    
    img.src = url;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      type: "",
      category: "",
      description: "",
      spicyLevel: "Not Applicable",
      prepTime: "",
      available: true,
      imageUrl: ""
    });
    setEditingItem(null);
    setShowAddForm(false);
    setImagePreview("");
    setImageLoading(false);
  };

  const validateImageUrl = (url) => {
    if (!url) return true; // Allow empty URLs
    
    try {
      const urlObj = new URL(url);
      // Check if it's a valid HTTP/HTTPS URL
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }
      // Check for common image extensions or Google image patterns
      const validPatterns = [
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
        /googleusercontent\.com/,
        /images\.unsplash\.com/,
        /cdn\./,
        /imgur\.com/
      ];
      
      return validPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate image URL
    if (formData.imageUrl && !validateImageUrl(formData.imageUrl)) {
      showErrorMessage('Please enter a valid image URL (jpg, png, gif, webp) or from supported platforms');
      return;
    }

    try {
      const dataToSend = {
        userId,
        canteenId: canteenRequest._id,
        name: formData.name,
        price: parseFloat(formData.price),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        spicyLevel: formData.spicyLevel,
        prepTime: formData.prepTime,
        available: formData.available,
        imageUrl: formData.imageUrl
      };

      let response;
      if (editingItem) {
        response = await axios.put(`http://localhost:5000/api/menu/update/${editingItem._id}`, dataToSend);
      } else {
        response = await axios.post('http://localhost:5000/api/menu/add', dataToSend);
      }

      showSuccessMessage(response.data.message);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      showErrorMessage(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      type: item.type,
      category: item.category,
      description: item.description,
      spicyLevel: item.spicyLevel,
      prepTime: item.prepTime || "",
      available: item.available,
      imageUrl: item.imageUrl || ""
    });
    setEditingItem(item);
    setShowAddForm(true);
    
    // Set image preview for editing
    if (item.imageUrl) {
      handleImagePreview(item.imageUrl);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await axios.delete(`http://localhost:5000/api/menu/delete/${itemId}`, {
          data: { userId }
        });
        showSuccessMessage('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        showErrorMessage(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/menu/toggle-availability/${itemId}`, {
        userId
      });
      showSuccessMessage(response.data.message);
      fetchMenuItems();
    } catch (error) {
      showErrorMessage(error.response?.data?.message || 'Toggle failed');
    }
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
   
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  };

  const showErrorMessage = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
  
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Veg': return '#10b981';
      case 'Non-Veg': return '#ef4444';
      case 'Vegan': return '#059669';
      case 'Egg': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Breakfast: '🌅',
      Lunch: '🍽️',
      Snacks: '🍿',
      Dinner: '🌙',
      Drinks: '🥤',
      Dessert: '🍰'
    };
    return icons[category] || '🍴';
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1MEgxNTBWMTUwSDUwVjUwWiIgc3Ryb2tlPSIjOUI5QkEwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI5MCIgeT0iOTAiPgo8cGF0aCBkPSJNMTIgMkw0IDdWMTdIMjBWN0wxMiAyWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4KPC9zdmc+';
    e.target.alt = 'Image not available';
  };

  if (loading) {
    return (
      <div className="manage-menu-container">
        <div className="loading" >
          Loading...
        </div>
      </div>
    );
  }

  if (!canteenRequest || canteenRequest.status !== 'approved') {
    return (
      <div className="manage-menu-container">
        <div className="access-denied" >
          <h2 >Access Denied</h2>
          <p >
            Your canteen request must be approved to manage menu items.
          </p>
          <button 
            onClick={() => window.location.href = '/canteen/dashboard'}
           
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-menu-container">
      <div className="menu-header">
        <h1>Manage Menu - {canteenRequest.name}</h1>
        <button 
          className="add-item-btn"
          onClick={() => setShowAddForm(!showAddForm)}
         
        >
          {showAddForm ? '❌ Cancel' : '➕ Add New Item'}
        </button>
      </div>

      {showAddForm && (
        <div className="menu-form-container" >
          <h3>
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} className="menu-form">
            <div className="form-grid" >
              <div className="form-group">
                <label >
                  Dish Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Masala Dosa"
                  required
                 
                />
              </div>

              <div className="form-group">
                <label >
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 120"
                  min="1"
                  step="0.01"
                  required
                 
                />
              </div>

              <div className="form-group">
                <label >
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  
                >
                  <option value="">Select Type</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label >
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                 
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label >
                  Spicy Level
                </label>
                <select
                  name="spicyLevel"
                  value={formData.spicyLevel}
                  onChange={handleInputChange}
                 
                >
                  {spicyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label >
                  Prep Time
                </label>
                <input
                  type="text"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleInputChange}
                  placeholder="e.g. 15 mins"
                 
                />
              </div>
            </div>

            <div className="form-group" >
              <label >
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the taste, ingredients, etc."
                required
                rows="3"
                
              />
            </div>

            <div className="form-group" >
              <label >
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                
              />
              <small >
                💡 Right-click on Google Images → "Copy image address" and paste here
              </small>
              
              {/* Image Preview */}
              {imageLoading && (
                <div >
                  Loading image preview...
                </div>
              )}
              
              {imagePreview && !imageLoading && (
                <div >
                  <p >
                    Image Preview:
                  </p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={handleImageError}
                   
                  />
                </div>
              )}
            </div>

            <div className="form-group" >
              <label >
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                 
                />
                <span >Available for orders</span>
              </label>
            </div>

            <div >
              <button
                type="button"
                onClick={resetForm}
               
              >
                Cancel
              </button>
              <button
                type="submit"
                
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items Display */}
      <div className="menu-items-grid" >
        {menuItems.map((item) => (
          <div key={item._id} className="menu-item-card" >
            {/* Image */}
            <div >
              <img
                src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjxzdmcgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMTQwIiB5PSI3MCI+CjxwYXRoIGQ9Ik0xMiAyTDQgN1YxN0gyMFY3TDEyIDJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo8L3N2Zz4='}
                alt={item.name}
                onError={handleImageError}

              />
              {!item.available && (
                <div >
                  Unavailable
                </div>
              )}
            </div>

            {/* Content */}
            <div >
              <div >
                <span >{getCategoryIcon(item.category)}</span>
                <h3 >
                  {item.name}
                </h3>
                <span>
                  {item.type}
                </span>
              </div>

              <p>
                {item.description}
              </p>

              <div >
                <span >
                  ₹{item.price}
                </span>
                {item.prepTime && (
                  <span >
                    ⏱️ {item.prepTime}
                  </span>
                )}
              </div>

              {item.spicyLevel !== 'Not Applicable' && (
                <div >
                  <span >
                    🌶️ {item.spicyLevel}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div >
                <button
                  onClick={() => handleEdit(item)}
                 
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleAvailability(item._id)}
                  
                >
                  {item.available ? '🚫 Disable' : '✅ Enable'}
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div >
          <h3>No menu items yet</h3>
          <p>Start by adding your first menu item!</p>
        </div>
      )}
    </div>
  );
};

export default ManageMenu;