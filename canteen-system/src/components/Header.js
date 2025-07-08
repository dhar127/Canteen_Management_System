import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeaderFooter.css';

const Header = () => {
  const navigate = useNavigate();

  const handleRoleSelection = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="header">
      <h1 className="header-title">🍽 FoodServe360</h1>
      <div className="header-buttons">
        <button onClick={handleRoleSelection} className="role-btn">Select Role</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </header>
  );
};

export default Header;