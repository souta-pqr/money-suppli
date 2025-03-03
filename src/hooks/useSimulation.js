import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';

/**
 * 市場シミュレーションを管理するカスタムフック
 * @param {Object} options シミュレーションオプション
 * @param {string} options.period シミュレーション期間 ('1day', '1week', '1month', '3months', '6months', '1year')
 * @param {string} options.marketCondition 市場条件 ('normal', 'bull', 'bear', 'volatile')
 * @param {string} options.difficulty 難易度 ('beginner', 'intermediate', 'advanced')
 * @param {Array} initialStocks 初期株式データ
 * @returns {Object} シミュレーション関連の状態と関数
 */
const useSimulation = (options = {}, initialStocks = []) => {
  const { period = '1month', marketCondition = 'normal', difficulty = 'beginner' } = options;
  const [stocks, setStocks] = useState(initialStocks);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState('normal'); // slow, normal, fast
  const [simulationDate, setSimulationDate] = useState(new Date());
  const [marketEvents, setMarketEvents] = useState([]);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const { userData } = useUser();

  // 市場条件による価格変動係数
  const getMarketFactor = useCallback(() => {
    switch (marketCondition) {
      case 'bull': return { base: 0.03, volatility: 0.04 };
      case 'bear': return { base: -0.02, volatility: 0.03 };
      case 'volatile': return { base: 0.0, volatility: 0.08 };
      case 'normal':
      default: return { base: 0.01, volatility: 0.02 };
    }
  }, [marketCondition]);

  // 難易度による効果
  const getDifficultyFactor = useCallback(() => {
    switch (difficulty) {
      case 'intermediate': return 1.2;
      case 'advanced': return 1.5;
      case 'beginner':
      default: return 1.0;
    }
  }, [difficulty]);

  // ランダムなマーケットイベント生成
  const generateMarketEvent = useCallback(() => {
    const events = [
      { title: '中央銀行が利上げを発表', impact: -0.02, sectors: ['金融', 'テクノロジー'] },
      { title: '経済指標が予想を上回る', impact: 0.025, sectors: ['小売', '消費財'] },
      { title: '原油価格の急騰', impact: -0.015, sectors: ['運輸', '航空'] },
      { title: 'テクノロジー企業の好決算', impact: 0.03, sectors: ['テクノロジー'] },
      { title: '貿易摩擦の激化', impact: -0.02, sectors: ['自動車', '製造'] },
      { title: '新たな経済刺激策の発表', impact: 0.02, sectors: ['全セクター'] },
      { title: '米ドル高の進行', impact: -0.01, sectors: ['輸出', '素材'] },
      { title: '医薬品の大型治験成功', impact: 0.04, sectors: ['医薬品'] },
      { title: '小売売上高の減少', impact: -0.02, sectors: ['小売', '消費財'] },
      { title: '半導体供給不足の緩和', impact: 0.025, sectors: ['テクノロジー', '自動車'] }
    ];

    // 難易度に応じてイベント発生確率を調整
    const difficultyFactor = getDifficultyFactor();
    const eventChance = 0.05 * difficultyFactor;
    
    if (Math.random() < eventChance) {
      const event = events[Math.floor(Math.random() * events.length)];
      const date = new Date(simulationDate);
      return {
        ...event,
        date: date.toISOString(),
        read: false
      };
    }
    
    return null;
  }, [getDifficultyFactor, simulationDate]);

  // 株価変動のシミュレーション
  const simulateStockPrices = useCallback(() => {
    if (!simulationActive) return;

    const marketFactor = getMarketFactor();
    const difficultyFactor = getDifficultyFactor();
    
    // マーケットイベント生成
    const newEvent = generateMarketEvent();
    if (newEvent) {
      setMarketEvents(prev => [...prev, newEvent]);
    }
    
    // 各銘柄の価格を更新
    setStocks(prevStocks => {
      const updatedStocks = prevStocks.map(stock => {
        // ベースとなるランダムな変動率
        let changePercent = (Math.random() - 0.5) * marketFactor.volatility * difficultyFactor * 100;
        
        // 市場全体の傾向を反映
        changePercent += marketFactor.base * 100;
        
        // イベントの影響を反映
        if (newEvent) {
          const isSectorAffected = newEvent.sectors.includes(stock.sector) || 
                                  newEvent.sectors.includes('全セクター');
          if (isSectorAffected) {
            changePercent += newEvent.impact * 100;
          }
        }
        
        // 最終的な変動率を制限
        changePercent = Math.max(Math.min(changePercent, 10), -10);
        
        // 新しい価格を計算
        const priceFactor = 1 + (changePercent / 100);
        const newPrice = Math.round(stock.price * priceFactor * 100) / 100;
        
        return {
          ...stock,
          price: newPrice,
          change: parseFloat(changePercent.toFixed(2))
        };
      });
      
      return updatedStocks;
    });
    
    // 日付を進める
    setSimulationDate(prevDate => {
      const newDate = new Date(prevDate);
      
      switch (period) {
        case '1day':
          newDate.setHours(newDate.getHours() + 1);
          break;
        case '1week':
          newDate.setDate(newDate.getDate() + 1);
          break;
        case '1month':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case '3months':
          newDate.setDate(newDate.getDate() + 14);
          break;
        case '6months':
          newDate.setDate(newDate.getDate() + 30);
          break;
        case '1year':
          newDate.setDate(newDate.getDate() + 60);
          break;
        default:
          newDate.setDate(newDate.getDate() + 1);
      }
      
      return newDate;
    });
    
    // シミュレーション履歴を更新
    if (userData && userData.portfolio) {
      const portfolioValue = userData.portfolio.cash + 
        userData.portfolio.stocks.reduce((sum, stock) => {
          const currentStock = stocks.find(s => s.id === stock.id);
          return sum + (currentStock ? currentStock.price * stock.quantity : 0);
        }, 0);
        
      setSimulationHistory(prev => [
        ...prev, 
        {
          date: simulationDate.toISOString(),
          value: portfolioValue
        }
      ]);
    }
    
  }, [simulationActive, getMarketFactor, getDifficultyFactor, generateMarketEvent, period, stocks, simulationDate, userData]);

  // シミュレーション速度に基づくインターバルを設定
  useEffect(() => {
    if (!simulationActive) return;
    
    let intervalTime = 5000; // デフォルト: normal = 5秒
    
    if (simulationSpeed === 'slow') {
      intervalTime = 10000; // slow = 10秒
    } else if (simulationSpeed === 'fast') {
      intervalTime = 2000; // fast = 2秒
    }
    
    const intervalId = setInterval(simulateStockPrices, intervalTime);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [simulationActive, simulationSpeed, simulateStockPrices]);

  // シミュレーション開始
  const startSimulation = useCallback(() => {
    setSimulationActive(true);
    setSimulationDate(new Date());
    setMarketEvents([]);
    setSimulationHistory([]);
    
    // 初期状態を履歴に追加
    if (userData && userData.portfolio) {
      const portfolioValue = userData.portfolio.cash + 
        userData.portfolio.stocks.reduce((sum, stock) => {
          const currentStock = stocks.find(s => s.id === stock.id);
          return sum + (currentStock ? currentStock.price * stock.quantity : 0);
        }, 0);
        
      setSimulationHistory([{
        date: new Date().toISOString(),
        value: portfolioValue
      }]);
    }
  }, [userData, stocks]);

  // シミュレーション停止
  const stopSimulation = useCallback(() => {
    setSimulationActive(false);
  }, []);

  // シミュレーション速度変更
  const changeSimulationSpeed = useCallback((speed) => {
    setSimulationSpeed(speed);
  }, []);

  // マーケットイベントの既読処理
  const markEventAsRead = useCallback((eventIndex) => {
    setMarketEvents(prev => prev.map((event, index) => 
      index === eventIndex ? { ...event, read: true } : event
    ));
  }, []);

  return {
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
  };
};

export default useSimulation;