# Meeting Summarizer (Full-Stack)

A full-stack AI-powered Meeting Summarizer built with a **Python Flask backend** and a modern **React + Vite + Tailwind CSS frontend**.

- 🎙️ **Transcription**: High-speed speech-to-text powered by `faster-whisper` (base model on CPU).
- 🧠 **AI Summarization**: Structured summarization powered by Groq's `llama-3.3-70b-versatile` model highlighting **Key Decisions** and **Action Items**.
- 🗄️ **Storage**: Local SQLite database via SQLAlchemy storing transcripts, summaries, and meeting records.
- 🎨 **UI / UX**: Modern dark theme, glassmorphism cards, interactive checkboxes for action items, copy to clipboard, and past meeting history.

---

## 📁 Project Structure

```
/
├── backend/
│   ├── app.py              # Flask server, CORS, routes & Groq/Whisper pipelines
│   ├── models.py           # SQLite SQLAlchemy model for meetings
│   ├── requirements.txt    # Minimal backend dependencies
│   ├── .env.example        # Environment variable template
│   └── uploads/            # Audio upload folder (.gitignore managed)
├── frontend/
│   ├── index.html          # Entry HTML
│   ├── package.json        # Frontend dependencies & scripts
│   ├── vite.config.js      # Vite config with /api proxy to Flask backend
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── src/
│       ├── main.jsx        # React DOM entry
│       ├── App.jsx         # Main application orchestrator
│       ├── index.css       # Global Tailwind CSS and glassmorphism styles
│       └── components/
│           ├── Navbar.jsx           # Top header & quick actions
│           ├── AudioUploader.jsx    # Drag-and-drop audio uploader (.mp3/.wav/.m4a)
│           ├── TranscriptViewer.jsx # Transcript viewer with search & copy
│           ├── SummaryCard.jsx      # Key Decisions & Action Items card
│           └── MeetingHistory.jsx   # Past meetings sidebar
├── .gitignore              # Ignores node_modules, .env, __pycache__, uploads/*, etc.
└── README.md               # Documentation & setup guide
```

---

## ⚙️ Getting Started

### 1. Backend Setup (Flask)

1. Open a terminal and navigate to `/backend`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the minimal dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and insert your [Groq API Key](https://console.groq.com/keys):
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

5. Run the Flask backend server:
   ```bash
   python app.py
   ```
   The backend will start at `http://localhost:5000`.

---

### 2. Frontend Setup (React + Tailwind CSS + Vite)

1. Open a separate terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or the URL printed in the terminal) in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Uploads an audio file (`.mp3`, `.wav`, `.m4a`) to `backend/uploads/` |
| `POST` | `/api/transcribe` | Transcribes audio using `faster-whisper` (base, CPU) |
| `POST` | `/api/summarize` | Summarizes transcript using Groq API (`llama-3.3-70b-versatile`) |
| `GET` | `/api/meetings` | Returns history of all processed meetings |
| `GET` | `/api/meetings/<id>` | Returns details for a single meeting |
| `DELETE` | `/api/meetings/<id>` | Deletes a meeting and its uploaded audio file |
| `GET` | `/api/health` | Backend status and engine configuration |

---

## 🔒 Dependencies

### Backend (`requirements.txt`)
- `flask`
- `flask-cors`
- `faster-whisper`
- `groq`
- `python-dotenv`
- `flask-sqlalchemy`

### Frontend (`package.json`)
- `react`, `react-dom`
- `vite`
- `tailwindcss`, `postcss`, `autoprefixer`
- `lucide-react`
