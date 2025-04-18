import os
import pandas as pd
import json
import time
from pathlib import Path
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from apify_client import ApifyClient

def collect_twitter_apify(queries: List[str], output_file=None, max_items=200, query_type="Latest", language="en"):
    """
    Collect Twitter/X data using the Apify API for the given queries.
    
    Args:
        queries (List[str]): List of query strings to search for.
        output_file: Path to save the results
        max_items: Maximum number of items to fetch per query (default: 200)
        query_type: Type of query to run (default: "Latest")
        language: Language of tweets to search for (default: "en")
    """
    load_dotenv()
    
    # API Key from environment variables
    api_token = os.getenv("APIFY_API_TOKEN")
    if not api_token:
        raise ValueError("APIFY_API_TOKEN must be set in .env file")
    
    # Initialize the ApifyClient
    client = ApifyClient(api_token)
    
    # Ensure output directory exists
    if output_file is None:
        today = datetime.now().strftime("%Y%m%d")
        output_file = str(Path(__file__).parent.parent.parent / "data" / "raw" / f"twitter_apify_data_{today}.csv")
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Date range for search (covering full year of 2024)
    since_date = "2024-01-01_00:00:00_UTC"
    until_date = "2024-12-31_23:59:59_UTC"
    
    all_data = []
    
    # Process each query variation passed as argument
    for query in queries:
        print(f"[Twitter Apify] Searching for query: {query}")
        
        # Create search terms for this query
        search_terms = [
            f"{query} since:{since_date} until:{until_date}",
        ]
        
        # Prepare the Actor input
        run_input = {
            "searchTerms": search_terms,
            "maxItems": max_items,
            "queryType": query_type,
            "lang": language,
            "since": since_date,
            "until": until_date,
            "filter:verified": False,
            "filter:blue_verified": False,
            "filter:nativeretweets": False,
            "include:nativeretweets": False,
            "filter:replies": False,
            "filter:quote": False,
            "min_retweets": 0,
            "min_faves": 0,
            "min_replies": 0,
            "filter:media": False,
            "filter:images": False,
            "filter:videos": False,
        }
        
        try:
            print(f"[Twitter Apify] Running Apify Actor with query: {query}")
            # Run the Actor and wait for it to finish
            run = client.actor("CJdippxWmn9uRfooo").call(run_input=run_input)
            
            # Fetch results from the Actor's dataset
            dataset_id = run["defaultDatasetId"]
            print(f"[Twitter Apify] Actor run completed. Dataset ID: {dataset_id}")
            
            # Collect items from the dataset
            items_count = 0
            for item in client.dataset(dataset_id).iterate_items():
                try:
                    # Extract relevant information - updated based on actual API response structure
                    tweet_id = item.get("id", "unknown")
                    
                    # Get user information
                    author = item.get("author", {})
                    user_name = author.get("userName", "unknown")
                    user_display_name = author.get("name", "unknown")
                    user_avatar = author.get("profilePicture", "unknown")
                    user_location = author.get("location", "unknown")
                    
                    # Get tweet content
                    text = item.get("text", "unknown")
                    created_at = item.get("createdAt", "unknown")
                    
                    # Get engagement metrics
                    retweets = item.get("retweetCount", 0)
                    likes = item.get("likeCount", 0)
                    reply_count = item.get("replyCount", 0)
                    quote_count = item.get("quoteCount", 0)
                    view_count = item.get("viewCount", 0)
                    
                    # Get tweet URL
                    url = item.get("url", "unknown")
                    
                    # Get tweet type information
                    is_reply = item.get("isReply", False)
                    is_retweet = "retweeted_tweet" in item and item["retweeted_tweet"] is not None
                    is_quote = "quoted_tweet" in item and item["quoted_tweet"] is not None
                    
                    # Determine country (basic heuristic based on location)
                    country = "unknown"
                    if user_location and "qatar" in user_location.lower():
                        country = "qatar"
                    elif user_location and any(country in user_location.lower() for country in ["usa", "united states"]):
                        country = "us"
                    elif user_location and any(country in user_location.lower() for country in ["uk", "united kingdom"]):
                        country = "uk"
                    elif user_location and any(country in user_location.lower() for country in ["nigeria"]):
                        country = "nigeria"
                    elif user_location and any(country in user_location.lower() for country in ["india"]):
                        country = "india"
                    # Append to data collection
                    all_data.append({
                        "source": "X",
                        "platform": "X",
                        "type": "post",
                        "post_id": tweet_id,
                        "date": created_at,
                        "text": text,
                        "retweets": retweets,
                        "likes": likes,
                        "user_location": user_location,
                        "country": country,
                        "comments": reply_count,  # Using reply count as comments
                        "user_display_name": user_display_name,
                        "user_name": user_name,
                        "user_avatar": user_avatar,
                        "reply_count": reply_count,
                        "quote_count": quote_count,
                        "view_count": view_count,
                        "is_reply": is_reply,
                        "is_retweet": is_retweet,
                        "is_quote": is_quote,
                        "url": url,
                        "query": query
                    })
                    
                    items_count += 1
                    if items_count % 10 == 0:
                        print(f"[Twitter Apify] Processed {items_count} items...")
                    
                except Exception as e:
                    print(f"[Twitter Apify] Error processing item: {e}")
                    continue
            
            print(f"[Twitter Apify] Collected {items_count} items for query: {query}")
            
            # Add a small delay between queries
            time.sleep(2)
            
        except Exception as e:
            print(f"[Twitter Apify] Error running Actor for query '{query}': {e}")
    
    # Save the collected data
    if all_data:
        df = pd.DataFrame(all_data)
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            try:
                existing_df = pd.read_csv(output_file)
                df = pd.concat([existing_df, df], ignore_index=True)
            except pd.errors.EmptyDataError:
                print(f"Warning: The file '{output_file}' is empty. Creating a new file.")
        df.to_csv(output_file, index=False)
        print(f"[Twitter Apify] Collected {len(all_data)} total tweets. Saved to '{output_file}'.")
    else:
        print("[Twitter Apify] No tweets collected.")
        df = pd.DataFrame(columns=["source", "platform", "type", "post_id", "date", "text", "retweets", "likes", 
                                  "user_location", "country", "comments", "user_display_name", "user_name", 
                                  "user_avatar", "reply_count", "quote_count", "view_count", "is_reply", 
                                  "is_retweet", "is_quote", "url", "query"])
        df.to_csv(output_file, index=False)
        print(f"[Twitter Apify] Created empty '{output_file}' with headers.")

def main(target_and_variations: List[str]):
    """Main function called by run_collectors. Accepts target/variations list."""
    if not target_and_variations:
         print("[Twitter Apify] Error: No target/query variations provided.")
         return

    target_name = target_and_variations[0]
    queries = target_and_variations[1:]
    print(f"[Twitter Apify] Received Target: {target_name}, Queries: {queries}")

    # Construct output file name using target name
    today = datetime.now().strftime("%Y%m%d")
    safe_target_name = target_name.replace(" ", "_").lower()
    output_path = Path(__file__).parent.parent.parent / "data" / "raw" / f"twitter_apify_{safe_target_name}_{today}.csv"

    # Call the collection function with the queries
    collect_twitter_apify(queries=queries, output_file=str(output_path))

if __name__ == "__main__":
    # Update the direct run message and call main appropriately
    print("[Twitter Apify] Running Twitter Apify collector directly (without args)... Use run_collectors.py for proper execution.")
    main([]) # Pass empty list for direct run scenario 