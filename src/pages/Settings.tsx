import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { notificationService, NotificationPreferences } from '@/lib/notificationService';
import { apiKeysService, APIKeysData } from '@/lib/apiKeysService';
import { learningService, LearningPreferences } from '@/lib/learningService';
import { Key, Lock, Globe, Brain, Trash2, AlertCircle, CheckCircle, Eye, EyeOff, Save, RefreshCw, Bell, LogOut, Cloud, CloudOff, Smartphone } from 'lucide-react';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showKeys, setShowKeys] = useState(false);
  const [showKeyValues, setShowKeyValues] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKeysData>({
    youtube: '',
    googleSearch: '',
    searchEngineId: '',
    gemini: '',
  });

  const [keyHints, setKeyHints] = useState<Record<string, string>>({});
  const [pin, setPin] = useState('');
  const [dbSyncStatus, setDbSyncStatus] = useState<'checking' | 'connected' | 'disconnected' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      checkDbConnection();
    }
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [user]);

  const checkDbConnection = async () => {
    if (!user) return;
    setDbSyncStatus('checking');
    const result = await apiKeysService.testDbConnection(user.id);
    setDbSyncStatus(result.connected ? 'connected' : 'disconnected');
  };

  const loadKeys = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { keys, error, fromDb } = await apiKeysService.loadKeys(user.id);
      if (error) {
        console.warn('API keys DB unavailable, using local backup:', error);
      }
      setApiKeys(keys);
      if (fromDb) {
        setDbSyncStatus('connected');
      }
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

    // Check push notification support (now works on mobile too via Service Worker)
    if (key === 'browserPush' && !notifications.browserPush) {
      if (!notificationService.isPushSupported()) {
        toast.info('הדפדפן שלך לא תומך בהתראות. נסה לעדכן את הדפדפן.');
        return;
      }
      const currentPermission = notificationService.getPermissionStatus();
      if (currentPermission !== 'granted') {
        const granted = await notificationService.requestPermission();
        if (!granted) {
          toast.error(t.settings.notifications.permissionDenied);
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
      const result = await apiKeysService.saveKeys(user.id, apiKeys);

      if (result.success) {
        if (result.dbSynced) {
          setSaveMessage({ type: 'success', text: 'מפתחות נשמרו וסונכרנו לענן בהצלחה! זמינים בכל מכשיר.' });
          setDbSyncStatus('connected');
        } else {
          setSaveMessage({ type: 'warning', text: `מפתחות נשמרו מקומית בלבד. ${result.dbError || 'סנכרון לענן נכשל - המפתחות לא יהיו זמינים במכשירים אחרים.'}` });
          setDbSyncStatus('disconnected');
          toast.warning('המפתחות נשמרו רק במכשיר הזה. לשמירה בכל המכשירים, נסה לסנכרן שוב.');
        }
        await loadKeyHints();
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'שמירה נכשלה' });
      }
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'שגיאה בשמירת מפתחות' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const result = await apiKeysService.syncToDb(user.id);
      if (result.success) {
        toast.success('מפתחות סונכרנו לענן בהצלחה!');
        setDbSyncStatus('connected');
      } else {
        toast.error(result.error || 'סנכרון נכשל');
      }
    } catch {
      toast.error('שגיאה בסנכרון');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestNotification = async () => {
    const sent = await notificationService.sendNotification('בדיקת התראות', {
      body: 'ההתראות עובדות! תקבל התראות כשהסיכומים שלך יהיו מוכנים.',
      tag: 'test',
    });
    if (sent) {
      toast.success('התראת בדיקה נשלחה!');
    } else {
      toast.error('שליחת התראה נכשלה. בדוק שאישרת התראות.');
    }
  };

  const handleUnlockVault = () => {
    if (pin.length !== 6) {
      toast.warning('PIN חייב להיות בן 6 ספרות');
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
      toast.success('פרופיל למידה אופס!');
    }
  };

  const handleFreezeAccount = async () => {
    const confirm = window.confirm('האם להקפיא את החשבון? תוכל לשחזר אותו בכל עת.');
    if (!confirm || !user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ metadata: { frozen: true, frozen_at: new Date().toISOString() } })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('חשבון הוקפא בהצלחה. תוכל לשחזר אותו בכניסה הבאה.');
      await logout();
      navigate('/home');
    } catch (error) {
      console.error('Freeze error:', error);
      toast.error('שגיאה בהקפאת החשבון');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('האם למחוק את החשבון לצמיתות? פעולה זו בלתי הפיכה!');
    if (!confirm || !user) return;

    const doubleConfirm = window.confirm('בטוח? כל הנתונים שלך יימחקו לצמיתות.');
    if (!doubleConfirm) return;

    try {
      // Delete user data from all tables
      await Promise.allSettled([
        supabase.from('jobs').delete().eq('user_id', user.id),
        supabase.from('api_keys').delete().eq('user_id', user.id),
        supabase.from('ratings').delete().eq('user_id', user.id),
        supabase.from('learning_profiles').delete().eq('user_id', user.id),
        supabase.from('credits_wallet').delete().eq('user_id', user.id),
        supabase.from('credits_transactions').delete().eq('user_id', user.id),
        supabase.from('public_recaps').delete().eq('user_id', user.id),
        supabase.from('user_profiles').delete().eq('id', user.id),
      ]);

      toast.success('חשבון נמחק בהצלחה');
      localStorage.clear();
      await logout();
      navigate('/home');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת החשבון');
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
        toast.error('שגיאה בהתנתקות');
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-semibold text-brass-200 flex items-center gap-2">
              <Key className="w-6 h-6" />
              {t.settings.api.title} - {t.settings.api.byok}
            </h2>

            {/* Cloud Sync Status */}
            {dbSyncStatus && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                dbSyncStatus === 'checking' ? 'bg-brass-900/30 text-brass-400 border border-brass-700/30' :
                dbSyncStatus === 'connected' ? 'bg-green-900/30 text-green-400 border border-green-700/30' :
                'bg-red-900/30 text-red-400 border border-red-700/30'
              }`}>
                {dbSyncStatus === 'checking' ? (
                  <>
                    <div className="w-3 h-3 border-2 border-brass-400/30 border-t-brass-400 rounded-full animate-spin"></div>
                    <span>בודק...</span>
                  </>
                ) : dbSyncStatus === 'connected' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>מחובר לענן</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5" />
                    <span>שמירה מקומית</span>
                  </>
                )}
              </div>
            )}
          </div>

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
                      : saveMessage.type === 'warning'
                      ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
                      : 'bg-red-900/30 border-red-700/50 text-red-300'
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              {/* Disconnected warning with sync button */}
              {dbSyncStatus === 'disconnected' && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-yellow-300">
                    <CloudOff className="w-4 h-4 flex-shrink-0" />
                    <span>המפתחות שמורים רק במכשיר הזה. סנכרן לענן כדי לגשת מכל מכשיר.</span>
                  </div>
                  <button
                    onClick={handleSyncToCloud}
                    disabled={isSyncing}
                    className="flex-shrink-0 bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-200 px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-yellow-300/30 border-t-yellow-300 rounded-full animate-spin"></div>
                    ) : (
                      <Cloud className="w-4 h-4" />
                    )}
                    סנכרן
                  </button>
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
                {notificationService.isPushSupported() && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    עובד בכל המכשירים - טלפון ומחשב
                  </p>
                )}
                {!notificationService.isPushSupported() && (
                  <p className="text-xs text-copper-400 mt-1">
                    הדפדפן לא תומך בהתראות - נסה לעדכן את הדפדפן
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

            {/* Test notification button */}
            {notifications.browserPush && notifPermission === 'granted' && (
              <button
                onClick={handleTestNotification}
                className="w-full bg-brass-900/30 hover:bg-brass-900/50 text-brass-200 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-brass-700/30 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                שלח התראת בדיקה
              </button>
            )}

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
