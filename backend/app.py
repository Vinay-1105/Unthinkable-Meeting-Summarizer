import os
import uuid
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from faster_whisper import WhisperModel
from groq import Groq

from models import db, Meeting

# Load environment variables from .env file
load_dotenv()

# Initialize Flask application
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a'}

app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB Max File Size
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR / 'meetings.db'}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLite database with SQLAlchemy
db.init_app(app)

with app.app_context():
    db.create_all()

# Lazy-loaded faster-whisper model (base model on CPU)
whisper_model = None


def get_whisper_model():
    """
    Lazy initialization of faster-whisper model to optimize startup time.
    Uses 'base' model on 'cpu'.
    """
    global whisper_model
    if whisper_model is None:
        # compute_type='int8' is efficient for CPU inference
        whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    return whisper_model


def allowed_file(filename: str) -> bool:
    """Check if uploaded file has a valid audio extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend status."""
    return jsonify({
        'status': 'healthy',
        'service': 'Meeting Summarizer Backend',
        'whisper_device': 'CPU',
        'whisper_model': 'base',
        'groq_model': 'llama-3.3-70b-versatile'
    }), 200


@app.route('/api/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint POST /api/upload
    Accepts an audio file (mp3/wav/m4a), validates it, saves to backend/uploads/,
    and creates a corresponding record in SQLite database.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({
            'error': f'Unsupported file format. Allowed formats: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    original_filename = secure_filename(file.filename)
    extension = original_filename.rsplit('.', 1)[1].lower()
    
    # Generate unique filename to avoid overwriting existing files
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    saved_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Save audio file to backend/uploads/
    file.save(saved_path)

    # Create meeting record in SQLite database
    meeting = Meeting(
        filename=original_filename,
        file_path=saved_path,
        status='uploaded'
    )
    db.session.add(meeting)
    db.session.commit()

    return jsonify({
        'message': 'File successfully uploaded',
        'meeting_id': meeting.id,
        'filename': original_filename,
        'saved_filename': unique_filename,
        'meeting': meeting.to_dict()
    }), 201


@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Endpoint POST /api/transcribe
    Takes a saved filename (or meeting_id), runs faster-whisper (base model, CPU)
    on the audio file, updates the database, and returns the transcript text.
    """
    data = request.get_json() or {}
    filename = data.get('filename')
    meeting_id = data.get('meeting_id')

    meeting = None
    if meeting_id:
        meeting = Meeting.query.get(meeting_id)
    elif filename:
        # Match by exact saved filepath or filename
        meeting = Meeting.query.filter(
            (Meeting.filename == filename) | (Meeting.file_path.like(f"%{filename}"))
        ).order_by(Meeting.id.desc()).first()

    if not meeting:
        # Check if direct filename in uploads was provided
        direct_path = os.path.join(app.config['UPLOAD_FOLDER'], filename) if filename else None
        if direct_path and os.path.exists(direct_path):
            meeting = Meeting(filename=filename, file_path=direct_path, status='uploaded')
            db.session.add(meeting)
            db.session.commit()
        else:
            return jsonify({'error': 'Meeting or audio file not found'}), 404

    if not os.path.exists(meeting.file_path):
        return jsonify({'error': f'Audio file not found at path: {meeting.file_path}'}), 404

    try:
        meeting.status = 'transcribing'
        db.session.commit()

        # Run faster-whisper (base model, CPU)
        model = get_whisper_model()
        segments, info = model.transcribe(meeting.file_path, beam_size=5)

        # Assemble full transcription text from segments
        segment_list = []
        transcript_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcript_parts.append(text)
                segment_list.append({
                    'start': segment.start,
                    'end': segment.end,
                    'text': text
                })

        full_transcript = " ".join(transcript_parts)
        
        # Save transcript to SQLite database
        meeting.transcript = full_transcript
        meeting.status = 'transcribed'
        db.session.commit()

        return jsonify({
            'message': 'Transcription completed successfully',
            'meeting_id': meeting.id,
            'filename': meeting.filename,
            'transcript': full_transcript,
            'language': info.language,
            'language_probability': info.language_probability,
            'duration': info.duration,
            'segments': segment_list
        }), 200

    except Exception as e:
        meeting.status = 'failed'
        db.session.commit()
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500


@app.route('/api/summarize', methods=['POST'])
def summarize_transcript():
    """
    Endpoint POST /api/summarize
    Takes transcript text (and optional meeting_id), calls Groq API (llama-3.3-70b-versatile),
    generates a structured summary with 'Key Decisions' and 'Action Items',
    saves the result to SQLite database, and returns the summary.
    """
    data = request.get_json() or {}
    transcript_text = data.get('transcript')
    meeting_id = data.get('meeting_id')

    meeting = None
    if meeting_id:
        meeting = Meeting.query.get(meeting_id)
        if not transcript_text and meeting:
            transcript_text = meeting.transcript

    if not transcript_text or not transcript_text.strip():
        return jsonify({'error': 'Transcript text is required for summarization'}), 400

    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key or groq_api_key.strip() == 'your_groq_api_key_here':
        return jsonify({
            'error': 'GROQ_API_KEY is not configured. Please set your valid Groq API key in backend/.env'
        }), 500

    try:
        if meeting:
            meeting.status = 'summarizing'
            db.session.commit()

        # Initialize Groq client
        client = Groq(api_key=groq_api_key)

        prompt = f"""
You are an executive AI assistant specialized in corporate and technical meeting summarization.
Analyze the following meeting transcript and generate a comprehensive, well-structured markdown summary.

Make sure to strictly include the following structured sections:
1. ## Executive Summary
   A concise high-level overview of the meeting purpose, key topics, and outcomes.

2. ## Key Decisions
   A clear bulleted list of all explicit decisions, consensus reached, and policies agreed upon during the meeting.

3. ## Action Items
   A structured list of tasks and commitments with assigned owners, deliverables, and deadlines if mentioned. Format as:
   - [ ] **[Task Description]** - Assigned to: *[Owner/Team]* | Deadline: *[Date/Timeline or 'TBD']*

4. ## Discussion Highlights & Topics
   Key discussion points, debates, insights, and concerns raised during the conversation.

5. ## Next Steps & Follow-ups
   Any scheduled future syncs, open questions, or dependencies.

Transcript:
\"\"\"{transcript_text}\"\"\"
"""

        # Call Groq API with llama-3.3-70b-versatile
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional meeting analysis assistant. Produce clear, actionable, structured markdown summaries highlighting Key Decisions and Action Items."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2048
        )

        summary_result = completion.choices[0].message.content

        # Update SQLite database
        if meeting:
            meeting.summary = summary_result
            meeting.status = 'completed'
            db.session.commit()

        return jsonify({
            'message': 'Summary generated successfully',
            'meeting_id': meeting.id if meeting else None,
            'summary': summary_result,
            'model': 'llama-3.3-70b-versatile'
        }), 200

    except Exception as e:
        if meeting:
            meeting.status = 'failed'
            db.session.commit()
        return jsonify({'error': f'Summarization failed: {str(e)}'}), 500


@app.route('/api/meetings', methods=['GET'])
def list_meetings():
    """Retrieve list of all meetings recorded in the SQLite database."""
    meetings = Meeting.query.order_by(Meeting.created_at.desc()).all()
    return jsonify([meeting.to_dict() for meeting in meetings]), 200


@app.route('/api/meetings/<int:meeting_id>', methods=['GET'])
def get_meeting(meeting_id: int):
    """Retrieve details for a single meeting by ID."""
    meeting = Meeting.query.get_or_404(meeting_id)
    return jsonify(meeting.to_dict()), 200


@app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id: int):
    """Delete a meeting record and its associated audio file if it exists."""
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.file_path and os.path.exists(meeting.file_path):
        try:
            os.remove(meeting.file_path)
        except OSError:
            pass
    db.session.delete(meeting)
    db.session.commit()
    return jsonify({'message': f'Meeting {meeting_id} deleted successfully'}), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
