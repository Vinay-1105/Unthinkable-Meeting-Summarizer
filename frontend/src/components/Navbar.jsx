import React from 'react';
import { Sparkles, Mic, Cpu, Zap, PlusCircle } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="sticky top-0 z-30 border-b border-obsidian-700/80 bg-obsidian-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-coral-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Mic className="w-5 h-5 text-indigo-400 group-hover:text-coral-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Meeting Assistant</span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Turn conversations into clear decisions & next steps</p>
          </div>
        </div>

        {/* Tech Badges & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 border border-obsidian-700 text-indigo-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Groq Whisper Turbo</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 border border-obsidian-700 text-amber-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>GPT-OSS 120B</span>
          </div>

          <button
            onClick={onReset}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 hover:from-indigo-600/30 hover:to-violet-600/30 text-indigo-200 border border-indigo-500/35 text-xs font-medium transition-all flex items-center space-x-1.5 shadow-sm hover:shadow-indigo-500/20 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-coral-400" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
}
