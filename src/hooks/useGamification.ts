import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  expiresAt: string;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  title: string;
}

const STORAGE_KEY = 'airm_gamification';
const XP_PER_LEVEL = 100;

const ACHIEVEMENT_DEFS = [
  { id: 'first_recap', key: 'firstRecap' as const, icon: '🌟', xpReward: 50, maxProgress: 1 },
  { id: 'ten_recaps', key: 'tenRecaps' as const, icon: '⭐', xpReward: 100, maxProgress: 10 },
  { id: 'first_share', key: 'firstShare' as const, icon: '📤', xpReward: 30, maxProgress: 1 },
  { id: 'daily_streak_3', key: 'dailyStreak' as const, icon: '🔥', xpReward: 75, maxProgress: 3 },
  { id: 'high_rated', key: 'highRated' as const, icon: '⭐⭐⭐⭐⭐', xpReward: 120, maxProgress: 1 },
  { id: 'fifty_recaps', key: 'fiftyRecaps' as const, icon: '🏆', xpReward: 250, maxProgress: 50 },
  { id: 'hundred_recaps', key: 'hundredRecaps' as const, icon: '👑', xpReward: 500, maxProgress: 100 },
  { id: 'ai_master', key: 'aiMaster' as const, icon: '🤖', xpReward: 200, maxProgress: 5 },
  { id: 'social_butterfly', key: 'socialButterfly' as const, icon: '💖', xpReward: 150, maxProgress: 50 },
  { id: 'trend_setter', key: 'trendSetter' as const, icon: '🔥', xpReward: 300, maxProgress: 3 },
];

export function useGamification() {
  const { t } = useLanguage();
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    xpForNextLevel: XP_PER_LEVEL,
    title: t.gamification.levels.beginner,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => {
    loadGamificationData();
    generateDailyChallenges();
  }, []);

  const loadGamificationData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let data: any;
      try { data = JSON.parse(stored); } catch { data = {}; }
      setUserLevel(data.userLevel || userLevel);
      setAchievements(data.achievements || initializeAchievements());
      setStreak(data.streak || 0);
      setLastActivity(data.lastActivity || null);
    } else {
      setAchievements(initializeAchievements());
    }
  };

  const getAchievements = () => ACHIEVEMENT_DEFS.map(a => ({
    id: a.id,
    name: t.gamification.achievements[a.key].name,
    description: t.gamification.achievements[a.key].desc,
    icon: a.icon,
    xpReward: a.xpReward,
    maxProgress: a.maxProgress,
  }));

  const initializeAchievements = (): Achievement[] => {
    return getAchievements().map(a => ({
      ...a,
      progress: 0,
      unlockedAt: undefined,
    }));
  };

  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`${STORAGE_KEY}_challenges_${today}`);
    
    if (stored) {
      try { setDailyChallenges(JSON.parse(stored)); } catch { /* corrupted data */ }
      return;
    }

    const expiresAt = new Date(new Date().setHours(23, 59, 59)).toISOString();
    const challenges: DailyChallenge[] = [
      {
        id: 'daily_1',
        title: t.gamification.challenges.create3.title,
        description: t.gamification.challenges.create3.desc,
        xpReward: 100,
        completed: false,
        progress: 0,
        maxProgress: 3,
        expiresAt,
      },
      {
        id: 'daily_2',
        title: t.gamification.challenges.share2.title,
        description: t.gamification.challenges.share2.desc,
        xpReward: 75,
        completed: false,
        progress: 0,
        maxProgress: 2,
        expiresAt,
      },
      {
        id: 'daily_3',
        title: t.gamification.challenges.watch5Ads.title,
        description: t.gamification.challenges.watch5Ads.desc,
        xpReward: 50,
        completed: false,
        progress: 0,
        maxProgress: 5,
        expiresAt,
      },
    ];

    setDailyChallenges(challenges);
    localStorage.setItem(`${STORAGE_KEY}_challenges_${today}`, JSON.stringify(challenges));
  };

  const addXP = (amount: number, reason?: string) => {
    const newXP = userLevel.currentXP + amount;
    let newLevel = userLevel.level;
    let remainingXP = newXP;

    // Level up if needed
    while (remainingXP >= XP_PER_LEVEL * newLevel) {
      remainingXP -= XP_PER_LEVEL * newLevel;
      newLevel++;
    }

    const newUserLevel: UserLevel = {
      level: newLevel,
      currentXP: remainingXP,
      xpForNextLevel: XP_PER_LEVEL * newLevel,
      title: getLevelTitle(newLevel),
    };

    setUserLevel(newUserLevel);
    saveGamificationData({ ...loadStoredData(), userLevel: newUserLevel });

    // Show notification
    if (newLevel > userLevel.level) {
      showNotification(t.gamification.notifications.levelUp.replace('{level}', String(newLevel)), t.gamification.notifications.levelUpTitle.replace('{title}', newUserLevel.title));
    } else if (reason) {
      showNotification(`+${amount} XP`, reason);
    }
  };

  const unlockAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlockedAt) return;

    const updated = achievements.map(a =>
      a.id === achievementId
        ? { ...a, unlockedAt: new Date().toISOString(), progress: a.maxProgress }
        : a
    );

    setAchievements(updated);
    addXP(achievement.xpReward, t.gamification.notifications.achievementXP.replace('{name}', achievement.name));
    saveGamificationData({ ...loadStoredData(), achievements: updated });

    showNotification(t.gamification.notifications.achievementUnlocked, achievement.name);
  };

  const updateAchievementProgress = (achievementId: string, progress: number) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlockedAt) return;

    const updated = achievements.map(a =>
      a.id === achievementId ? { ...a, progress: Math.min(progress, a.maxProgress) } : a
    );

    setAchievements(updated);
    saveGamificationData({ ...loadStoredData(), achievements: updated });

    // Auto unlock if progress reached
    if (progress >= achievement.maxProgress) {
      unlockAchievement(achievementId);
    }
  };

  const updateChallengeProgress = (challengeId: string, progress: number) => {
    const updated = dailyChallenges.map(c => {
      if (c.id === challengeId && !c.completed) {
        const newProgress = Math.min(progress, c.maxProgress);
        const completed = newProgress >= c.maxProgress;
        
        if (completed && !c.completed) {
          addXP(c.xpReward, t.gamification.notifications.challengeComplete.replace('{title}', c.title));
        }

        return { ...c, progress: newProgress, completed };
      }
      return c;
    });

    setDailyChallenges(updated);
    const today = new Date().toDateString();
    localStorage.setItem(`${STORAGE_KEY}_challenges_${today}`, JSON.stringify(updated));
  };

  const getLevelTitle = (level: number): string => {
    if (level >= 50) return t.gamification.levels.aiLegend;
    if (level >= 40) return t.gamification.levels.recapMaster;
    if (level >= 30) return t.gamification.levels.aiExpert;
    if (level >= 20) return t.gamification.levels.advanced;
    if (level >= 10) return t.gamification.levels.veteran;
    if (level >= 5) return t.gamification.levels.experienced;
    return t.gamification.levels.beginner;
  };

  const showNotification = (title: string, message: string) => {
    // In production, use toast or notification system
    // TODO: use toast or notification system
  };

  const loadStoredData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    try { return JSON.parse(stored); } catch { return {}; }
  };

  const saveGamificationData = (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastActivity === today) {
      return; // Already counted today
    }

    const newStreak = lastActivity === yesterday ? streak + 1 : 1;
    setStreak(newStreak);
    setLastActivity(today);

    saveGamificationData({
      ...loadStoredData(),
      streak: newStreak,
      lastActivity: today,
    });

    // Check streak achievements
    if (newStreak >= 3) {
      updateAchievementProgress('daily_streak_3', newStreak);
    }
  };

  return {
    userLevel,
    achievements,
    dailyChallenges,
    streak,
    addXP,
    unlockAchievement,
    updateAchievementProgress,
    updateChallengeProgress,
    updateStreak,
  };
}
