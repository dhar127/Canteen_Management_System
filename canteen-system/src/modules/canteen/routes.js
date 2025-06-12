// modules/admin/routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CanteenDashboard from "./Dashboard";// Adjust path as needed

const CanteenRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<CanteenDashboard />} />
    </Routes>
  );
};

export default CanteenRoutes;
