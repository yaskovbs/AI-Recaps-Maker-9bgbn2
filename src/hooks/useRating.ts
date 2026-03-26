import { useState, useEffect } from 'react';

interface Rating {
  score: number;
  comment?: string;
  timestamp: string;
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratings: Rating[];
}

const STORAGE_KEY = 'airm_ratings';
const RATING_ASKED_KEY = 'airm_rating_asked';

export function useRating() {
  const [stats, setStats] = useState<RatingStats>({
    totalRatings: 0,
    averageRating: 0,
    ratings: [],
  });
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    loadRatings();
    checkIfAsked();
  }, []);

  const loadRatings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ratings: Rating[] = JSON.parse(stored);
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
          ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
          : 0;
        
        setStats({
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          ratings,
        });
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    }
  };

  const checkIfAsked = () => {
    const asked = localStorage.getItem(RATING_ASKED_KEY) === 'true';
    setHasAsked(asked);
  };

  const submitRating = (score: number, comment?: string) => {
    const newRating: Rating = {
      score,
      comment,
      timestamp: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const ratings: Rating[] = stored ? JSON.parse(stored) : [];
      ratings.push(newRating);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
      localStorage.setItem(RATING_ASKED_KEY, 'true');
      
      loadRatings();
      setHasAsked(true);
    } catch (err) {
      console.error('Failed to save rating:', err);
    }
  };

  const markAsAsked = () => {
    localStorage.setItem(RATING_ASKED_KEY, 'true');
    setHasAsked(true);
  };

  const shouldShowPrompt = (): boolean => {
    // Show rating prompt if:
    // 1. User hasn't been asked before
    // 2. User has created at least 1 recap
    const jobs = localStorage.getItem('airm_jobs');
    const hasJobs = jobs ? JSON.parse(jobs).length > 0 : false;
    return !hasAsked && hasJobs;
  };

  return {
    stats,
    submitRating,
    markAsAsked,
    shouldShowPrompt,
    hasAsked,
  };
}
