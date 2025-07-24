import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, FileAudio, Image as ImageIcon } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Generate image preview
  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  // Handle audio file
  React.useEffect(() => {
    if (file.type.startsWith('audio/') && audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [file]);

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Image preview
  if (file.type.startsWith('image/')) {
    return (
      <div className={`relative group ${className}`}>
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-lg border border-gray-200">
            <img
              src={imagePreview}
              alt={file.name}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          {file.name} • {formatFileSize(file.size)}
        </div>
      </div>
    );
  }

  // Audio preview
  if (file.type.startsWith('audio/')) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <audio ref={audioRef} src={URL.createObjectURL(file)} />
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAudioPlayback}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileAudio className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Volume2 className="w-3 h-3" />
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span>•</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-100"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default file preview (for documents)
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-lg">
            {file.type.includes('pdf') ? '📄' :
             file.type.includes('word') || file.type.includes('document') ? '📝' :
             file.type.includes('excel') || file.type.includes('spreadsheet') ? '📊' :
             file.type.includes('csv') ? '📋' :
             file.type.includes('text') ? '📄' : '📁'}
          </span>
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </div>
          <div className="text-xs text-gray-500">
            {formatFileSize(file.size)} • {file.type}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview; 