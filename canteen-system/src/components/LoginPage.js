import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      // Use full URL to backend server
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      console.log("🔍 Full login response:", data);

      if (response.ok) {
        // Enhanced userId extraction - check multiple possible response structures
        let userId = null;
        
        // Try different possible response structures
        if (data.user && data.user._id) {
          userId = data.user._id;
          console.log("✅ Found userId in data.user._id:", userId);
        } else if (data.userId) {
          userId = data.userId;
          console.log("✅ Found userId in data.userId:", userId);
        } else if (data._id) {
          userId = data._id;
          console.log("✅ Found userId in data._id:", userId);
        } else if (data.user && data.user.id) {
          userId = data.user.id;
          console.log("✅ Found userId in data.user.id:", userId);
        } else {
          console.error("❌ Could not find userId in response");
          console.error("Available keys:", Object.keys(data));
          if (data.user) {
            console.error("User object keys:", Object.keys(data.user));
          }
        }

        // Validate userId format (MongoDB ObjectId should be 24 hex characters)
        if (userId && typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
          // Store user data in localStorage for session management
          localStorage.setItem('userId', userId);
          localStorage.setItem('userRole', data.role || data.user?.role || role);
          localStorage.setItem('canteenRequestId', data.canteenRequestId || '');
          
          // Store additional user info if available
          if (data.user) {
            localStorage.setItem('userName', data.user.name || '');
            localStorage.setItem('userEmail', data.user.email || '');
          }
          
          // Debug: Verify what was stored
          console.log("🔍 Verification - userId stored:", localStorage.getItem('userId'));
          console.log("🔍 All localStorage items after login:");
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}: ${value}`);
          }
          
          alert("Login successful!");
          
          // Navigate based on role
          if (role === 'canteen') {
            navigate('/canteen/dashboard'); // Go to canteen request form first
          } else {
            navigate(`/${role}/dashboard`);
          }
        } else {
          console.error("❌ Invalid userId format:", userId);
          alert("Login failed: Invalid user data received");
        }
      } else {
        console.error("❌ Login failed:", data);
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <button 
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="login-links">
          <a href="/forgot-password">Forgot Password?</a>
          {" | "}
          <a href={`/signup/${role}`}>Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;