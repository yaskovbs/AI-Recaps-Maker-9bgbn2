import { useState, useEffect } from 'react';

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

const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  { id: 'first_recap', name: 'מתחיל', description: 'צור את הסיכום הראשון שלך', icon: '🌟', xpReward: 50, maxProgress: 1 },
  { id: 'ten_recaps', name: 'יוצר', description: 'צור 10 סיכומים', icon: '⭐', xpReward: 100, maxProgress: 10 },
  { id: 'first_share', name: 'משתף', description: 'שתף סיכום ראשון', icon: '📤', xpReward: 30, maxProgress: 1 },
  { id: 'daily_streak_3', name: 'מחויב', description: '3 ימים רצופים', icon: '🔥', xpReward: 75, maxProgress: 3 },
  { id: 'high_rated', name: 'מצטיין', description: 'קבל דירוג 5 כוכבים', icon: '⭐⭐⭐⭐⭐', xpReward: 120, maxProgress: 1 },
  { id: 'fifty_recaps', name: 'מומחה', description: 'צור 50 סיכומים', icon: '🏆', xpReward: 250, maxProgress: 50 },
  { id: 'hundred_recaps', name: 'אגדה', description: 'צור 100 סיכומים', icon: '👑', xpReward: 500, maxProgress: 100 },
  { id: 'ai_master', name: 'שולט ב-AI', description: 'השתמש בכל תכונות AI', icon: '🤖', xpReward: 200, maxProgress: 5 },
  { id: 'social_butterfly', name: 'חברתי', description: 'קבל 50 לייקים', icon: '💖', xpReward: 150, maxProgress: 50 },
  { id: 'trend_setter', name: 'קובע טרנדים', description: 'היה ב-Trending 3 פעמים', icon: '🔥', xpReward: 300, maxProgress: 3 },
];

export function useGamification() {
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    xpForNextLevel: XP_PER_LEVEL,
    title: 'מתחיל',
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
      const data = JSON.parse(stored);
      setUserLevel(data.userLevel || userLevel);
      setAchievements(data.achievements || initializeAchievements());
      setStreak(data.streak || 0);
      setLastActivity(data.lastActivity || null);
    } else {
      setAchievements(initializeAchievements());
    }
  };

  const initializeAchievements = (): Achievement[] => {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      progress: 0,
      unlockedAt: undefined,
    }));
  };

  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`${STORAGE_KEY}_challenges_${today}`);
    
    if (stored) {
      setDailyChallenges(JSON.parse(stored));
      return;
    }

    const challenges: DailyChallenge[] = [
      {
        id: 'daily_1',
        title: 'צור 3 סיכומים היום',
        description: 'השלם 3 סיכומים חדשים',
        xpReward: 100,
        completed: false,
        progress: 0,
        maxProgress: 3,
        expiresAt: new Date(new Date().setHours(23, 59, 59)).toISOString(),
      },
      {
        id: 'daily_2',
        title: 'שתף 2 סיכומים',
        description: 'שתף סיכומים ברשתות חברתיות',
        xpReward: 75,
        completed: false,
        progress: 0,
        maxProgress: 2,
        expiresAt: new Date(new Date().setHours(23, 59, 59)).toISOString(),
      },
      {
        id: 'daily_3',
        title: 'צפה ב-5 מודעות',
        description: 'צבור קרדיטים מצפייה במודעות',
        xpReward: 50,
        completed: false,
        progress: 0,
        maxProgress: 5,
        expiresAt: new Date(new Date().setHours(23, 59, 59)).toISOString(),
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
      showNotification(`🎉 עלית לרמה ${newLevel}!`, `הרווחת את התואר: ${newUserLevel.title}`);
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
    addXP(achievement.xpReward, `פתחת הישג: ${achievement.name}`);
    saveGamificationData({ ...loadStoredData(), achievements: updated });

    showNotification(`🏆 הישג חדש!`, achievement.name);
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
          addXP(c.xpReward, `השלמת אתגר: ${c.title}`);
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
    if (level >= 50) return 'אגדת AI';
    if (level >= 40) return 'מאסטר סיכומים';
    if (level >= 30) return 'מומחה AI';
    if (level >= 20) return 'יוצר מתקדם';
    if (level >= 10) return 'יוצר ותיק';
    if (level >= 5) return 'יוצר מנוסה';
    return 'מתחיל';
  };

  const showNotification = (title: string, message: string) => {
    // In production, use toast or notification system
    // TODO: use toast or notification system
  };

  const loadStoredData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
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
