import React from 'react';
import { HashRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      {/* 
        GitHub Pages では HashRouter を使用
        HashRouter は URL の # の後ろの部分だけを使用するため、
        GitHub Pages のような静的ホスティングでも動作する
      */}
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </HashRouter>
    </UserProvider>
  );
}

export default App;