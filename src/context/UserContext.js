import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, getUserData } from '../firebase/auth';
import { 
  updateCompletedLesson, 
  saveQuizResult as saveQuizResultFirestore, 
  updatePortfolio as updatePortfolioFirestore,
  updateUserName as updateUserNameFirestore,
  updateSettings as updateSettingsFirestore,
  createInitialUserData
} from '../firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase 認証状態を監視
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // ユーザーがログインしている場合、Firestoreからデータを取得
          const data = await getUserData(user.uid);
          
          // データがない場合は初期データを生成
          if (!data) {
            // 初期ユーザーデータを作成
            const initialData = {
              uid: user.uid,
              user: {  // ここを明示的にnested objectとして定義
                name: user.displayName || 'ゲスト',
                email: user.email
              },
              learning: {
                completedLessons: [],
                progress: {},
                quizResults: {}
              },
              portfolio: {
                cash: 1000000,
                stocks: [],
                transactions: [],
                history: [
                  {
                    date: new Date().toISOString(),
                    value: 1000000
                  }
                ]
              },
              settings: {
                theme: 'light',
                notifications: true
              }
            };
            
            // Firestoreに保存
            try {
              await createInitialUserData(user.uid, initialData);
              setUserData(initialData);
            } catch (error) {
              console.error("Failed to create initial user data:", error);
              // エラーでも最低限のデータを設定
              setUserData(initialData);
            }
          } else {
            // データ構造にuserプロパティがないか、nameがない場合は追加
            if (!data.user) {
              data.user = { name: user.displayName || 'ゲスト', email: user.email };
            }
            setUserData(data);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // エラーが発生しても最低限のデータを設定して白画面を防ぐ
          setUserData({
            user: { name: user.displayName || 'ゲスト', email: user.email },
            learning: { completedLessons: [] },
            portfolio: { 
              cash: 1000000, 
              stocks: [],
              history: [{ date: new Date().toISOString(), value: 1000000 }]
            }
          });
        }
      } else {
        // ログアウト時はuserDataをクリア
        setUserData(null);
      }
      
      setLoading(false);
    });
    
    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  // レッスン完了を記録
  const completeLesson = async (courseId, lessonId) => {
    if (!currentUser) return;
    
    try {
      await updateCompletedLesson(currentUser.uid, courseId, lessonId);
      
      // ローカルステートも更新
      setUserData(prev => {
        if (!prev) return prev;
        
        // learning.completedLessonsがない場合は作成
        const prevCompletedLessons = prev.learning && prev.learning.completedLessons ? 
          prev.learning.completedLessons : [];
        
        const newCompletedLessons = [...prevCompletedLessons];
        const lessonKey = `${courseId}-${lessonId}`;
        
        if (!newCompletedLessons.includes(lessonKey)) {
          newCompletedLessons.push(lessonKey);
        }
        
        return {
          ...prev,
          learning: {
            ...(prev.learning || {}),
            completedLessons: newCompletedLessons
          }
        };
      });
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    }
  };

  // クイズ結果を保存
  const saveQuizResult = async (courseId, lessonId, correct, total) => {
    if (!currentUser) return;
    
    try {
      await saveQuizResultFirestore(currentUser.uid, courseId, lessonId, correct, total);
      
      // ローカルステートも更新
      setUserData(prev => {
        if (!prev) return prev;
        
        // learning.quizResultsがない場合は作成
        const quizResults = prev.learning && prev.learning.quizResults ? 
          {...prev.learning.quizResults} : {};
        
        const resultKey = `${courseId}-${lessonId}`;
        
        quizResults[resultKey] = {
          correct,
          total,
          timestamp: new Date().toISOString()
        };
        
        return {
          ...prev,
          learning: {
            ...(prev.learning || {}),
            quizResults
          }
        };
      });
    } catch (error) {
      console.error("Failed to save quiz result:", error);
    }
  };

  // ポートフォリオ更新
  const updatePortfolio = async (newPortfolioData) => {
    if (!currentUser) return;
    
    try {
      await updatePortfolioFirestore(currentUser.uid, newPortfolioData);
      
      // ローカルステートも更新
      setUserData(prev => {
        if (!prev) return prev;
        
        const prevHistory = prev.portfolio && prev.portfolio.history ? 
          prev.portfolio.history : [];
        
        return {
          ...prev,
          portfolio: {
            ...newPortfolioData,
            history: [
              ...prevHistory,
              {
                date: new Date().toISOString(),
                value: newPortfolioData.cash + newPortfolioData.stocks.reduce((sum, stock) => 
                  sum + (stock.price * stock.quantity), 0)
              }
            ]
          }
        };
      });
    } catch (error) {
      console.error("Failed to update portfolio:", error);
    }
  };

  // ユーザー名の更新
  const updateUserName = async (name) => {
    if (!currentUser) return;
    
    try {
      await updateUserNameFirestore(currentUser.uid, name);
      
      // ローカルステートも更新
      setUserData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          user: {
            ...(prev.user || {}),
            name
          }
        };
      });
    } catch (error) {
      console.error("Failed to update user name:", error);
    }
  };

  // 設定の更新
  const updateSettings = async (newSettings) => {
    if (!currentUser) return;
    
    try {
      await updateSettingsFirestore(currentUser.uid, newSettings);
      
      // ローカルステートも更新
      setUserData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          settings: {
            ...(prev.settings || {}),
            ...newSettings
          }
        };
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    completeLesson,
    saveQuizResult,
    updatePortfolio,
    updateUserName,
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