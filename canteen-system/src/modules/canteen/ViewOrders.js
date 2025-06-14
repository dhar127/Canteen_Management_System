import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewOrders.css";

const ViewOrders = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canteenId, setCanteenId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null); // For debugging

  useEffect(() => {
    console.log('ViewOrders mounted, userId:', userId);
    fetchCanteenId();
  }, [userId]);

  useEffect(() => {
    console.log('canteenId changed:', canteenId);
    if (canteenId) {
      fetchOrders();
    }
  }, [canteenId, filterStatus]);

  // Get canteen ID from the approved request
  const fetchCanteenId = async () => {
    if (!userId) {
      console.error('No userId found in localStorage');
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching canteen request for userId:', userId);
      const response = await axios.get(`http://localhost:5000/api/canteen/request-by-user/${userId}`);
      console.log('Canteen request response:', response.data);
      
      if (response.data && response.data.status === 'approved') {
        console.log('Canteen approved, setting canteenId:', response.data._id);
        setCanteenId(response.data._id);
        setDebugInfo({ canteenRequestId: response.data._id, status: response.data.status });
      } else {
        console.error('Canteen not approved, status:', response.data?.status);
        setError(`Canteen not approved yet. Current status: ${response.data?.status || 'unknown'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching canteen info:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to fetch canteen information: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  // Fetch orders for this canteen
  const fetchOrders = async () => {
    if (!canteenId) {
      console.error('No canteenId available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching orders for canteenId:', canteenId);
      
      // Try multiple possible endpoints
      let response;
      let ordersData = [];
      
      try {
        // Primary endpoint
        response = await axios.get(`http://localhost:5000/api/orders/canteen/${canteenId}`);
        console.log('Orders response from /canteen endpoint:', response.data);
      } catch (primaryError) {
        console.log('Primary endpoint failed, trying alternative:', primaryError.message);
        
        // Alternative endpoint - try with different URL structure
        try {
          response = await axios.get(`http://localhost:5000/api/orders`, {
            params: { canteenId: canteenId }
          });
          console.log('Orders response from alternative endpoint:', response.data);
        } catch (alternativeError) {
          console.log('Alternative endpoint also failed:', alternativeError.message);
          throw primaryError; // Throw the original error
        }
      }

      // Handle different response structures
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (response.data.success && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else {
        console.log('Unexpected response structure:', response.data);
        ordersData = [];
      }

      console.log('Processed orders data:', ordersData);

      // Filter orders based on selected status
      if (filterStatus !== 'all') {
        ordersData = ordersData.filter(order => order.status === filterStatus);
        console.log(`Filtered orders for status '${filterStatus}':`, ordersData);
      }

      setOrders(ordersData);
      setError(null);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        totalOrders: ordersData.length,
        filteredBy: filterStatus,
        lastFetch: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = "Failed to fetch orders";
      if (error.response?.status === 404) {
        errorMessage = "Orders endpoint not found. Please check your API server.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error while fetching orders.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      const response = await axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus
      });
      console.log('Status update response:', response.data);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Failed to update order status: ${error.response?.data?.message || error.message}`);
    }
  };

  // Refresh orders
  const handleRefresh = async () => {
    console.log('Refreshing orders...');
    setRefreshing(true);
    await fetchOrders();
  };

  // Test API connection
  const testConnection = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/test');
      console.log('API test response:', response.data);
      alert('API connection successful!');
    } catch (error) {
      console.error('API connection failed:', error);
      alert(`API connection failed: ${error.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      preparing: '#fd7e14',
      ready: '#28a745',
      delivered: '#6f42c1',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // Get status emoji
  const getStatusEmoji = (status) => {
    const emojis = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🔔',
      delivered: '🚚',
      cancelled: '❌'
    };
    return emojis[status] || '📦';
  };

  // Calculate total items
  const getTotalItems = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  if (loading && !refreshing) {
    return (
      <div className="view-orders-container">
        <div className="loading-container">
          <h2>Loading Orders...</h2>
          {debugInfo && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Debug: {JSON.stringify(debugInfo, null, 2)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-orders-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          
          {/* Debug Information */}
          {debugInfo && (
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>Debug Info:</strong>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button onClick={testConnection} className="back-button" style={{ marginRight: '10px' }}>
              Test API Connection
            </button>
            <button onClick={() => navigate('/canteen/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-orders-container">
      <div className="view-orders-header">
        <div className="header-top">
          <button onClick={() => navigate('/canteen/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>Customer Orders</h1>
          <button 
            onClick={handleRefresh} 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #1976d2',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <strong>Debug:</strong> Canteen ID: {canteenId}, Total Orders: {debugInfo.totalOrders}, Filter: {debugInfo.filteredBy}
          </div>
        )}

        {/* Filter Section */}
        <div className="filter-section">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select 
            id="statusFilter"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>
            {filterStatus === 'all' 
              ? 'No orders found for your canteen yet.' 
              : `No ${filterStatus} orders found.`
            }
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Canteen ID: {canteenId}
          </p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <h3>#{order.orderId || order._id}</h3>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusEmoji(order.status)} {order.status?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>

              {/* Customer Information */}
              {order.customerInfo && (
                <div className="customer-section">
                  <h4>Customer Details</h4>
                  <div className="customer-info">
                    <p><strong>Name:</strong> {order.customerInfo.name}</p>
                    <p><strong>Phone:</strong> {order.customerInfo.phone}</p>
                    {order.customerInfo.email && (
                      <p><strong>Email:</strong> {order.customerInfo.email}</p>
                    )}
                    {order.customerInfo.address && (
                      <p><strong>Address:</strong> {order.customerInfo.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="items-section">
                <h4>Order Items ({getTotalItems(order.items)} items)</h4>
                <div className="items-list">
                  {order.items && Array.isArray(order.items) ? order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-details">
                        Qty: {item.quantity} × ₹{item.price} = ₹{item.total || (item.quantity * item.price)}
                      </span>
                    </div>
                  )) : (
                    <p>No items found in this order</p>
                  )}
                </div>
                <div className="order-total">
                  <strong>Total Amount: ₹{order.totalAmount}</strong>
                </div>
              </div>

              {/* Payment Information */}
              <div className="payment-section">
                <div className="payment-info">
                  <span>Payment: {order.paymentStatus?.toUpperCase() || 'UNKNOWN'}</span>
                  {order.paymentMethod && (
                    <span>Method: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="notes-section">
                  <p><strong>Notes:</strong> {order.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="order-actions">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                      className="action-button confirm"
                    >
                      Confirm Order
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                      className="action-button cancel"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                
                {order.status === 'confirmed' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                    className="action-button preparing"
                  >
                    Start Preparing
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'ready')}
                    className="action-button ready"
                  >
                    Mark as Ready
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button 
                    onClick={() => updateOrderStatus(order._id, 'delivered')}
                    className="action-button delivered"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>

              {/* Timestamps */}
              <div className="timestamps">
                <small>Ordered: {formatDate(order.createdAt)}</small>
                {order.estimatedDeliveryTime && (
                  <small>Estimated Delivery: {formatDate(order.estimatedDeliveryTime)}</small>
                )}
                {order.actualDeliveryTime && (
                  <small>Delivered: {formatDate(order.actualDeliveryTime)}</small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewOrders;