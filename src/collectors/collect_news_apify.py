import os
import pandas as pd
import json
import time
from pathlib import Path
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from apify_client import ApifyClient

def collect_news_apify(queries: List[str], output_file=None, language="US:en"):
    """
    Collect news data using the Apify API for the given queries.
    
    Args:
        queries (List[str]): List of query strings to search for.
        output_file: Path to save the results
        language: Language of news to search for (default: "US:en")
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
        output_file = str(Path(__file__).parent.parent.parent / "data" / "raw" / f"news_apify_data_{today}.csv")
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    all_data = []
    
    # Process each query variation passed as argument
    for query in queries:
        print(f"[News Apify] Searching for news about: {query}")
        
        # Prepare the Actor input
        run_input = {
            "keywords": [query],
            "language": language,
        }
        
        try:
            print(f"[News Apify] Running Apify News Actor with query: {query}")
            # Run the Actor and wait for it to finish
            run = client.actor("v2y7x1v2Muk1NlPyZ").call(run_input=run_input)
            
            # Fetch results from the Actor's dataset
            dataset_id = run["defaultDatasetId"]
            print(f"[News Apify] Actor run completed. Dataset ID: {dataset_id}")
            
            # Collect items from the dataset
            items_count = 0
            for item in client.dataset(dataset_id).iterate_items():
                try:
                    # Print the raw item for debugging
                    # print(f"Processing news item: {item}") # Optionally keep for detailed debug
                    
                    # Extract relevant information
                    title = item.get("title", "unknown")
                    url = item.get("link", "unknown")
                    source = item.get("source", "unknown")
                    domain = item.get("domain", "unknown")
                    text = title
                    published_date = item.get("published", "unknown")
                    image_url = item.get("image", "unknown")
                    keyword = item.get("keyword", query) # Fallback to the main query if keyword missing
                    country = "unknown"
                    if domain:
                        if domain.endswith(".qa") or "qatar" in domain.lower():
                            country = "qatar"
                        elif domain.endswith(".com") or domain.endswith(".org"):
                            country = "us"  # Assumption, might not always be true
                        elif domain.endswith(".uk"):
                            country = "uk"
                        elif domain.endswith(".ae"):
                            country = "uae"
                        elif domain.endswith(".ng"):
                            country = "nigeria"
                        elif domain.endswith(".in"):
                            country = "india"
                    
                    all_data.append({
                        "source": "News",
                        "platform": source,
                        "type": "article",
                        "post_id": url.split("/")[-1] if url != "unknown" else "unknown",
                        "date": published_date,
                        "text": text,
                        "title": title,
                        "url": url,
                        "image_url": image_url,
                        "domain": domain,
                        "country": country,
                        "query": keyword
                    })
                    
                    items_count += 1
                    if items_count % 10 == 0:
                        print(f"[News Apify] Processed {items_count} news items for query '{query}'...")
                    
                except Exception as e:
                    print(f"[News Apify] Error processing news item: {str(e)}")
                    continue
            
            print(f"[News Apify] Collected {items_count} news items for query: {query}")
            
            # Add a small delay between queries
            time.sleep(2)
            
        except Exception as e:
            print(f"[News Apify] Error running News Actor for query '{query}': {str(e)}")
    
    # Save the collected data
    if all_data:
        df = pd.DataFrame(all_data)
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            try:
                existing_df = pd.read_csv(output_file)
                df = pd.concat([existing_df, df], ignore_index=True)
            except pd.errors.EmptyDataError:
                print(f"[News Apify] Warning: The file '{output_file}' is empty. Creating a new file.")
        df.to_csv(output_file, index=False)
        print(f"\n[News Apify] Collected {len(all_data)} total news articles. Saved to '{output_file}'.")
    else:
        print("\n[News Apify] No news articles collected.")
        df = pd.DataFrame(columns=["source", "platform", "type", "post_id", "date", "text", "title", 
                                  "url", "image_url", "domain", "country", "query"])
        df.to_csv(output_file, index=False)
        print(f"[News Apify] Created empty '{output_file}' with headers.")

def main(target_and_variations: List[str]):
    """Main function called by run_collectors. Accepts target/variations list."""
    if not target_and_variations:
         print("[News Apify] Error: No target/query variations provided.")
         return
         
    target_name = target_and_variations[0]
    queries = target_and_variations[1:]
    print(f"[News Apify] Received Target: {target_name}, Queries: {queries}")
    
    # Construct output file name
    today = datetime.now().strftime("%Y%m%d")
    # Use target name in filename for clarity, replacing spaces
    safe_target_name = target_name.replace(" ", "_").lower()
    output_path = Path(__file__).parent.parent.parent / "data" / "raw" / f"news_apify_{safe_target_name}_{today}.csv"
    
    # Call the collection function with the queries
    collect_news_apify(queries=queries, output_file=str(output_path))

# Keep the __main__ block for potential direct testing, but it won't receive args
if __name__ == "__main__":
    print("Running News Apify collector directly (without args)... Use run_collectors.py for proper execution.")
    # This direct call will likely fail or use default/empty queries now.
    main([]) # Pass empty list for direct run scenario 