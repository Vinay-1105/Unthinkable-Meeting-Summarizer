import React, { useState, useRef } from 'react';
import { UploadCloud, Music, FileAudio, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'm4a'];

export default function AudioUploader({ onUploadSuccess, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError(`Unsupported file format (.${extension}). Please upload an MP3, WAV, or M4A audio file.`);
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File is too large. Maximum supported size is 100MB.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload audio file');
      }

      onUploadSuccess(data);
    } catch (err) {
      setError(err.message || 'Upload failed. Please ensure the backend server is reachable.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          dragActive 
            ? 'border-coral-500 bg-coral-950/20 shadow-xl shadow-coral-500/10 scale-[1.01]' 
            : 'border-obsidian-700 bg-obsidian-900/60 hover:border-indigo-500/50 hover:bg-obsidian-850/80'
        }`}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".mp3,.wav,.m4a" 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
            selectedFile 
              ? 'bg-gradient-to-tr from-indigo-600/30 to-coral-500/30 text-coral-400 border border-coral-500/40 scale-105 shadow-lg shadow-coral-500/15' 
              : 'bg-obsidian-800 text-indigo-400 border border-obsidian-700'
          }`}>
            {selectedFile ? <FileAudio className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>

          <div className="max-w-md">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100">
              {selectedFile ? selectedFile.name : 'Drop your meeting audio recording here'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {selectedFile 
                ? `${formatFileSize(selectedFile.size)} • ${selectedFile.name.split('.').pop().toUpperCase()} Ready`
                : 'Click to select or drag a file to extract structured notes and action items'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {['MP3', 'WAV', 'M4A'].map((fmt) => (
              <span 
                key={fmt}
                className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-lg bg-obsidian-800 text-indigo-300 border border-obsidian-700"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
            <span className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-lg bg-obsidian-800/60 text-slate-400 border border-obsidian-700">
              Max 100MB
            </span>
          </div>
        </div>
      </div>

      {/* Audio playback preview */}
      {audioUrl && (
        <div className="mt-4 p-4 rounded-2xl bg-obsidian-900/90 border border-obsidian-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
              <Music className="w-4 h-4" />
            </div>
            <div className="truncate text-left min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-xs">
                {selectedFile?.name}
              </p>
              <p className="text-[11px] text-slate-400">Audio playback preview ready</p>
            </div>
          </div>
          <audio 
            controls 
            src={audioUrl} 
            className="w-full sm:w-64 h-8 text-xs accent-indigo-500" 
          />
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action button */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isProcessing}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
            !selectedFile || isUploading || isProcessing
              ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-obsidian-700'
              : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-coral-500 hover:from-indigo-500 hover:to-coral-400 text-white shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-[0.98]'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading recording...</span>
            </>
          ) : (
            <>
              <span>Proceed to Transcription</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
