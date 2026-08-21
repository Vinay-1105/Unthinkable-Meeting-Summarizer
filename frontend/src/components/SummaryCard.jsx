import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Download,
  ChevronDown,
  MessageSquare,
  Compass,
  BookmarkCheck
} from 'lucide-react';

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-300">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-indigo-300 italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-2 my-2.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-2 my-2.5">{children}</ol>,
  li: ({ children }) => <li className="text-slate-300 leading-relaxed pl-1">{children}</li>,
  h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-200 mt-2 mb-1">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-indigo-500/60 pl-3.5 py-1.5 my-2.5 text-slate-300 italic bg-indigo-950/20 rounded-r-xl">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-xs bg-obsidian-850 text-indigo-300 px-1.5 py-0.5 rounded-md border border-obsidian-700">
      {children}
    </code>
  )
};

export default function SummaryCard({ summary, filename }) {
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

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

  const toggleSection = (sIdx) => {
    setExpandedSections(prev => ({
      ...prev,
      [sIdx]: !prev[sIdx]
    }));
  };

  // Parse markdown into structured sections
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

  // Exclude Action Items from this tab (it has its own dedicated tab)
  const allSections = parseSections(summary);
  const summarySections = allSections.filter(
    s => !s.title.toLowerCase().includes('action') && !s.title.toLowerCase().includes('task')
  );

  const getSectionMetadata = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('executive') || lower.includes('summary')) {
      return {
        icon: <BookmarkCheck className="w-5 h-5 text-indigo-400" />,
        color: 'text-indigo-200',
        bg: 'bg-gradient-to-br from-indigo-950/30 via-obsidian-900 to-obsidian-900 border-indigo-500/35 shadow-lg shadow-indigo-950/30',
        isCollapsible: false,
        badge: 'Executive Brief',
      };
    }
    if (lower.includes('decision')) {
      return {
        icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
        color: 'text-amber-300',
        bg: 'bg-gradient-to-br from-amber-950/20 via-obsidian-900 to-obsidian-900 border-amber-500/35 shadow-lg shadow-amber-950/20',
        isCollapsible: false,
        badge: 'Key Decisions',
      };
    }
    if (lower.includes('discussion') || lower.includes('highlight') || lower.includes('topic')) {
      return {
        icon: <MessageSquare className="w-5 h-5 text-violet-400" />,
        color: 'text-violet-300',
        bg: 'bg-obsidian-900/70 border-obsidian-700 hover:border-obsidian-600',
        isCollapsible: true,
        badge: 'Discussion',
      };
    }
    if (lower.includes('next step') || lower.includes('follow')) {
      return {
        icon: <Compass className="w-5 h-5 text-coral-400" />,
        color: 'text-coral-300',
        bg: 'bg-obsidian-900/70 border-obsidian-700 hover:border-obsidian-600',
        isCollapsible: true,
        badge: 'Follow-ups',
      };
    }

    return {
      icon: <FileText className="w-5 h-5 text-slate-400" />,
      color: 'text-slate-200',
      bg: 'bg-obsidian-900/70 border-obsidian-700',
      isCollapsible: false,
      badge: 'Notes',
    };
  };

  return (
    <div className="glass-panel-glow rounded-3xl p-5 sm:p-8 border border-indigo-500/30 flex flex-col space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-obsidian-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-coral-500/20 text-indigo-300 border border-indigo-500/30 shadow-md">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Meeting Synthesis & Decisions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured summary powered by <span className="text-indigo-300 font-mono">openai/gpt-oss-120b</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-200 text-xs font-medium transition-all active:scale-95 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-700 border border-obsidian-700 text-slate-200 text-xs font-medium transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Sections Content */}
      <div className="space-y-4">
        {summarySections.map((section, sIdx) => {
          const sectionContent = section.lines.join('\n').trim();
          if (!sectionContent && section.title === 'Overview') return null;

          const meta = getSectionMetadata(section.title);
          const isExpanded = !!expandedSections[sIdx];

          // Collapsible Accordions (Discussion Highlights & Next Steps)
          if (meta.isCollapsible) {
            return (
              <div
                key={sIdx}
                className={`rounded-2xl border transition-all overflow-hidden ${meta.bg}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sIdx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:bg-obsidian-800/40 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-obsidian-800 border border-obsidian-700">
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-bold tracking-tight ${meta.color}`}>
                        {section.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {isExpanded ? 'Expanded details' : 'Click to reveal full discussion notes'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <div className={`p-1.5 rounded-lg bg-obsidian-800/80 text-slate-400 border border-obsidian-700 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-indigo-400' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-obsidian-700 text-xs sm:text-sm text-slate-300 leading-relaxed animate-in fade-in duration-200">
                    <ReactMarkdown components={markdownComponents}>
                      {sectionContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }

          // Default Visible Sections (Executive Summary & Key Decisions)
          return (
            <div
              key={sIdx}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${meta.bg}`}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-obsidian-800 border border-obsidian-700">
                    {meta.icon}
                  </div>
                  <h3 className={`text-base font-bold tracking-tight ${meta.color}`}>
                    {section.title}
                  </h3>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-obsidian-800/80 text-slate-400 border border-obsidian-700">
                  {meta.badge}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-0.5">
                <ReactMarkdown components={markdownComponents}>
                  {sectionContent}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
