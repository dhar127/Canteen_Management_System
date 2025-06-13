// SignupPage.js
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const SignupPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignup = async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }
if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
  alert("Please enter a valid 10-digit phone number");
  return;
}

if (formData.username.length > 20) {
  alert("Username must be 20 characters or fewer");
  return;
}

    setLoading(true);
    try {
      // Use full URL to backend server
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      console.log("Signup response:", data);

      if (res.ok) {
        alert("Signup successful! Please login.");
        navigate(`/login/${role}`);
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">Sign Up as {role}</h2>
        <input 
          name="name" 
          placeholder="Full Name *" 
          onChange={handleChange} 
          className="login-input"
          required
        />
        <input 
          name="email" 
          type="email"
          placeholder="Email *" 
          onChange={handleChange} 
          className="login-input"
          required
        />
        <input 
          name="phone" 
          placeholder="Phone" 
          onChange={handleChange} 
          className="login-input" 
        />
        <input 
          name="username" 
          placeholder="Username *" 
          onChange={handleChange} 
          className="login-input"
          required
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password *" 
          onChange={handleChange} 
          className="login-input"
          required
        />
        <button 
          onClick={handleSignup} 
          className="login-button"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <div className="login-links">
          <a href={`/login/${role}`}>Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;