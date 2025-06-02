import React from 'react';
import Register from './Register';
import Login from './Login';
import Chat from './Chat';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppRoutes() {
  const navigate = useNavigate();
  // 切换登录/注册
  const handleSwitch = (type) => {
    if (type === 'register') {
      navigate('/register');
    } else if (type === 'login') {
      navigate('/login');
    }
  };
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" />} />
      <Route path="/login" element={<Login onSwitch={handleSwitch} />} />
      <Route path="/register" element={<Register onSwitch={handleSwitch} />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="main-box">
      <ToastContainer />
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
}

export default App;