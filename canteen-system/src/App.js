import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelectionPage from "./components/RoleSelectionPage";
import LoginPage from "./components/LoginPage";
import AdminRoutes from "./modules/admin/routes";
import CanteenRoutes from "./modules/canteen/routes";
//import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import CustomerRoutes from "./modules/customer/routes";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import CanteenRequestForm from "./modules/canteen/CanteenRequestForm";
import ManageMenu from "./modules/canteen/ManageMenu";
import RequestDetails from './modules/admin/RequestDetails';
import AdminDashboard from './modules/admin/Dashboard';
import AcceptedCanteens from "./modules/admin/AcceptedCanteen";
import RejectedCanteens from "./modules/admin/RejectedCanteen";
import ViewOrders from "./modules/canteen/ViewOrders";
function App() {
  return (
   <Router>
  <Routes>
    <Route path="/" element={<RoleSelectionPage />} />
    <Route path="/admin/*" element={<AdminRoutes />} />
    <Route path="/canteen/*" element={<CanteenRoutes />} />
    <Route path="/customer/*" element={<CustomerRoutes />} />
    <Route path="/login/:role" element={<LoginPage />} />
     <Route path="/signup/:role" element={<SignupPage />} /> 
     <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/canteen/request-form" element={<CanteenRequestForm />} />   
    <Route path="/canteen/manage-menu" element={<ManageMenu/>} />
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/request/:id" element={<RequestDetails />} />
    <Route path="/admin/accepted" element={<AcceptedCanteens />} />
    <Route path="/admin/rejected" element={<RejectedCanteens />} />
    <Route path="/canteen/view-orders" element={<ViewOrders />} />
  </Routes>
</Router>

  );
}

export default App;
