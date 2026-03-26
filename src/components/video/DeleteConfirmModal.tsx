import React from 'react';
import { TriangleAlert as AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  taskNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  taskNames,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const isBatch = taskNames.length > 1;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="steampunk-card max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-brass-200">
              {isBatch ? `Delete ${taskNames.length} Tasks?` : 'Delete Task?'}
            </h3>
            <p className="text-sm text-brass-400 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-brass-300 mb-3">
            {isBatch
              ? 'The following tasks will be permanently deleted:'
              : 'This task will be permanently deleted:'}
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {taskNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-steam-900/50 rounded text-sm text-brass-300">
                <Trash2 className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-steam-800 hover:bg-steam-700 text-brass-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-900/60 hover:bg-red-900/80 text-red-200 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
