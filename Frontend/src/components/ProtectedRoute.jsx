import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Condition 1: Agar token ya user session storage mein nahi hai -> Redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Condition 2: Agar user ka role allowed roles ki list mein nahi hai -> Redirect to Home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert("Unauthorized Access! You don't have permission to view this command console.");
    return <Navigate to="/" replace />;
  }

  // Agar sab sahi hai, toh andar ka component render hone do
  return children;
}