import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css"; // Reuse login styles

const SignupPage = () => {
  const { role } = useParams(); // customer, admin, canteen
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/signup", {
        ...formData,
        role,
      });

      if (res.data.message === "Signup successful") {
        alert("Signup successful. You can now login.");
        navigate(`/login/${role}`);
      }
    } catch (error) {
      alert(
        error.response?.data?.message || "Signup failed. Try again."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">{`Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="login-input"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="login-input"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          className="login-input"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="login-input"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="login-input"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="login-input"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <button className="login-button" onClick={handleSignup}>
          Sign Up
        </button>
        <div className="login-links">
          Already have an account? <Link to={`/login/${role}`}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
