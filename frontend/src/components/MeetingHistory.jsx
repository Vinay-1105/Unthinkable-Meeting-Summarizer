import React, { useState, useEffect } from 'react';
import { History, Trash2, Clock, CheckCircle, FileText, ChevronRight, RefreshCw } from 'lucide-react';

export default function MeetingHistory({ onSelectMeeting, activeMeetingId }) {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to load meetings history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [activeMeetingId]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete meeting', err);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Meeting History</h3>
        </div>
        <button
          onClick={fetchMeetings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Refresh list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
        {meetings.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-500">No saved meetings yet</p>
          </div>
        ) : (
          meetings.map((meeting) => {
            const isSelected = activeMeetingId === meeting.id;
            return (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                      {meeting.filename}
                    </p>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(meeting.created_at)}</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, meeting.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-all"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    meeting.summary 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : meeting.transcript 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {meeting.summary ? 'Summarized' : meeting.transcript ? 'Transcribed' : 'Uploaded'}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 group-hover:text-slate-300 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
