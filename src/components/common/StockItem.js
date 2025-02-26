import React, { memo, useCallback } from 'react';

// StockItemコンポーネント
// 無駄な再レンダリングを防ぐためにmemo化
const StockItem = memo(({ stock, onBuy }) => {
  // 購入ボタンクリック時の処理
  const handleBuy = useCallback(() => {
    onBuy(stock, 1);
  }, [stock, onBuy]);
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">{stock.code}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{stock.name}</div>
          <div className="text-xs text-gray-500">{stock.description}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">¥{stock.price.toLocaleString()}</td>
      <td className={`px-6 py-4 whitespace-nowrap text-right ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {stock.change >= 0 ? '+' : ''}{stock.change}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{stock.sector}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button 
          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
          onClick={handleBuy}
        >
          購入
        </button>
      </td>
    </tr>
  );
});

export default StockItem;