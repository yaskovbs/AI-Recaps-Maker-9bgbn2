import React, { useState, useEffect } from 'react';
import { Clock, TriangleAlert as AlertTriangle, OctagonAlert as AlertOctagon } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  isExpired: boolean;
}

function calculateTimeLeft(expiresAt: string): TimeLeft {
  const diff = new Date(expiresAt).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, isExpired: true };
  }

  const totalHours = diff / (1000 * 60 * 60);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalHours, isExpired: false };
}

type Severity = 'safe' | 'warning' | 'critical' | 'expired';

function getSeverity(time: TimeLeft): Severity {
  if (time.isExpired) return 'expired';
  if (time.totalHours <= 24) return 'critical';
  if (time.days <= 7) return 'warning';
  return 'safe';
}

const severityConfig: Record<Severity, { bg: string; text: string; border: string; icon: typeof Clock; pulse: boolean }> = {
  safe: {
    bg: 'bg-green-900/20',
    text: 'text-green-400',
    border: 'border-green-700/30',
    icon: Clock,
    pulse: false,
  },
  warning: {
    bg: 'bg-yellow-900/20',
    text: 'text-yellow-400',
    border: 'border-yellow-700/30',
    icon: AlertTriangle,
    pulse: false,
  },
  critical: {
    bg: 'bg-red-900/30',
    text: 'text-red-400',
    border: 'border-red-600/50',
    icon: AlertOctagon,
    pulse: true,
  },
  expired: {
    bg: 'bg-red-900/40',
    text: 'text-red-300',
    border: 'border-red-500/60',
    icon: AlertOctagon,
    pulse: true,
  },
};

export default function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const severity = getSeverity(timeLeft);
  const config = severityConfig[severity];
  const Icon = config.icon;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono ${config.bg} ${config.text} border ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-3 h-3" />
        {timeLeft.isExpired ? (
          <span>Expired</span>
        ) : (
          <span>{timeLeft.days}d {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
      <Icon className={`w-5 h-5 ${config.text} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        {timeLeft.isExpired ? (
          <p className={`text-sm font-semibold ${config.text}`}>
            File expired and will be deleted
          </p>
        ) : (
          <>
            <p className={`text-sm font-semibold ${config.text}`}>
              {timeLeft.days > 0 && `${timeLeft.days} days `}
              {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
            </p>
            <p className="text-xs text-brass-500 mt-0.5">
              {severity === 'critical' && 'File will be deleted within 24 hours!'}
              {severity === 'warning' && 'File expires within a week'}
              {severity === 'safe' && `Expires ${new Date(expiresAt).toLocaleDateString('he-IL')}`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
