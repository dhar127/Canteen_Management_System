import React from "react";
import "./Dashboard.css";

const CustomerDashboard = () => {
  return (
    <div className="customer-dashboard-container">
      <div className="customer-dashboard-card">
        <h2 className="customer-dashboard-title">Welcome, Customer</h2>
        <p className="customer-dashboard-subtext">
          Browse canteens, place orders, and track deliveries.
        </p>
        <button className="customer-dashboard-button">Browse Menu</button>
        <button className="customer-dashboard-button">My Orders</button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
