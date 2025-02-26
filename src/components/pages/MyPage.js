import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { courses } from '../../data/learningContent';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PortfolioChart from '../common/PortfolioChart';

const MyPage = () => {
  const { userData, loading, updateUserName } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [userName, setUserName] = useState('');

  // 名前編集モードの開始
  const startEditName = () => {
    if (userData) {
      setUserName(userData.user.name);
      setEditMode(true);
    }
  };

  // 名前の更新
  const saveName = () => {
    if (userName.trim()) {
      updateUserName(userName.trim());
      setEditMode(false);
    }
  };

  // 学習進捗のデータを取得
  const getLearningProgressData = () => {
    if (loading || !userData) return [];

    return courses.map(course => {
      // コースの進捗率を計算
      const completedLessons = userData.learning.completedLessons.filter(lessonKey => 
        lessonKey.startsWith(`${course.id}-`)
      ).length;
      
      const progressPercent = course.lessonsCount > 0 
        ? Math.round((completedLessons / course.lessonsCount) * 100) 
        : 0;
        
      return {
        id: course.id,
        name: course.title,
        progress: progressPercent,
        completed: completedLessons,
        total: course.lessonsCount
      };
    });
  };

  // ポートフォリオの履歴データの整形
  const getPortfolioHistoryData = () => {
    if (loading || !userData || !userData.portfolio.history) return [];

    return userData.portfolio.history.map(entry => ({
      date: new Date(entry.date).toLocaleDateString(),
      value: entry.value
    }));
  };

  // 目標の進捗率を計算
  const calculateGoalProgress = (goal) => {
    if (!goal) return 0;
    
    switch (goal.type) {
      case 'course_completion':
        // コース完了の進捗
        if (loading || !userData) return 0;
        
        const courseId = goal.courseId;
        const course = courses.find(c => c.id === courseId);
        
        if (!course) return 0;
        
        const completedLessons = userData.learning.completedLessons.filter(lessonKey => 
          lessonKey.startsWith(`${courseId}-`)
        ).length;
        
        return course.lessonsCount > 0 
          ? Math.round((completedLessons / course.lessonsCount) * 100) 
          : 0;
        
      case 'portfolio_return':
        // ポートフォリオリターンの進捗
        if (loading || !userData || userData.portfolio.history.length < 2) return 0;
        
        const initialValue = userData.portfolio.history[0].value;
        const currentValue = userData.portfolio.history[userData.portfolio.history.length - 1].value;
        const targetReturn = goal.targetPercent;
        
        const actualReturn = ((currentValue / initialValue) - 1) * 100;
        
        return Math.min(Math.round((actualReturn / targetReturn) * 100), 100);
        
      default:
        return goal.progress || 0;
    }
  };

  // サンプルの目標データ
  const goals = [
    {
      id: 1,
      title: '基礎知識コースを完了する',
      type: 'course_completion',
      courseId: 1,
      status: 'in_progress'
    },
    {
      id: 2,
      title: '仮想投資で10%のリターンを達成',
      type: 'portfolio_return',
      targetPercent: 10,
      status: 'in_progress'
    },
    {
      id: 3,
      title: '分散投資の原則を学ぶ',
      type: 'custom',
      progress: 100,
      status: 'completed'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">マイページ</h2>
        {editMode ? (
          <div className="flex items-center">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="border rounded px-2 py-1 mr-2"
            />
            <button
              onClick={saveName}
              className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm"
            >
              保存
            </button>
          </div>
        ) : (
          <button
            onClick={startEditName}
            className="text-primary hover:text-primary-dark font-medium"
          >
            名前を編集
          </button>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">学習の進捗状況</h3>
        
        <div className="space-y-4">
          {getLearningProgressData().map((course) => (
            <div key={course.id}>
              <div className="flex justify-between mb-1">
                <span>{course.name}</span>
                <span>{course.completed}/{course.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{width: `${course.progress}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">あなたの仮想ポートフォリオ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">ポートフォリオ構成</h4>
            {userData && userData.portfolio && (
              <PortfolioChart 
                portfolio={{
                  cash: userData.portfolio.cash,
                  stocks: userData.portfolio.stocks,
                  totalValue: userData.portfolio.cash + 
                    userData.portfolio.stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
                }} 
              />
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">資産の推移</h4>
            <div className="h-64">
              {getPortfolioHistoryData().length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getPortfolioHistoryData()}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#1E88E5" 
                      activeDot={{ r: 8 }} 
                      name="資産価値"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                  <span className="text-gray-400">データが不足しています</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Link to="/simulator" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">
            シミュレーターで詳細を見る
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">目標と達成状況</h3>
        
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            
            return (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{goal.title}</h4>
                  <span className={goal.status === 'completed' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                    {goal.status === 'completed' ? '達成済み' : '進行中'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={goal.status === 'completed' ? 'bg-green-500 h-2 rounded-full' : 'bg-yellow-500 h-2 rounded-full'} 
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  進捗率: {progress}%
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6">
          <button className="border border-primary text-primary hover:bg-blue-50 font-bold py-2 px-4 rounded">
            新しい目標を追加
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">設定</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">テーマ</h4>
              <p className="text-sm text-gray-500">ダークモードまたはライトモード</p>
            </div>
            <select className="border rounded p-1">
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">通知</h4>
              <p className="text-sm text-gray-500">アプリからの通知を受け取る</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input 
                type="checkbox" 
                name="notification" 
                id="notification" 
                className="sr-only peer"
                defaultChecked={userData?.settings?.notifications}
              />
              <label 
                htmlFor="notification" 
                className="h-6 w-11 cursor-pointer bg-gray-300 rounded-full peer-checked:bg-primary block overflow-hidden"
              >
                <span className="absolute h-4 w-4 rounded-full bg-white top-1 left-1 peer-checked:left-6 transition-all duration-300"></span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">データをリセット</h4>
              <p className="text-sm text-gray-500">すべての学習データとポートフォリオをリセット</p>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
              リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;