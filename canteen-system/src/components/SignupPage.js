import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const SignupPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();

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
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please login.");
        navigate(`/login/${role}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Signup failed.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">Sign Up as {role}</h2>
        <input name="name" placeholder="Full Name" onChange={handleChange} className="login-input" />
        <input name="email" placeholder="Email" onChange={handleChange} className="login-input" />
        <input name="phone" placeholder="Phone" onChange={handleChange} className="login-input" />
        <input name="username" placeholder="Username" onChange={handleChange} className="login-input" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="login-input" />
        <button onClick={handleSignup} className="login-button">Sign Up</button>
        <div className="login-links">
          <a href={`/login/${role}`}>Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
