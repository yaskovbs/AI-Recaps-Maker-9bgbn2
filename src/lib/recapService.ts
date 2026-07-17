export interface RecapDraft {
  inputMode: 'text' | 'txt' | 'mp3';
  scriptText?: string;
  txtAssetId?: string;
  mp3AssetId?: string;
  videoAssetId?: string;
  youtubeUrl?: string;
  
  // Advanced settings
  movieTitle?: string;
  description?: string;
  genre?: string;
  durationHours?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  cutEveryMinutes?: number;
  cutEverySeconds?: number;
  
  // Features
  webSearchEnabled?: boolean;
  youtubeLearningEnabled?: boolean;
  continuousLearningEnabled?: boolean;
  continuousLearningConsent?: boolean;
  globalLearningOptIn?: boolean;
  
  // API keys
  googleSearchApiKey?: string;
  searchEngineId?: string;
  youtubeApiKey?: string;
  youtubeChannelUrl?: string;
  
  // Workflow
  currentStep?: number;
  lastSaved?: string;
}

export interface RecapJob {
  id: string;
  userId: string;
  title: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  stages: RecapStage[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface RecapStage {
  stage: number;
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'fallback' | 'failed';
  message?: string;
  reason?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface RecapEvent {
  type: 'step_started' | 'step_completed' | 'step_fallback' | 'step_failed';
  stage: number;
  status: string;
  reason?: string;
  createdAt: string;
}

const DRAFT_KEY = 'recap_draft';
const JOBS_KEY = 'recap_jobs';
const LAST_JOB_KEY = 'last_job_id';
const EVENTS_KEY = 'recap_events';

export function saveDraft(draft: RecapDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    ...draft,
    lastSaved: new Date().toISOString(),
  }));
}

export function loadDraft(): RecapDraft | null {
  const saved = localStorage.getItem(DRAFT_KEY);
  if (!saved) return null;
  return JSON.parse(saved);
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function saveJob(job: RecapJob) {
  const jobs = getJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  if (index >= 0) {
    jobs[index] = job;
  } else {
    jobs.unshift(job);
  }
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  localStorage.setItem(LAST_JOB_KEY, job.id);
}

export function getJobs(userId?: string): RecapJob[] {
  const saved = localStorage.getItem(JOBS_KEY);
  if (!saved) return [];
  try {
    const jobs = JSON.parse(saved) as RecapJob[];
    return userId ? jobs.filter(job => job.userId === userId) : jobs;
  } catch {
    localStorage.removeItem(JOBS_KEY);
    return [];
  }
}

export function getJobById(id: string): RecapJob | null {
  const jobs = getJobs();
  return jobs.find(j => j.id === id) || null;
}

export function getLastJobId(): string | null {
  return localStorage.getItem(LAST_JOB_KEY);
}

export function addJobEvent(jobId: string, event: RecapEvent) {
  const eventsMap = getEventsMap();
  if (!eventsMap[jobId]) {
    eventsMap[jobId] = [];
  }
  eventsMap[jobId].push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(eventsMap));
}

function getEventsMap(): Record<string, RecapEvent[]> {
  const saved = localStorage.getItem(EVENTS_KEY);
  if (!saved) return {};
  return JSON.parse(saved);
}

export function getJobEvents(jobId: string): RecapEvent[] {
  const eventsMap = getEventsMap();
  return eventsMap[jobId] || [];
}

export interface CreateJobParams {
  userId: string;
  title: string;
  source: {
    inputMode: 'text' | 'txt' | 'mp3';
    scriptText?: string;
    txtAssetId?: string;
    mp3AssetId?: string;
    youtubeUrl?: string;
  };
  settings: {
    recapLengthSeconds: number;
    clipLengthSeconds: number;
    gapSeconds: number;
  };
  advanced: {
    movieTitle?: string;
    description?: string;
    genre?: string;
    webSearchEnabled?: boolean;
    youtubeLearningEnabled?: boolean;
    continuousLearningEnabled?: boolean;
    continuousLearningConsent?: boolean;
    learningProfileEnabled?: boolean;
    globalLearningOptIn?: boolean;
    globalLearningConsentedAt?: string;
  };
  pipeline: string[];
}

export function createJob(params: CreateJobParams): RecapJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: RecapJob = {
    id: jobId,
    userId: params.userId,
    title: params.title,
    status: 'processing',
    stages: [
      {
        stage: 1,
        name: 'Input Processing',
        status: 'completed',
        message: 'Input received and validated',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 1000).toISOString(),
      },
      {
        stage: 2,
        name: 'Audio Processing',
        status: 'processing',
        message: 'Extracting and analyzing audio...',
        startedAt: new Date(Date.now() + 1000).toISOString(),
      },
      {
        stage: 3,
        name: 'Video Analysis',
        status: 'idle',
        message: 'Waiting for audio processing',
      },
      {
        stage: 4,
        name: 'AI Alignment',
        status: 'idle',
        message: 'Waiting for video analysis',
      },
      {
        stage: 5,
        name: 'Final Render',
        status: 'idle',
        message: 'Waiting for alignment',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Add initial event
  addJobEvent(jobId, {
    type: 'step_started',
    stage: 1,
    status: 'processing',
    createdAt: job.createdAt,
  });
  
  addJobEvent(jobId, {
    type: 'step_completed',
    stage: 1,
    status: 'completed',
    createdAt: new Date(Date.now() + 1000).toISOString(),
  });
  
  addJobEvent(jobId, {
    type: 'step_started',
    stage: 2,
    status: 'processing',
    createdAt: new Date(Date.now() + 1000).toISOString(),
  });
  
  saveJob(job);
  
  // Simulate progression
  simulateJobProgression(jobId);
  
  return job;
}

export function createMockJob(draft: RecapDraft): RecapJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: RecapJob = {
    id: jobId,
    userId: 'demo-user',
    title: draft.movieTitle || 'Untitled Recap',
    status: 'processing',
    stages: [
      {
        stage: 1,
        name: 'Input Processing',
        status: 'completed',
        message: 'Input received and validated',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 1000).toISOString(),
      },
      {
        stage: 2,
        name: 'Audio Processing',
        status: 'processing',
        message: 'Extracting and analyzing audio...',
        startedAt: new Date(Date.now() + 1000).toISOString(),
      },
      {
        stage: 3,
        name: 'Video Analysis',
        status: 'idle',
        message: 'Waiting for audio processing',
      },
      {
        stage: 4,
        name: 'AI Alignment',
        status: 'idle',
        message: 'Waiting for video analysis',
      },
      {
        stage: 5,
        name: 'Final Render',
        status: 'idle',
        message: 'Waiting for alignment',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveJob(job);
  
  // Simulate progression
  simulateJobProgression(jobId);
  
  return job;
}

function simulateJobProgression(jobId: string) {
  let currentStage = 2;
  
  const interval = setInterval(() => {
    const job = getJobById(jobId);
    if (!job || currentStage > 5) {
      clearInterval(interval);
      return;
    }
    
    // Add event for stage completion
    addJobEvent(jobId, {
      type: 'step_completed',
      stage: currentStage - 1,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    
    // Complete current stage
    job.stages[currentStage - 1].status = 'completed';
    job.stages[currentStage - 1].endedAt = new Date().toISOString();
    job.stages[currentStage - 1].message = 'Stage completed successfully';
    
    // Start next stage
    if (currentStage < 5) {
      currentStage++;
      job.stages[currentStage - 1].status = 'processing';
      job.stages[currentStage - 1].startedAt = new Date().toISOString();
      job.stages[currentStage - 1].message = `Processing stage ${currentStage}...`;
      
      // Add event for stage start
      addJobEvent(jobId, {
        type: 'step_started',
        stage: currentStage,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });
    } else {
      // All done
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
    }
    
    job.updatedAt = new Date().toISOString();
    saveJob(job);
  }, 3000); // Complete each stage after 3 seconds
}
