import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { calculateCommission } from '../utils/StockUtils';

/**
 * 強化版ポートフォリオ管理カスタムフック
 * @param {number} initialCash 初期資金
 * @param {string} brokerType ブローカータイプ ('standard', 'discount', 'app')
 * @returns {Object} ポートフォリオ状態と取引機能
 */
const usePortfolioEnhanced = (initialCash = 1000000, brokerType = 'discount') => {
  const { userData, updatePortfolio } = useUser();
  const [portfolio, setPortfolio] = useState({
    cash: initialCash,
    stocks: [],
    totalValue: initialCash,
    performance: {
      dailyChange: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      totalGain: 0,
      totalGainPercent: 0
    },
    brokerType
  });

  // ユーザーコンテキストからポートフォリオデータを読み込み
  useEffect(() => {
    if (userData && userData.portfolio) {
      const stocks = userData.portfolio.stocks || [];
      const cash = userData.portfolio.cash || initialCash;
      
      // 株式の合計価値を計算
      const stocksValue = stocks.reduce((sum, stock) => {
        return sum + (stock.price * stock.quantity);
      }, 0);
      
      // パフォーマンス計算のために履歴データを使用
      const history = userData.portfolio.history || [];
      let dailyChange = 0;
      let weeklyChange = 0;
      let monthlyChange = 0;
      let totalGain = 0;
      let totalGainPercent = 0;
      
      if (history.length > 1) {
        const currentValue = cash + stocksValue;
        const initialValue = history[0].value;
        
        // 直近のパフォーマンス計算
        if (history.length > 1) {
          const latestValue = history[history.length - 1].value;
          const yesterdayValue = history.length > 2 ? history[history.length - 2].value : latestValue;
          dailyChange = ((currentValue / yesterdayValue) - 1) * 100;
        }
        
        // 週間パフォーマンス
        if (history.length > 7) {
          const weekAgoValue = history[history.length - 8].value;
          weeklyChange = ((currentValue / weekAgoValue) - 1) * 100;
        }
        
        // 月間パフォーマンス
        if (history.length > 30) {
          const monthAgoValue = history[history.length - 31].value;
          monthlyChange = ((currentValue / monthAgoValue) - 1) * 100;
        }
        
        // トータルのゲイン/ロス
        totalGain = currentValue - initialValue;
        totalGainPercent = ((currentValue / initialValue) - 1) * 100;
      }
      
      setPortfolio({
        cash,
        stocks,
        totalValue: cash + stocksValue,
        performance: {
          dailyChange,
          weeklyChange,
          monthlyChange,
          totalGain,
          totalGainPercent
        },
        brokerType
      });
    }
  }, [userData, initialCash, brokerType]);

  // ポートフォリオの合計価値を計算 (リアルタイム更新)
  useEffect(() => {
    const stocksValue = portfolio.stocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.quantity);
    }, 0);
    
    setPortfolio(prev => ({
      ...prev,
      totalValue: prev.cash + stocksValue
    }));
  }, [portfolio.cash, portfolio.stocks]);

  /**
   * 株式購入 (拡張版)
   * @param {Object} stock 株式オブジェクト
   * @param {number} quantity 数量
   * @param {string} orderType 注文タイプ ('market', 'limit')
   * @param {number} limitPrice 指値価格 (orderType='limit'の場合)
   * @returns {boolean} 購入成功かどうか
   */
  const buyStock = useCallback((stock, quantity, orderType = 'market', limitPrice = null) => {
    if (!stock || quantity <= 0) {
      return false;
    }
    
    // 指値注文の場合、現在価格が指値を超えていれば購入しない
    if (orderType === 'limit' && limitPrice !== null && stock.price > limitPrice) {
      return false;
    }
    
    const price = orderType === 'limit' ? limitPrice : stock.price;
    const cost = price * quantity;
    
    // 手数料計算
    const commission = calculateCommission(cost, portfolio.brokerType);
    const totalCost = cost + commission;
    
    // 現金が足りるか確認
    if (totalCost > portfolio.cash) {
      alert('現金が足りません');
      return false;
    }
    
    setPortfolio(prev => {
      // すでに保有している場合は数量を追加
      const existingStockIndex = prev.stocks.findIndex(s => s.id === stock.id);
      let updatedStocks;
      
      if (existingStockIndex >= 0) {
        updatedStocks = [...prev.stocks];
        const existingStock = updatedStocks[existingStockIndex];
        
        // 平均取得単価を再計算 (手数料込み)
        const newTotalQuantity = existingStock.quantity + quantity;
        const newTotalCost = (existingStock.averagePrice * existingStock.quantity) + totalCost;
        const newAveragePrice = newTotalCost / newTotalQuantity;
        
        updatedStocks[existingStockIndex] = {
          ...existingStock,
          quantity: newTotalQuantity,
          averagePrice: newAveragePrice
        };
      } else {
        // 新規購入
        // 平均取得単価には手数料を含む
        const averagePrice = totalCost / quantity;
        
        updatedStocks = [...prev.stocks, {
          ...stock,
          quantity,
          averagePrice,
          purchaseDate: new Date().toISOString()
        }];
      }
      
      const newPortfolio = {
        ...prev,
        cash: prev.cash - totalCost,
        stocks: updatedStocks
      };
      
      // ユーザーコンテキストを更新
      if (updatePortfolio) {
        updatePortfolio({
          cash: newPortfolio.cash,
          stocks: newPortfolio.stocks,
          transactions: userData?.portfolio?.transactions ? [
            ...userData.portfolio.transactions,
            {
              type: 'buy',
              stockId: stock.id,
              stockName: stock.name,
              quantity,
              price,
              commission,
              value: cost,
              totalValue: totalCost,
              orderType,
              date: new Date().toISOString()
            }
          ] : []
        });
      }
      
      return newPortfolio;
    });
    
    return true;
  }, [portfolio.cash, portfolio.brokerType, updatePortfolio, userData]);

  /**
   * 株式売却 (拡張版)
   * @param {string} stockId 株式ID
   * @param {number} quantity 数量
   * @param {string} orderType 注文タイプ ('market', 'limit')
   * @param {number} limitPrice 指値価格 (orderType='limit'の場合)
   * @returns {boolean} 売却成功かどうか
   */
  const sellStock = useCallback((stockId, quantity, orderType = 'market', limitPrice = null) => {
    if (!stockId || quantity <= 0) {
      return false;
    }
    
    const stockIndex = portfolio.stocks.findIndex(s => s.id === stockId);
    
    if (stockIndex < 0) {
      alert('保有していない株式です');
      return false;
    }
    
    const stock = portfolio.stocks[stockIndex];
    
    if (quantity > stock.quantity) {
      alert('保有数量を超えています');
      return false;
    }
    
    // 指値注文の場合、現在価格が指値を下回っていれば売却しない
    if (orderType === 'limit' && limitPrice !== null && stock.price < limitPrice) {
      return false;
    }
    
    const price = orderType === 'limit' ? limitPrice : stock.price;
    const saleProceeds = price * quantity;
    
    // 手数料計算
    const commission = calculateCommission(saleProceeds, portfolio.brokerType);
    const netProceeds = saleProceeds - commission;
    
    setPortfolio(prev => {
      let updatedStocks;
      
      if (quantity === stock.quantity) {
        // すべて売却
        updatedStocks = prev.stocks.filter(s => s.id !== stockId);
      } else {
        // 一部売却
        updatedStocks = [...prev.stocks];
        updatedStocks[stockIndex] = {
          ...updatedStocks[stockIndex],
          quantity: updatedStocks[stockIndex].quantity - quantity
        };
      }
      
      const newPortfolio = {
        ...prev,
        cash: prev.cash + netProceeds,
        stocks: updatedStocks
      };
      
      // ユーザーコンテキストを更新
      if (updatePortfolio) {
        updatePortfolio({
          cash: newPortfolio.cash,
          stocks: newPortfolio.stocks,
          transactions: userData?.portfolio?.transactions ? [
            ...userData.portfolio.transactions,
            {
              type: 'sell',
              stockId: stock.id,
              stockName: stock.name,
              quantity,
              price,
              commission,
              value: saleProceeds,
              netValue: netProceeds,
              orderType,
              date: new Date().toISOString()
            }
          ] : []
        });
      }
      
      return newPortfolio;
    });
    
    return true;
  }, [portfolio.stocks, portfolio.brokerType, updatePortfolio, userData]);

  /**
   * ポートフォリオリバランス
   * @param {Object} targetAllocation 目標アロケーション (例: {stocks: 60, etfs: 30, cash: 10})
   * @returns {boolean} リバランス成功かどうか
   */
  const rebalancePortfolio = useCallback((targetAllocation) => {
    if (!targetAllocation) return false;
    
    const totalValue = portfolio.totalValue;
    
    // 現在の配分を計算
    const currentAllocation = {
      stocks: 0,
      etfs: 0,
      funds: 0,
      cash: portfolio.cash
    };
    
    portfolio.stocks.forEach(stock => {
      const value = stock.price * stock.quantity;
      if (stock.type === 'etf') {
        currentAllocation.etfs += value;
      } else if (stock.type === 'fund') {
        currentAllocation.funds += value;
      } else {
        currentAllocation.stocks += value;
      }
    });
    
    // 目標金額を計算
    const targetValues = {};
    Object.keys(targetAllocation).forEach(key => {
      targetValues[key] = totalValue * (targetAllocation[key] / 100);
    });
    
    // リバランスのための購入・売却計画を作成
    // このロジックは実装が複雑なため、基本的なアイデアだけを示しています
    alert('リバランス機能は現在実装中です');
    
    return false;
  }, [portfolio]);

  /**
   * 配当金受取処理
   * @param {string} stockId 株式ID
   * @param {number} dividendPerShare 1株あたり配当金
   */
  const receiveDividend = useCallback((stockId, dividendPerShare) => {
    const stock = portfolio.stocks.find(s => s.id === stockId);
    
    if (!stock) return false;
    
    const dividendAmount = stock.quantity * dividendPerShare;
    
    setPortfolio(prev => {
      const newPortfolio = {
        ...prev,
        cash: prev.cash + dividendAmount
      };
      
      // ユーザーコンテキストを更新
      if (updatePortfolio) {
        updatePortfolio({
          cash: newPortfolio.cash,
          stocks: newPortfolio.stocks,
          transactions: userData?.portfolio?.transactions ? [
            ...userData.portfolio.transactions,
            {
              type: 'dividend',
              stockId: stock.id,
              stockName: stock.name,
              value: dividendAmount,
              perShare: dividendPerShare,
              date: new Date().toISOString()
            }
          ] : []
        });
      }
      
      return newPortfolio;
    });
    
    return true;
  }, [portfolio.stocks, updatePortfolio, userData]);

  /**
   * ポートフォリオをリセット
   */
  const resetPortfolio = useCallback(() => {
    const newPortfolio = {
      cash: initialCash,
      stocks: [],
      totalValue: initialCash,
      performance: {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        totalGain: 0,
        totalGainPercent: 0
      },
      brokerType
    };
    
    setPortfolio(newPortfolio);
    
    // ユーザーコンテキストを更新
    if (updatePortfolio) {
      updatePortfolio({
        cash: initialCash,
        stocks: [],
        transactions: []
      });
    }
  }, [initialCash, brokerType, updatePortfolio]);

  /**
   * 証券会社を変更
   * @param {string} newBrokerType 新しいブローカータイプ
   */
  const changeBroker = useCallback((newBrokerType) => {
    setPortfolio(prev => ({
      ...prev,
      brokerType: newBrokerType
    }));
  }, []);

  return {
    portfolio,
    buyStock,
    sellStock,
    rebalancePortfolio,
    receiveDividend,
    resetPortfolio,
    changeBroker
  };
};

export default usePortfolioEnhanced;