import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AudioUploader from './components/AudioUploader';
import TranscriptViewer from './components/TranscriptViewer';
import SummaryCard from './components/SummaryCard';
import ActionItemsViewer from './components/ActionItemsViewer';
import MeetingHistory from './components/MeetingHistory';
import {
  Sparkles,
  Mic,
  FileText,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wand2
} from 'lucide-react';

export default function App() {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'action_items' | 'transcript'
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showSummarySuccess, setShowSummarySuccess] = useState(false);

  // Fetch initial meeting records from backend SQLite
  const fetchMeetings = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to load meeting history', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // 1. Optimistic update on Upload
  const handleUploadSuccess = async (uploadData) => {
    const newMeeting = uploadData.meeting;
    setActiveMeeting(newMeeting);
    setErrorMessage(null);
    setStep(2);
    setActiveTab('transcript');

    // Optimistically prepend to history sidebar immediately
    setMeetings((prev) => [newMeeting, ...prev.filter((m) => m.id !== newMeeting.id)]);

    await handleTranscribe(uploadData.meeting_id, uploadData.saved_filename);
  };

  // 2. Optimistic update on Transcribe
  const handleTranscribe = async (meetingId, filename) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId || activeMeeting?.id,
          filename: filename || activeMeeting?.filename,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio file');
      }

      const updatedMeeting = {
        ...(activeMeeting || {}),
        id: data.meeting_id || activeMeeting?.id,
        filename: data.filename || activeMeeting?.filename,
        transcript: data.transcript,
        segments: data.segments,
        status: 'transcribed'
      };

      setActiveMeeting(updatedMeeting);

      // Optimistically update record in meetings history
      setMeetings((prev) =>
        prev.map((m) => (m.id === updatedMeeting.id ? { ...m, ...updatedMeeting } : m))
      );

      setStep(2);
      setActiveTab('transcript');
    } catch (err) {
      setErrorMessage(err.message || 'Transcription error occurred');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 3. Optimistic update on Summarize
  const handleSummarize = async () => {
    if (!activeMeeting?.transcript) return;

    setIsSummarizing(true);
    setErrorMessage(null);
    setShowSummarySuccess(false);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: activeMeeting.id,
          transcript: activeMeeting.transcript,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const updatedMeeting = {
        ...activeMeeting,
        summary: data.summary,
        status: 'completed'
      };

      setActiveMeeting(updatedMeeting);

      // Optimistically update record in meetings history
      setMeetings((prev) =>
        prev.map((m) => (m.id === updatedMeeting.id ? { ...m, ...updatedMeeting } : m))
      );

      setStep(3);
      setActiveTab('summary');
      setShowSummarySuccess(true);
      setTimeout(() => setShowSummarySuccess(false), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Summarization error occurred');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle meeting deletion with optimistic UI update
  const handleDeleteMeeting = async (id) => {
    // Optimistic delete from UI
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (activeMeeting?.id === id) {
      setActiveMeeting(null);
      setStep(1);
    }

    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete meeting record', err);
      // Rollback list if delete fails
      fetchMeetings();
    }
  };

  const handleSelectHistoryMeeting = (meeting) => {
    setActiveMeeting(meeting);
    setErrorMessage(null);
    if (meeting.summary) {
      setStep(3);
      setActiveTab('summary');
    } else if (meeting.transcript) {
      setStep(2);
      setActiveTab('transcript');
    } else {
      setStep(1);
      setActiveTab('summary');
    }
  };

  const handleReset = () => {
    setActiveMeeting(null);
    setErrorMessage(null);
    setStep(1);
    setActiveTab('summary');
    setShowSummarySuccess(false);
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar onReset={handleReset} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-obsidian-800 -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                step >= 1
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-obsidian-900 border-obsidian-700 text-slate-400'
              }`}>
                1
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1.5 text-center">Upload Audio</span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                step >= 2
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-obsidian-900 border-obsidian-700 text-slate-400'
              }`}>
                2
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1.5 text-center">AI Transcribe</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                step >= 3
                  ? 'bg-gradient-to-tr from-coral-500 to-amber-500 border-amber-400 text-white shadow-lg shadow-coral-500/25'
                  : 'bg-obsidian-900 border-obsidian-700 text-slate-400'
              }`}>
                3
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1.5 text-center">Smart Summary</span>
            </div>
          </div>
        </div>

        {/* Global Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start space-x-3 shadow-md animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Notice</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Summary Completion Flash Toast */}
        {showSummarySuccess && (
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-obsidian-900 to-coral-950/80 border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-indigo-950/40 animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-coral-400 flex-shrink-0" />
              <span>Summary synthesized with Key Decisions and Action Items!</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ready
            </span>
          </div>
        )}

        {/* Main Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Step 1: Uploading Audio */}
            {!activeMeeting && (
              <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-obsidian-700 shadow-sm">
                <div className="mb-6 text-center max-w-lg mx-auto">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
                    <Wand2 className="w-3.5 h-3.5 text-coral-400" />
                    <span>Instant Audio Analysis</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Turn Meetings into Action
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    Upload an audio recording to extract high-accuracy transcripts, concise executive briefs, key decisions, and interactive checklist items.
                  </p>
                </div>
                <AudioUploader onUploadSuccess={handleUploadSuccess} isProcessing={isTranscribing} />
              </div>
            )}

            {/* Transcription in progress loading screen */}
            {isTranscribing && (
              <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-obsidian-700 text-center flex flex-col items-center justify-center space-y-4 shadow-md">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-obsidian-800 border-t-indigo-500 border-r-coral-400 animate-spin" />
                  <Mic className="w-6 h-6 text-indigo-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-lg font-bold text-white">Transcribing Meeting Audio</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Running Groq Whisper Turbo in the cloud. Converting voice to timestamped text in seconds...
                  </p>
                </div>
              </div>
            )}

            {/* Results Tabbed Interface */}
            {activeMeeting?.transcript && !isTranscribing && (
              <div className="space-y-6">
                {/* Responsive Navigation Tabs Bar */}
                <div className="flex items-center space-x-1 p-1 sm:p-1.5 rounded-2xl bg-obsidian-900/90 border border-obsidian-700/90 backdrop-blur-md shadow-sm overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 min-w-[90px] flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none ${
                      activeTab === 'summary'
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-coral-400" />
                    <span>Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('action_items')}
                    className={`flex-1 min-w-[90px] flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none ${
                      activeTab === 'action_items'
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
                    <span>Action Items</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('transcript')}
                    className={`flex-1 min-w-[90px] flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none ${
                      activeTab === 'transcript'
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                    <span>Transcript</span>
                  </button>
                </div>

                {/* Tab 1: Summary */}
                {activeTab === 'summary' && (
                  activeMeeting?.summary ? (
                    <SummaryCard
                      summary={activeMeeting.summary}
                      filename={activeMeeting.filename}
                    />
                  ) : (
                    <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-obsidian-700 text-center flex flex-col items-center justify-center space-y-3.5 min-h-[320px]">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                        <Sparkles className="w-7 h-7 text-coral-400" />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-base sm:text-lg font-bold text-slate-100">Ready to Synthesize Meeting</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                          Extract the executive summary, key decisions reached, and important takeaways with Groq GPT-OSS 120B.
                        </p>
                      </div>
                      <button
                        onClick={handleSummarize}
                        disabled={isSummarizing || !activeMeeting?.transcript}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-coral-500 hover:from-indigo-500 hover:to-coral-400 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-2 active:scale-95"
                      >
                        {isSummarizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating Summary...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-coral-300" />
                            <span>Generate AI Summary</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                )}

                {/* Tab 2: Action Items */}
                {activeTab === 'action_items' && (
                  <ActionItemsViewer
                    summary={activeMeeting?.summary}
                    filename={activeMeeting?.filename}
                    onGoToTranscript={() => setActiveTab('transcript')}
                  />
                )}

                {/* Tab 3: Transcript */}
                {activeTab === 'transcript' && activeMeeting?.transcript && (
                  <TranscriptViewer
                    transcript={activeMeeting.transcript}
                    segments={activeMeeting.segments || []}
                    filename={activeMeeting.filename}
                    onSummarize={handleSummarize}
                    isSummarizing={isSummarizing}
                  />
                )}
              </div>
            )}
          </div>

          {/* Persistent History Sidebar (Stacks naturally on mobile/tablet, right column on desktop) */}
          <div className="lg:col-span-4 w-full">
            <MeetingHistory
              meetings={meetings}
              onSelectMeeting={handleSelectHistoryMeeting}
              activeMeetingId={activeMeeting?.id}
              onDeleteMeeting={handleDeleteMeeting}
              onRefresh={fetchMeetings}
              isLoading={isHistoryLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
