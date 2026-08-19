import React, { useState, useRef } from 'react';
import { UploadCloud, Music, FileAudio, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

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
      setError(`Unsupported file format (.${extension}). Please upload .mp3, .wav, or .m4a files.`);
      return false;
    }
    // 100MB limit check
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
      setError(err.message || 'Upload failed. Ensure the Flask backend is running on port 5000.');
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
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          dragActive 
            ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10' 
            : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
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
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 scale-105' 
              : 'bg-slate-800/80 text-slate-400 border border-slate-700'
          }`}>
            {selectedFile ? <FileAudio className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Upload meeting recording'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {selectedFile 
                ? `${formatFileSize(selectedFile.size)} • ${selectedFile.name.split('.').pop().toUpperCase()} Audio`
                : 'Drag & drop an audio file here, or click to browse'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['MP3', 'WAV', 'M4A'].map((fmt) => (
              <span 
                key={fmt}
                className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-md bg-slate-800 text-slate-400 border border-slate-700"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
            <span className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-md bg-slate-800/50 text-slate-500 border border-slate-800">
              Up to 100MB
            </span>
          </div>
        </div>
      </div>

      {/* Audio playback preview */}
      {audioUrl && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Music className="w-4 h-4" />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-medium text-slate-200 truncate max-w-xs sm:max-w-sm">
                {selectedFile?.name}
              </p>
              <p className="text-[11px] text-slate-500">Preview ready</p>
            </div>
          </div>
          <audio 
            controls 
            src={audioUrl} 
            className="w-full sm:w-64 h-8 text-xs accent-emerald-500" 
          />
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start space-x-2.5">
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
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-emerald-600/30'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading audio...</span>
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
