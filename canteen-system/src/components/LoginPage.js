import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        alert("Login successful!");
        navigate(`/${role}/dashboard`);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred while logging in.");
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
          <a href="/forgot-password">Forgot Password?</a>
 |{" "}
          <a href={`/signup/${role}`}>Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
