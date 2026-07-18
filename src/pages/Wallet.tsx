import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { Wallet as WalletIcon, Plus, Minus, RefreshCw, TrendingUp, Clock } from 'lucide-react';

export default function Wallet() {
  const { t } = useLanguage();
  const { wallet, refreshWallet, isLoading, error, isAvailable } = useWallet();

  /* Removed simulated reward flow.
  const legacyHandleWatchAd = () => {
    alert('מציג מודעה מתגמלת...');
    setTimeout(() => {
      rewardCredits(1, 'Watched rewarded ad from wallet');
      alert('קיבלת קרדיט אחד!');
    }, 1000);
  };

  */
  const handleRefresh = async () => {
    const refreshed = await refreshWallet();
    if (refreshed) alert('היתרה עודכנה!');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t.wallet.title}
          </h1>
          <p className="text-brass-300">נהל את הקרדיטים שלך</p>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-700/40 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Balance Card */}
        <div className="steampunk-card p-8 mb-6 bg-gradient-to-br from-brass-900/40 to-copper-900/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-brass-300 text-sm mb-2">{t.wallet.balance}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-brass-100">{isLoading ? '…' : wallet.balance}</span>
                <span className="text-brass-300">{t.wallet.credits}</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center glow-brass">
              <WalletIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleRefresh}
              disabled={isLoading || !isAvailable}
              className="bg-steam-800 hover:bg-steam-700 disabled:cursor-not-allowed disabled:opacity-50 text-brass-200 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              {t.wallet.refresh}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Plus className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-brass-100">
                {wallet.totalEarned}
              </span>
            </div>
            <p className="text-sm text-brass-300">קרדיטים התקבלו</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Minus className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-brass-100">
                {wallet.totalSpent}
              </span>
            </div>
            <p className="text-sm text-brass-300">קרדיטים נוצלו</p>
          </div>

          <div className="steampunk-card p-6 md:col-span-1 col-span-2">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-brass-400" />
              <span className="text-sm font-bold text-brass-100">
                {wallet.lastRewardAt
                  ? new Date(wallet.lastRewardAt).toLocaleDateString('he-IL')
                  : 'אף פעם'}
              </span>
            </div>
            <p className="text-sm text-brass-300">תגמול אחרון</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="steampunk-card p-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t.wallet.history.title}
          </h2>

          {wallet.history.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="w-12 h-12 text-brass-400 mx-auto mb-4" />
              <p className="text-brass-300">{t.wallet.history.empty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.history
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction, idx) => (
                  <div
                    key={transaction.id || idx}
                    className="flex items-center justify-between p-4 bg-steam-800/30 border border-brass-700/20 rounded-lg hover:bg-steam-800/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <Plus className="w-5 h-5" />
                        ) : (
                          <Minus className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-brass-200 font-medium">
                          {transaction.amount > 0
                            ? t.wallet.history.reward
                            : t.wallet.history.consume}
                        </p>
                        <p className="text-sm text-brass-400">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : '-'}
                        {Math.abs(transaction.amount)}
                      </p>
                      <p className="text-xs text-brass-400">
                        {new Date(transaction.date).toLocaleString('he-IL')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
