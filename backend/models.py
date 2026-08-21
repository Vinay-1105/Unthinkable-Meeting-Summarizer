from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()


class Meeting(db.Model):
    """
    Meeting database model representing an uploaded recording,
    its transcribed text, and generated structured summary.
    """
    __tablename__ = 'meetings'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    transcript = db.Column(db.Text, nullable=True)
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='uploaded')  # uploaded, transcribing, transcribed, summarizing, completed, failed

    def to_dict(self):
        """Serialize Meeting record to dictionary format for JSON responses."""
        created_at_iso = None
        if self.created_at:
            iso_str = self.created_at.isoformat()
            # Append 'Z' if naive UTC datetime to guarantee standard ISO-8601 UTC representation
            created_at_iso = iso_str if iso_str.endswith('Z') else f"{iso_str}Z"

        return {
            'id': self.id,
            'filename': self.filename,
            'file_path': self.file_path,
            'transcript': self.transcript,
            'summary': self.summary,
            'status': self.status,
            'created_at': created_at_iso
        }
