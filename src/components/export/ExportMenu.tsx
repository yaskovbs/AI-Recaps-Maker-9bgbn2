import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileDown, FileText, Video, Presentation, Settings } from 'lucide-react';
import { exportRecap, downloadBlob, ExportOptions } from '@/lib/exportService';

interface ExportMenuProps {
  jobId: string;
  title: string;
  content: string;
  onClose: () => void;
  className?: string;
}

export default function ExportMenu({ jobId, title, content, onClose, className = '' }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'mp4' | 'slides' | null>(null);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [customBranding, setCustomBranding] = useState(false);

  const handleExport = async (format: 'pdf' | 'mp4' | 'slides') => {
    setSelectedFormat(format);
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        quality,
        branding: customBranding
          ? {
              footer: 'Created with AI Recaps Maker',
              colors: {
                primary: '#D47C47',
                secondary: '#4B7DB0',
              },
            }
          : undefined,
      };

      const blob = await exportRecap(jobId, title, content, options);
      
      const extension = format === 'slides' ? 'pptx' : format;
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      
      downloadBlob(blob, filename);
      
      setTimeout(() => {
        setIsExporting(false);
        setSelectedFormat(null);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('ייצוא נכשל. נסה שוב.');
      setIsExporting(false);
      setSelectedFormat(null);
    }
  };

  return (
    <div className={`export-menu steampunk-card p-6 ${className}`}>
      <h3 className="text-xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
        <FileDown className="w-5 h-5" />
        ייצוא סיכום
      </h3>

      {/* Format Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className={`steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedFormat === 'pdf' ? 'ring-2 ring-brass-500' : ''
          }`}
        >
          <FileText className="w-8 h-8 text-brass-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-brass-200 mb-1">PDF מעוצב</div>
          <div className="text-xs text-brass-400">מסמך מעוצב עם מיתוג</div>
          {isExporting && selectedFormat === 'pdf' && (
            <div className="mt-2">
              <div className="w-full h-1 bg-steam-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-brass-600 to-copper-600 animate-pulse"></div>
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => handleExport('mp4')}
          disabled={isExporting}
          className={`steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedFormat === 'mp4' ? 'ring-2 ring-brass-500' : ''
          }`}
        >
          <Video className="w-8 h-8 text-brass-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-brass-200 mb-1">וידאו MP4</div>
          <div className="text-xs text-brass-400">סרטון מוכן לפרסום</div>
          {isExporting && selectedFormat === 'mp4' && (
            <div className="mt-2">
              <div className="w-full h-1 bg-steam-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-brass-600 to-copper-600 animate-pulse"></div>
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => handleExport('slides')}
          disabled={isExporting}
          className={`steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedFormat === 'slides' ? 'ring-2 ring-brass-500' : ''
          }`}
        >
          <Presentation className="w-8 h-8 text-brass-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-brass-200 mb-1">מצגת PowerPoint</div>
          <div className="text-xs text-brass-400">שקופיות מעוצבות</div>
          {isExporting && selectedFormat === 'slides' && (
            <div className="mt-2">
              <div className="w-full h-1 bg-steam-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-brass-600 to-copper-600 animate-pulse"></div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Options */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brass-300 mb-2">איכות</label>
          <select
            value={quality}
            onChange={e => setQuality(e.target.value as any)}
            className="steampunk-input w-full"
            disabled={isExporting}
          >
            <option value="low">נמוכה (מהירה)</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה (מומלץ)</option>
            <option value="ultra">Ultra HD (איטית)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="custom-branding"
            checked={customBranding}
            onChange={e => setCustomBranding(e.target.checked)}
            className="w-4 h-4"
            disabled={isExporting}
          />
          <label htmlFor="custom-branding" className="text-sm text-brass-300 cursor-pointer">
            הוסף מיתוג מותאם אישית
          </label>
        </div>
      </div>

      {isExporting && (
        <div className="text-center text-sm text-brass-300">
          <div className="animate-pulse mb-2">מייצא...</div>
          <p className="text-xs text-brass-500">זה עשוי לקחת כמה שניות</p>
        </div>
      )}
    </div>
  );
}
