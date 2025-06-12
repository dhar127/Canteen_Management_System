// modules/admin/routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./Dashboard";// Adjust path as needed

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
    </Routes>
  );
};

export default AdminRoutes;
