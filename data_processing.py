import pandas as pd
from transformers import pipeline

# Load the Hugging Face sentiment analysis model
sentiment_pipeline = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")

# Load data
tweet_df = pd.read_csv("tweets.csv")
article_df = pd.read_csv("articles.csv")

# Sentiment analysis function
def get_sentiment_hf(text):
    result = sentiment_pipeline(text[:280])[0]  # Truncate to 280 chars (Twitter-like limit)
    label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
    return label_map[result["label"]], result["score"]

# Apply sentiment analysis
tweet_df[["sentiment_label", "sentiment_score"]] = tweet_df["text"].apply(get_sentiment_hf).apply(pd.Series)
article_df[["sentiment_label", "sentiment_score"]] = article_df["text"].apply(get_sentiment_hf).apply(pd.Series)

# Country parsing for Twitter (heuristic)
def get_country(location):
    if pd.isna(location) or location == "unknown":
        return "unknown"
    location = location.lower()
    if "uk" in location or "united kingdom" in location:
        return "uk"
    elif "us" in location or "united states" in location or "usa" in location:
        return "us"
    return "unknown"

tweet_df["country"] = tweet_df["user_location"].apply(get_country)

# Combine datasets and filter for UK/US
combined_df = pd.concat([tweet_df, article_df], ignore_index=True)
combined_df = combined_df[combined_df["country"].isin(["uk", "us"])]

# Convert date to datetime
combined_df["date"] = pd.to_datetime(combined_df["date"])

# Save processed data
combined_df.to_csv("processed_data.csv", index=False)

print("Data processing complete. File saved as 'processed_data.csv'.")