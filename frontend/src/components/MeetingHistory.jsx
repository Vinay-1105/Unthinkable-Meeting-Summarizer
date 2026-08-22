import React, { useState } from 'react';
import { History, Trash2, Clock, ChevronRight, RefreshCw, Sparkles, AudioLines, Inbox, AlertTriangle, X } from 'lucide-react';
import { formatIST } from '../utils/formatters';

export default function MeetingHistory({ 
  meetings = [], 
  onSelectMeeting, 
  activeMeetingId, 
  onDeleteMeeting, 
  onRefresh, 
  isLoading 
}) {
  const [deleteTargetMeeting, setDeleteTargetMeeting] = useState(null);

  const handleDeleteClick = (e, meeting) => {
    e.stopPropagation();
    setDeleteTargetMeeting(meeting);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetMeeting && onDeleteMeeting) {
      onDeleteMeeting(deleteTargetMeeting.id);
    }
    setDeleteTargetMeeting(null);
  };

  const handleCancelDelete = () => {
    setDeleteTargetMeeting(null);
  };

  return (
    <>
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-obsidian-700 flex flex-col shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-700">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Meeting History</h3>
              <p className="text-[11px] text-slate-400">Past discussions & records</p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 border border-transparent hover:border-obsidian-700 transition-all"
              title="Sync meeting list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="mt-3.5 flex-1 overflow-y-auto space-y-2.5 max-h-[520px] p-1">
          {meetings.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-obsidian-850 flex items-center justify-center text-slate-500 border border-obsidian-750 mb-3">
                <Inbox className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-xs font-semibold text-slate-300">No meeting recordings yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Upload your first conversation to see structured notes and action items here.
              </p>
            </div>
          ) : (
            meetings.map((meeting) => {
              const isSelected = activeMeetingId === meeting.id;
              return (
                <div
                  key={meeting.id}
                  onClick={() => onSelectMeeting(meeting)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950/50 via-obsidian-850 to-obsidian-850 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/50'
                      : 'bg-obsidian-900/60 border-obsidian-700 hover:bg-obsidian-850 hover:border-obsidian-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="truncate pr-2 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                        {meeting.filename}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-1 font-medium">
                        <Clock className="w-3 h-3 text-indigo-400/80 flex-shrink-0" />
                        <span className="truncate">{formatIST(meeting.created_at)}</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteClick(e, meeting)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                      title="Delete meeting recording"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium flex items-center space-x-1 ${
                      meeting.summary 
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                        : meeting.transcript 
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'bg-obsidian-800 text-slate-400 border border-obsidian-700'
                    }`}>
                      {meeting.summary ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>Summary Ready</span>
                        </>
                      ) : meeting.transcript ? (
                        <>
                          <AudioLines className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Transcribed</span>
                        </>
                      ) : (
                        <span>Uploaded</span>
                      )}
                    </span>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 group-hover:text-indigo-300 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Styled Delete Confirmation Modal */}
      {deleteTargetMeeting && (
        <div 
          onClick={handleCancelDelete}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-glow rounded-3xl p-6 sm:p-7 max-w-md w-full border border-indigo-500/40 shadow-2xl shadow-obsidian-950 space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Delete Meeting Recording?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <button
                onClick={handleCancelDelete}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-obsidian-900/80 border border-obsidian-700 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200 truncate mb-1">
                {deleteTargetMeeting.filename}
              </p>
              <p className="text-slate-400">
                Are you sure you want to delete this meeting? The audio file, transcript, and generated summary will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-obsidian-700 text-xs sm:text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-coral-600 hover:from-rose-500 hover:to-coral-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-rose-600/25 transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
