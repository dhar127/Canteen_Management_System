import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BrowseMenuPage.css";

const BrowseMenuPage = () => {
  const [canteensWithMenu, setCanteensWithMenu] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [filters, setFilters] = useState({ categories: [], types: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeView, setActiveView] = useState("browse"); // 'browse' or 'search'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch canteens with menu items
      const canteensResponse = await axios.get('http://localhost:5000/api/browse/canteens-with-menu');
      setCanteensWithMenu(canteensResponse.data.data || []);

      // Fetch featured items
      const featuredResponse = await axios.get('http://localhost:5000/api/browse/featured-items?limit=6');
      setFeaturedItems(featuredResponse.data.data || []);

      // Fetch filters
      const filtersResponse = await axios.get('http://localhost:5000/api/browse/filters');
      setFilters(filtersResponse.data.data || { categories: [], types: [] });

    } catch (error) {
      console.error('Error fetching initial data:', error);
      showErrorMessage('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      showErrorMessage('Please enter at least 2 characters to search');
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get('http://localhost:5000/api/browse/search', {
        params: {
          query: searchQuery,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          type: selectedType !== 'All' ? selectedType : undefined
        }
      });

      setSearchResults(response.data.data.results || []);
      setActiveView('search');
    } catch (error) {
      console.error('Error searching:', error);
      showErrorMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setActiveView('browse');
    setSelectedCategory('All');
    setSelectedType('All');
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

  const showErrorMessage = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #fecaca;
      z-index: 1000;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 4000);
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjxwb2x5Z29uIHBvaW50cz0iMTQwLDcwIDE2MCw5MCAxODAsNzAgMTgwLDExMCAxNDAsMTEwIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSI0IiBmaWxsPSIjOUI5QkEwIi8+CjwvZz4KPC9zdmc+';
    e.target.alt = 'Image not available';
  };

  const renderFoodCard = (item, showCanteen = true) => (
    <div key={item._id} className="food-card">
      <div className="food-image">
        <img 
          src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjxwb2x5Z29uIHBvaW50cz0iMTQwLDcwIDE2MCw5MCAxODAsNzAgMTgwLDExMCAxNDAsMTEwIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSI0IiBmaWxsPSIjOUI5QkEwIi8+PC9zdmc+'} 
          alt={item.name}
          onError={handleImageError}
        />
        <div className="type-badge" style={{ backgroundColor: getTypeColor(item.type) }}>
          {item.type}
        </div>
      </div>
      
      <div className="food-content">
        <div className="food-header">
          <span className="category-icon">{getCategoryIcon(item.category)}</span>
          <h3 className="food-name">{item.name}</h3>
        </div>
        
        <p className="food-description">{item.description}</p>
        
        <div className="food-price">
          <span className="price">₹{item.price}</span>
          {item.spicyLevel && item.spicyLevel !== 'Not Applicable' && (
            <span className="spicy-level">🌶️ {item.spicyLevel}</span>
          )}
        </div>
        
        {showCanteen && item.canteen && (
          <div className="canteen-info">
            <span className="canteen-name">📍 {item.canteen.name}</span>
            {item.canteen.location && (
              <span className="canteen-location">{item.canteen.location}</span>
            )}
          </div>
        )}
        
        <button className="order-btn">
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading delicious food options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🍕 Browse Menu</h1>
        <p className="page-description">Explore tasty dishes from your favorite canteens!</p>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for dishes, cuisine, or canteens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="search-btn"
          >
            {isSearching ? '🔄' : '🔍'}
          </button>
        </div>

        <div className="filters">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {filters.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            {filters.types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {activeView === 'search' && (
            <button onClick={clearSearch} className="clear-search-btn">
              ❌ Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {activeView === 'search' && (
        <div className="search-results-section">
          <h2 className="section-title">
            Search Results for "{searchQuery}" ({searchResults.length} found)
          </h2>
          {searchResults.length > 0 ? (
            <div className="card-grid">
              {searchResults.map(item => renderFoodCard(item, true))}
            </div>
          ) : (
            <div className="no-results">
              <p>No items found matching your search criteria.</p>
              <button onClick={clearSearch} className="back-to-browse-btn">
                🔙 Back to Browse
              </button>
            </div>
          )}
        </div>
      )}

      {/* Browse View */}
      {activeView === 'browse' && (
        <>
          {/* Featured Items */}
          {featuredItems.length > 0 && (
            <div className="featured-section">
              <h2 className="section-title">⭐ Featured Items</h2>
              <div className="card-grid">
                {featuredItems.map(item => renderFoodCard(item, true))}
              </div>
            </div>
          )}

          {/* Canteens with Menu */}
          <div className="canteens-section">
            <h2 className="section-title">🏪 All Canteens</h2>
            {canteensWithMenu.length > 0 ? (
              canteensWithMenu.map(canteen => (
                <div key={canteen.canteenId} className="canteen-section">
                  <div className="canteen-header">
                    <h3 className="canteen-name">{canteen.canteenName}</h3>
                    <div className="canteen-details">
                      {canteen.canteenLocation && (
                        <span className="canteen-location">📍 {canteen.canteenLocation}</span>
                      )}
                      {canteen.canteenContact && (
                        <span className="canteen-contact">📞 {canteen.canteenContact}</span>
                      )}
                    </div>
                    {canteen.canteenDescription && (
                      <p className="canteen-description">{canteen.canteenDescription}</p>
                    )}
                  </div>
                  
                  <div className="card-grid">
                    {canteen.menuItems.map(item => renderFoodCard(item, false))}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-canteens">
                <h3>No canteens available</h3>
                <p>Check back later for delicious food options!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseMenuPage;