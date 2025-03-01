import React from 'react';
import { useUser } from '../../context/UserContext';
import { courses } from '../../data/learningContent';
import CourseCard from '../common/CourseCard';

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
            <CourseCard 
              key={course.id}
              course={course}
              progress={progress}
              nextLesson={nextLesson}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LearnPage;