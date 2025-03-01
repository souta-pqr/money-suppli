import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { stockMarketData } from '../../data/stockData';
import { courses } from '../../data/learningContent';

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
    if (loading || !userData) return courses[0].lessons.slice(0, 4);

    // 完了していないレッスンを探す
    const completedLessons = new Set(userData.learning.completedLessons);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          こんにちは、{loading ? 'ゲスト' : userData.user.name}さん
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
          <p className="font-medium">次のおすすめ:</p>
          <p className="text-primary">
            {recommendedLessons.length > 0 ? `「${recommendedLessons[0].title}」` : '全てのレッスンを完了しました！'}
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">あなたのポートフォリオ</h3>
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <>
              <p className="text-xl font-bold mb-2">
                総資産: ¥{userData.portfolio.cash.toLocaleString()}
              </p>
              {userData.portfolio.history.length > 1 && (
                <p className={`${userData.portfolio.history[userData.portfolio.history.length - 1].value > 
                  userData.portfolio.history[userData.portfolio.history.length - 2].value ? 
                  'text-green-600' : 'text-red-600'} mb-4`}>
                  先週比: {userData.portfolio.history[userData.portfolio.history.length - 1].value > 
                    userData.portfolio.history[userData.portfolio.history.length - 2].value ? '↑' : '↓'}
                  {Math.abs((userData.portfolio.history[userData.portfolio.history.length - 1].value / 
                    userData.portfolio.history[userData.portfolio.history.length - 2].value - 1) * 100).toFixed(1)}%
                </p>
              )}
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400">グラフ表示エリア</span>
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
              className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer"
            >
              <span className="text-primary">◉</span> {lesson.title}
              <p className="text-xs text-gray-500 mt-1">{lesson.courseTitle}</p>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">シミュレーターを試してみましょう</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/simulator" 
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          >
            仮想投資を始める
          </Link>
          <Link 
            to="/simulator?tab=portfolio" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded"
          >
            ポートフォリオ分析
          </Link>
          <Link 
            to="/simulator?tab=tax" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded"
          >
            税金計算
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;