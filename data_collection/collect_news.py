from newsapi import NewsApiClient
import pandas as pd
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from query_variations import query_variations

def collect_news_data(output_file="news_data.csv"):
    load_dotenv()
    api_key = os.getenv("NEWSAPI_KEY")
    if not api_key:
        raise ValueError("NEWSAPI_KEY must be set in .env")

    newsapi = NewsApiClient(api_key=api_key)

    # UK and US news sources
    uk_sources = [
        "bbc.co.uk", "theguardian.com", "telegraph.co.uk", "independent.co.uk", "dailymail.co.uk",
        "thetimes.co.uk", "ft.com", "standard.co.uk", "mirror.co.uk", "express.co.uk",
        "sky.com", "itv.com", "channel4.com",
        "manchestereveningnews.co.uk", "liverpoolecho.co.uk", "birminghammail.co.uk",
        "walesonline.co.uk", "scotsman.com", "heraldscotland.com", "belfasttelegraph.co.uk",
        "economist.com", "newstatesman.com", "spectator.co.uk"
    ]
    us_sources = [
        "nytimes.com", "washingtonpost.com", "cnn.com", "usatoday.com", "foxnews.com",
        "wsj.com", "latimes.com", "nypost.com", "chicagotribune.com", "bostonglobe.com",
        "time.com", "newsweek.com", "bloomberg.com", "forbes.com", "reuters.com",
        "abcnews.go.com", "nbcnews.com", "cbsnews.com", "msnbc.com", "pbs.org",
        "sfgate.com", "miamiherald.com", "denverpost.com", "dallasnews.com", "seattletimes.com",
        "philly.com", "ajc.com", "houstonchronicle.com", "startribune.com", "tampabay.com",
        "vox.com", "slate.com", "theatlantic.com", "politico.com", "buzzfeednews.com",
        "huffpost.com", "axios.com", "thedailybeast.com"
    ]
    all_sources = ",".join(uk_sources + us_sources)

    # Calculate 29 days ago
    today = datetime.now()
    days_ago_29 = today - timedelta(days=28)
    from_date = days_ago_29.strftime("%Y-%m-%d")

    # Initialize an empty DataFrame for all results
    all_article_data = []

    # Run for each query variation separately
    for query in query_variations:
        try:
            print(f"\nFetching articles for query: '{query}' from {len(uk_sources)} UK and {len(us_sources)} US sources...")
            print(f"Date range: from {from_date} to {today.strftime('%Y-%m-%d')}")
            response = newsapi.get_everything(
                q=query,
                language="en",
                sort_by="publishedAt",
                page_size=100,  # Max per query
                domains=all_sources,
                from_param=from_date
            )
            
            print(f"API response status: {response['status']}")
            print(f"Total results available: {response.get('totalResults', 0)}")
            articles = response.get("articles", [])
            print(f"Articles returned: {len(articles)}")
            if articles:
                print("Sample article titles:", [a["title"] for a in articles[:3]])

            if not articles:
                print(f"No articles found for query: '{query}'")
                continue
            
            for article in articles:
                domain = article["url"].split("/")[2].lower()
                country = "uk" if any(uk in domain for uk in uk_sources) else "us"
                all_article_data.append({
                    "source": "News",
                    "platform": article["source"]["name"],
                    "type": "post",
                    "post_id": article["url"].split("/")[-1],
                    "date": article["publishedAt"],
                    "text": (article["title"] or "") + " " + (article["description"] or ""),
                    "retweets": "N/A",
                    "likes": "N/A",
                    "user_location": "N/A",
                    "country": country,
                    "comments": "none"
                })

        except Exception as e:
            print(f"Error fetching news data for query '{query}': {e}")

    # Save all collected data
    if all_article_data:
        df = pd.DataFrame(all_article_data)
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            try:
                existing_df = pd.read_csv(output_file)
                df = pd.concat([existing_df, df], ignore_index=True)
            except pd.errors.EmptyDataError:
                print(f"Warning: The file '{output_file}' is empty. Creating a new file.")
        df.to_csv(output_file, index=False)
        print(f"\nCollected {len(all_article_data)} total articles from UK/US news sources across all queries. Saved to '{output_file}'.")
    else:
        print("\nNo articles collected across all queries. Check API key, query relevance, or source coverage.")
        df = pd.DataFrame()
        df.to_csv(output_file, index=False)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    today = datetime.now().strftime("%Y%m%d")
    collect_news_data(output_file=f"news_data_{today}.csv")