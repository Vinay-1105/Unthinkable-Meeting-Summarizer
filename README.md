# Meeting Assistant

> An AI-powered full-stack application that transforms recorded meeting audio into accurate transcripts, structured executive summaries, and interactive action items.

---

## Overview

Meeting Assistant solves the challenge of information loss and productivity drain caused by long meetings. Instead of manually taking notes or re-listening to hours of audio, teams can upload their conversation recordings and immediately obtain timestamped transcripts, high-impact key decisions, and actionable task lists.

The application is engineered to meet rigorous evaluation standards across four core dimensions:
1. **Transcription Accuracy**: Cloud-accelerated audio processing using state-of-the-art speech-to-text models.
2. **Summary Quality**: High-fidelity executive synthesis that extracts decisions and discussion context with precision.
3. **Prompt Effectiveness**: Structured LLM prompting that accurately isolates task owners and deadlines while ignoring conversational filler words.
4. **Code Structure & UX**: A modular, decoupled full-stack architecture with an intuitive, tabbed user interface and real-time optimistic state management.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Backend** | Python, Flask, Flask-CORS, Flask-SQLAlchemy, SQLite | REST API, database persistence, and file handling |
| **Transcription** | Groq-hosted Whisper (`whisper-large-v3-turbo`) | High-speed, multilingual speech-to-text inference |
| **Summarization** | Groq LLM API (`openai/gpt-oss-120b`) | Structured markdown generation with section constraints |
| **Frontend** | React 18, Vite, Tailwind CSS, `react-markdown`, Lucide Icons | Responsive tabbed interface, dark mode theme, optimistic UI |

---

## Features

- **Audio File Ingestion**: Drag-and-drop support for `.mp3`, `.wav`, and `.m4a` files with client-side format/size validation (up to 100MB) and inline audio playback preview.
- **High-Speed Cloud Transcription**: Transcribes audio using Groq's hosted `whisper-large-v3-turbo` model, outputting full text and timestamped segment breakdowns.
- **Structured AI Summaries**: Synthesizes meetings into defined sections:
  - **Executive Summary**: High-level overview of the discussion.
  - **Key Decisions**: Explicit decisions, policy agreements, and consensus.
  - **Discussion Highlights & Next Steps**: Collapsible accordions to reduce vertical visual clutter.
- **Interactive Action Items Checklist**: Dedicated tab that extracts tasks, assignees, and deadlines with toggleable checkboxes and real-time progress tracking (`X of Y Completed`).
- **Persistent Meeting History**: Local SQLite database storing all past recordings with instant access, optimistic UI updates on upload/delete, and custom deletion confirmation modals.
- **Timezone Consistency (IST)**: All timestamps across the application are normalized and formatted in Indian Standard Time (`Asia/Kolkata` - `IST`).
- **Tabbed, Responsive Design**: Optimized 3-tab layout (`Summary`, `Action Items`, `Transcript`) that prevents excessive vertical scrolling across mobile (375px), tablet, and desktop screens.

---

## Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher) and **npm**
- **Python** (v3.9 or higher) and **pip**
- **Groq API Key**: A free API key from [Groq Console](https://console.groq.com/keys) (powers both Whisper transcription and LLM summarization).

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Vinay-1105/Meeting-Summarizer.git
cd Meeting-Summarizer
```

---

### Step 2: Backend Setup (Flask API)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux (bash/zsh)**:
     ```bash
     source venv/bin/activate
     ```

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` in your editor and paste your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   FLASK_ENV=development
   PORT=5000
   DATABASE_URL=sqlite:///meetings.db
   ```

6. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend will be running at `http://localhost:5000`.

---

### Step 3: Frontend Setup (React + Vite)

1. Open a **new terminal window** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` (or the URL displayed in the terminal).

---

## How to Use

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Upload Audio │ ────> │ 2. Transcribe   │ ────> │ 3. AI Summary   │
│ Drag MP3/WAV/M4A│       │ Groq Whisper    │       │ Groq GPT-OSS    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Upload Audio**: Drag and drop an audio file (`.mp3`, `.wav`, `.m4a`) onto the upload zone or browse your files. Verify the audio preview player and click **Proceed to Transcription**.
2. **Review Transcript**: The application automatically sends the audio to Groq Whisper Turbo. View the transcript as continuous text or explore timestamped segments with built-in search.
3. **Generate & Explore Summary**: Click **Generate AI Summary** to produce a structured synthesis. Navigate across the three tabs:
   - **Summary Tab**: Scan the Executive Summary and Key Decisions; expand Discussion Highlights and Next Steps accordions as needed.
   - **Action Items Tab**: Track task commitments, review assigned owners/deadlines, check off completed items, and export task lists.
   - **Transcript Tab**: Reference the raw audio transcript, copy to clipboard, or download as a text file.

---

## Demo Video

Watch the demo video here - https://www.youtube.com/watch?v=Z0_jyGx38oQ 

---

## Project Structure

```
Meeting-Summarizer/
├── backend/
│   ├── app.py                  # Flask server, CORS, REST endpoints & Groq API handlers
│   ├── models.py               # SQLite database schema using Flask-SQLAlchemy
│   ├── requirements.txt        # Minimal Python dependencies (flask, flask-cors, groq, etc.)
│   ├── .env.example            # Environment variables template
│   └── uploads/                # Directory for uploaded audio files (.gitkeep tracked)
├── frontend/
│   ├── index.html              # HTML shell with Inter typography & metadata
│   ├── package.json            # React, Vite, Tailwind CSS, and Lucide dependencies
│   ├── vite.config.js          # Vite configuration with proxy to Flask (:5000)
│   ├── tailwind.config.js      # Custom theme (Obsidian dark base, Indigo & Coral accents)
│   ├── postcss.config.js       # PostCSS configuration for Tailwind
│   └── src/
│       ├── main.jsx            # React root entry point
│       ├── App.jsx             # Main application orchestrator & tab state machine
│       ├── index.css           # Global Tailwind directives & glassmorphism utilities
│       ├── components/
│       │   ├── Navbar.jsx              # Header with tech badges & reset trigger
│       │   ├── AudioUploader.jsx       # Drag-and-drop audio uploader with preview
│       │   ├── TranscriptViewer.jsx    # Transcript viewer with search & timestamps
│       │   ├── SummaryCard.jsx         # Executive brief & Key Decisions with accordions
│       │   ├── ActionItemsViewer.jsx   # Interactive checklist & progress tracker
│       │   └── MeetingHistory.jsx      # SQLite meeting sidebar & custom delete modal
│       └── utils/
│           └── formatters.js           # IST timezone formatter & markdown sanitizers
├── .gitignore                  # Excludes venv, node_modules, .env, uploads/*, *.db
└── README.md                   # Project documentation & evaluation guide
```

---

## Notes on Evaluation Criteria

- **Transcription Accuracy**: Utilizing Groq's hosted `whisper-large-v3-turbo` model provides near-zero latency, robust background noise handling, and superior word error rate (WER) compared to lightweight local CPU models.
- **Summary Quality & Prompt Effectiveness**: The system prompt enforces strict separation of concerns into distinct markdown sections. A dedicated prompt rule instructs the model to filter out conversational filler words and honorifics (e.g. *"sir"*, *"ma'am"*, *"boss"*) when identifying task assignees, ensuring clean ownership attribution (e.g. assigning to the actual team or speaker rather than *"Sir"*).
- **Code Structure & Architecture**: The project maintains clear separation between client and server. The Flask backend adheres to RESTful conventions (`/api/upload`, `/api/transcribe`, `/api/summarize`, `/api/meetings`), while the React frontend leverages component modularity, optimistic UI state updates, and sanitization utilities to prevent raw markdown leaks.

---

## License

Distributed under the MIT License.
