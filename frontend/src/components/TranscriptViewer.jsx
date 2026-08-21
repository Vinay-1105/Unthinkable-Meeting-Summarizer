import React, { useState } from 'react';
import { Copy, Check, FileText, Download, Sparkles, Loader2, Search } from 'lucide-react';

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
    <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-obsidian-700 flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-700">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">Full Audio Transcript</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 mt-1">
            <span>{wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>~{estimatedReadTime} min read</span>
            {filename && (
              <>
                <span>•</span>
                <span className="truncate max-w-[180px] text-slate-300">{filename}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {segments && segments.length > 0 && (
            <div className="bg-obsidian-900 rounded-xl p-0.5 border border-obsidian-700 flex text-xs">
              <button
                onClick={() => setActiveTab('full')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'full'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Text
              </button>
              <button
                onClick={() => setActiveTab('segments')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'segments'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Timestamps
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-300 hover:text-white transition-colors"
            title="Copy transcript"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-300 hover:text-white transition-colors"
            title="Download TXT"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar (if segments tab active) */}
      {activeTab === 'segments' && (
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript segments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-900 border border-obsidian-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      )}

      {/* Transcript Body */}
      <div className="mt-4 flex-1 overflow-y-auto max-h-[420px] pr-2 text-sm text-slate-300 leading-relaxed font-normal">
        {activeTab === 'full' ? (
          <p className="whitespace-pre-wrap selection:bg-indigo-500/25">{transcript}</p>
        ) : (
          <div className="space-y-2">
            {filteredSegments.map((seg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-obsidian-900/70 border border-obsidian-700/80 hover:border-obsidian-600 transition-colors flex items-start space-x-3 text-xs"
              >
                <span className="font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/25 flex-shrink-0 font-medium">
                  {formatTimestamp(seg.start)}
                </span>
                <span className="text-slate-200 flex-1 leading-relaxed">{seg.text}</span>
              </div>
            ))}
            {filteredSegments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No matching transcript segments found.</p>
            )}
          </div>
        )}
      </div>

      {/* Summarize Trigger Footer */}
      <div className="mt-6 pt-4 border-t border-obsidian-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Powered by <span className="text-amber-400 font-medium">Groq GPT-OSS 120B</span>
        </div>
        <button
          onClick={onSummarize}
          disabled={isSummarizing || !transcript}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isSummarizing || !transcript
              ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-obsidian-700'
              : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-coral-500 hover:from-indigo-500 hover:to-coral-400 text-white shadow-indigo-500/20 active:scale-[0.98]'
          }`}
        >
          {isSummarizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Key Decisions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-coral-300" />
              <span>Generate AI Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
