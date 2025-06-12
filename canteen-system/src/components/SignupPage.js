import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Reuse same CSS for consistency

const SignupPage = () => {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // TODO: Send data to backend for MongoDB storage
    alert("Signup successful!");
    navigate("/login");
  };

  const handleForgotPassword = () => {
    // Simulate code sending
    alert(`Code sent to ${formData.email} and ${formData.phone}`);
  };

  const handleSocialSignup = (platform) => {
    alert(`Signing up with ${platform}...`);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">Sign Up</h2>
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
          <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
        </div>
        <div className="social-signup">
          <p>Or sign up with:</p>
          <button onClick={() => handleSocialSignup("Google")}>Google</button>
          <button onClick={() => handleSocialSignup("Facebook")}>Facebook</button>
          <button onClick={() => handleSocialSignup("Twitter")}>Twitter</button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
