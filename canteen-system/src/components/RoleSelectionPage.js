import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelectionPage.css";

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="role-selection-container">
      <div className="role-card animate-slide">
        <h1 className="title">🍔 Canteen Management System</h1>
        <p className="subtitle">Select your role to continue</p>
        <div className="buttons">
          <button onClick={() => navigate("/login/customer")}>👤 Customer</button>
          <button onClick={() => navigate("/login/canteen")}>🏪 Canteen</button>
          <button onClick={() => navigate("/login/admin")}>🛠️ Admin</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
