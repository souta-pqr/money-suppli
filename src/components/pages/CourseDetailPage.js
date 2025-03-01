import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { courses } from '../../data/learningContent';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { userData, loading } = useUser();
  
  // コースデータを取得
  const course = courses.find(c => c.id === parseInt(courseId));
  
  if (!course) {
    return <div className="p-6 bg-white rounded-lg shadow">コースが見つかりません</div>;
  }
  
  // コースの進捗状況を取得
  const getCourseProgress = () => {
    if (loading || !userData) return 0;

    const completedLessons = userData.learning.completedLessons;
    const courseLessons = course.lessons || [];
    
    if (courseLessons.length === 0) return 0;
    
    const completedCourseLessons = completedLessons.filter(lessonKey => 
      lessonKey.startsWith(`${course.id}-`)
    ).length;
    
    return Math.round((completedCourseLessons / courseLessons.length) * 100);
  };

  // 次に学ぶべきレッスンを特定
  const getNextLesson = () => {
    if (loading || !userData) return course.lessons[0];

    const completedLessons = new Set(userData.learning.completedLessons);
    const courseLessons = course.lessons || [];
    
    for (const lesson of courseLessons) {
      const lessonKey = `${course.id}-${lesson.id}`;
      if (!completedLessons.has(lessonKey)) {
        return lesson;
      }
    }
    
    // すべて完了している場合は最初のレッスンを返す
    return courseLessons[0];
  };
  
  const progress = getCourseProgress();
  const nextLesson = getNextLesson();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/learn" className="text-primary">
          ← 学習コンテンツに戻る
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
        <p className="text-gray-600 mb-6">{course.description}</p>
        
        <div className="mb-6">
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
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">コースの内容</h3>
          <ul className="space-y-4">
            {course.lessons.map((lesson, index) => {
              const isCompleted = userData && !loading && 
                userData.learning.completedLessons.includes(`${course.id}-${lesson.id}`);
              
              return (
                <li key={lesson.id} className="flex items-start">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-grow">
                    <Link 
                      to={`/learn/${course.id}/${lesson.id}`}
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      {lesson.title}
                    </Link>
                    {lesson.quiz && (
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        クイズあり
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="flex justify-center">
          <Link 
            to={`/learn/${course.id}/${nextLesson.id}`}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded font-medium"
          >
            {progress > 0 ? '続ける' : 'コースを始める'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;