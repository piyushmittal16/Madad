import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

// 🛡️ SECURITY GUARD 1: Ensures token exist before routing renders
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 🛡️ SECURITY GUARD 2: Kick-out non-customers from landing page
const RoleGatekeeper = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return children;

  try {
    const user = JSON.parse(userStr);
    if (user && user.role) {
      if (user.role === "provider") {
        return <Navigate to="/provider-dashboard" replace />;
      }
      if (user.role === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
      }
    }
  } catch (e) {
    console.error("Session verification parse exception logged", e);
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CUSTOMER HOME PAGE AREA */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleGatekeeper>
                <Home />
              </RoleGatekeeper>
            </ProtectedRoute>
          }
        />

        {/* PROVIDER DASHBOARD INTERFACE CORE */}
        <Route
          path="/provider-dashboard"
          element={
            <ProtectedRoute>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMINISTRATIVE INTERNAL TERMINAL CORE */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
