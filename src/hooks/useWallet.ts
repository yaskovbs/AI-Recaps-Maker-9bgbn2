import { useState, useEffect } from 'react';

interface WalletData {
  balance: number;
  lastRewardAt?: string;
  updatedAt: string;
  history: Array<{
    type: 'reward' | 'consume';
    amount: number;
    date: string;
    description?: string;
  }>;
}

const WALLET_KEY = 'wallet_data';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletData>(() => {
    const saved = localStorage.getItem(WALLET_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      balance: 5, // Starting balance
      updatedAt: new Date().toISOString(),
      history: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  }, [wallet]);

  const rewardCredits = (amount: number = 1, description?: string) => {
    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amount,
      lastRewardAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          type: 'reward',
          amount,
          date: new Date().toISOString(),
          description: description || 'Watched ad',
        },
        ...prev.history,
      ],
    }));
  };

  const consumeCredits = (amount: number = 1, description?: string): boolean => {
    if (wallet.balance < amount) {
      return false;
    }
    
    setWallet(prev => ({
      ...prev,
      balance: prev.balance - amount,
      updatedAt: new Date().toISOString(),
      history: [
        {
          type: 'consume',
          amount: -amount,
          date: new Date().toISOString(),
          description: description || 'Created recap',
        },
        ...prev.history,
      ],
    }));
    
    return true;
  };

  const refresh = () => {
    const saved = localStorage.getItem(WALLET_KEY);
    if (!saved) return;

    try {
      setWallet(JSON.parse(saved) as WalletData);
    } catch {
      localStorage.removeItem(WALLET_KEY);
    }
  };

  return {
    wallet,
    rewardCredits,
    consumeCredits,
    refresh,
    refreshWallet: refresh,
  };
}
