import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PortfolioChart = ({ portfolio }) => {
  // データの準備
  const prepareData = () => {
    if (!portfolio || !portfolio.stocks) return [];
    
    const stocksData = portfolio.stocks.map(stock => ({
      name: stock.name,
      value: stock.price * stock.quantity
    }));
    
    // 現金も含める
    if (portfolio.cash > 0) {
      return [
        { name: '現金', value: portfolio.cash },
        ...stocksData
      ];
    }
    
    return stocksData;
  };

  const data = prepareData();
  
  // データがない場合
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
        <p className="text-gray-500">保有資産はありません</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `¥${value.toLocaleString()}`} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;