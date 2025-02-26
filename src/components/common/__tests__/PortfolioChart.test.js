import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioChart from '../PortfolioChart';

// Rechartsコンポーネントをモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }) => <div data-testid="pie">{data.map(d => d.name).join(', ')}</div>,
  Cell: () => <div data-testid="cell"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>
}));

describe('PortfolioChart Component', () => {
  test('データがない場合はメッセージを表示すること', () => {
    render(<PortfolioChart portfolio={{ cash: 0, stocks: [] }} />);
    expect(screen.getByText(/保有資産はありません/i)).toBeInTheDocument();
  });

  test('現金のみがある場合のチャート表示', () => {
    const portfolio = {
      cash: 1000000,
      stocks: []
    };
    
    render(<PortfolioChart portfolio={portfolio} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByText(/現金/i)).toBeInTheDocument();
  });

  test('現金と株式がある場合のチャート表示', () => {
    const portfolio = {
      cash: 500000,
      stocks: [
        { id: 1, name: 'テスト株式', price: 1000, quantity: 100 }
      ]
    };
    
    render(<PortfolioChart portfolio={portfolio} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    
    // PIEに現金と株式名が含まれることを確認
    expect(screen.getByText(/現金, テスト株式/i)).toBeInTheDocument();
  });
});