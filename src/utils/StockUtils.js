/**
 * 投資分析のためのユーティリティ関数群
 */

/**
 * 投資リターン（収益率）を計算
 * @param {number} initialValue 初期投資額
 * @param {number} currentValue 現在の価値
 * @returns {number} リターン率（パーセント）
 */
export const calculateReturn = (initialValue, currentValue) => {
    if (!initialValue || initialValue === 0) return 0;
    return ((currentValue / initialValue) - 1) * 100;
  };
  
  /**
   * 年率換算リターンを計算
   * @param {number} initialValue 初期投資額
   * @param {number} currentValue 現在の価値
   * @param {number} daysHeld 保有日数
   * @returns {number} 年率リターン（パーセント）
   */
  export const calculateAnnualizedReturn = (initialValue, currentValue, daysHeld) => {
    if (!initialValue || initialValue === 0 || !daysHeld || daysHeld === 0) return 0;
    const rawReturn = currentValue / initialValue;
    return (Math.pow(rawReturn, 365 / daysHeld) - 1) * 100;
  };
  
  /**
   * 平均リターンを計算
   * @param {Array} returns リターンの配列
   * @returns {number} 平均リターン
   */
  export const calculateAverageReturn = (returns) => {
    if (!returns || returns.length === 0) return 0;
    const sum = returns.reduce((acc, val) => acc + val, 0);
    return sum / returns.length;
  };
  
  /**
   * 標準偏差（リスク指標）を計算
   * @param {Array} returns リターンの配列
   * @param {number} avgReturn 平均リターン（省略可）
   * @returns {number} 標準偏差
   */
  export const calculateStandardDeviation = (returns, avgReturn = null) => {
    if (!returns || returns.length <= 1) return 0;
    
    const mean = avgReturn !== null ? avgReturn : calculateAverageReturn(returns);
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (returns.length - 1);
    
    return Math.sqrt(variance);
  };
  
  /**
   * シャープレシオを計算（リスク調整後リターン）
   * @param {number} portfolioReturn ポートフォリオのリターン
   * @param {number} riskFreeRate リスクフリーレート（例: 0.5 for 0.5%）
   * @param {number} standardDeviation 標準偏差
   * @returns {number} シャープレシオ
   */
  export const calculateSharpeRatio = (portfolioReturn, riskFreeRate, standardDeviation) => {
    if (standardDeviation === 0) return 0;
    return (portfolioReturn - riskFreeRate) / standardDeviation;
  };
  
  /**
   * 資産クラス別の配分を計算
   * @param {Object} portfolio ポートフォリオオブジェクト
   * @returns {Object} 資産クラス別の配分（金額と比率）
   */
  export const calculateAssetAllocation = (portfolio) => {
    if (!portfolio || !portfolio.stocks || !portfolio.cash) {
      return {
        cash: { amount: 0, percentage: 0 },
        stocks: { amount: 0, percentage: 0 },
        etfs: { amount: 0, percentage: 0 },
        funds: { amount: 0, percentage: 0 }
      };
    }
    
    const allocation = {
      cash: { amount: portfolio.cash, percentage: 0 },
      stocks: { amount: 0, percentage: 0 },
      etfs: { amount: 0, percentage: 0 },
      funds: { amount: 0, percentage: 0 }
    };
    
    // 各資産クラスの合計を計算
    portfolio.stocks.forEach(stock => {
      const value = stock.price * stock.quantity;
      
      if (stock.type === 'etf') {
        allocation.etfs.amount += value;
      } else if (stock.type === 'fund') {
        allocation.funds.amount += value;
      } else {
        allocation.stocks.amount += value;
      }
    });
    
    // 合計価値を計算
    const totalValue = allocation.cash.amount + 
                       allocation.stocks.amount + 
                       allocation.etfs.amount + 
                       allocation.funds.amount;
    
    // パーセンテージを計算
    if (totalValue > 0) {
      Object.keys(allocation).forEach(key => {
        allocation[key].percentage = (allocation[key].amount / totalValue) * 100;
      });
    }
    
    return allocation;
  };
  
  /**
   * セクター別の配分を計算
   * @param {Array} stocks 株式の配列
   * @returns {Array} セクター別の配分（名前、金額、比率）
   */
  export const calculateSectorAllocation = (stocks) => {
    if (!stocks || stocks.length === 0) return [];
    
    const sectors = {};
    let totalValue = 0;
    
    // 各セクターの合計を計算
    stocks.forEach(stock => {
      const value = stock.price * stock.quantity;
      totalValue += value;
      
      if (sectors[stock.sector]) {
        sectors[stock.sector] += value;
      } else {
        sectors[stock.sector] = value;
      }
    });
    
    // 配列形式に変換
    const result = Object.keys(sectors).map(sector => ({
      name: sector,
      amount: sectors[sector],
      percentage: totalValue > 0 ? (sectors[sector] / totalValue) * 100 : 0
    }));
    
    // 金額でソート
    return result.sort((a, b) => b.amount - a.amount);
  };
  
  /**
   * 実現損益を計算
   * @param {Array} transactions 取引履歴配列
   * @returns {Object} 実現損益（利益、損失、ネット）
   */
  export const calculateRealizedProfitLoss = (transactions) => {
    if (!transactions || transactions.length === 0) {
      return { gains: 0, losses: 0, net: 0 };
    }
    
    let gains = 0;
    let losses = 0;
    
    // 各銘柄の保有数量と取得コストを管理
    const holdings = {};
    
    transactions.forEach(tx => {
      if (tx.type === 'buy') {
        // 買いの場合は保有数量と取得コストを更新
        if (!holdings[tx.stockId]) {
          holdings[tx.stockId] = {
            quantity: 0,
            totalCost: 0
          };
        }
        
        holdings[tx.stockId].quantity += tx.quantity;
        holdings[tx.stockId].totalCost += tx.value;
      } 
      else if (tx.type === 'sell') {
        // 売りの場合は実現損益を計算
        if (holdings[tx.stockId] && holdings[tx.stockId].quantity >= tx.quantity) {
          const costBasis = (holdings[tx.stockId].totalCost / holdings[tx.stockId].quantity) * tx.quantity;
          const saleProceeds = tx.value;
          const profitLoss = saleProceeds - costBasis;
          
          if (profitLoss >= 0) {
            gains += profitLoss;
          } else {
            losses += Math.abs(profitLoss);
          }
          
          // 保有数量と取得コストを更新
          holdings[tx.stockId].quantity -= tx.quantity;
          holdings[tx.stockId].totalCost -= costBasis;
        }
      }
    });
    
    return {
      gains,
      losses,
      net: gains - losses
    };
  };
  
  /**
   * 評価損益を計算
   * @param {Array} stocks 保有株式の配列
   * @returns {Object} 評価損益（利益、損失、ネット）
   */
  export const calculateUnrealizedProfitLoss = (stocks) => {
    if (!stocks || stocks.length === 0) {
      return { gains: 0, losses: 0, net: 0 };
    }
    
    let gains = 0;
    let losses = 0;
    
    stocks.forEach(stock => {
      const currentValue = stock.price * stock.quantity;
      const costBasis = stock.averagePrice * stock.quantity;
      const profitLoss = currentValue - costBasis;
      
      if (profitLoss >= 0) {
        gains += profitLoss;
      } else {
        losses += Math.abs(profitLoss);
      }
    });
    
    return {
      gains,
      losses,
      net: gains - losses
    };
  };
  
  /**
   * 日本の税金（所得税、住民税）を計算
   * @param {number} profitAmount 利益額
   * @param {boolean} isNISA NISAかどうか
   * @returns {Object} 税額詳細
   */
  export const calculateJapaneseTax = (profitAmount, isNISA = false) => {
    if (isNISA || profitAmount <= 0) {
      return {
        incomeTax: 0,
        residentTax: 0,
        specialTax: 0,
        total: 0,
        profitAfterTax: profitAmount
      };
    }
    
    // 所得税 (15.315% = 15% + 0.315% 復興特別所得税)
    const incomeTax = profitAmount * 0.15315;
    
    // 住民税 (5%)
    const residentTax = profitAmount * 0.05;
    
    // 特別税 (納税額の2.1%、復興特別所得税)
    const specialTax = profitAmount * 0.00315;
    
    const totalTax = incomeTax + residentTax;
    
    return {
      incomeTax,
      residentTax, 
      specialTax,
      total: totalTax,
      profitAfterTax: profitAmount - totalTax
    };
  };
  
  /**
   * 手数料を計算
   * @param {number} amount 取引金額
   * @param {string} broker 証券会社タイプ ('standard', 'discount', 'app')
   * @returns {number} 手数料
   */
  export const calculateCommission = (amount, broker = 'standard') => {
    if (amount <= 0) return 0;
    
    switch (broker) {
      case 'discount':
        // ディスカウントブローカー（SBI証券など）
        if (amount <= 50000) return 55;
        if (amount <= 100000) return 99;
        if (amount <= 200000) return 115;
        if (amount <= 500000) return 275;
        if (amount <= 1000000) return 535;
        if (amount <= 1500000) return 640;
        if (amount <= 30000000) return 1013;
        return 1070;
        
      case 'app':
        // スマホアプリ証券（マネックス証券など）
        return 0; // 手数料無料
        
      case 'standard':
      default:
        // 標準的な証券会社
        if (amount <= 100000) return amount * 0.01;
        if (amount <= 1000000) return amount * 0.0075;
        if (amount <= 5000000) return amount * 0.005;
        if (amount <= 10000000) return amount * 0.0025;
        return amount * 0.001;
    }
  };
  
  /**
   * 複利効果を計算
   * @param {number} principal 元本
   * @param {number} ratePercent 金利（年率、パーセント）
   * @param {number} years 年数
   * @param {number} compoundFrequency 複利計算の頻度（年間）
   * @returns {Object} 複利計算結果
   */
  export const calculateCompoundInterest = (principal, ratePercent, years, compoundFrequency = 1) => {
    const rate = ratePercent / 100;
    const periods = years * compoundFrequency;
    const periodRate = rate / compoundFrequency;
    
    const finalAmount = principal * Math.pow(1 + periodRate, periods);
    const interest = finalAmount - principal;
    
    return {
      principal,
      finalAmount,
      interest,
      years,
      ratePercent
    };
  };
  
  /**
   * ポートフォリオの推奨バランスを計算
   * @param {string} riskProfile リスクプロファイル ('conservative', 'moderate', 'aggressive')
   * @returns {Object} 推奨資産配分
   */
  export const getRecommendedAllocation = (riskProfile = 'moderate') => {
    switch (riskProfile) {
      case 'conservative':
        return {
          cash: 15,
          bonds: 40,
          stocks: 35,
          alternatives: 10
        };
      case 'aggressive':
        return {
          cash: 5,
          bonds: 15,
          stocks: 70,
          alternatives: 10
        };
      case 'moderate':
      default:
        return {
          cash: 10,
          bonds: 30,
          stocks: 50,
          alternatives: 10
        };
    }
  };