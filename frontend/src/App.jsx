import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AudioUploader from './components/AudioUploader';
import TranscriptViewer from './components/TranscriptViewer';
import SummaryCard from './components/SummaryCard';
import MeetingHistory from './components/MeetingHistory';
import { 
  Sparkles, 
  Mic, 
  FileText, 
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
  const [step, setStep] = useState(1); // 1: Upload, 2: Transcribe, 3: Summarize / View

  const handleUploadSuccess = async (uploadData) => {
    setActiveMeeting(uploadData.meeting);
    setErrorMessage(null);
    setStep(2);

    // Automatically trigger transcription once uploaded
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
    } else if (meeting.transcript) {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleReset = () => {
    setActiveMeeting(null);
    setErrorMessage(null);
    setStep(1);
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
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                step >= 1 
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}>
                1
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5">Upload Audio</span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                step >= 2 
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}>
                2
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5">Whisper Transcribe</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                step >= 3 
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                    Running faster-whisper (base model) on CPU. Depending on audio length, this may take a few moments.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Transcript Viewer */}
            {activeMeeting?.transcript && (
              <TranscriptViewer 
                transcript={activeMeeting.transcript}
                segments={activeMeeting.segments || []}
                filename={activeMeeting.filename}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
              />
            )}

            {/* Step 3: Structured Summary Card */}
            {activeMeeting?.summary && (
              <SummaryCard 
                summary={activeMeeting.summary} 
                filename={activeMeeting.filename} 
              />
            )}
          </div>

          {/* History Sidebar */}
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
