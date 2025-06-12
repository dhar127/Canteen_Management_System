import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Welcome to Admin Dashboard</h2>
        <p className="dashboard-subtext">
          Manage users, view reports, and oversee operations from here.
        </p>
        <button className="dashboard-button">View Reports</button>
        <button className="dashboard-button">Manage Users</button>
      </div>
    </div>
  );
};

export default Dashboard;
