import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Basic dummy check
    if (username === "admin" && password === "admin123") {
      navigate(`/${role}/dashboard`);
    } else {
      alert("Incorrect credentials. Try again or reset your password.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">{`Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}</h2>
        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
        <div className="login-links">
          <a href="#">Forgot Password?</a> | <a href="#">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
