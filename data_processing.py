import pandas as pd
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import os
import glob
from datetime import datetime
from dateutil import parser

# Define model info
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
MODEL_DIR = "sentiment_model"

# Load or download sentiment model
def get_sentiment_model():
    if os.path.exists(MODEL_DIR):
        print("Loading model from local directory...")
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        return pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    else:
        print("Downloading and saving model...")
        # Download and create the pipeline
        sentiment_pipe = pipeline("sentiment-analysis", model=MODEL_NAME)
        # Save the model and tokenizer
        os.makedirs(MODEL_DIR, exist_ok=True)
        sentiment_pipe.model.save_pretrained(MODEL_DIR)
        sentiment_pipe.tokenizer.save_pretrained(MODEL_DIR)
        return sentiment_pipe

# Load sentiment model
sentiment_pipeline = get_sentiment_model()

def get_sentiment_hf(text):
    if pd.isna(text) or str(text).lower() == "none":
        return "neutral", 0.0
    result = sentiment_pipeline(str(text)[:280])[0]
    label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
    return label_map[result["label"]], result["score"]

# Define the columns to keep
columns_to_keep = ["source", "platform", "type", "date", "text", "url", "published_at"]

# Load data with file existence checks
dataframes = []

# Get all CSV files from csv_files directory
csv_files = glob.glob("data_collection/csv_files/*.csv")

for filepath in csv_files:
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        try:
            df = pd.read_csv(filepath)
            # Standardize column names (case insensitive)
            df.columns = [col.lower() for col in df.columns]
            
            # Extract source name from filename
            source_name = os.path.splitext(os.path.basename(filepath))[0].split('_')[0].capitalize()
            
            # Make sure required columns exist, create them if not
            required_columns = ["source", "platform", "type", "date", "text", "url", "published_at"]
            for col in required_columns:
                if col not in df.columns:
                    if col == "source":
                        df[col] = source_name
                    elif col == "text" and "text" not in df.columns:
                        # Look for similar column names
                        text_cols = [c for c in df.columns if "text" in c or "content" in c or "title" in c]
                        if text_cols:
                            df[col] = df[text_cols[0]]
                        else:
                            print(f"Warning: No text column found in {filepath}")
                            df[col] = "No text"
                    elif col == "date" and "date" not in df.columns and "published_at" in df.columns:
                        # Use published_at as date if date is missing
                        print(f"Using published_at as date in {filepath}")
                        df[col] = df["published_at"]
                    else:
                        df[col] = "unknown"
            
            # Keep only the specified columns
            df = df[columns_to_keep]
            dataframes.append(df)
            print(f"Loaded {len(df)} records from {filepath}")
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
    else:
        print(f"Skipping {filepath} - file not found or empty")

# Check if we have any data to process
if not dataframes:
    print("No data files were found or loaded. Exiting.")
    exit()

# Combine posts
combined_df = pd.concat(dataframes, ignore_index=True)

# Split comments into separate rows if "comments" column exists
comment_rows = []
if "comments" in combined_df.columns:
    for _, row in combined_df.iterrows():
        if not pd.isna(row["comments"]) and row["comments"] != "none":
            comments = row["comments"]
            if isinstance(comments, str):
                for comment in comments.split(";"):
                    if comment.strip():
                        comment_row = row.copy()
                        comment_row["type"] = "comment"
                        comment_row["text"] = comment
                        comment_rows.append(comment_row)

comments_df = pd.DataFrame(comment_rows) if comment_rows else pd.DataFrame()
full_df = pd.concat([combined_df, comments_df], ignore_index=True) if not comments_df.empty else combined_df

# Apply sentiment analysis
full_df[["sentiment_label", "sentiment_score"]] = full_df["text"].apply(get_sentiment_hf).apply(pd.Series)

# Optional country filtering
# If you want to filter by country, uncomment the line below
# full_df = full_df[full_df["country"].str.lower().isin(["uk", "us"])]

# Debug: Print the available columns
print("Available columns in DataFrame:", full_df.columns.tolist())

# Convert date if possible
try:
    # Convert any published_at values to date format if date is empty/unknown
    print("Processing dates...")
    mask = (full_df["date"] == "unknown") & (full_df["published_at"].notna()) & (full_df["published_at"] != "unknown")
    if any(mask):
        print(f"Updating {mask.sum()} empty dates with published_at values")
        full_df.loc[mask, "date"] = full_df.loc[mask, "published_at"]
    
    # Try to handle all date formats
    def safe_parse_date(date_str):
        if pd.notnull(date_str) and date_str != "unknown":
            try:
                # Handle different formats
                return parser.parse(str(date_str)).strftime("%Y-%m-%d")
            except Exception as e:
                print(f"Error parsing date: {date_str}, error: {e}")
                return date_str
        return date_str
    
    # Convert date column
    print("Converting dates to YYYY-MM-DD format...")
    full_df["date"] = full_df["date"].apply(safe_parse_date)
    
    # Show some examples of the parsed dates
    print("Sample of parsed dates:")
    date_sample = full_df[full_df["date"] != "unknown"]["date"].head(5).tolist()
    print(date_sample)
            
except Exception as e:
    print(f"Warning: Could not convert date column to datetime format: {str(e)}")
    import traceback
    traceback.print_exc()

# Save with date and time
current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
output_filename = f"processed/processed_data_{current_time}.csv"
os.makedirs("processed", exist_ok=True)  # Ensure directory exists
full_df.to_csv(output_filename, index=False)
print(f"Data processing complete. Processed {len(full_df)} records. Saved to '{output_filename}'.")