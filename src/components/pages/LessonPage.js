import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { courses } from '../../data/learningContent';
import ReactMarkdown from 'react-markdown';

const LessonPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { completeLesson, saveQuizResult } = useUser();
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [prevLesson, setPrevLesson] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // コースとレッスンのデータを設定
  useEffect(() => {
    const foundCourse = courses.find(c => c.id === parseInt(courseId));
    if (foundCourse) {
      setCurrentCourse(foundCourse);
      
      const foundLesson = foundCourse.lessons.find(l => l.id === parseInt(lessonId));
      if (foundLesson) {
        setCurrentLesson(foundLesson);
        
        const idx = foundCourse.lessons.findIndex(l => l.id === parseInt(lessonId));
        setCurrentIndex(idx);
        
        setPrevLesson(idx > 0 ? foundCourse.lessons[idx - 1] : null);
        setNextLesson(idx < foundCourse.lessons.length - 1 ? foundCourse.lessons[idx + 1] : null);
      }
    }
  }, [courseId, lessonId]);
  
  // レッスン完了時の処理
  useEffect(() => {
    if (showResults && quizAnswers && currentLesson) {
      const quizQuestions = currentLesson.quiz || [];
      
      if (quizQuestions.length > 0) {
        let correctCount = 0;
        quizQuestions.forEach((q, index) => {
          if (quizAnswers[index] === q.answer) {
            correctCount++;
          }
        });
        
        // クイズの結果を保存
        saveQuizResult(courseId, lessonId, correctCount, quizQuestions.length);
        
        // すべて正解した場合、レッスンを完了とする
        if (correctCount === quizQuestions.length) {
          completeLesson(courseId, lessonId);
        }
      } else {
        // クイズがない場合は、閲覧だけでレッスン完了とする
        completeLesson(courseId, lessonId);
      }
    }
  }, [showResults, quizAnswers, courseId, lessonId, completeLesson, saveQuizResult, currentLesson]);
  
  // クイズの回答を処理
  const handleQuizAnswer = (questionIndex, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: optionIndex
    });
  };
  
  // クイズの採点
  const checkAnswers = () => {
    setShowResults(true);
  };
  
  // 次のレッスンへ進む
  const goToNextLesson = () => {
    if (nextLesson) {
      navigate(`/learn/${courseId}/${nextLesson.id}`);
      setQuizAnswers({});
      setShowResults(false);
    }
  };
  
  if (!currentCourse) {
    return <div className="p-6 bg-white rounded-lg shadow">コースが見つかりません</div>;
  }
  
  if (!currentLesson) {
    return <div className="p-6 bg-white rounded-lg shadow">レッスンが見つかりません</div>;
  }
  
  return (
    <div className="space-y-6 max-w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link to={`/learn`} className="mr-2 text-gray-500">
            &lt; {currentCourse.title}
          </Link>
        </div>
        <div className="text-sm font-medium">
          {currentIndex + 1}/{currentCourse.lessons.length}レッスン
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium p-2 bg-blue-50 border-l-4 border-primary mb-6">
          レッスン{currentIndex + 1}: {currentLesson.title}
        </h3>
        
        <div className="prose max-w-full w-full">
          <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
        </div>
      </div>
      
      {currentLesson.quiz && currentLesson.quiz.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">クイズ</h3>
          
          {currentLesson.quiz.map((q, qIndex) => (
            <div key={qIndex} className="mb-6">
              <p className="font-medium mb-2">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => (
                  <div 
                    key={oIndex} 
                    className={`flex items-center space-x-3 p-3 border rounded cursor-pointer
                      ${quizAnswers[qIndex] === oIndex ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50'}
                      ${showResults && oIndex === q.answer ? 'bg-green-100 border-green-500' : ''}
                      ${showResults && quizAnswers[qIndex] === oIndex && oIndex !== q.answer ? 'bg-red-100 border-red-500' : ''}
                    `}
                    onClick={() => !showResults && handleQuizAnswer(qIndex, oIndex)}
                  >
                    <div className={`w-4 h-4 rounded-full border ${quizAnswers[qIndex] === oIndex ? 'bg-primary border-primary' : 'border-gray-300'}`}></div>
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!showResults ? (
            <button 
              onClick={checkAnswers}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
            >
              回答を確認
            </button>
          ) : (
            <div className="mt-4 p-4 rounded bg-blue-50">
              <p className="font-medium">
                {currentLesson.quiz.every((q, i) => quizAnswers[i] === q.answer) 
                  ? '素晴らしい！すべて正解です！' 
                  : '間違いがあります。もう一度確認しましょう。'}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between">
        {prevLesson ? (
          <Link 
            to={`/learn/${courseId}/${prevLesson.id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            onClick={() => {
              setQuizAnswers({});
              setShowResults(false);
            }}
          >
            前のレッスン
          </Link>
        ) : (
          <div></div>
        )}
        
        {nextLesson && (
          <button
            onClick={goToNextLesson}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          >
            次のレッスン
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonPage;