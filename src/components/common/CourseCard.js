import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course, progress, nextLesson }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
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
};

export default CourseCard;