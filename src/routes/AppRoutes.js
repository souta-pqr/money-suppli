import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import HomePage from '../components/pages/HomePage';
import LearnPage from '../components/pages/LearnPage';
import CourseDetailPage from '../components/pages/CourseDetailPage';
import LessonPage from '../components/pages/LessonPage';
import SimulatorPage from '../components/pages/SimulatorPage';
import MyPage from '../components/pages/MyPage';
import LoginPage from '../components/pages/LoginPage';
import SignupPage from '../components/pages/SignupPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

// 認証済みルート
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useUser();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// 未認証ルート
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useUser();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 認証不要のルート */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      
      {/* 認証が必要なルート */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/learn" element={
        <ProtectedRoute>
          <LearnPage />
        </ProtectedRoute>
      } />
      <Route path="/learn/:courseId" element={
        <ProtectedRoute>
          <CourseDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/learn/:courseId/:lessonId" element={
        <ProtectedRoute>
          <LessonPage />
        </ProtectedRoute>
      } />
      <Route path="/simulator" element={
        <ProtectedRoute>
          <SimulatorPage />
        </ProtectedRoute>
      } />
      <Route path="/mypage" element={
        <ProtectedRoute>
          <MyPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;