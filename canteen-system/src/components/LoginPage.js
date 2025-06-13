import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";

const LoginPage = () => {
  const { role } = useParams(); // customer, admin, canteen
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
        role,
      });

      if (res.data.message === "Login successful") {
        // Store user information in localStorage
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("userRole", res.data.role);
        
        // Store canteen request ID if available (for canteen users)
        if (res.data.canteenRequestId) {
          localStorage.setItem("canteenRequestId", res.data.canteenRequestId);
        }
        
        // Navigate to the appropriate dashboard (existing functionality preserved)
        navigate(`/${role}/dashboard`);
      }
    } catch (error) {
      alert("Invalid credentials or role mismatch");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">
          {`Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </h2>
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
          <a href="#">Forgot Password?</a> |{" "}
          <Link to={`/signup/${role}`}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;