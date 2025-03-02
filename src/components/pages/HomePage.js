import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { stockMarketData } from '../../data/stockData';
import { courses } from '../../data/learningContent';
import PortfolioChart from '../common/PortfolioChart';

const HomePage = () => {
  const { userData, loading } = useUser();

  // 全体の学習進捗率を計算
  const calculateOverallProgress = () => {
    if (loading || !userData || !userData.learning) return 0;
    
    // ここでnullチェックを追加
    const completedLessons = userData.learning.completedLessons ? userData.learning.completedLessons.length : 0;
    const totalLessons = courses.reduce((sum, course) => sum + course.lessonsCount, 0);
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // おすすめのレッスンを取得
  const getRecommendedLessons = () => {
    if (loading || !userData || !userData.learning) return courses[0].lessons.slice(0, 4);

    // 完了していないレッスンを探す
    const completedLessons = new Set(userData.learning.completedLessons || []);
    const notCompletedLessons = [];

    courses.forEach(course => {
      course.lessons.forEach(lesson => {
        const lessonKey = `${course.id}-${lesson.id}`;
        if (!completedLessons.has(lessonKey)) {
          notCompletedLessons.push({
            courseId: course.id,
            lessonId: lesson.id,
            title: lesson.title,
            courseTitle: course.title
          });
        }
      });
    });

    // まだ始めていない場合は最初のコースを表示
    return notCompletedLessons.length > 0 
      ? notCompletedLessons.slice(0, 4)
      : courses[0].lessons.map(lesson => ({
          courseId: courses[0].id,
          lessonId: lesson.id,
          title: lesson.title,
          courseTitle: courses[0].title
        })).slice(0, 4);
  };

  const progress = calculateOverallProgress();
  const recommendedLessons = getRecommendedLessons();
  const nextRecommendedLesson = recommendedLessons.length > 0 ? recommendedLessons[0] : null;

  // ユーザー名を安全に取得する関数
  const getUserName = () => {
    if (loading) return 'ゲスト';
    if (!userData) return 'ゲスト';
    if (!userData.user) return 'ゲスト';
    return userData.user.name || 'ゲスト';
  };

  // ポートフォリオの安全な取得
  const getPortfolioData = () => {
    if (loading || !userData || !userData.portfolio) {
      return {
        cash: 1000000,
        history: []
      };
    }
    return userData.portfolio;
  };

  const portfolio = getPortfolioData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          こんにちは、{getUserName()}さん
        </h2>
        <div className="text-sm text-green-600 font-medium">
          今日の市場: {stockMarketData[0].change > 0 ? '↑' : '↓'}
          {Math.abs(stockMarketData[0].change)}%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">学習の進捗</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 mb-2">進捗率: {progress}%</p>
          
          {nextRecommendedLesson && (
            <div className="mt-4">
              <p className="font-medium">次のおすすめ:</p>
              <Link 
                to={`/learn/${nextRecommendedLesson.courseId}/${nextRecommendedLesson.lessonId}`}
                className="block mt-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-primary font-medium">{nextRecommendedLesson.title}</span>
                    <p className="text-xs text-gray-500 mt-1">{nextRecommendedLesson.courseTitle}</p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">あなたのポートフォリオ</h3>
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <>
              <p className="text-xl font-bold mb-2">
                総資産: ¥{portfolio.cash.toLocaleString()}
              </p>
              {portfolio.history && portfolio.history.length > 1 && (
                <p className={`${portfolio.history[portfolio.history.length - 1].value > 
                  portfolio.history[portfolio.history.length - 2].value ? 
                  'text-green-600' : 'text-red-600'} mb-4`}>
                  先週比: {portfolio.history[portfolio.history.length - 1].value > 
                    portfolio.history[portfolio.history.length - 2].value ? '↑' : '↓'}
                  {Math.abs((portfolio.history[portfolio.history.length - 1].value / 
                    portfolio.history[portfolio.history.length - 2].value - 1) * 100).toFixed(1)}%
                </p>
              )}
              <div className="h-32 bg-gray-100 rounded">
                {portfolio.stocks && portfolio.stocks.length > 0 ? (
                  <PortfolioChart portfolio={portfolio} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">ポートフォリオを作成して資産を可視化しましょう</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">おすすめのレッスン</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recommendedLessons.map((lesson) => (
            <Link 
              key={`${lesson.courseId}-${lesson.lessonId}`}
              to={`/learn/${lesson.courseId}/${lesson.lessonId}`}
              className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors duration-200 flex flex-col h-full"
            >
              <div className="flex items-center mb-2">
                <span className="text-primary mr-2">◉</span>
                <span className="font-medium">{lesson.title}</span>
              </div>
              <p className="text-xs text-gray-500 mt-auto">{lesson.courseTitle}</p>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">シミュレーターを試してみましょう</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/simulator" 
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            仮想投資を始める
          </Link>
          <Link 
            to="/simulator?tab=portfolio" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            ポートフォリオ分析
          </Link>
          <Link 
            to="/simulator?tab=tax" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            税金計算
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;