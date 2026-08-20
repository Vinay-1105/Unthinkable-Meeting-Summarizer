import React, { useState } from 'react';
import { Copy, Check, FileText, Download, Sparkles, Loader2, Search, Volume2 } from 'lucide-react';

export default function TranscriptViewer({
  transcript,
  segments = [],
  filename,
  onSummarize,
  isSummarizing
}) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('full');

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'meeting'}_transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = transcript ? transcript.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSegments = segments.filter(seg =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-100">Meeting Transcript</h3>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
            <span>{wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>~{estimatedReadTime} min read</span>
            {filename && (
              <>
                <span>•</span>
                <span className="truncate max-w-[150px] text-slate-300">{filename}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {segments && segments.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-0.5 border border-slate-800 flex text-xs">
              <button
                onClick={() => setActiveTab('full')}
                className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === 'full'
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Text
              </button>
              <button
                onClick={() => setActiveTab('segments')}
                className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === 'segments'
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Timestamps
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Copy transcript"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Download TXT"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar (if segments tab active or long transcript) */}
      {activeTab === 'segments' && (
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      )}

      {/* Transcript Body */}
      <div className="mt-4 flex-1 overflow-y-auto max-h-[420px] pr-2 text-sm text-slate-300 leading-relaxed font-normal">
        {activeTab === 'full' ? (
          <p className="whitespace-pre-wrap selection:bg-emerald-500/20">{transcript}</p>
        ) : (
          <div className="space-y-2">
            {filteredSegments.map((seg, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 transition-colors flex items-start space-x-3 text-xs"
              >
                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                  {formatTimestamp(seg.start)}
                </span>
                <span className="text-slate-200 flex-1">{seg.text}</span>
              </div>
            ))}
            {filteredSegments.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No matching segments found.</p>
            )}
          </div>
        )}
      </div>

      {/* Summarize Trigger Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-400 hidden sm:block">
          Powered by <span className="text-amber-400 font-medium">Groq GPT-OSS 120B</span>
        </div>
        <button
          onClick={onSummarize}
          disabled={isSummarizing || !transcript}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${isSummarizing || !transcript
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/20'
            }`}
        >
          {isSummarizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating AI Summary...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
