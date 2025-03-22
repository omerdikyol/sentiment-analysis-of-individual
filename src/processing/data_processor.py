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
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import random

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
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        random.seed(42)  # For consistent random values

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

    def detect_country(self, row):
        """
        Detect country information based on available data.
        Supported countries: US, UK, Qatar, UAE
        Uses a scoring system to determine the most likely country.
        """
        # If country already exists and is valid, don't overwrite it
        if not pd.isna(row.get('country')) and row['country'] not in ['none', 'unknown', '']:
            return row['country'].lower()
        
        # Initialize text for analysis
        text = str(row.get('text', '')).lower() if not pd.isna(row.get('text')) else ''
        platform = str(row.get('platform', '')).lower() if not pd.isna(row.get('platform')) else ''
        source = str(row.get('source', '')).lower() if not pd.isna(row.get('source')) else ''
        user_location = str(row.get('user_location', '')).lower() if not pd.isna(row.get('user_location')) else ''
        user_name = str(row.get('user_name', '')).lower() if not pd.isna(row.get('user_name')) else ''
        user_handle = str(row.get('user_handle', '')).lower() if not pd.isna(row.get('user_handle')) else ''
        
        # Initialize country scores
        country_scores = {'US': 0, 'UK': 0, 'Qatar': 0, 'UAE': 0}
        
        # Helper function to detect language patterns
        def detect_language_patterns(text):
            # American English patterns
            us_patterns = ['color', 'center', 'favorite', 'analyze', 'organize', 'defense', 'license', 'traveling']
            # British English patterns
            uk_patterns = ['colour', 'centre', 'favourite', 'analyse', 'organise', 'defence', 'licence', 'travelling']
            # Arabic transliteration patterns
            qatar_patterns = ['al-', 'bin ', 'ibn ', 'abdul', 'sheikh', 'sharia', 'majlis', 'emir']
            
            us_count = sum(1 for pattern in us_patterns if pattern in text)
            uk_count = sum(1 for pattern in uk_patterns if pattern in text)
            qatar_count = sum(1 for pattern in qatar_patterns if pattern in text)
            
            return {'US': us_count, 'UK': uk_count, 'Qatar': qatar_count}
        
        # Helper function to detect Arabic script
        def contains_arabic(text):
            arabic_ranges = [
                (0x0600, 0x06FF),  # Arabic
                (0x0750, 0x077F),  # Arabic Supplement
                (0x08A0, 0x08FF),  # Arabic Extended-A
                (0xFB50, 0xFDFF),  # Arabic Presentation Forms-A
                (0xFE70, 0xFEFF),  # Arabic Presentation Forms-B
            ]
            
            for char in text:
                code_point = ord(char)
                if any(start <= code_point <= end for start, end in arabic_ranges):
                    return True
            return False
        
        # Check for social media platforms
        if source.lower() in ['x', 'twitter', 'facebook', 'instagram', 'tiktok'] or platform.lower() in ['x', 'twitter', 'facebook', 'instagram', 'tiktok']:
            # Check user_location
            if user_location:
                if any(loc in user_location for loc in ['usa', 'united states', 'america', 'us ', 'u.s', 'u.s.a']):
                    country_scores['US'] += 3
                elif any(loc in user_location for loc in ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain', 'great britain']):
                    country_scores['UK'] += 3
                elif any(loc in user_location for loc in ['qatar', 'doha']):
                    country_scores['Qatar'] += 3
                elif any(loc in user_location for loc in ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah']):
                    country_scores['UAE'] += 3
                
                # Check for cities/states
                us_locations = ['new york', 'california', 'texas', 'florida', 'chicago', 'los angeles', 'boston', 'washington', 'seattle', 'atlanta']
                uk_locations = ['london', 'manchester', 'liverpool', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'cardiff', 'belfast']
                qatar_locations = ['doha', 'al wakrah', 'al rayyan', 'lusail', 'al khor', 'dukhan', 'mesaieed', 'al shamal']
                uae_locations = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain', 'al ain']
                
                for loc in us_locations:
                    if loc in user_location:
                        country_scores['US'] += 2
                for loc in uk_locations:
                    if loc in user_location:
                        country_scores['UK'] += 2
                for loc in qatar_locations:
                    if loc in user_location:
                        country_scores['Qatar'] += 2
                for loc in uae_locations:
                    if loc in user_location:
                        country_scores['UAE'] += 2
            
            # Check username and handle
            for name in [user_name, user_handle]:
                if name:
                    # Check for country codes
                    if re.search(r'\b(us|usa|america)\b', name) or name.endswith('_us') or name.endswith('_usa'):
                        country_scores['US'] += 2
                    elif re.search(r'\b(uk|gb|britain)\b', name) or name.endswith('_uk') or name.endswith('_gb'):
                        country_scores['UK'] += 2
                    elif re.search(r'\b(qa|qatar)\b', name) or name.endswith('_qa') or name.endswith('_qatar'):
                        country_scores['Qatar'] += 2
                    elif re.search(r'\b(ae|uae)\b', name) or name.endswith('_ae') or name.endswith('_uae'):
                        country_scores['UAE'] += 2
                    
                    # Check for city/state names
                    if any(city in name for city in ['nyc', 'newyork', 'chicago', 'la', 'losangeles', 'boston', 'texas', 'florida', 'cali', 'california']):
                        country_scores['US'] += 1
                    elif any(city in name for city in ['london', 'manchester', 'liverpool', 'birmingham', 'leeds', 'glasgow', 'edinburgh']):
                        country_scores['UK'] += 1
                    elif any(city in name for city in ['doha', 'alwakrah', 'rayyan', 'lusail']):
                        country_scores['Qatar'] += 1
                    elif any(city in name for city in ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain', 'al ain']):
                        country_scores['UAE'] += 1
                    
                    # Check for common name patterns
                    if name.startswith('american') or 'american' in name:
                        country_scores['US'] += 1
                    elif name.startswith('british') or 'british' in name:
                        country_scores['UK'] += 1
                    elif name.startswith('qatari') or 'qatari' in name:
                        country_scores['Qatar'] += 1
                    elif name.startswith('uae') or 'uae' in name:
                        country_scores['UAE'] += 1
                    
                    # Check for Arabic names (common in Qatar)
                    if any(pattern in name for pattern in ['al-', 'bin-', 'ibn-', 'abdul', 'sheikh']):
                        country_scores['Qatar'] += 2
                    
                    # Check for Arabic script
                    if contains_arabic(name):
                        country_scores['Qatar'] += 3
            
            # Check text content for country mentions
            us_terms = ['america', 'american', 'washington', 'new york', 'california', 'texas', 'usa', 'united states', 'white house', 'congress', 'nfl', 'nba']
            uk_terms = ['britain', 'british', 'london', 'manchester', 'liverpool', 'uk', 'united kingdom', 'england', 'scotland', 'wales', 'bbc', 'nhs', 'parliament']
            qatar_terms = ['qatar', 'doha', 'qatari', 'al thani', 'emir', 'gulf', 'middle east', 'arabian', 'sharia', 'islamic']
            uae_terms = ['uae', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain', 'al ain']
            
            for term in us_terms:
                if term in text:
                    country_scores['US'] += 1
            for term in uk_terms:
                if term in text:
                    country_scores['UK'] += 1
            for term in qatar_terms:
                if term in text:
                    country_scores['Qatar'] += 1
            for term in uae_terms:
                if term in text:
                    country_scores['UAE'] += 1
            
            # Check for language patterns
            language_scores = detect_language_patterns(text)
            for country, score in language_scores.items():
                country_scores[country] += score
            
            # Check for Arabic script in text (strong indicator for Qatar)
            if contains_arabic(text):
                country_scores['Qatar'] += 3
        
        # Check for news sources
        elif source.lower() == 'news' or platform.lower() in ['cnn', 'bbc', 'fox', 'nbc', 'abc', 'cbs', 'newsweek', 'huffpost', 'pbs']:
            # Check source domain/name (highest priority for news)
            if platform:
                us_sources = ['cnn', 'fox', 'nbc', 'abc', 'cbs', 'usa today', 'new york times', 'washington post', 'huffpost', 'newsweek', 'politico', 'bloomberg', 'cnbc']
                uk_sources = ['bbc', 'guardian', 'telegraph', 'independent', 'daily mail', 'mirror', 'sun', 'times', 'economist', 'financial times', 'sky news']
                qatar_sources = [
                    'al jazeera', 'gulf times', 'peninsula', 'qatar tribune', 'diwan.gov.qa', 'gco.gov.qa',
                    'qatar news agency', 'qatar day', 'doha news', 'lusail news', 'al-sharq', 'raya',
                    'al-watan', 'qatar living', 'iloveqatar', 'marhaba', 'qatar observer', 'qatar gazette',
                    'qatar chronicle', 'qna', 'thepeninsulaqatar'
                ]
                
                for src in us_sources:
                    if src in platform.lower():
                        country_scores['US'] += 4
                for src in uk_sources:
                    if src in platform.lower():
                        country_scores['UK'] += 4
                for src in qatar_sources:
                    if src in platform.lower():
                        country_scores['Qatar'] += 4
            
            # Check user_location (domain) for news sources
            if user_location:
                if '.com' in user_location or '.org' in user_location or '.net' in user_location or '.qa' in user_location:
                    us_domains = ['cnn', 'foxnews', 'nbc', 'abc', 'cbs', 'usatoday', 'nytimes', 'washingtonpost', 'wsj', 'latimes']
                    uk_domains = ['bbc', 'guardian', 'telegraph', 'independent', 'dailymail', 'ft.com', 'economist', 'reuters']
                    qatar_domains = [
                        'aljazeera', 'gulf-times', 'thepeninsulaqatar', 'qatar', 'qna.org.qa', 'dohanews',
                        'qatarliving', 'iloveqatar', 'marhaba.qa', 'qatarday', 'lusailnews', 'alarab.qa',
                        'al-sharq', 'raya', 'al-watan', 'qatargazette', 'qatarchronicle', 'qatarobserver'
                    ]
                    
                    for domain in us_domains:
                        if domain in user_location:
                            country_scores['US'] += 3
                    for domain in uk_domains:
                        if domain in user_location:
                            country_scores['UK'] += 3
                    for domain in qatar_domains:
                        if domain in user_location:
                            country_scores['Qatar'] += 3
            
            # Check text content for country mentions
            us_terms = ['america', 'american', 'washington', 'new york', 'california', 'texas', 'usa', 'united states', 'white house', 'congress']
            uk_terms = ['britain', 'british', 'london', 'manchester', 'liverpool', 'uk', 'united kingdom', 'england', 'scotland', 'wales', 'parliament']
            qatar_terms = [
                'qatar', 'doha', 'qatari', 'al thani', 'emir', 'gulf', 'middle east', 'arabian',
                'lusail', 'al wakrah', 'al khor', 'education city', 'katara', 'the pearl', 'west bay',
                'aspire', 'hamad', 'khalifa', 'corniche', 'souq waqif', 'msheireb', 'al sadd'
            ]
            
            for term in us_terms:
                if term in text:
                    country_scores['US'] += 1
            for term in uk_terms:
                if term in text:
                    country_scores['UK'] += 1
            for term in qatar_terms:
                if term in text:
                    country_scores['Qatar'] += 1
            
            # Check for language patterns
            language_scores = detect_language_patterns(text)
            for country, score in language_scores.items():
                country_scores[country] += score
            
            # Check for Arabic script in text (strong indicator for Qatar)
            if contains_arabic(text):
                country_scores['Qatar'] += 3
        
        # Determine the country with the highest score
        max_score = max(country_scores.values())
        if max_score > 0:
            # Get the country with the highest score
            for country, score in country_scores.items():
                if score == max_score:
                    return country.lower()
        
        # Default to unknown if no country could be determined
        return 'unknown'

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

        # Detect country information
        logger.info("Detecting country information...")
        df['country'] = df.apply(self.detect_country, axis=1)
        logger.info(f"Country distribution: {df['country'].value_counts().to_dict()}")

        # Apply sentiment analysis
        logger.info("Applying sentiment analysis...")
        sentiments = df['text'].apply(self.get_sentiment)
        df['sentiment_label'], df['sentiment_score'] = zip(*sentiments)

        # Drop temporary columns
        df = df.drop(columns=['normalized_text'])

        # Add random engagement metrics
        logger.info("Adding random engagement metrics...")
        df['likes'] = df.apply(lambda row: random.randint(3, 15) if pd.isna(row['likes']) or row['likes'] == 'N/A' else row['likes'], axis=1)
        df['retweets'] = df.apply(lambda row: random.randint(1, 8) if pd.isna(row['retweets']) or row['retweets'] == 'N/A' else row['retweets'], axis=1)
        df['comments'] = df.apply(lambda row: random.randint(2, 12) if pd.isna(row['comments']) or row['comments'] == 'none' else row['comments'], axis=1)

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