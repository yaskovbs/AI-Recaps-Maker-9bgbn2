export type TaskStatus = 'pending' | 'downloading' | 'processing' | 'summarizing' | 'converting_3d' | 'completed' | 'error' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSourceType = 'youtube' | 'upload' | 'playlist';
export type LogLevel = 'info' | 'warning' | 'error';

export interface VideoTask {
  id: string;
  user_id: string;
  source_url: string | null;
  source_type: TaskSourceType;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percentage: number;
  current_step: string | null;
  error_code: string | null;
  error_message: string | null;
  error_details: string | null;
  error_action: string | null;
  original_file_url: string | null;
  processed_file_url: string | null;
  output_storage_path: string | null;
  narration_storage_path: string | null;
  file_size_mb: number;
  duration_seconds: number;
  enable_3d_conversion: boolean;
  processing_logs: ProcessingLogEntry[];
  summary_text: string | null;
  summary_language: string | null;
  key_topics: string[];
  transcript_text: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
  cancel_requested_at: string | null;
  source_metadata: Record<string, unknown>;
  clip_plan: Array<{ start: number; end: number; reason: string }>;
}

export interface PlaylistItem {
  id: string;
  task_id: string;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  position: number;
  selected: boolean;
  created_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProcessingLogEntry {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  duration_ms?: number;
}

export interface CreateTaskParams {
  source_url?: string;
  source_type: TaskSourceType;
  title: string;
  description?: string;
  priority?: TaskPriority;
  enable_3d_conversion?: boolean;
}

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  search?: string;
  sortBy?: 'created_at' | 'title' | 'expires_at' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'ממתין',
  downloading: 'מוריד',
  processing: 'מעבד',
  summarizing: 'מסכם',
  converting_3d: 'ממיר לתלת-מימד',
  completed: 'הושלם',
  error: 'שגיאה',
  cancelled: 'בוטל',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
};

export const PROCESSING_STATUSES: TaskStatus[] = ['pending', 'downloading', 'processing', 'summarizing', 'converting_3d'];

export const ERROR_CODES: Record<string, { message: string; details: string; action: string }> = {
  ERR_DOWNLOAD_FAILED: {
    message: 'הורדת הוידאו נכשלה',
    details: 'לא ניתן היה להוריד את הוידאו מהמקור. ייתכן שהקישור אינו תקין או שהוידאו הוסר.',
    action: 'בדוק שהקישור תקין ונסה שוב. אם הבעיה נמשכת, נסה להעלות את הוידאו ידנית.',
  },
  ERR_PROCESSING_TIMEOUT: {
    message: 'זמן העיבוד חרג',
    details: 'העיבוד לקח יותר מדי זמן והופסק אוטומטית.',
    action: 'נסה עם וידאו קצר יותר או שנה את הגדרות העיבוד.',
  },
  ERR_INVALID_FORMAT: {
    message: 'פורמט קובץ לא נתמך',
    details: 'הקובץ שהועלה אינו בפורמט וידאו נתמך.',
    action: 'העלה קובץ בפורמט MP4, AVI, MOV או MKV.',
  },
  ERR_3D_CONVERSION: {
    message: 'המרת תלת-מימד נכשלה',
    details: 'לא ניתן היה להמיר את הוידאו לפורמט תלת-מימדי.',
    action: 'נסה לכבות את אפשרות התלת-מימד ולעבד מחדש.',
  },
  ERR_STORAGE_FULL: {
    message: 'האחסון מלא',
    details: 'הגעת למגבלת האחסון המרבית.',
    action: 'מחק קבצים ישנים כדי לפנות מקום ונסה שוב.',
  },
  ERR_API_QUOTA: {
    message: 'מכסת API חרגה',
    details: 'מכסת ה-API היומית שלך הגיעה למקסימום.',
    action: 'המתן עד מחר או שדרג את מפתח ה-API שלך.',
  },
  ERR_NETWORK: {
    message: 'שגיאת רשת',
    details: 'התרחשה שגיאת רשת במהלך העיבוד.',
    action: 'בדוק את חיבור האינטרנט ונסה שוב.',
  },
  ERR_UNKNOWN: {
    message: 'שגיאה לא ידועה',
    details: 'התרחשה שגיאה לא צפויה.',
    action: 'נסה שוב. אם הבעיה נמשכת, פנה לתמיכה.',
  },
};
