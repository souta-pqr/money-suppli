import { 
    doc, 
    updateDoc,
    arrayUnion, 
    getDoc, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from './config';
  
  // レッスン完了状態の更新
  export const updateCompletedLesson = async (userId, courseId, lessonId) => {
    try {
      const userRef = doc(db, "users", userId);
      const lessonKey = `${courseId}-${lessonId}`;
      
      await updateDoc(userRef, {
        "learning.completedLessons": arrayUnion(lessonKey)
      });
      
      return true;
    } catch (error) {
      console.error("Update completed lesson error:", error);
      throw error;
    }
  };
  
  // クイズ結果の保存
  export const saveQuizResult = async (userId, courseId, lessonId, correct, total) => {
    try {
      const userRef = doc(db, "users", userId);
      const resultKey = `${courseId}-${lessonId}`;
      
      await updateDoc(userRef, {
        [`learning.quizResults.${resultKey}`]: {
          correct,
          total,
          timestamp: serverTimestamp()
        }
      });
      
      return true;
    } catch (error) {
      console.error("Save quiz result error:", error);
      throw error;
    }
  };
  
  // ポートフォリオの更新
  export const updatePortfolio = async (userId, portfolioData) => {
    try {
      const userRef = doc(db, "users", userId);
      
      // 新しい履歴エントリを作成
      const historyEntry = {
        date: new Date().toISOString(),
        value: portfolioData.cash + portfolioData.stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
      };
      
      // ポートフォリオデータの更新（履歴を含む）
      await updateDoc(userRef, {
        "portfolio.cash": portfolioData.cash,
        "portfolio.stocks": portfolioData.stocks,
        "portfolio.transactions": portfolioData.transactions || [],
        "portfolio.history": arrayUnion(historyEntry)
      });
      
      return true;
    } catch (error) {
      console.error("Update portfolio error:", error);
      throw error;
    }
  };
  
  // ユーザー名の更新
  export const updateUserName = async (userId, name) => {
    try {
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        "name": name
      });
      
      return true;
    } catch (error) {
      console.error("Update username error:", error);
      throw error;
    }
  };
  
  // 設定の更新
  export const updateSettings = async (userId, settings) => {
    try {
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        "settings": settings
      });
      
      return true;
    } catch (error) {
      console.error("Update settings error:", error);
      throw error;
    }
  };