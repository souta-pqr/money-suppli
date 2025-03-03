import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../components/pages/HomePage';
import LearnPage from '../components/pages/LearnPage';
import CourseDetailPage from '../components/pages/CourseDetailPage';
import LessonPage from '../components/pages/LessonPage';
import SimulatorPageEnhanced from '../components/pages/SimulatorPageEnhanced';
import MyPage from '../components/pages/MyPage';
import LoginPage from '../components/pages/LoginPage';
import SignupPage from '../components/pages/SignupPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/learn/:courseId" element={<CourseDetailPage />} />
      <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
      {/* 強化版シミュレーターページを使用 */}
      <Route path="/simulator" element={<SimulatorPageEnhanced />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
};

export default AppRoutes;