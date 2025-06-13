import React from "react";
import "./Page.css";

const SupportPage = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">📞 Support</h1>
      <p className="page-description">Need help? We're here for you!</p>
      <div className="support-card">
        <p><strong>Email us:</strong> support@canteenapp.com</p>
        <p><strong>Call:</strong> +91 99999 88888</p>
        <p><strong>Chat:</strong> Available 10 AM – 10 PM</p>
      </div>
    </div>
  );
};

export default SupportPage;
