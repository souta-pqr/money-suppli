import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const usePortfolio = (initialCash = 1000000) => {
  const { userData, updatePortfolio } = useUser();
  const [portfolio, setPortfolio] = useState({
    cash: initialCash,
    stocks: [],
    totalValue: initialCash,
  });

  // UserContextからポートフォリオデータを読み込み
  useEffect(() => {
    if (userData && userData.portfolio) {
      setPortfolio({
        cash: userData.portfolio.cash,
        stocks: userData.portfolio.stocks,
        totalValue: userData.portfolio.cash + userData.portfolio.stocks.reduce(
          (sum, stock) => sum + (stock.price * stock.quantity), 0
        )
      });
    }
  }, [userData]);

  // ポートフォリオの合計価値を計算
  useEffect(() => {
    const stocksValue = portfolio.stocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.quantity);
    }, 0);
    
    setPortfolio(prev => ({
      ...prev,
      totalValue: prev.cash + stocksValue
    }));
  }, [portfolio.cash, portfolio.stocks]);

  // 株式購入
  const buyStock = (stock, quantity) => {
    const cost = stock.price * quantity;
    
    // 現金が足りるか確認
    if (cost > portfolio.cash) {
      alert('現金が足りません');
      return false;
    }
    
    setPortfolio(prev => {
      // すでに保有している場合は数量を追加
      const existingStockIndex = prev.stocks.findIndex(s => s.id === stock.id);
      let updatedStocks;
      
      if (existingStockIndex >= 0) {
        updatedStocks = [...prev.stocks];
        updatedStocks[existingStockIndex] = {
          ...updatedStocks[existingStockIndex],
          quantity: updatedStocks[existingStockIndex].quantity + quantity,
          averagePrice: (updatedStocks[existingStockIndex].averagePrice * updatedStocks[existingStockIndex].quantity + cost) / 
                        (updatedStocks[existingStockIndex].quantity + quantity)
        };
      } else {
        // 新規購入
        updatedStocks = [...prev.stocks, {
          ...stock,
          quantity,
          averagePrice: stock.price
        }];
      }
      
      const newPortfolio = {
        cash: prev.cash - cost,
        stocks: updatedStocks,
        totalValue: prev.totalValue  // これは次のuseEffectで更新される
      };
      
      // ユーザーコンテキストを更新
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
            price: stock.price,
            value: cost,
            date: new Date().toISOString()
          }
        ] : []
      });
      
      return newPortfolio;
    });
    
    return true;
  };

  // 株式売却
  const sellStock = (stockId, quantity) => {
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
    
    const saleProceeds = stock.price * quantity;
    
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
        cash: prev.cash + saleProceeds,
        stocks: updatedStocks,
        totalValue: prev.totalValue  // これは次のuseEffectで更新される
      };
      
      // ユーザーコンテキストを更新
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
            price: stock.price,
            value: saleProceeds,
            date: new Date().toISOString()
          }
        ] : []
      });
      
      return newPortfolio;
    });
    
    return true;
  };

  // ポートフォリオをリセット
  const resetPortfolio = () => {
    const newPortfolio = {
      cash: initialCash,
      stocks: [],
      totalValue: initialCash,
    };
    
    setPortfolio(newPortfolio);
    
    // ユーザーコンテキストを更新
    updatePortfolio({
      cash: initialCash,
      stocks: [],
      transactions: []
    });
  };

  return {
    portfolio,
    buyStock,
    sellStock,
    resetPortfolio
  };
};

export default usePortfolio;