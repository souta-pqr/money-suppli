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
  
  // トグル用の状態
  const [lessonContentVisible, setLessonContentVisible] = useState(true);
  const [quizContentVisible, setQuizContentVisible] = useState(true);
  
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
  
  // レッスンのトグル
  const toggleLessonContent = () => {
    setLessonContentVisible(!lessonContentVisible);
  };
  
  // クイズのトグル
  const toggleQuizContent = () => {
    setQuizContentVisible(!quizContentVisible);
  };
  
  // ホームに戻る前の確認
  const confirmReturnHome = () => {
    if (window.confirm('ホームページに戻りますか？進捗は保存されています。')) {
      navigate('/');
    }
  };
  
  if (!currentCourse) {
    return <div className="p-6 bg-white rounded-lg shadow">コースが見つかりません</div>;
  }
  
  if (!currentLesson) {
    return <div className="p-6 bg-white rounded-lg shadow">レッスンが見つかりません</div>;
  }
  
  const isLastLesson = currentIndex === currentCourse.lessons.length - 1;
  
  return (
    <div className="space-y-6 max-w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Link to={`/learn/${courseId}`} className="mr-2 text-gray-500">
            &lt; {currentCourse.title}
          </Link>
        </div>
        <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
          {currentIndex + 1}/{currentCourse.lessons.length}レッスン
        </div>
      </div>
      
      {/* 固定ナビゲーションバー */}
      <div className="sticky top-0 z-10 bg-white shadow-md rounded-lg p-3 flex justify-between items-center border-l-4 border-primary">
        <h2 className="text-lg font-medium">レッスン{currentIndex + 1}: {currentLesson.title}</h2>
        <Link to="/" className="text-gray-500 hover:text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="hidden sm:inline">ホーム</span>
        </Link>
      </div>
      
      {/* レッスンコンテンツセクション */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div 
          className="p-4 bg-blue-50 cursor-pointer flex justify-between items-center border-l-4 border-primary"
          onClick={toggleLessonContent}
        >
          <h3 className="text-lg font-medium">
            レッスン内容
          </h3>
          <div className="text-primary">
            {lessonContentVisible ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          </div>
        </div>
        
        {lessonContentVisible && (
          <div className="p-6 transition-all duration-300 ease-in-out">
            <div className="prose max-w-full w-full">
              <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      
      {/* クイズセクション */}
      {currentLesson.quiz && currentLesson.quiz.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div 
            className="p-4 bg-green-50 cursor-pointer flex justify-between items-center border-l-4 border-green-500"
            onClick={toggleQuizContent}
          >
            <h3 className="text-lg font-medium">クイズ</h3>
            <div className="text-green-600">
              {quizContentVisible ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg> : 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            </div>
          </div>
          
          {quizContentVisible && (
            <div className="p-6 transition-all duration-300 ease-in-out">
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
        </div>
      )}
      
      {/* ナビゲーションボタンエリア */}
      <div className="flex flex-wrap justify-between items-center gap-3 mt-8">
        <div className="flex gap-3">
          {prevLesson ? (
            <Link 
              to={`/learn/${courseId}/${prevLesson.id}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded flex items-center"
              onClick={() => {
                setQuizAnswers({});
                setShowResults(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              前のレッスン
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={confirmReturnHome}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            ホームに戻る
          </button>
          
          {nextLesson ? (
            <button
              onClick={goToNextLesson}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded flex items-center"
            >
              次のレッスン
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <Link 
              to="/"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              コース完了！ホームに戻る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;