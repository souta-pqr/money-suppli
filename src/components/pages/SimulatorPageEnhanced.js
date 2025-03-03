import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import usePortfolioEnhanced from '../../hooks/usePortfolioEnhanced';
import useSimulation from '../../hooks/useSimulation';
import PortfolioChart from '../common/PortfolioChart';
import { 
  stockMarketData as stockMarketDataEnhanced, 
  stocksData as stocksDataEnhanced, 
  etfData as etfDataEnhanced, 
  mutualFundData as mutualFundDataEnhanced,
  marketNewsData
} from '../../data/stockData';
import { 
  calculateAssetAllocation, 
  calculateSectorAllocation,
  calculateRealizedProfitLoss,
  calculateUnrealizedProfitLoss,
  calculateJapaneseTax,
  calculateReturn,
  calculateAnnualizedReturn,
  calculateSharpeRatio,
  getRecommendedAllocation
} from '../../utils/StockUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// 追加のデータ
const economicIndicatorsData = [
  {
    id: 2001,
    name: 'GDP成長率（前期比）',
    value: 0.6,
    previousValue: 0.4,
    unit: '%',
    period: '2024年第4四半期',
    releaseDate: '2025-02-15',
    impact: 'high',
    trend: 'increasing'
  },
  {
    id: 2002,
    name: '消費者物価指数（前年同月比）',
    value: 2.1,
    previousValue: 2.2,
    unit: '%',
    period: '2025年1月',
    impact: 'high',
    trend: 'stable'
  },
  {
    id: 2003,
    name: '失業率',
    value: 2.6,
    previousValue: 2.5,
    unit: '%',
    period: '2025年1月',
    impact: 'medium',
    trend: 'increasing'
  }
];

const brokerageCommissionData = [
  {
    id: 4001,
    name: 'SBI証券',
    type: 'discount',
    oneWayCommissions: [
      { amount: 50000, fee: 55 },
      { amount: 100000, fee: 99 },
      { amount: 200000, fee: 115 }
    ]
  },
  {
    id: 4002,
    name: 'マネックス証券',
    type: 'app',
    oneWayCommissions: [
      { amount: null, fee: 0 }
    ]
  }
];

// 色パレット
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SimulatorPageEnhanced = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('stocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [simulationSettings, setSimulationSettings] = useState({
    period: '1month',
    marketCondition: 'normal',
    difficulty: 'beginner',
    brokerType: 'discount'
  });
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedTaxIncomeAmount, setSelectedTaxIncomeAmount] = useState(1000000);
  const [selectedTaxIsNisa, setSelectedTaxIsNisa] = useState(false);
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [analysisTimeframe, setAnalysisTimeframe] = useState('1year');
  const [stockToAnalyze, setStockToAnalyze] = useState(null);
  const [stockAnalysisData, setStockAnalysisData] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
  const { userData } = useUser();
  const { portfolio, buyStock, sellStock, resetPortfolio, changeBroker } = usePortfolioEnhanced(
    1000000, 
    simulationSettings.brokerType
  );
  
  const {
    stocks,
    simulationActive,
    simulationSpeed,
    simulationDate,
    marketEvents,
    simulationHistory,
    startSimulation,
    stopSimulation,
    changeSimulationSpeed,
    markEventAsRead
  } = useSimulation(
    {
      period: simulationSettings.period,
      marketCondition: simulationSettings.marketCondition,
      difficulty: simulationSettings.difficulty
    },
    [...stocksDataEnhanced, ...etfDataEnhanced, ...mutualFundDataEnhanced]
  );

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
  const filterStocks = (stocksToFilter) => {
    if (!searchTerm) return stocksToFilter;
    
    return stocksToFilter.filter(stock => 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 取引対象のストック配列を取得
  const getStocksForActiveTab = () => {
    const allStocks = simulationActive ? stocks : [...stocksDataEnhanced, ...etfDataEnhanced, ...mutualFundDataEnhanced];
    
    switch (activeTab) {
      case 'etf':
        return filterStocks(allStocks.filter(stock => stock.type === 'etf'));
      case 'fund':
        return filterStocks(allStocks.filter(stock => stock.type === 'fund'));
      case 'stocks':
        return filterStocks(allStocks.filter(stock => stock.type === 'stock'));
      default:
        return [];
    }
  };

  // シミュレーション設定の変更
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSimulationSettings(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'brokerType') {
      changeBroker(value);
    }
  };

  // シミュレーション開始
  const handleStartSimulation = () => {
    startSimulation();
    showAlert('シミュレーションを開始しました', 'success');
  };

  // シミュレーション停止
  const handleStopSimulation = () => {
    stopSimulation();
    showAlert('シミュレーションを停止しました', 'info');
  };

  // 株式購入処理
  const handleBuyStock = (stock) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showAlert('有効な数量を入力してください', 'error');
      return;
    }
    
    let limitPriceValue = null;
    if (orderType === 'limit') {
      limitPriceValue = parseFloat(limitPrice);
      if (isNaN(limitPriceValue) || limitPriceValue <= 0) {
        showAlert('有効な指値価格を入力してください', 'error');
        return;
      }
    }
    
    const success = buyStock(stock, qty, orderType, limitPriceValue);
    
    if (success) {
      showAlert(`${stock.name}を${qty}株購入しました`, 'success');
      setQuantity(1);
      setLimitPrice('');
    }
  };

  // 株式売却処理
  const handleSellStock = (stockId, quantity) => {
    const success = sellStock(stockId, quantity);
    
    if (success) {
      const stock = portfolio.stocks.find(s => s.id === stockId);
      showAlert(`${stock.name}を${quantity}株売却しました`, 'success');
    }
  };

  // ポートフォリオリセット
  const handleResetPortfolio = () => {
    if (window.confirm('ポートフォリオをリセットしますか？この操作は元に戻せません。')) {
      resetPortfolio();
      showAlert('ポートフォリオをリセットしました', 'info');
    }
  };

  // アラートメッセージ表示
  const showAlert = (message, type = 'info') => {
    setAlertMessage({ message, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  // 注文タイプ変更処理
  const handleOrderTypeChange = (e) => {
    setOrderType(e.target.value);
    if (e.target.value === 'market') {
      setLimitPrice('');
    }
  };

  // 数量変更処理
  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  // 指値価格変更処理
  const handleLimitPriceChange = (e) => {
    setLimitPrice(e.target.value);
  };

  // リスクプロファイル変更処理
  const handleRiskProfileChange = (e) => {
    setRiskProfile(e.target.value);
  };

  // 株式詳細分析
  const analyzeStock = (stock) => {
    setStockToAnalyze(stock);
    
    // 簡易的なシミュレーションデータを生成
    const historicalData = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    let price = stock.price * 0.8; // 1年前の価格は現在の80%と仮定
    const volatility = stock.volatility || 20;
    
    // 52週分のデータを生成
    for (let i = 0; i < 52; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i * 7));
      
      // ランダムな変動を加える
      const change = (Math.random() - 0.5) * (volatility / 100) * price * 0.5;
      price = price + change + (price * 0.003); // 週ごとに少しずつ上昇
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    
    setStockAnalysisData({
      stock,
      historicalData,
      metrics: {
        beta: stock.beta || 1.0,
        volatility: stock.volatility || 20,
        yearReturn: calculateReturn(historicalData[0].price, stock.price),
        dividendYield: stock.dividendYield || 0,
        per: stock.per || 0,
        pbr: stock.pbr || 0
      }
    });
  };

  // アセットアロケーション計算（メモ化）
  const assetAllocation = useMemo(() => {
    return calculateAssetAllocation(portfolio);
  }, [portfolio]);

  // セクターアロケーション計算（メモ化）
  const sectorAllocation = useMemo(() => {
    return calculateSectorAllocation(portfolio.stocks);
  }, [portfolio.stocks]);

  // ポートフォリオパフォーマンス指標（メモ化）
  const portfolioMetrics = useMemo(() => {
    const history = simulationActive ? simulationHistory : (userData?.portfolio?.history || []);
    
    if (history.length < 2) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      };
    }
    
    const initialValue = history[0].value;
    const currentValue = portfolio.totalValue;
    const totalReturn = calculateReturn(initialValue, currentValue);
    
    // 運用日数を計算
    const startDate = new Date(history[0].date);
    const endDate = new Date(history[history.length - 1].date);
    const daysHeld = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    const annualizedReturn = calculateAnnualizedReturn(initialValue, currentValue, daysHeld);
    
    // 月次リターン計算（簡易版）
    const monthlyReturns = [];
    let lastMonthValue = initialValue;
    let lastMonthDate = startDate;
    
    for (let i = 1; i < history.length; i++) {
      const currentDate = new Date(history[i].date);
      if (currentDate.getMonth() !== lastMonthDate.getMonth() || i === history.length - 1) {
        const monthReturn = (history[i].value / lastMonthValue - 1) * 100;
        monthlyReturns.push(monthReturn);
        lastMonthValue = history[i].value;
        lastMonthDate = currentDate;
      }
    }
    
    // シャープレシオ計算
    const riskFreeRate = 0.5; // 0.5%と仮定
    const standardDeviation = monthlyReturns.length > 1 ? 
      Math.sqrt(monthlyReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / monthlyReturns.length) : 
      1;
    
    const sharpeRatio = calculateSharpeRatio(annualizedReturn, riskFreeRate, standardDeviation);
    
    // 最大ドローダウン計算
    let maxDrawdown = 0;
    let peak = initialValue;
    
    for (const item of history) {
      if (item.value > peak) {
        peak = item.value;
      } else {
        const drawdown = (peak - item.value) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown
    };
  }, [portfolio.totalValue, simulationActive, simulationHistory, userData?.portfolio?.history]);

  // 損益計算（メモ化）
  const profitLoss = useMemo(() => {
    const realized = calculateRealizedProfitLoss(userData?.portfolio?.transactions || []);
    const unrealized = calculateUnrealizedProfitLoss(portfolio.stocks);
    
    return {
      realized,
      unrealized,
      total: {
        gains: realized.gains + unrealized.gains,
        losses: realized.losses + unrealized.losses,
        net: realized.net + unrealized.net
      }
    };
  }, [portfolio.stocks, userData?.portfolio?.transactions]);

  // 推奨アロケーション（メモ化）
  const recommendedAllocation = useMemo(() => {
    return getRecommendedAllocation(riskProfile);
  }, [riskProfile]);

  // 税金計算（メモ化）
  const taxCalculation = useMemo(() => {
    return calculateJapaneseTax(selectedTaxIncomeAmount, selectedTaxIsNisa);
  }, [selectedTaxIncomeAmount, selectedTaxIsNisa]);

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
              <h4 className="font-medium mb-2">ポートフォリオパフォーマンス</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">トータルリターン</p>
                    <p className={`text-lg font-bold ${portfolioMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioMetrics.totalReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">年率リターン</p>
                    <p className={`text-lg font-bold ${portfolioMetrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioMetrics.annualizedReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">シャープレシオ</p>
                    <p className="text-lg font-bold">
                      {portfolioMetrics.sharpeRatio.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">最大ドローダウン</p>
                    <p className="text-lg font-bold text-red-600">
                      {portfolioMetrics.maxDrawdown.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium mt-4 mb-2">資産推移</h4>
              <div className="h-64">
                {(simulationActive ? simulationHistory : userData?.portfolio?.history || []).length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simulationActive ? simulationHistory : userData?.portfolio?.history}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => `¥${value.toLocaleString()}`}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1E88E5" 
                        activeDot={{ r: 8 }} 
                        name="資産価値"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                    <span className="text-gray-400">データが不足しています</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">資産クラス配分</h4>
              <div className="space-y-3">
                {Object.keys(assetAllocation).map(key => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{key === 'cash' ? '現金' : 
                             key === 'stocks' ? '株式' : 
                             key === 'etfs' ? 'ETF' : '投資信託'}</span>
                      <span>{assetAllocation[key].percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-grow h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 ${
                            key === 'cash' ? 'bg-blue-400' : 
                            key === 'stocks' ? 'bg-green-500' : 
                            key === 'etfs' ? 'bg-yellow-500' : 'bg-purple-500'
                          } rounded-full`} 
                          style={{ width: `${assetAllocation[key].percentage}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">¥{assetAllocation[key].amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">セクター配分</h4>
              {sectorAllocation.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorAllocation}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sectorAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                  <span className="text-gray-400">セクターデータがありません</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">ポートフォリオ診断</h4>
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-medium mb-2">あなたのリスクプロファイル</h5>
              <select
                className="border rounded p-2 mb-4 w-full"
                value={riskProfile}
                onChange={handleRiskProfileChange}
              >
                <option value="conservative">保守的 (リスク回避型)</option>
                <option value="moderate">中立的 (バランス型)</option>
                <option value="aggressive">積極的 (リスク許容型)</option>
              </select>
              
              <h5 className="font-medium mb-2">推奨アセットアロケーション</h5>
              <div className="space-y-3 mb-4">
                {Object.keys(recommendedAllocation).map(key => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{key === 'cash' ? '現金' : 
                             key === 'bonds' ? '債券' : 
                             key === 'stocks' ? '株式' : 'オルタナティブ'}</span>
                      <span>{recommendedAllocation[key]}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 ${
                          key === 'cash' ? 'bg-blue-400' : 
                          key === 'bonds' ? 'bg-green-500' : 
                          key === 'stocks' ? 'bg-yellow-500' : 'bg-purple-500'
                        } rounded-full`} 
                        style={{ width: `${recommendedAllocation[key]}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <h5 className="font-medium mb-2">診断結果</h5>
              <div className="p-3 bg-blue-50 rounded">
                <p>現在のポートフォリオは
                  {sectorAllocation.length < 3 ? 
                    '分散が不十分です。より多くのセクターに投資することで、リスクを分散させることができます。' : 
                    '分散が良好です。複数のセクターに投資することで、リスク分散が図れています。'}
                </p>
                <p className="mt-2">
                  {assetAllocation.cash.percentage > 50 ? 
                    '現金の比率が高すぎます。投資機会を逃している可能性があります。' : 
                    assetAllocation.cash.percentage < 5 ? 
                    '現金の比率が低すぎます。緊急時の資金や新たな投資機会に対応できない可能性があります。' : 
                    '現金の比率は適切な範囲内です。'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">損益状況</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="text-sm text-gray-600">実現利益</h5>
                <p className="text-lg font-bold text-green-600">¥{profitLoss.realized.gains.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-sm text-gray-600">実現損失</h5>
                <p className="text-lg font-bold text-red-600">¥{profitLoss.realized.losses.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg ${profitLoss.realized.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h5 className="text-sm text-gray-600">実現損益合計</h5>
                <p className={`text-lg font-bold ${profitLoss.realized.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{profitLoss.realized.net.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="text-sm text-gray-600">評価益</h5>
                <p className="text-lg font-bold text-green-600">¥{profitLoss.unrealized.gains.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-sm text-gray-600">評価損</h5>
                <p className="text-lg font-bold text-red-600">¥{profitLoss.unrealized.losses.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg ${profitLoss.unrealized.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h5 className="text-sm text-gray-600">評価損益合計</h5>
                <p className={`text-lg font-bold ${profitLoss.unrealized.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{profitLoss.unrealized.net.toLocaleString()}
                </p>
              </div>
              <div className={`p-4 rounded-lg md:col-span-3 ${profitLoss.total.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <h5 className="text-sm font-medium">総合損益</h5>
                <p className={`text-xl font-bold ${profitLoss.total.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{profitLoss.total.net.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">保有銘柄</h4>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">分析</th>
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium">{stock.name}</div>
                              <div className="text-xs text-gray-500">{stock.code} ({stock.type === 'etf' ? 'ETF' : stock.type === 'fund' ? '投資信託' : '株式'})</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">{stock.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">¥{stock.averagePrice.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">¥{stock.price.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">¥{currentValue.toLocaleString()}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()} ({profitPercent}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
                              onClick={() => analyzeStock(stock)}
                            >
                              分析
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
          
          {stockAnalysisData && (
            <div className="mb-6 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">銘柄分析: {stockAnalysisData.stock.name}</h4>
                <button 
                  className="text-gray-500"
                  onClick={() => setStockAnalysisData(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium mb-2">価格推移</h5>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stockAnalysisData.historicalData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }} 
                        />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#2196F3"
                          dot={false}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">取引量推移</h5>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stockAnalysisData.historicalData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }} 
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                        <Bar dataKey="volume" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">ベータ値</p>
                  <p className="text-lg font-bold">{stockAnalysisData.metrics.beta.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {stockAnalysisData.metrics.beta < 0.8 ? '市場より変動が少ない' : 
                     stockAnalysisData.metrics.beta > 1.2 ? '市場より変動が大きい' : 
                     '市場と同程度の変動'}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">ボラティリティ</p>
                  <p className="text-lg font-bold">{stockAnalysisData.metrics.volatility.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">
                    {stockAnalysisData.metrics.volatility < 15 ? '低リスク' : 
                     stockAnalysisData.metrics.volatility > 25 ? '高リスク' : 
                     '中程度のリスク'}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">年間リターン</p>
                  <p className={`text-lg font-bold ${stockAnalysisData.metrics.yearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockAnalysisData.metrics.yearReturn.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">配当利回り</p>
                  <p className="text-lg font-bold">{stockAnalysisData.metrics.dividendYield.toFixed(2)}%</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">PER</p>
                  <p className="text-lg font-bold">{stockAnalysisData.metrics.per.toFixed(1)}倍</p>
                  <p className="text-xs text-gray-500">
                    {stockAnalysisData.metrics.per < 10 ? '割安' : 
                     stockAnalysisData.metrics.per > 25 ? '割高' : 
                     '標準的な水準'}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">PBR</p>
                  <p className="text-lg font-bold">{stockAnalysisData.metrics.pbr.toFixed(2)}倍</p>
                  <p className="text-xs text-gray-500">
                    {stockAnalysisData.metrics.pbr < 1 ? '割安' : 
                     stockAnalysisData.metrics.pbr > 3 ? '割高' : 
                     '標準的な水準'}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded md:col-span-2">
                  <p className="text-xs text-gray-600">分析結果</p>
                  <p className="text-sm">
                    {stockAnalysisData.metrics.per < 15 && stockAnalysisData.metrics.pbr < 1.5 ? 
                      'バリュー株：割安な水準にあり、長期投資の候補として検討できます。' : 
                     stockAnalysisData.metrics.yearReturn > 15 ? 
                      'グロース株：直近の成長率が高く、今後も成長が期待できる可能性があります。' : 
                     stockAnalysisData.metrics.dividendYield > 3 ? 
                      'インカム株：高配当が特徴で、インカム投資家向けです。' : 
                      'スタンダード株：極端な特徴はなく、バランスの取れた銘柄です。'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-2">過去のトランザクション</h4>
            {userData && userData.portfolio.transactions && userData.portfolio.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種類</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">手数料</th>
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
                            tx.type === 'buy' ? 'bg-green-100 text-green-800' : 
                            tx.type === 'sell' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type === 'buy' ? '買付' : 
                             tx.type === 'sell' ? '売却' : 
                             tx.type === 'dividend' ? '配当' : tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{tx.stockName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{tx.quantity || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {tx.price ? `¥${tx.price.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {tx.commission ? `¥${tx.commission.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={tx.type === 'buy' ? 'text-red-600' : 'text-green-600'}>
                            {tx.type === 'buy' ? '-' : '+'}
                            ¥{(tx.value || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">年間の利益額</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      className="focus:ring-primary focus:border-primary block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0"
                      value={selectedTaxIncomeAmount}
                      onChange={(e) => setSelectedTaxIncomeAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      checked={selectedTaxIsNisa}
                      onChange={(e) => setSelectedTaxIsNisa(e.target.checked)}
                    />
                    <span className="ml-2">NISA口座での取引</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">NISA口座での利益は非課税です</p>
                </div>
                
                <button 
                  className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                  onClick={() => {
                    // すでに自動計算されているので特に何もしない
                  }}
                >
                  計算する
                </button>
              </div>
              
              <div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-lg mb-3">税金の計算結果</h4>
                  
                  {selectedTaxIsNisa ? (
                    <div className="mb-4">
                      <p className="text-green-600 font-medium">NISA口座のため、非課税です。</p>
                      <p className="text-sm text-gray-600 mt-2">
                        NISA口座では年間の投資枠（一般NISA：120万円、つみたてNISA：40万円）の範囲内で得た利益が非課税となります。
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-600">所得税 (15.315%)</div>
                        <div className="text-right font-medium">¥{taxCalculation.incomeTax.toLocaleString()}</div>
                        
                        <div className="text-sm text-gray-600">住民税 (5%)</div>
                        <div className="text-right font-medium">¥{taxCalculation.residentTax.toLocaleString()}</div>
                        
                        <div className="border-t pt-1 text-sm font-medium">合計税額</div>
                        <div className="border-t pt-1 text-right font-medium text-red-600">¥{taxCalculation.total.toLocaleString()}</div>
                        
                        <div className="text-sm font-medium">税引後の利益</div>
                        <div className="text-right font-medium text-green-600">¥{taxCalculation.profitAfterTax.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  
                  <h5 className="font-medium mt-4 mb-2">税率の詳細</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>所得税: 15%</li>
                    <li>復興特別所得税: 所得税額の2.1% (0.315%)</li>
                    <li>住民税: 5%</li>
                    <li>合計税率: 20.315%</li>
                  </ul>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium mb-2">注意事項</h5>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>この計算はあくまで概算であり、実際の税額とは異なる場合があります。</li>
                    <li>特定口座（源泉徴収あり）の場合、証券会社が自動的に税金を差し引きます。</li>
                    <li>一般口座や特定口座（源泉徴収なし）の場合は、確定申告が必要です。</li>
                    <li>詳細は税理士または税務署にご相談ください。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="font-medium mb-4">主な投資口座の比較</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">口座タイプ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年間投資枠</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">非課税期間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">対象商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メリット</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">デメリット</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">特定口座（源泉徴収あり）</td>
                    <td className="px-6 py-4 whitespace-nowrap">無制限</td>
                    <td className="px-6 py-4 whitespace-nowrap">なし（課税）</td>
                    <td className="px-6 py-4 whitespace-nowrap">株式、投資信託、ETF、債券など</td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>税金計算が自動</li>
                        <li>投資できる金額に制限なし</li>
                        <li>損益通算や繰越控除が可能</li>
                      </ul>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>利益に対して約20%の税金がかかる</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">一般NISA</td>
                    <td className="px-6 py-4 whitespace-nowrap">120万円</td>
                    <td className="px-6 py-4 whitespace-nowrap">5年間</td>
                    <td className="px-6 py-4 whitespace-nowrap">株式、投資信託、ETF など</td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>利益が非課税</li>
                        <li>比較的自由な銘柄選択</li>
                      </ul>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>年間投資枠の制限</li>
                        <li>損失の繰越控除ができない</li>
                        <li>5年経過後は課税口座へ移管</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">新NISA（2024年～）</td>
                    <td className="px-6 py-4 whitespace-nowrap">360万円</td>
                    <td className="px-6 py-4 whitespace-nowrap">無期限</td>
                    <td className="px-6 py-4 whitespace-nowrap">株式、投資信託、ETF など</td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>恒久的な非課税措置</li>
                        <li>投資枠が大幅増加</li>
                        <li>生涯投資枠1,800万円</li>
                      </ul>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>損失の繰越控除ができない</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">iDeCo</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      会社員：27.6万円<br />
                      自営業：81.6万円
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">60歳まで</td>
                    <td className="px-6 py-4 whitespace-nowrap">定められた投資信託</td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>掛金が全額所得控除</li>
                        <li>運用益が非課税</li>
                        <li>受取時も税制優遇あり</li>
                      </ul>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc pl-5 text-sm">
                        <li>原則60歳まで引き出し不可</li>
                        <li>商品が限定的</li>
                        <li>手数料がかかる場合がある</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    
    // デフォルトは株式・ETF・投資信託の取引画面
    return (
      <>
        {/* アラートメッセージ */}
        {alertMessage && (
          <div className={`p-4 rounded-lg mb-4 ${
            alertMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
            alertMessage.type === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {alertMessage.message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 市場概況パネル */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">市場概況</h3>
            <p className="text-sm text-gray-600 mb-3">
              {simulationActive ? 
                `シミュレーション日時: ${new Date(simulationDate).toLocaleString()}` : 
                `${new Date().toLocaleString()} 現在`}
            </p>
            
            <div className="space-y-3">
              {(simulationActive ? stockMarketDataEnhanced : stockMarketDataEnhanced).map((market, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{market.name}</span>
                    <span className="text-xs text-gray-500 ml-1">({market.code})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">
                      {market.price.toLocaleString()}
                    </span>
                    <span className={`ml-2 ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {market.change >= 0 ? '↑' : '↓'}{Math.abs(market.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {simulationActive && marketEvents.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">市場イベント</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {marketEvents.map((event, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${event.read ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}
                      onClick={() => markEventAsRead(index)}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium text-sm">{event.title}</p>
                        <span className={`text-xs ${event.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {event.impact > 0 ? '+' : ''}{(event.impact * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        影響セクター: {event.sectors.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* ポートフォリオサマリー */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">あなたのポートフォリオ</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-sm text-gray-600">現金</p>
                <p className="text-lg font-medium">¥{portfolio.cash.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">株式評価額</p>
                <p className="text-lg font-medium">
                  ¥{portfolio.stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0).toLocaleString()}
                </p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-sm text-gray-600">総資産</p>
                <p className="text-xl font-bold">¥{portfolio.totalValue.toLocaleString()}</p>
              </div>
            </div>
            
            {/* パフォーマンス指標 */}
            {portfolio.performance && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-xs text-gray-600">今日の変化</p>
                  <p className={`font-medium ${portfolio.performance.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.performance.dailyChange >= 0 ? '+' : ''}{portfolio.performance.dailyChange.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">週間変化</p>
                  <p className={`font-medium ${portfolio.performance.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.performance.weeklyChange >= 0 ? '+' : ''}{portfolio.performance.weeklyChange.toFixed(2)}%
                  </p>
                </div>
                <div className="col-span-2 mt-1">
                  <p className="text-xs text-gray-600">トータルゲイン/ロス</p>
                  <p className={`font-medium ${portfolio.performance.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.performance.totalGain >= 0 ? '+' : ''}¥{portfolio.performance.totalGain.toLocaleString()} 
                    ({portfolio.performance.totalGainPercent >= 0 ? '+' : ''}{portfolio.performance.totalGainPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            )}
            
            <PortfolioChart portfolio={portfolio} />
          </div>
          
          {/* シミュレーション設定 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">シミュレーション設定</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
                <select 
                  className="border rounded p-2 w-full"
                  name="period"
                  value={simulationSettings.period}
                  onChange={handleSettingChange}
                  disabled={simulationActive}
                >
                  <option value="1day">1日</option>
                  <option value="1week">1週間</option>
                  <option value="1month">1ヶ月</option>
                  <option value="3months">3ヶ月</option>
                  <option value="6months">6ヶ月</option>
                  <option value="1year">1年</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市場条件</label>
                <select 
                  className="border rounded p-2 w-full"
                  name="marketCondition"
                  value={simulationSettings.marketCondition}
                  onChange={handleSettingChange}
                  disabled={simulationActive}
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
                  className="border rounded p-2 w-full"
                  name="difficulty"
                  value={simulationSettings.difficulty}
                  onChange={handleSettingChange}
                  disabled={simulationActive}
                >
                  <option value="beginner">初級</option>
                  <option value="intermediate">中級</option>
                  <option value="advanced">上級</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">証券会社タイプ</label>
                <select 
                  className="border rounded p-2 w-full"
                  name="brokerType"
                  value={simulationSettings.brokerType}
                  onChange={handleSettingChange}
                >
                  <option value="discount">ネット証券（SBI証券等）</option>
                  <option value="app">スマホ証券（無料）</option>
                  <option value="standard">大手証券（対面型）</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">※手数料体系が変わります</p>
              </div>
            </div>
            
            {!simulationActive ? (
              <button 
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                onClick={handleStartSimulation}
              >
                シミュレーション開始
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">シミュレーション速度</label>
                  <select 
                    className="border rounded p-2 w-full"
                    value={simulationSpeed}
                    onChange={(e) => changeSimulationSpeed(e.target.value)}
                  >
                    <option value="slow">遅い (10秒/ステップ)</option>
                    <option value="normal">通常 (5秒/ステップ)</option>
                    <option value="fast">速い (2秒/ステップ)</option>
                  </select>
                </div>
                
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleStopSimulation}
                >
                  シミュレーション停止
                </button>
              </div>
            )}
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
          
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <input
                type="text"
                placeholder="銘柄名や証券コードで検索"
                className="flex-grow p-2 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <button
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? '詳細設定を閉じる' : '詳細設定を開く'}
              </button>
            </div>
            
            {showAdvancedOptions && (
              <div className="p-4 border rounded-lg mb-4 bg-gray-50">
                <h4 className="font-medium mb-2">詳細な取引設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">注文タイプ</label>
                    <select 
                      className="border rounded p-2 w-full"
                      value={orderType}
                      onChange={handleOrderTypeChange}
                    >
                      <option value="market">成行注文</option>
                      <option value="limit">指値注文</option>
                    </select>
                  </div>
                  
                  {orderType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">指値価格</label>
                      <input
                        type="number"
                        className="border rounded p-2 w-full"
                        placeholder="指値価格を入力"
                        value={limitPrice}
                        onChange={handleLimitPriceChange}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                    <input
                      type="number"
                      className="border rounded p-2 w-full"
                      placeholder="購入数量"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コード</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄名</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">現在値</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">前日比</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">配当利回り</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.sector}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
                        onClick={() => handleBuyStock(stock)}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-xs text-gray-500">{stock.code} ({stock.type === 'etf' ? 'ETF' : stock.type === 'fund' ? '投資信託' : '株式'})</div>
                          </div>
                        </td>
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
                            onClick={() => handleSellStock(stock.id, stock.quantity)}
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
        
        <div className="flex justify-end mt-6">
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            onClick={handleResetPortfolio}
          >
            ポートフォリオをリセット
          </button>
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
        <div className="flex flex-wrap border-b">
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

export default SimulatorPageEnhanced;