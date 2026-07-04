import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Mentor Routes */}
        <Route 
          path="/mentor" 
          element={
            <PrivateRoute allowedRoles={['mentor']}>
              <MentorDashboard />
            </PrivateRoute>
          } 
        />

        {/* Protected Student Routes */}
        <Route 
          path="/student" 
          element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } 
        />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
