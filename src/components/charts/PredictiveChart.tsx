import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

interface PredictiveChartProps {
  historicalData: { date: string; value: number }[];
  prediction: { date: string; value: number; confidence: number }[];
  title: string;
  className?: string;
}

export default function PredictiveChart({
  historicalData,
  prediction,
  title,
  className = '',
}: PredictiveChartProps) {
  const allData = [...historicalData, ...prediction];
  const maxValue = Math.max(...allData.map(d => d.value));
  const minValue = Math.min(...allData.map(d => d.value));
  const range = maxValue - minValue || 1;

  const getY = (value: number) => {
    return 200 - ((value - minValue) / range) * 180;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`predictive-chart ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-brass-400" />
        <h4 className="text-brass-200 font-semibold">{title}</h4>
        <span className="text-xs text-brass-500 mr-auto">תחזית AI</span>
      </div>

      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 800 220">
          <defs>
            <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D47C47" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D47C47" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="predictionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4B7DB0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4B7DB0" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 50 + 10}
              x2="800"
              y2={i * 50 + 10}
              stroke="rgba(212, 124, 71, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Historical data line */}
          <polyline
            points={historicalData
              .map((d, i) => {
                const x = (i / (allData.length - 1)) * 800;
                const y = getY(d.value);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="url(#historicalGradient)"
            stroke="#D47C47"
            strokeWidth="3"
          />

          {/* Prediction line */}
          {prediction.length > 0 && (
            <>
              <polyline
                points={[
                  historicalData[historicalData.length - 1],
                  ...prediction,
                ]
                  .map((d, i) => {
                    const totalIndex = historicalData.length - 1 + i;
                    const x = (totalIndex / (allData.length - 1)) * 800;
                    const y = getY(d.value);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="url(#predictionGradient)"
                stroke="#4B7DB0"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* Confidence bands */}
              {prediction.map((d, i) => {
                const totalIndex = historicalData.length + i;
                const x = (totalIndex / (allData.length - 1)) * 800;
                const y = getY(d.value);
                const confidenceRange = (1 - d.confidence) * 30;
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="8"
                    ry={confidenceRange}
                    fill="rgba(75, 125, 176, 0.1)"
                    stroke="rgba(75, 125, 176, 0.3)"
                    strokeWidth="1"
                  />
                );
              })}
            </>
          )}

          {/* Data points */}
          {historicalData.map((d, i) => {
            const x = (i / (allData.length - 1)) * 800;
            const y = getY(d.value);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="#D47C47"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}

          {/* Prediction points */}
          {prediction.map((d, i) => {
            const totalIndex = historicalData.length + i;
            const x = (totalIndex / (allData.length - 1)) * 800;
            const y = getY(d.value);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#4B7DB0"
                stroke="#fff"
                strokeWidth="1.5"
                opacity={d.confidence}
              />
            );
          })}

          {/* Divider line between historical and prediction */}
          {historicalData.length > 0 && prediction.length > 0 && (
            <line
              x1={(historicalData.length / (allData.length - 1)) * 800}
              y1="0"
              x2={(historicalData.length / (allData.length - 1)) * 800}
              y2="200"
              stroke="rgba(212, 124, 71, 0.3)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}
        </svg>

        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-brass-500 px-2">
          <span>{formatDate(allData[0].date)}</span>
          <span className="text-steam-400">תחזית AI →</span>
          <span>{formatDate(allData[allData.length - 1].date)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-brass-500"></div>
          <span className="text-brass-400">היסטוריה</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-steam-500" style={{ borderTop: '2px dashed' }}></div>
          <span className="text-steam-400">תחזית</span>
        </div>
      </div>

      {/* AI Insight */}
      {prediction.length > 0 && (
        <div className="mt-4 p-3 bg-steam-900/30 border border-brass-700/20 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-brass-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brass-300">
              <span className="font-semibold">תובנת AI:</span> על בסיס הנתונים ההיסטוריים, צפוי גידול של{' '}
              <span className="text-brass-200 font-semibold">
                {(
                  ((prediction[prediction.length - 1].value - historicalData[historicalData.length - 1].value) /
                    historicalData[historicalData.length - 1].value) *
                  100
                ).toFixed(1)}
                %
              </span>{' '}
              בשבוע הקרוב (רמת ביטחון:{' '}
              {(prediction[prediction.length - 1].confidence * 100).toFixed(0)}%)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
