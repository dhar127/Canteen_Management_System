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
  
  // Cart functionality
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // Payment options
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem('foodCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('foodCart', JSON.stringify(cart));
  }, [cart]);

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

  // Cart functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    showSuccessMessage(`${item.name} added to cart!`);
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item._id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };

  // Direct payment initiation - no customer form
  const initiatePlaceOrder = () => {
    if (cart.length === 0) {
      showErrorMessage('Your cart is empty!');
      return;
    }
    
    setShowCart(false);
    setShowPaymentOptions(true);
  };

  const handleCashOnDelivery = async () => {
    try {
      setPaymentLoading(true);
      
      // Get the canteen ID from the first item (assuming all items are from same canteen)
      const firstItem = cart[0];
      const canteenId = firstItem.canteen?._id || firstItem.canteenId;
      
      const orderPayload = {
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: parseFloat(getCartTotal().toFixed(2)),
        canteenId: canteenId,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending'
      };

      console.log('Placing COD order with data:', orderPayload);

      const response = await axios.post('http://localhost:5000/api/orders/place', orderPayload);
      
      if (response.data.success) {
        const orderDetails = response.data.data;
        
        // Generate a delivery code
        const deliveryCode = `COD-${orderDetails.orderId.slice(-6).toUpperCase()}`;
        
        showSuccessMessage('Order placed successfully with Cash on Delivery!');
        
        clearCart();
        setShowPaymentOptions(false);
        
        // Show delivery code
        setTimeout(() => {
          alert(`Order Confirmed - Cash on Delivery!\n\nOrder ID: ${orderDetails.orderId}\nDelivery Code: ${deliveryCode}\nTotal: ₹${orderDetails.totalAmount}\n\n⚠️ Important: Show this delivery code at the delivery counter when making payment.\n\nEstimated Delivery: ${orderDetails.estimatedDeliveryTime ? new Date(orderDetails.estimatedDeliveryTime).toLocaleString() : 'TBD'}`);
        }, 1000);
      } else {
        showErrorMessage(response.data.error || 'Failed to place order. Please try again.');
      }
      
    } catch (error) {
      console.error('Error placing COD order:', error);
      const errorMessage = error.response?.data?.error || 'Failed to place order. Please try again.';
      showErrorMessage(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Get the canteen ID from the first item
      const firstItem = cart[0];
      const canteenId = firstItem.canteen?._id || firstItem.canteenId;
      
      // First create the order with pending payment status
      const orderPayload = {
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: parseFloat(getCartTotal().toFixed(2)),
        canteenId: canteenId,
        paymentMethod: 'online',
        paymentStatus: 'pending'
      };

      console.log('Creating order for online payment:', orderPayload);

      const orderResponse = await axios.post('http://localhost:5000/api/orders/place', orderPayload);
      
      if (orderResponse.data.success) {
        const orderDetails = orderResponse.data.data;
        
        // Generate transaction ID
        const merchantTransactionId = `TXN_${Date.now()}`;
        
        // Simulate PhonePe payment integration
        const confirmPayment = window.confirm(
          `Redirecting to PhonePe for payment of ₹${orderDetails.totalAmount}\n\nClick OK to simulate successful payment, Cancel to abort.`
        );

        if (confirmPayment) {
          // Simulate payment success - update order status in database
          const paymentUpdateResponse = await axios.post('http://localhost:5000/api/orders/update-payment-status', {
            orderId: orderDetails.orderId,
            paymentStatus: 'completed',
            transactionId: merchantTransactionId,
            paymentMethod: 'online'
          });

          if (paymentUpdateResponse.data.success) {
            showSuccessMessage('Payment successful! Order confirmed.');
            
            clearCart();
            setShowPaymentOptions(false);
            
            // Show success confirmation
            setTimeout(() => {
              alert(`Payment Successful!\n\nOrder ID: ${orderDetails.orderId}\nTransaction ID: ${merchantTransactionId}\nTotal Paid: ₹${orderDetails.totalAmount}\nStatus: Confirmed & Paid\n\n✅ Your order is being prepared!\nEstimated Delivery: ${orderDetails.estimatedDeliveryTime ? new Date(orderDetails.estimatedDeliveryTime).toLocaleString() : 'TBD'}`);
            }, 1000);
          } else {
            showErrorMessage('Payment completed but failed to update order status. Please contact support.');
          }
        } else {
          // Payment cancelled - notify user
          showErrorMessage('Payment cancelled. Your order is still pending.');
        }
      } else {
        showErrorMessage(orderResponse.data.error || 'Failed to create order. Please try again.');
      }
      
    } catch (error) {
      console.error('Error processing online payment:', error);
      const errorMessage = error.response?.data?.error || 'Payment processing failed. Please try again.';
      showErrorMessage(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
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
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 4000);
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d1fae5;
      color: #065f46;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #a7f3d0;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjxwb2x5Z29uIHBvaW50cz0iMTQwLDcwIDE2MCw5MCAxODAsNzAgMTgwLDExMCAxNDAsMTEwIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSI0IiBmaWxsPSIjOUI5QkEwIi8+PC9zdmc+';
    e.target.alt = 'Image not available';
  };

  const renderFoodCard = (item, showCanteen = true) => {
    const cartItem = cart.find(cartItem => cartItem._id === item._id);
    const inCart = !!cartItem;
    
    return (
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
          {inCart && (
            <div className="in-cart-badge">
              ✓ In Cart ({cartItem.quantity})
            </div>
          )}
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
          
          <div className="order-actions">
            {!inCart ? (
              <button 
                className="order-btn add-to-cart"
                onClick={() => addToCart(item)}
              >
                🛒 Add to Cart
              </button>
            ) : (
              <div className="cart-controls">
                <button 
                  className="quantity-btn"
                  onClick={() => updateCartItemQuantity(item._id, cartItem.quantity - 1)}
                >
                  -
                </button>
                <span className="quantity">{cartItem.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => updateCartItemQuantity(item._id, cartItem.quantity + 1)}
                >
                  +
                </button>
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item._id)}
                  title="Remove from cart"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentOptions = () => {
    if (!showPaymentOptions) return null;

    return (
      <div className="cart-overlay">
        <div className="cart-modal payment-options-modal">
          <div className="cart-header">
            <h3>💳 Choose Payment Method</h3>
            <button className="close-cart" onClick={() => setShowPaymentOptions(false)}>
              ✕
            </button>
          </div>
          
          <div className="payment-content">
            <div className="order-summary">
              <h4>Order Summary</h4>
              <div className="summary-items">
                {cart.map(item => (
                  <div key={item._id} className="summary-item">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <strong>Total: ₹{getCartTotal()}</strong>
              </div>
            </div>

            <div className="payment-methods">
              <div className="payment-method-card">
                <div className="payment-method-header">
                  <h4>💵 Cash on Delivery</h4>
                  <p>Pay when your order is delivered. You'll receive a delivery code to show at the counter.</p>
                </div>
                <button 
                  className="payment-btn cod-btn"
                  onClick={handleCashOnDelivery}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? '⏳ Processing...' : '💵 Choose Cash on Delivery'}
                </button>
              </div>

              <div className="payment-method-card">
                <div className="payment-method-header">
                  <h4>📱 Pay Online</h4>
                  <p>Secure payment via PhonePe. Your order will be confirmed immediately upon payment.</p>
                </div>
                <button 
                  className="payment-btn online-btn"
                  onClick={handleOnlinePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? '⏳ Processing...' : '📱 Pay with PhonePe'}
                </button>
              </div>
            </div>

            <div className="payment-actions">
              <button 
                onClick={() => setShowPaymentOptions(false)}
                className="cancel-btn"
                disabled={paymentLoading}
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCart = () => {
    if (!showCart) return null;

    return (
      <div className="cart-overlay">
        <div className="cart-modal">
          <div className="cart-header">
            <h3>🛒 Your Cart ({getCartItemCount()} items)</h3>
            <button className="close-cart" onClick={() => setShowCart(false)}>
              ✕
            </button>
          </div>
          
          <div className="cart-content">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
                <button onClick={() => setShowCart(false)}>Continue Shopping</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item._id} className="cart-item">
                      <img 
                        src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjxwb2x5Z29uIHBvaW50cz0iMjgsMjQgMzIsMjggMzYsMjQgMzYsMzYgMjgsMzYiIGZpbGw9IiM5QjlCQTAiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyOCIgcj0iMiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'} 
                        alt={item.name}
                        className="cart-item-image"
                      />
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p>₹{item.price} each</p>
                        {item.canteen && (
                          <small>📍 {item.canteen.name}</small>
                        )}
                      </div>
                      <div className="cart-item-controls">
                        <button onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}>
                          +
                        </button>
                        <button 
                          className="remove-item"
                          onClick={() => removeFromCart(item._id)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="cart-item-total">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-total">
                    <h3>Total: ₹{getCartTotal()}</h3>
                  </div>
                  <div className="cart-actions">
                    <button onClick={clearCart} className="clear-cart">
                      Clear Cart
                    </button>
                    <button onClick={initiatePlaceOrder} className="place-order">
                      Place Order →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="browse-menu-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading delicious food options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-menu-page">
      {/* Cart Icon */}
      <div className="cart-icon" onClick={() => setShowCart(true)}>
        🛒
        {getCartItemCount() > 0 && (
          <span className="cart-count">{getCartItemCount()}</span>
        )}
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for food items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '⏳' : '🔍'}
          </button>
        </div>
        
        {/* Filters */}
        <div className="filters">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {filters.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            {filters.types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {activeView === 'search' && (
            <button onClick={clearSearch} className="clear-search">
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeView === 'search' ? (
          // Search Results
          <div className="search-results">
            <h2>Search Results ({searchResults.length} found)</h2>
            {searchResults.length === 0 ? (
              <div className="no-results">
                <p>No food items found matching your search.</p>
                <button onClick={clearSearch}>Browse All Items</button>
              </div>
            ) : (
              <div className="food-grid">
                {searchResults.map(item => renderFoodCard(item))}
              </div>
            )}
          </div>
        ) : (
          // Browse View
          <>
            {/* Featured Items */}
            {featuredItems.length > 0 && (
              <div className="featured-section">
                <h2>⭐ Featured Items</h2>
                <div className="food-grid">
                  {featuredItems.map(item => renderFoodCard(item))}
                </div>
              </div>
            )}

            {/* Canteens with Menu */}
            <div className="canteens-section">
              <h2>🏪 Browse by Canteen</h2>
              {canteensWithMenu.map(canteen => (
                <div key={canteen._id} className="canteen-section">
                  <div className="canteen-header">
                    <h3>{canteen.name}</h3>
                    <p>{canteen.location}</p>
                  </div>
                  <div className="food-grid">
                    {canteen.menuItems.map(item => renderFoodCard(item, false))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Render Modals */}
      {renderCart()}
      {renderPaymentOptions()}
    </div>
  );
};

export default BrowseMenuPage;