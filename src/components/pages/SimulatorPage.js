import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import usePortfolio from '../../hooks/usePortfolio';
import PortfolioChart from '../common/PortfolioChart';
import { stockMarketData, stocksData, etfData, mutualFundData } from '../../data/stockData';

const SimulatorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('stocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [simulationSettings, setSimulationSettings] = useState({
    period: '1month',
    marketCondition: 'normal',
    difficulty: 'beginner'
  });
  const { userData } = useUser();
  const { portfolio, buyStock, sellStock, resetPortfolio } = usePortfolio();

  // タブの初期化
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // タブ切り替え
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // 検索フィルター
  const filterStocks = (stocks) => {
    if (!searchTerm) return stocks;
    
    return stocks.filter(stock => 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.includes(searchTerm)
    );
  };

  // 銘柄選択によるデータ取得
  const getStocksForActiveTab = () => {
    switch (activeTab) {
      case 'etf':
        return filterStocks(etfData);
      case 'fund':
        return filterStocks(mutualFundData);
      case 'portfolio':
      case 'tax':
        return [];
      default:
        return filterStocks(stocksData);
    }
  };

  // シミュレーション設定の変更
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSimulationSettings({
      ...simulationSettings,
      [name]: value
    });
  };

  // シミュレーション開始
  const startSimulation = () => {
    alert(`シミュレーション開始: ${simulationSettings.period}、${simulationSettings.marketCondition}、${simulationSettings.difficulty}`);
    // ここにシミュレーションのロジックを追加
  };

  // 表示するコンテンツを選択
  const renderContent = () => {
    if (activeTab === 'portfolio') {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">ポートフォリオ分析</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">ポートフォリオ構成</h4>
              <PortfolioChart portfolio={portfolio} />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">資産内訳</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資産</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">割合</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">現金</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">¥{portfolio.cash.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  {portfolio.stocks.map((stock) => (
                    <tr key={stock.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{stock.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        ¥{(stock.price * stock.quantity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {(((stock.price * stock.quantity) / portfolio.totalValue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">過去のトランザクション</h4>
            {userData && userData.portfolio.transactions && userData.portfolio.transactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種類</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userData.portfolio.transactions.slice(0).reverse().map((tx, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(tx.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type === 'buy' ? '買付' : '売却'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.stockName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{tx.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">¥{tx.price.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">¥{tx.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">取引履歴はありません</p>
            )}
          </div>
        </div>
      );
    } else if (activeTab === 'tax') {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">税金計算ツール</h3>
          
          <div className="mb-6">
            <p className="mb-4">株式投資などの金融商品から得た利益には税金がかかります。このツールを使って、おおよその税金を計算できます。</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">年間の売買益（キャピタルゲイン）</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  className="focus:ring-primary focus:border-primary block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">年間の配当金（インカムゲイン）</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  className="focus:ring-primary focus:border-primary block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
            </div>
            
            <button className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">
              計算する
            </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">税金の計算結果</h4>
            <p className="text-gray-500">
              上記の情報を入力して「計算する」をクリックすると、おおよその税額が表示されます。
              <br />
              ※ この計算はあくまで概算であり、実際の税額とは異なる場合があります。正確な税額については、税理士にご相談ください。
            </p>
          </div>
        </div>
      );
    }
    
    // デフォルトは株式・ETF・投資信託の取引画面
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">市場一覧</h3>
            <ul className="space-y-2">
              {stockMarketData.map((market, index) => (
                <li key={index}>
                  <span className="text-primary">◉</span> {market.name} 
                  <span className={market.change >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {market.change >= 0 ? '↑' : '↓'}{Math.abs(market.change)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">あなたのポートフォリオ</h3>
            <p className="mb-1">現金: ¥{portfolio.cash.toLocaleString()}</p>
            <p className="mb-1">
              株式: ¥{portfolio.stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0).toLocaleString()}
            </p>
            <p className="text-lg font-bold mb-4">総資産: ¥{portfolio.totalValue.toLocaleString()}</p>
            <PortfolioChart portfolio={portfolio} />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="flex border-b mb-4">
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'stocks' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              onClick={() => handleTabChange('stocks')}
            >
              株式
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'etf' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              onClick={() => handleTabChange('etf')}
            >
              ETF
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'fund' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              onClick={() => handleTabChange('fund')}
            >
              投資信託
            </button>
          </div>
          
          <h3 className="text-lg font-medium mb-4">投資対象を選択</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="銘柄名や証券コードで検索"
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コード</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄名</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">現在値</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">前日比</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セクター</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getStocksForActiveTab().map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
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
                        onClick={() => buyStock(stock, 1)}
                      >
                        購入
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">保有中の銘柄</h3>
          {portfolio.stocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄名</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">平均取得価格</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">現在値</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">評価額</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">損益</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.stocks.map((stock) => {
                    const currentValue = stock.price * stock.quantity;
                    const purchaseValue = stock.averagePrice * stock.quantity;
                    const profit = currentValue - purchaseValue;
                    const profitPercent = ((profit / purchaseValue) * 100).toFixed(2);
                    
                    return (
                      <tr key={stock.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{stock.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{stock.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">¥{stock.averagePrice.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">¥{stock.price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">¥{currentValue.toLocaleString()}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()} ({profitPercent}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                            onClick={() => sellStock(stock.id, stock.quantity)}
                          >
                            売却
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">現在保有している銘柄はありません</p>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">シミュレーション設定</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
              <select 
                className="border rounded p-2"
                name="period"
                value={simulationSettings.period}
                onChange={handleSettingChange}
              >
                <option value="1month">1ヶ月</option>
                <option value="3months">3ヶ月</option>
                <option value="6months">6ヶ月</option>
                <option value="1year">1年</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">市場条件</label>
              <select 
                className="border rounded p-2"
                name="marketCondition"
                value={simulationSettings.marketCondition}
                onChange={handleSettingChange}
              >
                <option value="normal">標準</option>
                <option value="bull">強気相場</option>
                <option value="bear">弱気相場</option>
                <option value="volatile">乱高下</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">難易度</label>
              <select 
                className="border rounded p-2"
                name="difficulty"
                value={simulationSettings.difficulty}
                onChange={handleSettingChange}
              >
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
              onClick={startSimulation}
            >
              シミュレーション開始
            </button>
            <button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={resetPortfolio}
            >
              ポートフォリオをリセット
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">投資シミュレーター</h2>
        <div className="text-lg font-medium">資金: ¥{portfolio.cash.toLocaleString()}</div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'stocks' || activeTab === 'etf' || activeTab === 'fund' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => handleTabChange('stocks')}
          >
            取引
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => handleTabChange('portfolio')}
          >
            ポートフォリオ分析
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'tax' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => handleTabChange('tax')}
          >
            税金計算
          </button>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default SimulatorPage;