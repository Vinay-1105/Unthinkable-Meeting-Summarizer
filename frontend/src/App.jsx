import React, { useState } from 'react';
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
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'action_items' | 'transcript'

  const handleUploadSuccess = async (uploadData) => {
    setActiveMeeting(uploadData.meeting);
    setErrorMessage(null);
    setStep(2);
    setActiveTab('transcript');

    await handleTranscribe(uploadData.meeting_id, uploadData.saved_filename);
  };

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

      setActiveMeeting(prev => ({
        ...prev,
        transcript: data.transcript,
        segments: data.segments,
        status: 'transcribed'
      }));
      setStep(2);
      setActiveTab('transcript');
    } catch (err) {
      setErrorMessage(err.message || 'Transcription error occurred');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeMeeting?.transcript) return;

    setIsSummarizing(true);
    setErrorMessage(null);

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

      setActiveMeeting(prev => ({
        ...prev,
        summary: data.summary,
        status: 'completed'
      }));
      setStep(3);
      setActiveTab('summary');
    } catch (err) {
      setErrorMessage(err.message || 'Summarization error occurred');
    } finally {
      setIsSummarizing(false);
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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onReset={handleReset} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="mb-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${step >= 1
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                1
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5">Upload Audio</span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${step >= 2
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                2
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5">Whisper Transcribe</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${step >= 3
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                3
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5">Groq Summary</span>
            </div>
          </div>
        </div>

        {/* Global Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Operation Notice</p>
              <p className="text-xs text-red-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Uploading Audio */}
            {!activeMeeting && (
              <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
                <div className="mb-6 text-center max-w-lg mx-auto">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Summarize Your Meetings with AI
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Upload an audio recording of your meeting to get an automatic transcription and high-impact key decisions & action items.
                  </p>
                </div>
                <AudioUploader onUploadSuccess={handleUploadSuccess} isProcessing={isTranscribing} />
              </div>
            )}

            {/* Transcription in progress loading screen */}
            {isTranscribing && (
              <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
                  <Mic className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Transcribing Meeting Audio</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Running Groq Whisper (whisper-large-v3-turbo) in the cloud. Fast and accurate transcription in progress.
                  </p>
                </div>
              </div>
            )}

            {/* Results Tabbed Interface */}
            {activeMeeting?.transcript && !isTranscribing && (
              <div className="space-y-6">
                {/* Navigation Tabs Bar */}
                <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === 'summary'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('action_items')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === 'action_items'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <ListChecks className="w-4 h-4" />
                    <span>Action Items</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('transcript')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === 'transcript'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
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
                    <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-200">AI Summary Not Generated Yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Generate an AI summary to extract the executive overview, key decisions, and discussion topics.
                      </p>
                      <button
                        onClick={handleSummarize}
                        disabled={isSummarizing || !activeMeeting?.transcript}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
                      >
                        {isSummarizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating AI Summary...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
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
                {activeTab === 'transcript' && (
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

          {/* Persistent History Sidebar */}
          <div className="lg:col-span-4">
            <MeetingHistory
              onSelectMeeting={handleSelectHistoryMeeting}
              activeMeetingId={activeMeeting?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
