import pandas as pd
import numpy as np
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import os
import glob
from datetime import datetime
from dateutil import parser
import re
from difflib import SequenceMatcher
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DataProcessor')

class DataProcessor:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent.parent
        self.model_name = "cardiffnlp/twitter-roberta-base-sentiment"
        self.model_dir = self.base_path / "models" / "sentiment"
        self.sentiment_pipeline = self.get_sentiment_model()

    def get_sentiment_model(self):
        """Load or download sentiment model"""
        if self.model_dir.exists():
            logger.info("Loading model from local directory...")
            model = AutoModelForSequenceClassification.from_pretrained(str(self.model_dir))
            tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir))
            return pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
        else:
            logger.info("Downloading and saving model...")
            # Download and create the pipeline
            sentiment_pipe = pipeline("sentiment-analysis", model=self.model_name)
            # Save the model and tokenizer
            self.model_dir.mkdir(parents=True, exist_ok=True)
            sentiment_pipe.model.save_pretrained(str(self.model_dir))
            sentiment_pipe.tokenizer.save_pretrained(str(self.model_dir))
            return sentiment_pipe

    def get_sentiment(self, text):
        """Get sentiment for a piece of text"""
        if pd.isna(text) or str(text).lower() == "none":
            return "neutral", 0.0
        result = self.sentiment_pipeline(str(text)[:512])[0]  # Limit text length
        label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
        return label_map[result["label"]], result["score"]

    def normalize_text(self, text):
        """Clean text for better duplicate detection"""
        if pd.isna(text) or not isinstance(text, str):
            return ""
        # Convert to lowercase
        text = text.lower()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove URLs
        text = re.sub(r'https?://\S+', '', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,?!-]', '', text)
        return text

    def is_similar_text(self, text1, text2, threshold=0.85):
        """Check if two texts are similar"""
        if pd.isna(text1) or pd.isna(text2):
            return False
        
        # For very short texts, require exact match
        if len(text1) < 10 or len(text2) < 10:
            return text1 == text2
        
        # For longer texts, use sequence matcher
        similarity = SequenceMatcher(None, text1, text2).ratio()
        return similarity >= threshold

    def parse_date(self, date_str):
        """Parse date string to ISO format with error handling"""
        if pd.isna(date_str):
            return None
            
        try:
            # Convert to string if not already
            date_str = str(date_str).strip()
            
            # Skip invalid or empty dates
            if date_str.lower() in ['none', 'nan', '', 'unknown']:
                return None
                
            # Try parsing with dateutil
            parsed_date = parser.parse(date_str)
            return parsed_date.isoformat()
        except Exception as e:
            logger.warning(f"Could not parse date '{date_str}': {str(e)}")
            return None

    def load_raw_data(self):
        """Load all raw data files"""
        raw_dir = self.base_path / "data" / "raw"
        all_data = []
        
        # Get all CSV files from raw directory
        csv_files = list(raw_dir.glob("*.csv"))
        if not csv_files:
            logger.warning("No data files found in raw directory")
            return pd.DataFrame()

        for file_path in csv_files:
            try:
                df = pd.read_csv(file_path)
                
                # Ensure required columns exist
                required_columns = ['source', 'platform', 'date', 'text']
                missing_columns = [col for col in required_columns if col not in df.columns]
                
                if missing_columns:
                    # Add missing columns with default values
                    for col in missing_columns:
                        if col == 'source' or col == 'platform':
                            df[col] = file_path.stem.split('_')[0]  # Use filename as source/platform
                        elif col == 'date':
                            df[col] = None
                        elif col == 'text':
                            df[col] = ''
                    logger.warning(f"Added missing columns {missing_columns} to {file_path}")
                
                # Add file info
                df['file_source'] = file_path.stem.split('_')[0]  # Extract source from filename
                all_data.append(df)
                logger.info(f"Loaded {len(df)} records from {file_path}")
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")

        if not all_data:
            logger.error("No data could be loaded from any files")
            return pd.DataFrame()

        # Combine all data
        combined_df = pd.concat(all_data, ignore_index=True)
        logger.info(f"Total records loaded: {len(combined_df)}")
        return combined_df

    def process_data(self):
        """Process and analyze the data"""
        # Load raw data
        df = self.load_raw_data()
        if df.empty:
            logger.error("No data files were found or loaded. Exiting.")
            return False

        logger.info(f"Processing {len(df)} records...")

        # Standardize date format
        logger.info("Standardizing dates...")
        df['date'] = df['date'].apply(self.parse_date)
        
        # Filter out records with no text
        df = df[df['text'].notna() & (df['text'] != '')]
        logger.info(f"Records after removing empty text: {len(df)}")
        
        # Add normalized text for duplicate detection
        df['normalized_text'] = df['text'].apply(self.normalize_text)

        # Remove exact duplicates
        df = df.drop_duplicates(subset=['normalized_text'])
        logger.info(f"Records after removing exact duplicates: {len(df)}")

        # Remove similar content
        indices_to_drop = []
        for idx1, row1 in df.iterrows():
            if idx1 in indices_to_drop:
                continue
            for idx2, row2 in df.iloc[idx1+1:].iterrows():
                if idx2 in indices_to_drop:
                    continue
                if self.is_similar_text(row1['normalized_text'], row2['normalized_text']):
                    # Keep the row with more information (longer text)
                    if len(str(row1['text'])) < len(str(row2['text'])):
                        indices_to_drop.append(idx1)
                    else:
                        indices_to_drop.append(idx2)
                    break

        df = df.drop(indices_to_drop)
        logger.info(f"Records after removing similar content: {len(df)}")

        # Apply sentiment analysis
        logger.info("Applying sentiment analysis...")
        sentiments = df['text'].apply(self.get_sentiment)
        df['sentiment_label'], df['sentiment_score'] = zip(*sentiments)

        # Drop temporary columns
        df = df.drop(columns=['normalized_text'])

        # Save processed data
        processed_dir = self.base_path / "data" / "processed"
        processed_dir.mkdir(parents=True, exist_ok=True)

        # Save with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        timestamped_file = processed_dir / f"processed_data_{timestamp}.csv"
        df.to_csv(timestamped_file, index=False)
        
        # Save as latest
        latest_file = processed_dir / "latest.csv"
        df.to_csv(latest_file, index=False)

        logger.info(f"Processing complete. Saved {len(df)} records to {timestamped_file}")
        return True

if __name__ == "__main__":
    processor = DataProcessor()
    processor.process_data()