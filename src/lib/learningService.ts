import { supabase } from './supabase';

export interface LearningPreferences {
  continuousLearning: boolean;
  globalLearning: boolean;
}

/**
 * Load user's learning preferences from database
 */
export async function loadPreferences(userId: string): Promise<LearningPreferences> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('learning')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading learning preferences:', error);
      return {
        continuousLearning: true,
        globalLearning: false,
      };
    }

    if (!data) {
      return {
        continuousLearning: true,
        globalLearning: false,
      };
    }

    const learning = data.learning as any;
    return {
      continuousLearning: learning?.continuousLearning ?? true,
      globalLearning: learning?.globalLearning ?? false,
    };
  } catch (error) {
    console.error('Exception loading learning preferences:', error);
    return {
      continuousLearning: true,
      globalLearning: false,
    };
  }
}

/**
 * Save user's learning preferences to database
 */
export async function savePreferences(
  userId: string,
  preferences: LearningPreferences
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        learning: preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving learning preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception saving learning preferences:', error);
    return false;
  }
}

/**
 * Reset user's learning profile to defaults
 */
export async function resetProfile(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        learning: {
          continuousLearning: true,
          globalLearning: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting learning profile:', error);
      return false;
    }

    const { error: profileError } = await supabase
      .from('learning_profiles')
      .update({
        continuous_learning: true,
        global_learning: false,
        preferences_data: {},
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) {
      console.warn('Error resetting learning_profiles:', profileError);
    }

    return true;
  } catch (error) {
    console.error('Exception resetting learning profile:', error);
    return false;
  }
}

export const learningService = {
  loadPreferences,
  savePreferences,
  resetProfile,
};
