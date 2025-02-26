import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { UserProvider } from '../../../context/UserContext';

// UserContextをモック
jest.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    userData: {
      user: { name: 'テストユーザー' },
      learning: { completedLessons: [] },
      portfolio: { 
        cash: 1000000,
        stocks: [],
        history: [
          { date: '2024-01-01T00:00:00.000Z', value: 1000000 }
        ]
      }
    },
    loading: false
  }),
  UserProvider: ({ children }) => <div data-testid="user-provider">{children}</div>
}));

// React Routerのモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>{children}</a>
  )
}));

describe('HomePage Component', () => {
  test('ホームページが正しくレンダリングされること', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    // ユーザー名が表示されることを確認
    expect(screen.getByText(/こんにちは、テストユーザーさん/i)).toBeInTheDocument();
    
    // 学習進捗セクションが表示されることを確認
    expect(screen.getByText(/学習の進捗/i)).toBeInTheDocument();
    
    // ポートフォリオセクションが表示されることを確認
    expect(screen.getByText(/あなたのポートフォリオ/i)).toBeInTheDocument();
    
    // 総資産が表示されることを確認
    expect(screen.getByText(/総資産: ¥1,000,000/i)).toBeInTheDocument();
    
    // おすすめレッスンセクションが表示されることを確認
    expect(screen.getByText(/おすすめのレッスン/i)).toBeInTheDocument();
    
    // シミュレーターセクションが表示されることを確認
    expect(screen.getByText(/シミュレーターを試してみましょう/i)).toBeInTheDocument();
    
    // 仮想投資ボタンが表示されることを確認
    expect(screen.getByText(/仮想投資を始める/i)).toBeInTheDocument();
  });
});