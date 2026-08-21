import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ListChecks, 
  Check, 
  Copy, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { sanitizeMarkdownText } from '../utils/formatters';

const actionItemMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-coral-300 font-medium not-italic">{children}</em>,
  code: ({ children }) => (
    <code className="font-mono text-xs bg-obsidian-850 text-indigo-300 px-1.5 py-0.5 rounded-md border border-obsidian-700">
      {children}
    </code>
  )
};

/**
 * Trims and sanitizes an action item line:
 * - Strips checkbox markdown, leading bullets, and empty bullet markers
 * - Eliminates stray placeholder hyphens ('--' or '---') and isolated asterisks
 * - Strips trailing unclosed '**' or '*' using comprehensive regex and balance checking
 */
const cleanActionItemText = (rawLine) => {
  if (!rawLine) return '';
  let text = rawLine.trim();

  // Strip standard markdown checkbox syntax: "- [ ]", "- [x]", "* [ ]", "[ ]", etc.
  text = text.replace(/^[-*•\s]*\[[ x]\]\s*/i, '');

  // Strip leading bullet markers, dashes, asterisks
  text = text.replace(/^[-*•\s]+/, '');

  text = text.trim();

  // If line is empty or purely separators
  if (!text || /^[-*—–_~`•\s]+$/.test(text)) {
    return '';
  }

  // Sanitize trailing/unclosed asterisks or hyphens
  text = sanitizeMarkdownText(text);

  // Final check: if text is empty or just punctuation
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
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-obsidian-700 text-center flex flex-col items-center justify-center space-y-4 min-h-[340px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
          <ClipboardList className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base sm:text-lg font-bold text-slate-100">Ready to Extract Action Items</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Generate an AI summary to automatically detect and extract owners, commitments, tasks, and deadlines from this meeting.
          </p>
        </div>
        {onGoToTranscript && (
          <button
            onClick={onGoToTranscript}
            className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-coral-500 hover:from-indigo-500 hover:to-coral-400 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-coral-300" />
            <span>Generate Summary Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel-glow rounded-3xl p-5 sm:p-8 border border-indigo-500/30 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-obsidian-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-coral-500/20 text-coral-400 border border-coral-500/30 shadow-md">
            <ListChecks className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Action Items & Deliverables</h2>
              {totalCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {completedCount} of {totalCount} Done
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive task checklist parsed from meeting discussion
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={totalCount === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-200 text-xs font-medium transition-all active:scale-95 disabled:opacity-40"
            title="Copy task checklist"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={totalCount === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-200 text-xs font-medium transition-all active:scale-95 disabled:opacity-40"
            title="Download task checklist"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-obsidian-900/60 p-4 rounded-2xl border border-obsidian-700">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Execution Progress</span>
            <span className="font-semibold text-coral-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-obsidian-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-coral-400 transition-all duration-300 rounded-full shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist Content */}
      <div className="space-y-2.5">
        {actionItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-obsidian-900/40 border border-obsidian-700/80 text-center">
            <CheckCircle2 className="w-8 h-8 text-indigo-400/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No explicit action items detected</p>
            <p className="text-xs text-slate-400 mt-1">This session may have been purely informative without assigned tasks.</p>
          </div>
        ) : (
          actionItems.map((item) => {
            const isChecked = checkedItems[item.id] || false;
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isChecked
                    ? 'bg-obsidian-900/40 border-obsidian-700/70 text-slate-400'
                    : 'bg-obsidian-900/80 border-obsidian-700 hover:bg-obsidian-850 hover:border-indigo-500/40 text-slate-200 shadow-sm'
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                  isChecked
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                    : 'border-obsidian-600 bg-obsidian-950 group-hover:border-indigo-400'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className={`text-xs sm:text-sm leading-relaxed flex-1 ${
                  isChecked ? 'line-through text-slate-400' : 'text-slate-200'
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
