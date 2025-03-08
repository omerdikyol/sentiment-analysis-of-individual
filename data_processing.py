import pandas as pd
from transformers import pipeline
import os

# Load sentiment model
sentiment_pipeline = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")

def get_sentiment_hf(text):
    if pd.isna(text) or str(text).lower() == "none":
        return "neutral", 0.0
    result = sentiment_pipeline(str(text)[:280])[0]
    label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
    return label_map[result["label"]], result["score"]

# Load data with file existence checks
dataframes = []

files_to_check = {
    "x_data": "data_collection/x_data.csv",
    "linkedin_data": "data_collection/linkedin_data.csv",
    "instagram_data": "data_collection/instagram_data.csv",
    "news_data": "data_collection/news_data.csv"
}

for name, filepath in files_to_check.items():
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        try:
            df = pd.read_csv(filepath)
            # Standardize column names (case insensitive)
            df.columns = [col.lower() for col in df.columns]
            
            # Make sure required columns exist, create them if not
            required_columns = ["source", "platform", "type", "post_id", "date", "text", "country"]
            for col in required_columns:
                if col not in df.columns:
                    if col == "source":
                        df[col] = name.replace("_data", "").capitalize()
                    elif col == "text" and "text" not in df.columns:
                        # Look for similar column names
                        text_cols = [c for c in df.columns if "text" in c or "content" in c or "title" in c]
                        if text_cols:
                            df[col] = df[text_cols[0]]
                        else:
                            print(f"Warning: No text column found in {filepath}")
                            df[col] = "No text"
                    else:
                        df[col] = "unknown"
            
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

# Convert date if possible
try:
    full_df["date"] = pd.to_datetime(full_df["date"], errors="coerce")
except:
    print("Warning: Could not convert date column to datetime format")

# Save
full_df.to_csv("processed_data.csv", index=False)
print(f"Data processing complete. Processed {len(full_df)} records. Saved to 'processed_data.csv'.")