// modules/admin/routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./Dashboard";// Adjust path as needed
import AcceptedCanteens from "./AcceptedCanteen";
import RejectedCanteens from "./RejectedCanteen";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="/admin/requests/accepted" element={<AcceptedCanteens />} />
<Route path="/admin/requests/rejected" element={<RejectedCanteens />} />
{/* <Route path="/admin/requests/pending" element={<PendingCanteens />} /> if you have it */}

    </Routes>
  );
};

export default AdminRoutes;
