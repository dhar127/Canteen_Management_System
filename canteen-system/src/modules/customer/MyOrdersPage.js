import React from "react";
import "./Page.css";

const MyOrdersPage = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">🛍 My Orders</h1>
      <p className="page-description">Track your food orders easily.</p>
      <div className="order-list">
        <div className="order-card">
          <h3>Order #1234</h3>
          <p>Pizza + Coke | ₹180</p>
          <p>Status: Delivered ✅</p>
        </div>
        <div className="order-card">
          <h3>Order #1235</h3>
          <p>Burger + Fries | ₹140</p>
          <p>Status: On the way 🛵</p>
        </div>
      </div>
    </div>
  );
};
export default MyOrdersPage;