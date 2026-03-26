import React from 'react';
import { Activity } from 'lucide-react';

interface HeatMapProps {
  data: { day: string; hour: number; value: number }[];
  className?: string;
}

export default function HeatMap({ data, className = '' }: HeatMapProps) {
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create 2D grid
  const grid: number[][] = days.map(() => hours.map(() => 0));

  // Fill grid with data
  data.forEach(({ day, hour, value }) => {
    const dayIndex = days.indexOf(day);
    if (dayIndex !== -1 && hour >= 0 && hour < 24) {
      grid[dayIndex][hour] = value;
    }
  });

  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getColor = (value: number): string => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'rgba(26, 35, 50, 0.3)';
    if (intensity < 0.2) return 'rgba(212, 124, 71, 0.2)';
    if (intensity < 0.4) return 'rgba(212, 124, 71, 0.4)';
    if (intensity < 0.6) return 'rgba(212, 124, 71, 0.6)';
    if (intensity < 0.8) return 'rgba(212, 124, 71, 0.8)';
    return 'rgba(212, 124, 71, 1)';
  };

  return (
    <div className={`heat-map ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-brass-400" />
        <h4 className="text-brass-200 font-semibold">מפת חום - פעילות משתמשים</h4>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-8"></div>
            {hours.map(hour => (
              <div
                key={hour}
                className="w-6 text-xs text-brass-500 text-center"
                title={`${hour}:00`}
              >
                {hour % 4 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-8 text-sm text-brass-300 font-medium">{day}</div>
              {hours.map(hour => (
                <div
                  key={hour}
                  className="w-6 h-6 mx-0.5 rounded transition-all hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: getColor(grid[dayIndex][hour]) }}
                  title={`${day} ${hour}:00 - ${grid[dayIndex][hour]} פעילויות`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs text-brass-500">פחות</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getColor(intensity * maxValue) }}
          />
        ))}
        <span className="text-xs text-brass-500">יותר</span>
      </div>
    </div>
  );
}
