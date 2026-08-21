import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ListChecks, 
  Check, 
  Copy, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  FileText 
} from 'lucide-react';

const actionItemMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-emerald-400 font-medium not-italic">{children}</em>,
  code: ({ children }) => (
    <code className="font-mono text-xs bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700">
      {children}
    </code>
  )
};

/**
 * Trims and sanitizes an action item line:
 * - Strips checkbox markdown, leading bullets, and empty bullet markers
 * - Eliminates stray placeholder hyphens ('--' or '---') and isolated asterisks
 * - Returns empty string if the line is purely whitespace/symbols
 */
const cleanActionItemText = (rawLine) => {
  if (!rawLine) return '';
  let text = rawLine.trim();

  // Strip standard markdown checkbox syntax: "- [ ]", "- [x]", "* [ ]", "[ ]", etc.
  text = text.replace(/^[-*•\s]*\[[ x]\]\s*/i, '');

  // Strip leading bullet markers, dashes, asterisks
  text = text.replace(/^[-*•\s]+/, '');

  text = text.trim();

  // Check if string is only separator characters (e.g. "--", "---", "***", "*", "**", "•", "—", "–")
  if (!text || /^[-*—–_~`•\s]+$/.test(text)) {
    return '';
  }

  // Trim stray leading/trailing hyphens, dashes, or separators
  text = text.replace(/^[-—–]+\s*/, '').replace(/\s*[-—–]+$/, '');

  // Strip stray standalone asterisks that are not closing/opening markdown
  text = text.replace(/^(\*|\*\*)\s+(?!\*)/, '').replace(/(?<!\*)\s+(\*|\*\*)$/, '');

  text = text.trim();

  // Final check: if text is empty or just punctuation/dividers
  if (!text || /^[-*—–_~`•\s]+$/.test(text)) {
    return '';
  }

  return text;
};

export default function ActionItemsViewer({ summary, filename, onGoToTranscript }) {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // Parse Action Items section lines from markdown summary
  const actionItems = useMemo(() => {
    if (!summary) return [];
    const lines = summary.split('\n');
    let insideActionSection = false;
    const items = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ') || line.startsWith('### ')) {
        const titleLower = line.toLowerCase();
        if (titleLower.includes('action') || titleLower.includes('task')) {
          insideActionSection = true;
          continue;
        } else if (insideActionSection) {
          // Exited action items section
          break;
        }
      }

      if (insideActionSection) {
        const clean = cleanActionItemText(line);
        if (clean.length > 0) {
          items.push({
            id: i,
            raw: line,
            text: clean,
          });
        }
      }
    }

    return items;
  }, [summary]);

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = actionItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = () => {
    if (actionItems.length === 0) return;
    const textToCopy = actionItems
      .map(item => `${checkedItems[item.id] ? '[x]' : '[ ]'} ${item.text}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (actionItems.length === 0) return;
    const content = `# Action Items - ${filename || 'Meeting'}\n\n` + 
      actionItems.map(item => `- [${checkedItems[item.id] ? 'x' : ' '}] ${item.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'meeting'}_action_items.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3 min-h-[320px]">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
          <ListChecks className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Action Items Generated Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Generate an AI summary first to automatically detect and extract commitments, tasks, owners, and deadlines.
        </p>
        {onGoToTranscript && (
          <button
            onClick={onGoToTranscript}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Go to Transcript & Summarize</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-emerald-500/30 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <ListChecks className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Action Items & Next Steps</h2>
              {totalCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {completedCount}/{totalCount} Done
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive task checklist extracted from meeting discussion
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={totalCount === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
            title="Copy tasks"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={totalCount === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
            title="Download Markdown"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mt-5 mb-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Task Completion</span>
            <span className="font-medium text-slate-200">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist Content */}
      <div className="mt-4 space-y-2.5">
        {actionItems.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No explicit action items found in transcript</p>
            <p className="text-xs text-slate-500 mt-1">The discussion may have been purely informational or high-level.</p>
          </div>
        ) : (
          actionItems.map((item) => {
            const isChecked = checkedItems[item.id] || false;
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-start space-x-3.5 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-400'
                    : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-850 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isChecked
                    ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                    : 'border-slate-600 bg-slate-950/80 group-hover:border-slate-500'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className={`text-xs sm:text-sm leading-relaxed flex-1 ${
                  isChecked ? 'line-through text-slate-400/90' : 'text-slate-200'
                }`}>
                  <ReactMarkdown components={actionItemMarkdownComponents}>
                    {item.text}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
