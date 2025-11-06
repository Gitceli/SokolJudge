import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ActiveScoring from './pages/ActiveScoring.jsx';
import DifficultyScoring from './pages/DifficultyScoring.jsx';
import MainJudgeDashboard from './pages/MainJudgeDashboard.jsx';
import Rezultati from './pages/Rezultati.jsx';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('auth_token');
  return token ? children : <Navigate to="/login" replace />;
}

function MainJudgeRoute({ children }) {
  const token = localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const judge = JSON.parse(localStorage.getItem('judge') || '{}');
    if (!judge.is_main_judge) {
      // Regular judges can't access main judge dashboard - redirect to scoring
      return <Navigate to="/sojenje" replace />;
    }
  } catch (e) {
    console.error('Failed to parse judge data:', e);
    return <Navigate to="/login" replace />;
  }
  return children;
}

function JudgeRoute({ children }) {
  // Any authenticated judge (main or regular) can access
  const token = localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;

  // Verify they have judge data
  try {
    const judge = JSON.parse(localStorage.getItem('judge') || '{}');
    if (!judge.id) {
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    console.error('Failed to parse judge data:', e);
    return <Navigate to="/login" replace />;
  }
  return children;
}

function SmartRedirect() {
  // Check judge type and redirect accordingly
  try {
    const judge = JSON.parse(localStorage.getItem('judge') || '{}');
    if (judge.is_main_judge) {
      return <Navigate to="/main-judge" replace />;
    }
    if (judge.judge_type === 'difficulty') {
      return <Navigate to="/tezavnost" replace />;
    }
  } catch (e) {
    console.error('Failed to parse judge data:', e);
  }
  return <Navigate to="/sojenje" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><SmartRedirect /></ProtectedRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/sojenje"
          element={
            <JudgeRoute>
              <ActiveScoring />
            </JudgeRoute>
          }
        />
        <Route
          path="/tezavnost"
          element={
            <JudgeRoute>
              <DifficultyScoring />
            </JudgeRoute>
          }
        />
        <Route
          path="/main-judge"
          element={
            <MainJudgeRoute>
              <MainJudgeDashboard />
            </MainJudgeRoute>
          }
        />
        <Route
          path="/rezultati"
          element={<Rezultati />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
