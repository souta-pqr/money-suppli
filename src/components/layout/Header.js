import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../firebase/auth';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData } = useUser();
  
  // 現在のパスからアクティブタブを判定
  const isActive = (path) => {
    return location.pathname === path ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
          
          {currentUser ? (
            /* ログイン済みの場合 */
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
              
              <div className="relative flex items-center">
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                >
                  ログアウト
                </button>
              </div>
            </nav>
          ) : (
            /* 未ログインの場合 */
            <nav className="flex space-x-4">
              <Link 
                to="/login" 
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary bg-white hover:bg-blue-50"
              >
                ログイン
              </Link>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                新規登録
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;