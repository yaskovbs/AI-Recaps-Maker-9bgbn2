import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { notificationService, NotificationPreferences } from '@/lib/notificationService';
import { apiKeysService, APIKeysData } from '@/lib/apiKeysService';
import { learningService, LearningPreferences } from '@/lib/learningService';
import { Key, Lock, Globe, Brain, Trash2, AlertCircle, CheckCircle, Eye, EyeOff, Save, RefreshCw, Bell, LogOut } from 'lucide-react';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showKeys, setShowKeys] = useState(false);
  const [showKeyValues, setShowKeyValues] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKeysData>({
    youtube: '',
    googleSearch: '',
    searchEngineId: '',
    gemini: '',
  });

  const [keyHints, setKeyHints] = useState<Record<string, string>>({});
  const [pin, setPin] = useState('');

  // Learning Settings State
  const [continuousLearning, setContinuousLearning] = useState(true);
  const [globalLearning, setGlobalLearning] = useState(false);
  const [learningSaveStatus, setLearningSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    browserPush: false,
    email: false,
    recapComplete: true,
    weeklyDigest: false,
  });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifSaveStatus, setNotifSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Load all settings on mount
  useEffect(() => {
    if (user) {
      loadKeys();
      loadKeyHints();
      loadNotificationSettings();
      loadLearningSettings();
    }
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [user]);

  const loadKeys = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { keys, error } = await apiKeysService.loadKeys(user.id);
      if (error) {
        console.warn('API keys DB unavailable, using local backup:', error);
      }
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKeyHints = async () => {
    if (!user) return;

    try {
      const hints = await apiKeysService.getKeyHints(user.id);
      setKeyHints(hints);
    } catch (error) {
      console.error('Error loading key hints:', error);
    }
  };

  const loadNotificationSettings = async () => {
    if (!user) return;
    const prefs = await notificationService.loadPreferences(user.id);
    setNotifications(prefs);
  };

  const loadLearningSettings = async () => {
    if (!user) return;
    const prefs = await learningService.loadPreferences(user.id);
    setContinuousLearning(prefs.continuousLearning);
    setGlobalLearning(prefs.globalLearning);
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    if (!user) return;

    // Check push notification support
    if (key === 'browserPush' && !notifications.browserPush) {
      if (!notificationService.isPushSupported()) {
        alert('התראות Push נתמכות רק בדפדפן שולחני. בטלפון נייד יש להשתמש בהתראות מייל.');
        return;
      }
      if (notifPermission !== 'granted') {
        const granted = await notificationService.requestPermission();
        if (!granted) {
          alert(t.settings.notifications.permissionDenied);
          return;
        }
        setNotifPermission('granted');
      }
    }

    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);

    const success = await notificationService.savePreferences(user.id, newPrefs);
    setNotifSaveStatus(success ? 'saved' : 'error');
    setTimeout(() => setNotifSaveStatus('idle'), 2000);
  };

  const handleLearningToggle = async (key: keyof LearningPreferences) => {
    if (!user) return;

    const newPrefs: LearningPreferences = {
      continuousLearning,
      globalLearning,
      [key]: key === 'continuousLearning' ? !continuousLearning : !globalLearning,
    };

    setContinuousLearning(newPrefs.continuousLearning);
    setGlobalLearning(newPrefs.globalLearning);

    const success = await learningService.savePreferences(user.id, newPrefs);
    setLearningSaveStatus(success ? 'saved' : 'error');
    setTimeout(() => setLearningSaveStatus('idle'), 2000);
  };

  const handleSaveKeys = async () => {
    if (!user) {
      setSaveMessage({ type: 'error', text: 'יש להתחבר כדי לשמור מפתחות' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { success, error } = await apiKeysService.saveKeys(user.id, apiKeys);

      if (success) {
        setSaveMessage({ type: 'success', text: t.settings.api.saved });
        await loadKeyHints();
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: error || 'שמירה נכשלה' });
      }
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'שגיאה בשמירת מפתחות' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockVault = () => {
    if (pin.length !== 6) {
      alert('PIN חייב להיות בן 6 ספרות');
      return;
    }
    setShowKeys(true);
    setPin('');
  };

  const handleResetLearning = async () => {
    const confirm = window.confirm('האם אתה בטוח? פעולה זו תמחק את כל פרופיל הלמידה שלך.');
    if (confirm && user) {
      await learningService.resetProfile(user.id);
      setContinuousLearning(true);
      setGlobalLearning(false);
      alert('פרופיל למידה אופס!');
    }
  };

  const handleFreezeAccount = () => {
    const confirm = window.confirm('האם להקפיא את החשבון? תוכל לשחזר אותו בכל עת.');
    if (confirm) {
      alert('חשבון הוקפא (דמו)');
    }
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm('האם למחוק את החשבון לצמיתות? פעולה זו בלתי הפיכה!');
    if (confirm) {
      alert('חשבון נמחק (דמו)');
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm(t.settings.account.logoutConfirm);
    if (confirm) {
      try {
        console.log('User confirmed logout from Settings');
        await logout();
        console.log('Navigating to home...');
        navigate('/home');
        setTimeout(() => {
          window.location.href = '/home';
        }, 100);
      } catch (error) {
        console.error('Logout error:', error);
        alert('שגיאה בהתנתקות');
        localStorage.clear();
        window.location.href = '/home';
      }
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t.settings.title}
          </h1>
          <p className="text-brass-300">נהל את ההגדרות והמפתחות שלך בצורה מאובטחת</p>
        </div>

        {/* API Settings */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Key className="w-6 h-6" />
            {t.settings.api.title} - {t.settings.api.byok}
          </h2>

          {!showKeys ? (
            <div className="space-y-4">
              <div className="bg-steam-800/30 border border-brass-700/20 rounded-lg p-6">
                <Lock className="w-12 h-12 text-brass-400 mx-auto mb-4" />
                <p className="text-brass-200 font-medium mb-4 text-center">
                  {t.settings.api.keyVault.locked}
                </p>

                {/* Show saved key hints */}
                {Object.keys(keyHints).length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-brass-400 text-center mb-2">מפתחות שמורים:</p>
                    {Object.entries(keyHints).map(([provider, hint]) => (
                      <div key={provider} className="flex items-center justify-center gap-2 text-sm text-brass-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="capitalize">{provider.replace('_', ' ')}</span>
                        <span className="text-brass-500 font-mono text-xs">{hint}</span>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.settings.api.keyVault.pin}
                  maxLength={6}
                  className="w-full max-w-xs mx-auto block bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center focus:outline-none focus:ring-2 focus:ring-brass-500 mb-4"
                />
                <div className="flex gap-2 justify-center">
                  <button onClick={handleUnlockVault} className="steampunk-button">
                    {t.settings.api.keyVault.unlock}
                  </button>
                  <button onClick={loadKeys} className="steampunk-button-secondary" title="רענן מפתחות">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg border ${
                    saveMessage.type === 'success'
                      ? 'bg-green-900/30 border-green-700/50 text-green-300'
                      : 'bg-red-900/30 border-red-700/50 text-red-300'
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              {/* YouTube API Key */}
              <div>
                <label className="block text-brass-200 font-medium mb-2">
                  {t.settings.api.youtube}
                </label>
                <div className="relative">
                  <input
                    type={showKeyValues ? 'text' : 'password'}
                    value={apiKeys.youtube || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, youtube: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 pr-12 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                  <button
                    onClick={() => setShowKeyValues(!showKeyValues)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brass-400 hover:text-brass-200"
                    type="button"
                  >
                    {showKeyValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {keyHints.youtube && (
                  <p className="text-xs text-brass-500 mt-1">שמור: {keyHints.youtube}</p>
                )}
              </div>

              {/* Google Search API Key */}
              <div>
                <label className="block text-brass-200 font-medium mb-2">
                  {t.settings.api.googleSearch}
                </label>
                <input
                  type={showKeyValues ? 'text' : 'password'}
                  value={apiKeys.googleSearch || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, googleSearch: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
                {keyHints.google_search && (
                  <p className="text-xs text-brass-500 mt-1">שמור: {keyHints.google_search}</p>
                )}
              </div>

              {/* Search Engine ID */}
              <div>
                <label className="block text-brass-200 font-medium mb-2">
                  Search Engine ID
                </label>
                <input
                  type={showKeyValues ? 'text' : 'password'}
                  value={apiKeys.searchEngineId || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, searchEngineId: e.target.value })}
                  placeholder="cx:..."
                  className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
                {keyHints.search_engine_id && (
                  <p className="text-xs text-brass-500 mt-1">שמור: {keyHints.search_engine_id}</p>
                )}
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="block text-brass-200 font-medium mb-2">
                  {t.settings.api.gemini}
                </label>
                <input
                  type={showKeyValues ? 'text' : 'password'}
                  value={apiKeys.gemini || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
                {keyHints.gemini && (
                  <p className="text-xs text-brass-500 mt-1">שמור: {keyHints.gemini}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveKeys}
                  disabled={isSaving || !user}
                  className="flex-1 steampunk-button flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>שומר...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t.settings.api.save}
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowKeys(false); setShowKeyValues(false); }}
                  className="steampunk-button-secondary px-6"
                >
                  <Lock className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-brass-500 text-center">
                המפתחות מוצפנים ב-AES-256-GCM ונשמרים בצורה מאובטחת. אף אחד כולל בעל האתר לא יכול לראות את המפתחות האמיתיים שלך.
              </p>
            </div>
          )}
        </div>

        {/* Notifications Settings */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            {t.settings.notifications.title}
            {notifSaveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-green-400" />}
            {notifSaveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          </h2>

          <div className="space-y-6">
            {/* Browser Push */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-brass-200 font-medium mb-1">
                  {t.settings.notifications.browserPush}
                </h3>
                <p className="text-sm text-brass-400">
                  {t.settings.notifications.browserPushDesc}
                </p>
                {!notificationService.isPushSupported() && (
                  <p className="text-xs text-copper-400 mt-1">
                    התראות Push נתמכות רק בדפדפן שולחני
                  </p>
                )}
              </div>
              <button
                onClick={() => handleNotificationToggle('browserPush')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.browserPush ? 'bg-brass-600' : 'bg-steam-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.browserPush ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-brass-200 font-medium mb-1">
                  {t.settings.notifications.email}
                </h3>
                <p className="text-sm text-brass-400">
                  {t.settings.notifications.emailDesc}
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle('email')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.email ? 'bg-brass-600' : 'bg-steam-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-brass-700/30 pt-6">
              <h3 className="text-brass-200 font-medium mb-4">{t.settings.notifications.when}</h3>

              {/* Recap Complete */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-brass-300">{t.settings.notifications.recapComplete}</span>
                <button
                  onClick={() => handleNotificationToggle('recapComplete')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.recapComplete ? 'bg-brass-600' : 'bg-steam-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.recapComplete ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Weekly Digest */}
              <div className="flex items-center justify-between">
                <span className="text-brass-300">{t.settings.notifications.weeklyDigest}</span>
                <button
                  onClick={() => handleNotificationToggle('weeklyDigest')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.weeklyDigest ? 'bg-brass-600' : 'bg-steam-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Settings */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            {t.settings.learning.title}
            {learningSaveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-green-400" />}
            {learningSaveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          </h2>

          <div className="space-y-6">
            {/* Continuous Learning */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-brass-200 font-medium">{t.settings.learning.personal}</p>
                <p className="text-sm text-brass-400">{t.settings.learning.personalDesc}</p>
              </div>
              <button
                onClick={() => handleLearningToggle('continuousLearning')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  continuousLearning ? 'bg-brass-600' : 'bg-steam-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    continuousLearning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Global Learning */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-brass-200 font-medium">{t.settings.learning.global}</p>
                <p className="text-sm text-brass-400">{t.settings.learning.globalDesc}</p>
              </div>
              <button
                onClick={() => handleLearningToggle('globalLearning')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  globalLearning ? 'bg-brass-600' : 'bg-steam-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    globalLearning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleResetLearning}
              className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {t.settings.learning.reset}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            {t.settings.language.title}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'he', label: 'עברית', flag: '🇮🇱' },
              { value: 'en', label: 'English', flag: '🇬🇧' },
              { value: 'ar', label: 'العربية', flag: '🇸🇦' },
              { value: 'es', label: 'Español', flag: '🇪🇸' },
              { value: 'fr', label: 'Français', flag: '🇫🇷' },
              { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
            ].map((lang) => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value as any)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  language === lang.value
                    ? 'border-brass-500 bg-brass-900/50'
                    : 'border-brass-700/30 hover:border-brass-600/50'
                }`}
              >
                <span className="text-2xl mb-1 block">{lang.flag}</span>
                <span className="text-brass-200 text-sm font-medium block">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="steampunk-card p-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            {t.settings.account.title}
          </h2>

          <div className="space-y-3">
            {/* Logout Button */}
            <div className="bg-steam-900/30 border border-brass-700/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-brass-200 font-medium mb-1 flex items-center gap-2">
                    <LogOut className="w-5 h-5" />
                    {t.settings.account.logout}
                  </h3>
                  <p className="text-sm text-brass-400">
                    {t.settings.account.logoutDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-brass-900/30 hover:bg-brass-900/50 text-brass-200 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border border-brass-700/50"
              >
                <LogOut className="w-5 h-5" />
                {t.settings.account.logout}
              </button>
            </div>

            <button
              onClick={handleFreezeAccount}
              className="w-full bg-copper-900/30 hover:bg-copper-900/50 text-copper-200 px-4 py-3 rounded-lg font-semibold transition-all"
            >
              {t.settings.account.freeze}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 px-4 py-3 rounded-lg font-semibold transition-all"
            >
              {t.settings.account.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
