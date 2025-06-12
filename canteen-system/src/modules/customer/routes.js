// modules/admin/routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomerDashboard from "./Dashboard";// Adjust path as needed

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<CustomerDashboard />} />
    </Routes>
  );
};

export default CustomerRoutes;
