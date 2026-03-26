import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';

interface InteractiveLineChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
  className?: string;
}

export default function InteractiveLineChart({
  data,
  title,
  color = '#D47C47',
  className = '',
}: InteractiveLineChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: title,
        data: data.map(d => d.value),
        borderColor: color,
        backgroundColor: `${color}33`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(26, 35, 50, 0.95)',
        titleColor: '#D47C47',
        bodyColor: '#E8D5C4',
        borderColor: '#D47C47',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(212, 124, 71, 0.1)',
        },
        ticks: {
          color: '#B39176',
        },
      },
      y: {
        grid: {
          color: 'rgba(212, 124, 71, 0.1)',
        },
        ticks: {
          color: '#B39176',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className={`interactive-line-chart ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-brass-400" />
        <h4 className="text-brass-200 font-semibold">{title}</h4>
      </div>
      <div className="h-64">
        {/* In production, use react-chartjs-2 with Chart.js */}
        {/* For now, simple SVG visualization */}
        <svg className="w-full h-full" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 50}
              x2="800"
              y2={i * 50}
              stroke="rgba(212, 124, 71, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Data line */}
          <polyline
            points={data
              .map((d, i) => {
                const x = (i / (data.length - 1)) * 800;
                const maxValue = Math.max(...data.map(d => d.value));
                const y = 200 - (d.value / maxValue) * 180;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="url(#lineGradient)"
            stroke={color}
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 800;
            const maxValue = Math.max(...data.map(d => d.value));
            const y = 200 - (d.value / maxValue) * 180;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
