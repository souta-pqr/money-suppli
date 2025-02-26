import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { courses } from '../../data/learningContent';

const LearnPage = () => {
  const { userData, loading } = useUser();

  // コースの進捗状況を取得
  const getCourseProgress = (courseId) => {
    if (loading || !userData) return 0;

    const completedLessons = userData.learning.completedLessons;
    const courseLessons = courses.find(c => c.id === courseId)?.lessons || [];
    
    if (courseLessons.length === 0) return 0;
    
    const completedCourseLessons = completedLessons.filter(lessonKey => 
      lessonKey.startsWith(`${courseId}-`)
    ).length;
    
    return Math.round((completedCourseLessons / courseLessons.length) * 100);
  };

  // 次に学ぶべきレッスンを特定
  const getNextLesson = (courseId) => {
    if (loading || !userData) return courses.find(c => c.id === courseId)?.lessons[0];

    const completedLessons = new Set(userData.learning.completedLessons);
    const courseLessons = courses.find(c => c.id === courseId)?.lessons || [];
    
    for (const lesson of courseLessons) {
      const lessonKey = `${courseId}-${lesson.id}`;
      if (!completedLessons.has(lessonKey)) {
        return lesson;
      }
    }
    
    // すべて完了している場合は最初のレッスンを返す
    return courseLessons[0];
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">学習コンテンツ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const progress = getCourseProgress(course.id);
          const nextLesson = getNextLesson(course.id);
          
          return (
            <div key={course.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="h-32 bg-primary-dark flex items-center justify-center text-white">
                {/* コース画像がある場合は表示、ない場合はタイトル表示 */}
                <h3 className="text-xl font-bold px-4 text-center">{course.title}</h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-3">{course.description}</p>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>進捗</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium">レッスン数: {course.lessonsCount}</p>
                  {nextLesson && (
                    <p className="text-sm">次のレッスン: {nextLesson.title}</p>
                  )}
                </div>
                
                <div className="flex justify-between">
                  {nextLesson && (
                    <Link 
                      to={`/learn/${course.id}/${nextLesson.id}`}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      {progress > 0 ? '続ける' : '始める'}
                    </Link>
                  )}
                  
                  <button className="text-primary hover:text-primary-dark text-sm font-medium">
                    詳細を見る
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearnPage;