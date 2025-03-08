import tweepy
import pandas as pd
from newsapi import NewsApiClient

# Twitter API setup (replace with your own credentials)
consumer_key = "Snv1xYZhSLkN9sOmXO5IL5jUC"
consumer_secret = "j8Q47835aNEd0b1q2dyBpwrHyeMHLhaVFnpH114dQKrRYNjMhL"
access_token = "4038307823-Er1HEkKdkOLi42vJEhZl8aAfgffSmOJEwTUvulp"
access_token_secret = "hJfLRxRehfRDiT6Q88w48PX1s8FlHG22UaJj5P8l8JDEB"

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
api = tweepy.API(auth)
print("Twitter API setup complete")

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
print(f"Fetched {len(tweet_data)} tweets")

# NewsAPI setup (replace with your own API key)
newsapi = NewsApiClient(api_key="af50310533d54cd59dd04feef26400cf")
print("NewsAPI setup complete")

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
print(f"Fetched {len(article_data)} news articles")

# Save to CSV
tweet_df.to_csv("tweets.csv", index=False)
article_df.to_csv("articles.csv", index=False)

print("Data collection complete. Files saved as 'tweets.csv' and 'articles.csv'.")