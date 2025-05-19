import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // 未登录，跳转到登录页
    return <Navigate to="/login" replace />;
  }
  // 已登录，渲染子组件
  return children;
};

export default ProtectedRoute;