import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../components/pages/HomePage';
import LearnPage from '../components/pages/LearnPage';
import SimulatorPage from '../components/pages/SimulatorPage';
import MyPage from '../components/pages/MyPage';
import LessonPage from '../components/pages/LessonPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
};

export default AppRoutes;