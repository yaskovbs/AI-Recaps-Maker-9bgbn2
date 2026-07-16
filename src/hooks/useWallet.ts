import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export interface WalletTransaction {
  id: string;
  type: 'reward' | 'consume' | 'bonus' | 'refund';
  amount: number;
  date: string;
  description?: string;
}

interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastRewardAt?: string;
  updatedAt: string;
  history: WalletTransaction[];
}

const EMPTY_WALLET: WalletData = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  updatedAt: new Date(0).toISOString(),
  history: [],
};

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>(EMPTY_WALLET);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(EMPTY_WALLET);
      setIsLoading(false);
      return false;
    }
    setIsLoading(true);
    const [walletResult, historyResult] = await Promise.all([
      supabase.from('credits_wallet').select('balance,total_earned,total_spent,updated_at').eq('user_id', user.id).maybeSingle(),
      supabase.from('credits_transactions').select('id,amount,type,reason,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ]);
    setIsLoading(false);
    if (walletResult.error || historyResult.error || !walletResult.data) {
      setError(walletResult.error?.message || historyResult.error?.message || 'Wallet is unavailable');
      return false;
    }
    const history: WalletTransaction[] = (historyResult.data || []).map(item => ({
      id: item.id,
      type: item.type as WalletTransaction['type'],
      amount: Number(item.amount),
      date: item.created_at,
      description: item.reason || undefined,
    }));
    setWallet({
      balance: walletResult.data.balance,
      totalEarned: walletResult.data.total_earned,
      totalSpent: walletResult.data.total_spent,
      updatedAt: walletResult.data.updated_at,
      lastRewardAt: history.find(item => item.type === 'reward' || item.type === 'bonus')?.date,
      history,
    });
    setError(null);
    return true;
  }, [user]);

  useEffect(() => { void refreshWallet(); }, [refreshWallet]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`wallet-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits_wallet', filter: `user_id=eq.${user.id}` }, () => { void refreshWallet(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credits_transactions', filter: `user_id=eq.${user.id}` }, () => { void refreshWallet(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refreshWallet]);

  return {
    wallet,
    isLoading,
    error,
    refresh: refreshWallet,
    refreshWallet,
  };
}
