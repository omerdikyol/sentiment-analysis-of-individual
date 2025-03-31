import os
import pandas as pd
import json
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient
from query_variations import query_variations

def collect_news_apify(output_file=None, language="US:en"):
    """
    Collect news data using the Apify API.
    
    Args:
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
    
    # Process each query variation
    for query in query_variations:
        print(f"Searching for news about: {query}")
        
        # Prepare the Actor input
        run_input = {
            "keywords": [query],
            "language": language,
        }
        
        try:
            print(f"Running Apify News Actor with query: {query}")
            # Run the Actor and wait for it to finish
            run = client.actor("v2y7x1v2Muk1NlPyZ").call(run_input=run_input)
            
            # Fetch results from the Actor's dataset
            dataset_id = run["defaultDatasetId"]
            print(f"Actor run completed. Dataset ID: {dataset_id}")
            
            # Collect items from the dataset
            items_count = 0
            for item in client.dataset(dataset_id).iterate_items():
                try:
                    # Print the raw item for debugging
                    print(f"Processing news item: {item}")
                    
                    # Extract relevant information - updated based on actual response structure
                    title = item.get("title", "unknown")
                    url = item.get("link", "unknown")  # Field is "link" not "url"
                    source = item.get("source", "unknown")  # Source is a string, not an object
                    domain = item.get("domain", "unknown")
                    
                    # The API doesn't provide content or description, just title
                    text = title
                    
                    # Published date
                    published_date = item.get("published", "unknown")  # Field is "published"
                    
                    # Get image if available
                    image_url = item.get("image", "unknown")
                    
                    # Keyword that matched
                    keyword = item.get("keyword", "unknown")
                    
                    # Determine country (basic heuristic based on domain)
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
                    
                    # Append to data collection
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
                        "query": keyword  # Use the keyword that matched
                    })
                    
                    items_count += 1
                    if items_count % 10 == 0:
                        print(f"Processed {items_count} news items...")
                    
                except Exception as e:
                    print(f"Error processing news item: {str(e)}")
                    continue
            
            print(f"Collected {items_count} news items for query: {query}")
            
            # Add a small delay between queries
            time.sleep(2)
            
        except Exception as e:
            print(f"Error running News Actor for query '{query}': {str(e)}")
    
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
        print(f"\nCollected {len(all_data)} total news articles. Saved to '{output_file}'.")
    else:
        print("\nNo news articles collected.")
        df = pd.DataFrame(columns=["source", "platform", "type", "post_id", "date", "text", "title", 
                                  "url", "image_url", "domain", "country", "query"])
        df.to_csv(output_file, index=False)
        print(f"Created empty '{output_file}' with headers.")

def main():
    today = datetime.now().strftime("%Y%m%d")
    output_path = Path(__file__).parent.parent.parent / "data" / "raw" / f"news_apify_data_{today}.csv"
    collect_news_apify(output_file=str(output_path))

if __name__ == "__main__":
    main() 