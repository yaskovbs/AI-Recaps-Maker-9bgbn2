import React, { useState, useMemo } from 'react';
import { Check, X, Search, ImageOff } from 'lucide-react';

interface PlaylistItem {
  videoId: string;
  title: string;
  thumbnail: string;
  position: number;
  duration?: number;
}

interface PlaylistSelectorProps {
  items: PlaylistItem[];
  selectedIds: Set<string>;
  onToggle: (videoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function PlaylistSelector({
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: PlaylistSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => item.title.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brass-300">
          {selectedIds.size} / {items.length} selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs px-3 py-1 bg-brass-700/30 hover:bg-brass-700/50 text-brass-300 rounded transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs px-3 py-1 bg-steam-800 hover:bg-steam-700 text-brass-400 rounded transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {items.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="steampunk-input w-full pl-10 pr-8 py-2"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brass-500 hover:text-brass-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {filtered.map(item => {
          const isSelected = selectedIds.has(item.videoId);
          return (
            <button
              key={item.videoId}
              type="button"
              onClick={() => onToggle(item.videoId)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-brass-800/40 border border-brass-500/40'
                  : 'bg-steam-900/30 border border-transparent hover:border-brass-700/30'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'bg-brass-500 border-brass-500' : 'border-brass-600/50'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-16 h-9 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-9 bg-steam-800 rounded flex items-center justify-center flex-shrink-0">
                  <ImageOff className="w-4 h-4 text-brass-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-brass-200 truncate">{item.title}</p>
                <p className="text-xs text-brass-500">#{item.position + 1}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
