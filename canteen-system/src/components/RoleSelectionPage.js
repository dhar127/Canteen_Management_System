import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelectionPage.css"; // Import CSS

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="role-selection-container">
      <div className="role-card animate-slide">
        <h1 className="title">Welcome to Canteen Management System</h1>
        <p className="subtitle">Please select your role to continue</p>
        <div className="buttons">
          <button onClick={() => navigate("/login/customer")}>Continue as Customer</button>
          <button onClick={() => navigate("/login/canteen")}>Continue as Canteen</button>
          <button onClick={() => navigate("/login/admin")}>Continue as Admin</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
