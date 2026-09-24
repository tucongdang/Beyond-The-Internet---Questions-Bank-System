import React, { useState } from 'react';
import { HardDrive, Loader2, Sparkles } from 'lucide-react';
import { googlePickerService } from '../../services/googlePickerService';
import { PickedDriveFile } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface GooglePickerTriggerButtonProps {
  onFilePicked: (file: PickedDriveFile) => void;
  viewId?: 'ALL' | 'SPREADSHEETS' | 'DOCS' | 'DOCS_IMAGES' | 'DOCS_VIDEOS' | 'PDFS' | 'FOLDERS';
  title?: string;
  mimeTypes?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'subtle';
  className?: string;
}

export const GooglePickerTriggerButton: React.FC<GooglePickerTriggerButtonProps> = ({
  onFilePicked,
  viewId = 'ALL',
  title = 'Chọn tệp từ Google Drive',
  mimeTypes,
  label = 'Chọn từ Google Drive',
  variant = 'secondary',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    vibrateTap();
    soundFx.playClick();
    setLoading(true);

    try {
      const files = await googlePickerService.openPicker({
        viewId,
        title,
        mimeTypes,
        multiselect: false
      });

      if (files && files.length > 0) {
        soundFx.playSuccess();
        vibrateSuccess();
        onFilePicked(files[0]);
      }
    } catch (err) {
      console.error('Picker error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-transparent shadow-md shadow-cyan-500/20';
      case 'subtle':
        return 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'secondary':
      default:
        return 'bg-white/10 hover:bg-white/15 text-white/90 border-white/20';
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 ${getVariantStyles()} ${className}`}
      title={title}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      )}
      <span>{loading ? 'Đang mở Drive...' : label}</span>
    </button>
  );
};
