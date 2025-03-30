#!/usr/bin/env python3
"""
Example script demonstrating sentiment change detection and notification.
"""

import os
import sys
import logging
import pandas as pd
from pathlib import Path
import random
from datetime import datetime

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.utils.notification_service import send_analysis_report, detect_sentiment_change
from src.utils.mail_config import get_email_recipients, is_email_notification_enabled

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def create_sample_data(sentiment_shift=0.0):
    """Create sample sentiment data with optional shift."""
    # Topics to include
    positive_topics = ["charity work", "economic policies", "international relations", 
                     "public speaking", "community engagement", "diplomatic efforts"]
    negative_topics = ["controversial statements", "policy criticism", "past actions", 
                       "public criticism", "political tensions"]
    neutral_topics = ["media appearance", "travel", "official visit", "meeting", "conference"]
    
    # Sources
    sources = ["twitter", "news", "rss", "mention"]
    
    # Create sample data
    data = []
    
    # Generate 100 records with sentiment distribution
    for i in range(100):
        # Determine sentiment (biased by shift parameter)
        rand = random.random() + sentiment_shift
        if rand < 0.3:  # Negative
            sentiment_score = -random.uniform(0.2, 1.0)
            sentiment_label = "negative"
            keywords = ", ".join(random.sample(negative_topics, random.randint(1, 3)))
        elif rand < 0.6:  # Neutral
            sentiment_score = random.uniform(-0.2, 0.2)
            sentiment_label = "neutral"
            keywords = ", ".join(random.sample(neutral_topics, random.randint(1, 3)))
        else:  # Positive
            sentiment_score = random.uniform(0.2, 1.0)
            sentiment_label = "positive"
            keywords = ", ".join(random.sample(positive_topics, random.randint(1, 3)))
        
        # Create record
        record = {
            "id": i,
            "text": f"Sample text {i}",
            "source": random.choice(sources),
            "timestamp": datetime.now().isoformat(),
            "sentiment_score": sentiment_score,
            "sentiment_label": sentiment_label,
            "keywords": keywords
        }
        data.append(record)
    
    return pd.DataFrame(data)

def main():
    """Demonstrate sentiment change detection and notification."""
    # Check if email is configured
    if not is_email_notification_enabled():
        logger.error(
            "Email notifications are disabled. "
            "Please set EMAIL_NOTIFICATION_ENABLED=true in your .env file."
        )
        return
    
    recipients = get_email_recipients()
    if not recipients:
        logger.error("No email recipients configured. Please set EMAIL_RECIPIENTS in your .env file.")
        custom_recipient = input("Enter a recipient email address for testing: ")
        if custom_recipient:
            recipients = [custom_recipient]
        else:
            return
    
    # Create the processed_data folder if it doesn't exist
    data_path = Path(__file__).parent.parent.parent / "data" / "processed"
    data_path.mkdir(exist_ok=True, parents=True)
    
    # Create sample "previous" data with neutral sentiment
    logger.info("Creating sample previous data with neutral sentiment...")
    previous_data = create_sample_data(sentiment_shift=0.0)
    previous_data.to_csv(data_path / "previous.csv", index=False)
    
    # Ask user for sentiment shift direction
    while True:
        shift_input = input("Enter sentiment shift direction (improve/decline/none): ").lower()
        if shift_input in ['improve', 'decline', 'none']:
            break
        print("Invalid choice. Please enter 'improve', 'decline', or 'none'.")
    
    # Create sample "current" data with shifted sentiment
    sentiment_shift = 0.0
    if shift_input == 'improve':
        sentiment_shift = 0.2  # Shift towards positive
        logger.info("Creating sample current data with improved sentiment...")
    elif shift_input == 'decline':
        sentiment_shift = -0.2  # Shift towards negative
        logger.info("Creating sample current data with declined sentiment...")
    else:
        logger.info("Creating sample current data with similar sentiment...")
    
    current_data = create_sample_data(sentiment_shift=sentiment_shift)
    current_data.to_csv(data_path / "latest.csv", index=False)
    
    # Detect sentiment changes
    logger.info("Detecting sentiment changes...")
    sentiment_change_data = detect_sentiment_change(current_data, previous_data)
    sentiment_changed = sentiment_change_data.get("sentiment_changed", False)
    
    logger.info(f"Sentiment change detected: {sentiment_changed}")
    if sentiment_changed:
        change_value = sentiment_change_data.get("sentiment_change", 0)
        change_direction = "improved" if change_value > 0 else "declined"
        logger.info(f"Sentiment has {change_direction} by {abs(change_value):.2f} points")
        
        # Calculate percentages
        total = len(current_data)
        positive_count = len(current_data[current_data['sentiment_label'] == 'positive'])
        negative_count = len(current_data[current_data['sentiment_label'] == 'negative'])
        neutral_count = len(current_data[current_data['sentiment_label'] == 'neutral'])
        
        positive_pct = (positive_count / total * 100) if total > 0 else 0
        negative_pct = (negative_count / total * 100) if total > 0 else 0
        neutral_pct = (neutral_count / total * 100) if total > 0 else 0
        
        # Extract topics by sentiment
        positive_topics = {}
        negative_topics = {}
        
        for _, row in current_data.iterrows():
            keywords = row['keywords'].split(',') if isinstance(row['keywords'], str) else []
            sentiment = row['sentiment_score']
            
            for keyword in keywords:
                keyword = keyword.strip()
                if not keyword:
                    continue
                    
                if sentiment > 0.2:
                    positive_topics[keyword] = positive_topics.get(keyword, 0) + 1
                elif sentiment < -0.2:
                    negative_topics[keyword] = negative_topics.get(keyword, 0) + 1
        
        # Prepare sample insights
        insights = [
            f"Sentiment has {change_direction} significantly since the last analysis.",
            f"The {change_direction} sentiment is reflected in the {change_direction} mentions of key topics.",
            "Analysis suggests that media coverage tone has shifted.",
            "Recommendation: Monitor for continued sentiment trends in this direction."
        ]
        
        # Add new topics and fading topics to insights
        for topic_data in sentiment_change_data.get("new_topics", []):
            topic = topic_data.get("topic")
            count = topic_data.get("count")
            insights.append(f"New topic detected: '{topic}' with {count} mentions")
        
        for topic_data in sentiment_change_data.get("fading_topics", []):
            topic = topic_data.get("topic")
            prev_count = topic_data.get("previous_count")
            curr_count = topic_data.get("current_count")
            if curr_count == 0:
                insights.append(f"Topic no longer mentioned: '{topic}' (previously {prev_count} mentions)")
            else:
                insights.append(f"Topic declining: '{topic}' reduced from {prev_count} to {curr_count} mentions")
        
        # Prepare analysis data
        analysis_data = {
            "overall_sentiment": current_data['sentiment_score'].mean(),
            "positive_mentions": positive_pct,
            "neutral_mentions": neutral_pct,
            "negative_mentions": negative_pct,
            "total_mentions": total,
            "positive_topics": positive_topics,
            "negative_topics": negative_topics,
            "insights": insights
        }
        
        # Add sentiment change data
        analysis_data.update(sentiment_change_data)
        
        # Send report email
        logger.info("Sending sample report with sentiment change information...")
        success = send_analysis_report(analysis_data, recipients)
        
        if success:
            logger.info(f"Sample report with sentiment change information sent successfully to {', '.join(recipients)}!")
        else:
            logger.error("Failed to send sample report.")
    else:
        logger.info("No significant sentiment change detected.")

if __name__ == "__main__":
    main() 