import React, { useState, useEffect } from "react";
import "./Page.css";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Handle different response structures
      let ordersData = [];
      if (Array.isArray(data)) {
        ordersData = data;
      } else if (data.orders && Array.isArray(data.orders)) {
        ordersData = data.orders;
      } else if (data.data && Array.isArray(data.data)) {
        ordersData = data.data;
      } else {
        console.warn('Unexpected response structure:', data);
        ordersData = [];
      }
      
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]); // Ensure orders is always an array
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Function to get status emoji
  const getStatusEmoji = (status) => {
    const statusEmojis = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🔔',
      delivered: '✅',
      cancelled: '❌'
    };
    return statusEmojis[status] || '📦';
  };

  // Function to get payment status emoji
  const getPaymentStatusEmoji = (paymentStatus) => {
    const paymentEmojis = {
      pending: '⏳',
      paid: '💳',
      failed: '❌',
      refunded: '↩️'
    };
    return paymentEmojis[paymentStatus] || '💳';
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to calculate total items
  const getTotalItems = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Function to get items summary
  const getItemsSummary = (items) => {
    if (items.length === 1) {
      return `${items[0].name} x${items[0].quantity}`;
    } else if (items.length === 2) {
      return `${items[0].name} + ${items[1].name}`;
    } else {
      return `${items[0].name} + ${items.length - 1} more items`;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">🛍 My Orders</h1>
        <div className="loading-container">
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h1 className="page-title">🛍 My Orders</h1>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchOrders} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">🛍 My Orders</h1>
      <p className="page-description">Track your food orders easily.</p>
      
      {!Array.isArray(orders) ? (
        <div className="error-container">
          <p className="error-message">Invalid data format received. Please contact support.</p>
          <button onClick={fetchOrders} className="retry-button">Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found. Place your first order now! 🍕</p>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderId}</h3>
                <span className="order-date">{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="order-items">
                <p className="items-summary">
                  {getItemsSummary(order.items)} | ₹{order.totalAmount}
                </p>
                <p className="total-items">
                  Total Items: {getTotalItems(order.items)}
                </p>
              </div>

              <div className="order-status-section">
                <div className="status-row">
                  <span className="status-label">Order Status:</span>
                  <span className="status-value">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)} {getStatusEmoji(order.status)}
                  </span>
                </div>
                
                <div className="status-row">
                  <span className="status-label">Payment:</span>
                  <span className="status-value">
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} {getPaymentStatusEmoji(order.paymentStatus)}
                  </span>
                </div>

                {order.paymentMethod && (
                  <div className="status-row">
                    <span className="status-label">Payment Method:</span>
                    <span className="status-value">
                      {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                       order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {order.customerInfo && (
                <div className="customer-info">
                  <p><strong>Customer:</strong> {order.customerInfo.name}</p>
                  {order.customerInfo.phone && (
                    <p><strong>Phone:</strong> {order.customerInfo.phone}</p>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="order-notes">
                  <p><strong>Notes:</strong> {order.notes}</p>
                </div>
              )}

              {order.estimatedDeliveryTime && (
                <div className="delivery-time">
                  <p><strong>Estimated Delivery:</strong> {formatDate(order.estimatedDeliveryTime)}</p>
                </div>
              )}

              {order.actualDeliveryTime && (
                <div className="delivery-time">
                  <p><strong>Delivered At:</strong> {formatDate(order.actualDeliveryTime)}</p>
                </div>
              )}

              {/* Show detailed items on click/expand */}
              <details className="order-details">
                <summary>View Items Details</summary>
                <div className="items-detail">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-detail">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-price">₹{item.price} each</span>
                      <span className="item-total">Total: ₹{item.total}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;