import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const CustomerDashboard = () => {
  return (
   <div className="customer-dashboard-container">
  <div className="customer-dashboard-card">
    <h2 className="customer-dashboard-title">Welcome, Foodie! 🍔</h2>
    <p className="customer-dashboard-subtext">
      Craving something delicious? Let’s explore your options!
    </p>

    <img
      src="/images/food-dashboard.png"
      alt="Food Banner"
      className="dashboard-image"
    />

    <div className="dashboard-buttons">
      <Link to="/customer/browse" className="customer-dashboard-button">
        🍽 Browse Menu
      </Link>
      <Link to="/customer/orders" className="customer-dashboard-button">
        🛍 My Orders
      </Link>
      <Link to="/customer/profile" className="customer-dashboard-button">
        👤 My Profile
      </Link>
      <Link to="/customer/support" className="customer-dashboard-button">
        📞 Support
      </Link>
    </div>
  </div>
</div>

  );
};

export default CustomerDashboard;
