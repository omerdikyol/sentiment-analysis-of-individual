from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, MetaData, Index
from sqlalchemy.sql import func
import datetime

# Import Base from database.py
from .database import Base

class SentimentData(Base):
    __tablename__ = 'sentiment_data'

    entry_id = Column(Integer, primary_key=True, autoincrement=True) # Auto-incrementing primary key
    run_timestamp = Column(DateTime(timezone=False), nullable=False, index=True) # Timestamp for the batch/run
    
    # Fields corresponding to DataRecord, keep nullable consistent
    original_id = Column(String, nullable=True) # Renamed from 'id' to avoid conflict if 'id' was meant to be unique external ID
    text = Column(String, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)
    platform = Column(String, nullable=True, index=True)
    timestamp = Column(DateTime(timezone=False), nullable=True) # Timestamp of the original data point

    created_at = Column(DateTime(timezone=False), server_default=func.now()) # DB-side creation timestamp

    # Optional: Add an index for faster querying by run_timestamp
    __table_args__ = (Index('ix_sentiment_data_run_timestamp', 'run_timestamp'), )

    def to_dict(self):
        # Helper to convert model instance to dictionary, matching original DataRecord structure
        return {
            "id": self.original_id, # Map back to 'id' if needed by frontend/agent structure
            "text": self.text,
            "sentiment_score": self.sentiment_score,
            "sentiment_label": self.sentiment_label,
            "platform": self.platform,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            # Include internal fields if needed for debugging?
            # "entry_id": self.entry_id,
            # "run_timestamp": self.run_timestamp.isoformat(),
            # "created_at": self.created_at.isoformat()
        }

# Example usage (not needed in models.py itself):
# record = SentimentData(run_timestamp=datetime.datetime.now(), original_id='xyz', text='Test', ...) 