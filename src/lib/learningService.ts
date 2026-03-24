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
      .select('continuous_learning, global_learning')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading learning preferences:', error);
      // Return defaults if error
      return {
        continuousLearning: true,
        globalLearning: false,
      };
    }

    return {
      continuousLearning: data?.continuous_learning ?? true,
      globalLearning: data?.global_learning ?? false,
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
    // First check if record exists
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await supabase
        .from('user_preferences')
        .update({
          continuous_learning: preferences.continuousLearning,
          global_learning: preferences.globalLearning,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Insert new record
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          continuous_learning: preferences.continuousLearning,
          global_learning: preferences.globalLearning,
        });
    }

    if (result.error) {
      console.error('Error saving learning preferences:', result.error);
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
        continuous_learning: true,
        global_learning: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting learning profile:', error);
      return false;
    }

    // Also reset any YouTube channel learning insights
    const { error: channelError } = await supabase
      .from('youtube_channels')
      .update({
        learning_insights: {
          genres: [],
          topics: [],
          music_style: '',
          color_palette: [],
          editing_style: '',
          videos_analyzed: 0,
          last_learning_at: null,
          avg_duration_seconds: 0,
        },
      })
      .eq('user_id', userId);

    if (channelError) {
      console.warn('Error resetting YouTube learning insights:', channelError);
      // Don't fail the whole operation if this fails
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
