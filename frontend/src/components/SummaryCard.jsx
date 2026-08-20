import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  CheckSquare,
  CheckCircle2,
  ListChecks,
  ShieldCheck,
  Copy,
  Check,
  Download,
  FileText
} from 'lucide-react';

const markdownComponents = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5">{children}</ol>,
  li: ({ children }) => <li className="text-slate-300 leading-relaxed pl-1">{children}</li>,
  h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-200 mt-2 mb-1">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-emerald-500/50 pl-3 py-1 my-2 text-slate-400 italic bg-emerald-950/10 rounded-r">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-xs bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700">
      {children}
    </code>
  )
};

const actionItemMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-emerald-400 font-medium not-italic">{children}</em>,
  code: ({ children }) => (
    <code className="font-mono text-xs bg-slate-800 text-emerald-300 px-1 py-0.5 rounded">
      {children}
    </code>
  )
};

/**
 * Trims and sanitizes an action item line:
 * - Strips checkbox markdown, leading bullets, and empty bullet markers
 * - Eliminates stray placeholder hyphens ('--' or '---') and isolated asterisks
 * - Returns empty string if the line is purely whitespace/symbols to filter it out
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

export default function SummaryCard({ summary, filename }) {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  if (!summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'meeting'}_summary.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleCheck = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const parseSections = (text) => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = { title: 'Overview', lines: [] };

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection.lines.length > 0 || currentSection.title !== 'Overview') {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, '').trim(),
          lines: []
        };
      } else {
        currentSection.lines.push(line);
      }
    }
    sections.push(currentSection);
    return sections;
  };

  const sections = parseSections(summary);

  const getSectionIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('decision')) return <ShieldCheck className="w-5 h-5 text-amber-400" />;
    if (lower.includes('action') || lower.includes('task')) return <ListChecks className="w-5 h-5 text-emerald-400" />;
    if (lower.includes('executive') || lower.includes('summary')) return <Sparkles className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-emerald-500/30">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Structured Meeting Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generated by Groq <span className="text-emerald-400 font-mono">openai/gpt-oss-120b</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Structured Sections Content */}
      <div className="mt-6 space-y-6">
        {sections.map((section, sIdx) => {
          const sectionContent = section.lines.join('\n').trim();
          if (!sectionContent && section.title === 'Overview') return null;

          const isActionSection = section.title.toLowerCase().includes('action');
          const isDecisionSection = section.title.toLowerCase().includes('decision');

          return (
            <div
              key={sIdx}
              className={`p-5 rounded-xl border transition-all ${isDecisionSection
                ? 'bg-amber-950/10 border-amber-500/30 shadow-sm'
                : isActionSection
                  ? 'bg-emerald-950/10 border-emerald-500/30 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/80'
                }`}
            >
              <div className="flex items-center space-x-2.5 mb-3">
                {getSectionIcon(section.title)}
                <h3 className={`text-base font-bold tracking-tight ${isDecisionSection
                  ? 'text-amber-300'
                  : isActionSection
                    ? 'text-emerald-300'
                    : 'text-slate-100'
                  }`}>
                  {section.title}
                </h3>
              </div>

              {isActionSection ? (
                <div className="space-y-2 text-sm text-slate-300">
                  {section.lines
                    .map((line, lIdx) => {
                      const cleanText = cleanActionItemText(line);
                      return { line, cleanText, lIdx };
                    })
                    .filter(({ cleanText }) => cleanText.length > 0)
                    .map(({ cleanText, lIdx }) => {
                      const itemKey = `${sIdx}-${lIdx}`;
                      const isChecked = checkedItems[itemKey] || false;

                      return (
                        <div
                          key={lIdx}
                          onClick={() => toggleCheck(itemKey)}
                          className={`flex items-start space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isChecked
                            ? 'bg-emerald-900/20 text-slate-400 line-through'
                            : 'hover:bg-slate-850 bg-slate-900/40 text-slate-200'
                            }`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600 bg-slate-950'
                            }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="text-xs sm:text-sm leading-relaxed flex-1">
                            <ReactMarkdown components={actionItemMarkdownComponents}>
                              {cleanText}
                            </ReactMarkdown>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <ReactMarkdown components={markdownComponents}>
                    {sectionContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
