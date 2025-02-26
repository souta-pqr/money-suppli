import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  // 現在のパスからアクティブタブを判定
  const isActive = (path) => {
    return location.pathname === path ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">マネーサプリ</Link>
            </div>
          </div>
          <nav className="flex space-x-8">
            <Link 
              to="/" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/')}`}
            >
              ホーム
            </Link>
            <Link 
              to="/learn" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/learn')}`}
            >
              学習
            </Link>
            <Link 
              to="/simulator" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/simulator')}`}
            >
              シミュレーター
            </Link>
            <Link 
              to="/mypage" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/mypage')}`}
            >
              マイページ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;