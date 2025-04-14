import os
import pandas as pd
import json
import time
from pathlib import Path
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from apify_client import ApifyClient

# Load environment variables
load_dotenv()

# API Key from environment variables
API_TOKEN = os.getenv("APIFY_API_TOKEN")
ACTOR_ID = "microlink/twitter-scraper" # Example Actor ID, verify correct one

def collect_tweets_apify(queries: List[str], output_file=None, max_tweets=100):
    """Collect tweets using the Apify Twitter Scraper Actor."""
    if not API_TOKEN:
        raise ValueError("APIFY_API_TOKEN must be set in .env file")

    client = ApifyClient(API_TOKEN)

    if output_file is None:
        today = datetime.now().strftime("%Y%m%d")
        output_file = str(Path(__file__).parent.parent.parent / "data" / "raw" / f"twitter_apify_data_{today}.csv")
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    all_tweets = []
    for query in queries:
        print(f"[Twitter Apify] Searching for tweets containing: '{query}'")
        run_input = {
            "queries": [query], # Actor likely expects a list of queries
            "maxTweetsPerQuery": max_tweets,
            # Add other relevant input fields for the actor 
            # e.g., language, location, date limits, etc.
        }
        try:
            print(f"[Twitter Apify] Running Actor for query: {query}")
            run = client.actor(ACTOR_ID).call(run_input=run_input)
            dataset_id = run["defaultDatasetId"]
            print(f"[Twitter Apify] Actor run completed. Dataset ID: {dataset_id}")

            items_count = 0
            for item in client.dataset(dataset_id).iterate_items():
                # Process item - map fields to your desired CSV format
                # Example mapping (adjust based on actual actor output):
                tweet_data = {
                     'source': 'Twitter',
                     'platform': 'Twitter',
                     'type': 'tweet',
                     'post_id': item.get('id_str') or item.get('id'),
                     'date': item.get('created_at'),
                     'text': item.get('full_text') or item.get('text'),
                     'user_name': item.get('user', {}).get('name'),
                     'user_handle': item.get('user', {}).get('screen_name'),
                     'retweets': item.get('retweet_count'),
                     'likes': item.get('favorite_count'),
                     'url': f"https://twitter.com/{item.get('user', {}).get('screen_name', 'user')}/status/{item.get('id_str')}" if item.get('id_str') else 'unknown',
                     'query': query # Add the query used
                }
                all_tweets.append(tweet_data)
                items_count += 1
            print(f"[Twitter Apify] Collected {items_count} tweets for query: '{query}'")
            time.sleep(2)
        except Exception as e:
            print(f"[Twitter Apify] Error running Actor for query '{query}': {str(e)}")

    # Save data
    if all_tweets:
        df = pd.DataFrame(all_tweets)
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            try:
                existing_df = pd.read_csv(output_file)
                df = pd.concat([existing_df, df], ignore_index=True)
            except pd.errors.EmptyDataError:
                print(f"Warning: The file '{output_file}' is empty. Creating a new file.")
        df.to_csv(output_file, index=False, mode='a', header=not Path(output_file).exists())
        print(f"[Twitter Apify] Saved/Appended {len(df)} tweets to {output_file}")
    else:
        print("[Twitter Apify] No tweets collected.")

def main(target_and_variations: List[str]):
    """Main function called by run_collectors. Accepts target/variations list."""
    if not target_and_variations:
        print("[Twitter Apify] Error: No target/query variations provided.")
        return
        
    target_name = target_and_variations[0]
    queries = target_and_variations[1:]
    print(f"[Twitter Apify] Received Target: {target_name}, Queries: {queries}")
    
    today = datetime.now().strftime("%Y%m%d")
    safe_target_name = target_name.replace(" ", "_").lower()
    output_path = Path(__file__).parent.parent.parent / "data" / "raw" / f"twitter_apify_{safe_target_name}_{today}.csv"
    
    # Call the collection function with the queries
    collect_tweets_apify(queries=queries, output_file=str(output_path))

if __name__ == "__main__":
    print("Running Twitter Apify collector directly (without args)... Use run_collectors.py for proper execution.")
    main([]) # Pass empty list 