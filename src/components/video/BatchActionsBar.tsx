import React from 'react';
import { Trash2, Download, Circle as XCircle, SquareCheck as CheckSquare, Square } from 'lucide-react';

interface BatchActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onCancelSelected: () => void;
  hasProcessingSelected: boolean;
}

export default function BatchActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onCancelSelected,
  hasProcessingSelected,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="sticky top-16 z-40 mb-4">
      <div className="bg-steam-900/95 backdrop-blur-lg border border-brass-600/30 rounded-lg px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="p-1.5 rounded hover:bg-brass-700/20 text-brass-300 transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <span className="text-sm text-brass-200 font-medium">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasProcessingSelected && (
            <button
              onClick={onCancelSelected}
              className="px-3 py-1.5 text-sm bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 rounded-lg transition-colors flex items-center gap-1.5 border border-yellow-700/30"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}
          <button
            onClick={onDeleteSelected}
            className="px-3 py-1.5 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg transition-colors flex items-center gap-1.5 border border-red-700/30"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete ({selectedCount})</span>
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-sm bg-steam-800 hover:bg-steam-700 text-brass-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
