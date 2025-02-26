const STORAGE_KEY = 'money-suppli-data';

// データ保存
export const saveUserData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('データの保存に失敗しました', error);
    return false;
  }
};

// データ読み込み
export const loadUserData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('データの読み込みに失敗しました', error);
    return null;
  }
};

// 初期データの作成
export const createInitialData = () => {
  return {
    user: {
      name: 'ゲスト',
      registeredAt: new Date().toISOString(),
    },
    learning: {
      completedLessons: [],
      progress: {},
      quizResults: {},
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
};