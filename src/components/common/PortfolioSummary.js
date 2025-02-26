import React from 'react';

const PortfolioSummary = ({ portfolio }) => {
  if (!portfolio) {
    return <div>ポートフォリオデータがありません</div>;
  }

  // 各資産クラスの合計を計算
  const calculateAssetClassTotals = () => {
    const totals = {
      cash: portfolio.cash || 0,
      stocks: 0,
      etfs: 0,
      funds: 0
    };

    if (portfolio.stocks && portfolio.stocks.length > 0) {
      portfolio.stocks.forEach(stock => {
        // 資産タイプによって分類
        if (stock.type === 'etf') {
          totals.etfs += stock.price * stock.quantity;
        } else if (stock.type === 'fund') {
          totals.funds += stock.price * stock.quantity;
        } else {
          totals.stocks += stock.price * stock.quantity;
        }
      });
    }

    return totals;
  };

  const totals = calculateAssetClassTotals();
  const totalAssets = totals.cash + totals.stocks + totals.etfs + totals.funds;

  // 各資産クラスの割合を計算
  const calculatePercentage = (value) => {
    if (totalAssets === 0) return 0;
    return ((value / totalAssets) * 100).toFixed(1);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">ポートフォリオサマリー</h3>
      
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-800">¥{totalAssets.toLocaleString()}</p>
        <p className="text-sm text-gray-500">総資産</p>
      </div>
      
      <div className="space-y-3">
        {/* 現金 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>現金</span>
            <span>{calculatePercentage(totals.cash)}%</span>
          </div>
          <div className="flex items-center">
            <div className="flex-grow h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-400 rounded-full" 
                style={{ width: `${calculatePercentage(totals.cash)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">¥{totals.cash.toLocaleString()}</span>
          </div>
        </div>
        
        {/* 株式 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>株式</span>
            <span>{calculatePercentage(totals.stocks)}%</span>
          </div>
          <div className="flex items-center">
            <div className="flex-grow h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ width: `${calculatePercentage(totals.stocks)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">¥{totals.stocks.toLocaleString()}</span>
          </div>
        </div>
        
        {/* ETF */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>ETF</span>
            <span>{calculatePercentage(totals.etfs)}%</span>
          </div>
          <div className="flex items-center">
            <div className="flex-grow h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-yellow-500 rounded-full" 
                style={{ width: `${calculatePercentage(totals.etfs)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">¥{totals.etfs.toLocaleString()}</span>
          </div>
        </div>
        
        {/* 投資信託 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>投資信託</span>
            <span>{calculatePercentage(totals.funds)}%</span>
          </div>
          <div className="flex items-center">
            <div className="flex-grow h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-purple-500 rounded-full" 
                style={{ width: `${calculatePercentage(totals.funds)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">¥{totals.funds.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;