import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadUserData, saveUserData, createInitialData } from '../services/storage';
import { courses } from '../data/learningContent';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初期データの読み込み
  useEffect(() => {
    const initializeData = () => {
      const savedData = loadUserData();
      if (savedData) {
        setUserData(savedData);
      } else {
        const initialData = createInitialData();
        setUserData(initialData);
        saveUserData(initialData);
      }
      setLoading(false);
    };

    initializeData();
  }, []);

  // データ更新時に保存
  useEffect(() => {
    if (userData && !loading) {
      saveUserData(userData);
    }
  }, [userData, loading]);

  // ユーザー名の更新
  const updateUserName = (name) => {
    setUserData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name
      }
    }));
  };

  // レッスン完了を記録
  const completeLesson = (courseId, lessonId) => {
    setUserData(prev => {
      const newCompletedLessons = [...prev.learning.completedLessons];
      const lessonKey = `${courseId}-${lessonId}`;
      
      if (!newCompletedLessons.includes(lessonKey)) {
        newCompletedLessons.push(lessonKey);
      }
      
      // コースの進捗率を更新
      const courseProgress = { ...prev.learning.progress };
      const course = courses.find(c => c.id === parseInt(courseId));
      
      if (course) {
        const totalLessons = course.lessons.length;
        const completedCount = newCompletedLessons.filter(l => l.startsWith(`${courseId}-`)).length;
        courseProgress[courseId] = (completedCount / totalLessons) * 100;
      }
      
      return {
        ...prev,
        learning: {
          ...prev.learning,
          completedLessons: newCompletedLessons,
          progress: courseProgress
        }
      };
    });
  };

  // クイズ結果を保存
  const saveQuizResult = (courseId, lessonId, correct, total) => {
    setUserData(prev => {
      const quizResults = { ...prev.learning.quizResults };
      const resultKey = `${courseId}-${lessonId}`;
      
      quizResults[resultKey] = {
        correct,
        total,
        timestamp: new Date().toISOString()
      };
      
      return {
        ...prev,
        learning: {
          ...prev.learning,
          quizResults
        }
      };
    });
  };

  // ポートフォリオ更新
  const updatePortfolio = (newPortfolioData) => {
    setUserData(prev => ({
      ...prev,
      portfolio: {
        ...newPortfolioData,
        history: [
          ...prev.portfolio.history,
          {
            date: new Date().toISOString(),
            value: newPortfolioData.cash + newPortfolioData.stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
          }
        ]
      }
    }));
  };

  // 設定の更新
  const updateSettings = (newSettings) => {
    setUserData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }));
  };

  const value = {
    userData,
    loading,
    updateUserName,
    completeLesson,
    saveQuizResult,
    updatePortfolio,
    updateSettings
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};