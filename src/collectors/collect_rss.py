import feedparser
import pandas as pd
from datetime import datetime
from pathlib import Path
import logging
from typing import List, Dict, Any
from query_variations import query_variations
import time
from urllib.parse import quote
import re
import socket
from urllib.error import URLError, HTTPError
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RSSFeedCollector:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent.parent
        
        # Use the predefined query variations as keywords for filtering
        self.qatar_emir_keywords = query_variations
        
        # Timeout settings
        self.feed_timeout = 10  # seconds for feed fetch timeout
        self.max_retries = 2    # maximum number of retries for each feed
        
        # Track failed sources
        self.failed_sources = set()
        self.source_failures = {}  # Track number of failures per source
        
        # List of RSS feeds to check
        self.rss_feeds = [
            # Qatar News
            "https://www.gulf-times.com/rss",
            "https://www.qatar-tribune.com/rss",
            "https://thepeninsulaqatar.com/rss",
            "https://dohanews.co/feed/",
            "https://www.qna.org.qa/en/rss",  # Qatar News Agency
            "https://www.lusailnews.net/rss",  # Lusail News
            "https://alarab.qa/rss",  # Al Arab Qatar
            "https://www.al-watan.com/rss",  # Al-Watan Qatar
            
            # Major Middle East News
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://english.alarabiya.net/rss",  # Al Arabiya English
            "https://www.arabnews.com/rss.xml",
            "https://gulfnews.com/rss",
            "https://www.khaleejtimes.com/rss",
            "https://www.thenationalnews.com/rss",
            "https://english.aawsat.com/rss",  # Asharq Al-Awsat
            "https://www.middleeastmonitor.com/feed/",  # MEMO
            "https://english.alaraby.co.uk/rss",  # The New Arab
            
            # UAE News (relevant for regional coverage)
            "https://www.emirates247.com/rss",
            "https://www.zawya.com/rss",  # ZAWYA (Business)
            "https://www.albayan.ae/rss",  # Al Bayan
            
            # UK News
            "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",  # BBC Middle East
            "https://feeds.bbci.co.uk/news/rss.xml",  # BBC Main
            "https://www.theguardian.com/world/middleeast/rss",  # Guardian Middle East
            "https://www.theguardian.com/world/rss",  # Guardian World
            "https://www.independent.co.uk/news/world/middle-east/rss",
            "https://www.telegraph.co.uk/rss.xml",
            "https://www.thetimes.co.uk/rss",
            "https://www.dailymail.co.uk/news/worldnews/index.rss",  # Daily Mail World News
            
            # US News
            "http://rss.cnn.com/rss/edition_meast.rss",  # CNN Middle East
            "http://rss.cnn.com/rss/cnn_topstories.rss",  # CNN Top Stories
            "https://www.reuters.com/rss/world/middle-east",  # Reuters Middle East
            "https://www.reuters.com/rss/topNews",  # Reuters Top News
            "https://feeds.npr.org/1001/rss.xml",  # NPR News
            "https://www.wsj.com/xml/rss/3_7481.xml",  # WSJ World News
            "https://www.latimes.com/world/middleeast/rss2.0.xml",  # LA Times Middle East
            "https://nypost.com/news/feed/",
            "https://www.washingtontimes.com/rss/headlines/news/world/",
            "https://www.voanews.com/api/zq$omekvi",  # Voice of America
            "https://www.usnews.com/rss/news",  # US News & World Report
            
            # Business and Politics
            "https://feeds.bloomberg.com/markets/news.rss",
            "https://www.forbes.com/middle-east/feed/",
            "https://www.ft.com/world/mideast?format=rss",  # Financial Times Middle East
            "https://www.economist.com/middle-east-and-africa/rss.xml",
            "https://www.cnbc.com/id/100727362/device/rss/rss.html",  # CNBC Middle East
            "https://www.marketwatch.com/rss/topstories",  # MarketWatch
            "https://www.thestreet.com/rss",  # TheStreet

            # Diplomatic and Policy News
            "https://www.brookings.edu/rss",  # Brookings Institution
            "https://www.chathamhouse.org/rss",  # Chatham House
            "https://www.cfr.org/rss.xml",  # Council on Foreign Relations
            "https://www.atlanticcouncil.org/feed/",  # Atlantic Council
            "https://www.csis.org/rss.xml",  # Center for Strategic and International Studies
            
            # Energy News (relevant for Qatar)
            "https://www.rigzone.com/news/rss/rigzone_latest.aspx",  # Rigzone
            "https://oilprice.com/rss/main",  # OilPrice.com
            "https://www.spglobal.com/platts/en/rss-feed",  # S&P Global Platts
            "https://www.naturalgasworld.com/rss/natural-gas-news-rss"  # Natural Gas World
        ]

    def _clean_text(self, text: str) -> str:
        """Clean the text by removing extra whitespace and HTML tags"""
        if not text:
            return ""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Remove extra whitespace
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = ' '.join(text.split())
        return text

    def _is_relevant_article(self, title: str, description: str, query: str) -> bool:
        """
        Check if the article is relevant to Qatar Emir based on title and description
        """
        text = (title + " " + description).lower()
        
        # Check if any of the Qatar Emir keywords are present
        for keyword in self.qatar_emir_keywords:
            if keyword.lower() in text:
                return True
                
        # Also check the original query if it's not in the predefined variations
        if query.lower() not in [var.lower() for var in self.qatar_emir_keywords]:
            return query.lower() in text
            
        return False

    def _parse_feed_with_timeout(self, feed_url: str) -> Any:
        """Parse feed with timeout handling"""
        # Set socket timeout for the request
        original_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(self.feed_timeout)
        
        try:
            return feedparser.parse(feed_url)
        finally:
            # Restore original timeout
            socket.setdefaulttimeout(original_timeout)

    def _should_retry_source(self, feed_url: str, error: Exception) -> bool:
        """Determine if we should retry a failed source"""
        # Initialize failure count if not exists
        if feed_url not in self.source_failures:
            self.source_failures[feed_url] = 0
            
        self.source_failures[feed_url] += 1
        
        # Don't retry if we've hit the maximum retries
        if self.source_failures[feed_url] > self.max_retries:
            return False
            
        # Don't retry for certain types of errors
        if isinstance(error, (HTTPError, URLError)):
            if isinstance(error, HTTPError) and error.code in [403, 404, 410]:  # Permanent errors
                return False
                
        return True

    def _parse_feed(self, feed_url: str, query: str) -> List[Dict[Any, Any]]:
        """Parse a single RSS feed and return relevant articles"""
        if feed_url in self.failed_sources:
            logger.debug(f"Skipping previously failed source: {feed_url}")
            return []
            
        try:
            # Try to parse the feed with timeout
            feed = self._parse_feed_with_timeout(feed_url)
            
            # Check if feed parsing was successful
            if hasattr(feed, 'status') and feed.status >= 400:
                raise HTTPError(feed_url, feed.status, f"HTTP Error: {feed.status}", {}, None)
                
            if feed.get('bozo', 0) == 1 and hasattr(feed, 'bozo_exception'):
                raise feed.bozo_exception
            
            articles = []
            entries = feed.get('entries', [])
            
            if not entries and hasattr(feed, 'feed') and not feed.feed:
                raise ValueError("Empty or invalid feed")
            
            for entry in entries:
                title = entry.get('title', '')
                description = entry.get('description', '')
                
                if self._is_relevant_article(title, description, query):
                    # Get the full content if available
                    content = entry.get('content', [{}])[0].get('value', '') if 'content' in entry else ''
                    if not content:
                        content = entry.get('summary', description)
                    
                    article = {
                        'title': self._clean_text(title),
                        'description': self._clean_text(description),
                        'content': self._clean_text(content),
                        'url': entry.get('link', ''),
                        'published_date': entry.get('published', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                        'source': feed.feed.get('title', feed_url),
                        'source_url': feed_url,
                        'query': query,
                        'language': entry.get('language', 'en')
                    }
                    articles.append(article)
            
            # Reset failure count on success
            self.source_failures.pop(feed_url, None)
            return articles
            
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            logger.warning(f"Error parsing feed {feed_url}: {error_type} - {error_msg}")
            
            if not self._should_retry_source(feed_url, e):
                logger.error(f"Marking source as failed after multiple attempts: {feed_url}")
                self.failed_sources.add(feed_url)
                
            return []

    def collect_from_feeds(self, query: str) -> List[Dict[Any, Any]]:
        """Collect news from all RSS feeds for a given query"""
        all_articles = []
        
        for feed_url in self.rss_feeds:
            if feed_url in self.failed_sources:
                continue
                
            try:
                logger.info(f"Collecting from {feed_url}")
                articles = self._parse_feed(feed_url, query)
                all_articles.extend(articles)
                
                # Be nice to the servers
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error collecting from {feed_url}: {str(e)}")
                continue
        
        # Log summary of failed sources
        if self.failed_sources:
            logger.warning(f"Failed sources in this run: {len(self.failed_sources)}")
            for failed_url in self.failed_sources:
                logger.warning(f"Failed source: {failed_url}")
        
        return all_articles

    def collect_all(self, queries: List[str] = None, output_file: str = None) -> None:
        """
        Collect news for all queries and save to CSV
        
        Args:
            queries: Optional list of additional search queries beyond the predefined variations
            output_file: Optional output file path. If not provided, will use default path.
        """
        all_articles = []
        
        # Use predefined variations as the base queries
        search_queries = self.qatar_emir_keywords.copy()
        
        # Add any additional queries if provided
        if queries:
            search_queries.extend(queries)
        
        # Remove duplicates while preserving order
        search_queries = list(dict.fromkeys(search_queries))
        
        for query in search_queries:
            logger.info(f"Collecting RSS feed news for query: {query}")
            articles = self.collect_from_feeds(query)
            all_articles.extend(articles)
        
        if all_articles:
            df = pd.DataFrame(all_articles)
            
            # Remove duplicates based on URL and title
            df = df.drop_duplicates(subset=['url', 'title'])
            
            # Sort by published date
            df['published_date'] = pd.to_datetime(df['published_date'])
            df = df.sort_values('published_date', ascending=False)
            
            # Save to CSV
            if output_file is None:
                output_file = self.base_path / 'data' / 'raw' / f'rss_news_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            
            output_file = Path(output_file)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            df.to_csv(output_file, index=False)
            logger.info(f"Saved {len(df)} articles to {output_file}")
        else:
            logger.warning("No articles found for any query")

def main():
    collector = RSSFeedCollector()
    # No need to provide queries as we're using predefined variations
    collector.collect_all()

if __name__ == "__main__":
    main() 