import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerDashboard from "./Dashboard";
import BrowseMenuPage from "./BrowseMenuPage";
import MyOrdersPage from "./MyOrdersPage";
import ProfilePage from "./ProfilePage";
import SupportPage from "./SupportPage";

const CustomerRoutes = () => {
  return (
    <Routes>
     <Route path="dashboard" element={<CustomerDashboard />} />
      <Route path="browse" element={<BrowseMenuPage />} />
      <Route path="orders" element={<MyOrdersPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="support" element={<SupportPage />} />
    </Routes>
  );
};

export default CustomerRoutes;
