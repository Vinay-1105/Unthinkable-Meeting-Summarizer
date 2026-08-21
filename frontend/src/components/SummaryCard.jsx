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
  ChevronRight,
  MessageSquare,
  Compass
} from 'lucide-react';

const markdownComponents = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-300">{children}</p>,
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

  // Parse markdown into sections
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

  // Filter out Action Items from the Summary tab (rendered in its own tab)
  const allSections = parseSections(summary);
  const summarySections = allSections.filter(
    s => !s.title.toLowerCase().includes('action') && !s.title.toLowerCase().includes('task')
  );

  const getSectionMetadata = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('executive') || lower.includes('summary')) {
      return {
        icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
        color: 'text-emerald-300',
        bg: 'bg-emerald-950/10 border-emerald-500/30',
        isCollapsible: false,
      };
    }
    if (lower.includes('decision')) {
      return {
        icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
        color: 'text-amber-300',
        bg: 'bg-amber-950/10 border-amber-500/30',
        isCollapsible: false,
      };
    }
    if (lower.includes('discussion') || lower.includes('highlight') || lower.includes('topic')) {
      return {
        icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
        color: 'text-blue-300',
        bg: 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700',
        isCollapsible: true,
      };
    }
    if (lower.includes('next step') || lower.includes('follow')) {
      return {
        icon: <Compass className="w-5 h-5 text-purple-400" />,
        color: 'text-purple-300',
        bg: 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700',
        isCollapsible: true,
      };
    }

    return {
      icon: <FileText className="w-5 h-5 text-slate-400" />,
      color: 'text-slate-200',
      bg: 'bg-slate-900/50 border-slate-800/80',
      isCollapsible: false,
    };
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-emerald-500/30">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
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
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Sections Content */}
      <div className="mt-6 space-y-4">
        {summarySections.map((section, sIdx) => {
          const sectionContent = section.lines.join('\n').trim();
          if (!sectionContent && section.title === 'Overview') return null;

          const meta = getSectionMetadata(section.title);
          const isExpanded = !!expandedSections[sIdx];

          // Collapsible Accordion (Discussion Highlights & Next Steps)
          if (meta.isCollapsible) {
            return (
              <div
                key={sIdx}
                className={`rounded-xl border transition-all overflow-hidden ${meta.bg}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sIdx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:bg-slate-800/40"
                >
                  <div className="flex items-center space-x-2.5">
                    {meta.icon}
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${meta.color}`}>
                      {section.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-[11px] hidden sm:inline text-slate-500 font-medium">
                      {isExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                    <div className={`p-1 rounded-md bg-slate-800/60 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 text-xs sm:text-sm text-slate-300 leading-relaxed animate-in fade-in duration-200">
                    <ReactMarkdown components={markdownComponents}>
                      {sectionContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }

          // Default Visible Section (Executive Summary & Key Decisions)
          return (
            <div
              key={sIdx}
              className={`p-5 rounded-xl border transition-all ${meta.bg}`}
            >
              <div className="flex items-center space-x-2.5 mb-3">
                {meta.icon}
                <h3 className={`text-base font-bold tracking-tight ${meta.color}`}>
                  {section.title}
                </h3>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
