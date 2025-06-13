// modules/admin/routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CanteenDashboard from "./Dashboard";// Adjust path as needed
import ManageMenu from "./ManageMenu";

const CanteenRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<CanteenDashboard />} />
      <Route path="managemenu" element={<ManageMenu/>}/>
    </Routes>
  );
};

export default CanteenRoutes;
