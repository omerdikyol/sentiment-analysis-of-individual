import tweepy
import pandas as pd
from newsapi import NewsApiClient

# Twitter API setup (replace with your own credentials)
consumer_key = "REDACTED_KEY"
consumer_secret = "REDACTED_SECRET"
access_token = "REDACTED_TOKEN"
access_token_secret = "REDACTED_TOKEN_SECRET"

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
api = tweepy.API(auth)

# Search term
individual_name = "Sheikh Tamim ibn Hamad Al Thani"

# Fetch tweets
query = f"{individual_name} -filter:retweets"  # Exclude retweets
tweets = tweepy.Cursor(api.search_tweets, q=query, lang="en", tweet_mode="extended").items(100)  # Limit to 100

tweet_data = []
for tweet in tweets:
    tweet_data.append({
        "source": "Twitter",
        "platform": "Twitter",
        "date": tweet.created_at,
        "text": tweet.full_text,
        "retweets": tweet.retweet_count,
        "likes": tweet.favorite_count,
        "user_location": tweet.user.location if tweet.user.location else "unknown"
    })

tweet_df = pd.DataFrame(tweet_data)

# NewsAPI setup (replace with your own API key)
newsapi = NewsApiClient(api_key="your_api_key")

# Fetch news articles from UK and US sources
articles = newsapi.get_everything(
    q=individual_name,
    language="en",
    sort_by="publishedAt",
    page_size=100,  # Limit to 100
    domains="bbc.co.uk,guardian.co.uk,nytimes.com,washingtonpost.com"  # UK and US sources
)

article_data = []
for article in articles["articles"]:
    country = "uk" if "co.uk" in article["url"] else "us"
    article_data.append({
        "source": "News",
        "platform": article["source"]["name"],
        "date": article["publishedAt"],
        "text": article["title"] + " " + (article["description"] if article["description"] else ""),
        "url": article["url"],
        "country": country
    })

article_df = pd.DataFrame(article_data)

# Save to CSV
tweet_df.to_csv("tweets.csv", index=False)
article_df.to_csv("articles.csv", index=False)

print("Data collection complete. Files saved as 'tweets.csv' and 'articles.csv'.")