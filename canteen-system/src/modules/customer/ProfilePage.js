import React from "react";
import "./Page.css";

const ProfilePage = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">👤 My Profile</h1>
      <p className="page-description">Manage your account and preferences</p>
      <div className="profile-card">
        <p><strong>Name:</strong> Dharani P</p>
        <p><strong>Email:</strong> dhar22028.cs@rmkec.ac.in</p>
        <p><strong>Phone:</strong> +91 9876543210</p>
        <button className="dashboard-button">Edit Profile</button>
      </div>
    </div>
  );
};
export default ProfilePage;