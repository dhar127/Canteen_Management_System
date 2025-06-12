import React from "react";
import "./Dashboard.css";

const CanteenDashboard = () => {
  return (
    <div className="canteen-dashboard-container">
      <div className="canteen-dashboard-card">
        <h2 className="canteen-dashboard-title">Welcome, Canteen</h2>
        <p className="canteen-dashboard-subtext">
          Manage menu, view orders, and process deliveries.
        </p>
        <button className="canteen-dashboard-button">Manage Menu</button>
        <button className="canteen-dashboard-button">View Orders</button>
      </div>
    </div>
  );
};

export default CanteenDashboard;
