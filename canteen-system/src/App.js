import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelectionPage from "./components/RoleSelectionPage";
import LoginPage from "./components/LoginPage";
import AdminRoutes from "./modules/admin/routes";
import CanteenRoutes from "./modules/canteen/routes";
import CustomerRoutes from "./modules/customer/routes";

function App() {
  return (
   <Router>
  <Routes>
    <Route path="/" element={<RoleSelectionPage />} />
    <Route path="/admin/*" element={<AdminRoutes />} />
    <Route path="/canteen/*" element={<CanteenRoutes />} />
    <Route path="/customer/*" element={<CustomerRoutes />} />
    <Route path="/login/:role" element={<LoginPage />} />
  </Routes>
</Router>

  );
}

export default App;
