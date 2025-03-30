#!/usr/bin/env python3
"""
Notification service for sentiment analysis results.
"""

import os
import logging
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Union

from src.utils.mail_sender import MailSender
from src.utils.mail_config import get_email_recipients, is_email_notification_enabled

logger = logging.getLogger(__name__)

def send_analysis_report(analysis_data: Dict[str, Any], recipients: List[str] = None) -> bool:
    """
    Send an email notification with the analysis results.
    
    Args:
        analysis_data (Dict[str, Any]): The analysis data to include in the email
        recipients (List[str], optional): List of email recipients. 
                                          If None, uses the configured recipients.
    
    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    if not is_email_notification_enabled():
        logger.info("Email notifications are disabled. Skipping report email.")
        return False
    
    if recipients is None:
        recipients = get_email_recipients()
        
    if not recipients:
        logger.warning("No email recipients configured. Skipping report email.")
        return False
    
    # Format the sentiment data into a report
    report_content = format_analysis_report(analysis_data)
    
    # Create a mail sender instance
    mail_sender = MailSender()
    
    # Determine overall sentiment
    overall_sentiment = "Positive"
    sentiment_score = analysis_data.get("overall_sentiment", 0)
    if sentiment_score < 0:
        overall_sentiment = "Negative"
    elif -0.2 <= sentiment_score <= 0.2:
        overall_sentiment = "Neutral"
    
    # Add sentiment change information to subject if available
    subject = f"Sentiment Analysis Report: {overall_sentiment} ({datetime.now().strftime('%Y-%m-%d')})"
    if analysis_data.get("sentiment_changed", False):
        change_direction = "Improved" if analysis_data.get("sentiment_change", 0) > 0 else "Declined"
        subject = f"ALERT: Sentiment {change_direction} - {subject}"
    
    success = mail_sender.send_report_email(
        recipients,
        subject,
        report_content
    )
    
    if success:
        logger.info(f"Analysis report email sent successfully to {', '.join(recipients)}")
    else:
        logger.error(f"Failed to send analysis report email to {', '.join(recipients)}")
        
    return success

def format_analysis_report(analysis_data: Dict[str, Any]) -> str:
    """
    Format the analysis data into an HTML report.
    
    Args:
        analysis_data (Dict[str, Any]): The analysis data
    
    Returns:
        str: Formatted HTML report content
    """
    # Extract key metrics
    sentiment_score = analysis_data.get("overall_sentiment", 0)
    sentiment_text = "Positive" if sentiment_score > 0.2 else ("Negative" if sentiment_score < -0.2 else "Neutral")
    sentiment_color = "#28a745" if sentiment_score > 0.2 else ("#dc3545" if sentiment_score < -0.2 else "#6c757d")
    
    # Format score as a percentage from 0-100% for display
    sentiment_percentage = round((sentiment_score + 1) * 50, 1)
    
    # Get the insights
    insights = analysis_data.get("insights", [])
    insights_html = "<ul>"
    for insight in insights[:5]:  # Show top 5 insights
        insights_html += f"<li>{insight}</li>"
    insights_html += "</ul>"
    
    # Get positive/negative topics
    positive_topics = analysis_data.get("positive_topics", {})
    negative_topics = analysis_data.get("negative_topics", {})
    
    positive_html = "<ul>"
    for topic, count in sorted(positive_topics.items(), key=lambda x: x[1], reverse=True)[:5]:
        positive_html += f"<li>{topic} ({count} mentions)</li>"
    positive_html += "</ul>"
    
    negative_html = "<ul>"
    for topic, count in sorted(negative_topics.items(), key=lambda x: x[1], reverse=True)[:5]:
        negative_html += f"<li>{topic} ({count} mentions)</li>"
    negative_html += "</ul>"
    
    # Add sentiment change section if available
    sentiment_change_html = ""
    if analysis_data.get("sentiment_changed", False):
        change_value = analysis_data.get("sentiment_change", 0)
        change_direction = "improved" if change_value > 0 else "declined"
        change_color = "#28a745" if change_value > 0 else "#dc3545"
        
        # Format percentage changes
        pos_change = analysis_data.get("positive_change", 0)
        neg_change = analysis_data.get("negative_change", 0)
        
        sentiment_change_html = f"""
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 5px solid {change_color};">
            <h3 style="color: {change_color};">Sentiment Change Detected!</h3>
            <p>The overall sentiment has <strong>{change_direction}</strong> since the last analysis.</p>
            <ul>
                <li>Overall sentiment change: <strong>{abs(change_value):.2f} points {change_direction}</strong></li>
                <li>Positive mentions: <strong>{'+' if pos_change > 0 else ''}{pos_change:.1f}%</strong></li>
                <li>Negative mentions: <strong>{'+' if neg_change > 0 else ''}{neg_change:.1f}%</strong></li>
            </ul>
        </div>
        """
    
    # Create HTML report
    html_content = f"""
    <h2>Sentiment Analysis Report</h2>
    <p>Analysis completed on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    
    {sentiment_change_html}
    
    <h3>Overall Sentiment: <span style="color: {sentiment_color}">{sentiment_text} ({sentiment_percentage}%)</span></h3>
    
    <h3>Key Insights:</h3>
    {insights_html}
    
    <h3>Top Positive Themes:</h3>
    {positive_html}
    
    <h3>Top Negative Themes:</h3>
    {negative_html}
    
    <p>This report was automatically generated by the Sentiment Analysis System.</p>
    """
    
    return html_content

def send_collection_notification(collection_data: Dict[str, Any], recipients: List[str] = None) -> bool:
    """
    Send notification that data collection has completed.
    
    Args:
        collection_data (Dict[str, Any]): Collection metrics and data
        recipients (List[str], optional): List of email recipients
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    from src.utils.mail_config import NOTIFY_ON_COLLECTION
    
    if not is_email_notification_enabled() or not NOTIFY_ON_COLLECTION:
        return False
        
    if recipients is None:
        recipients = get_email_recipients()
        
    if not recipients:
        return False
    
    success_rate = collection_data.get("collection_success_rate", 0) * 100
    active_sources = collection_data.get("active_sources", 0)
    total_sources = collection_data.get("total_sources", 0)
    total_records = collection_data.get("total_records", 0)
    
    subject = f"Data Collection Complete: {success_rate:.1f}% Success Rate"
    message = f"""
    <h2>Data Collection Complete</h2>
    <p>Collection completed on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    
    <h3>Collection Metrics:</h3>
    <ul>
        <li>Success Rate: {success_rate:.1f}% ({active_sources}/{total_sources} sources)</li>
        <li>Total Records: {total_records}</li>
    </ul>
    
    <p>The data processing and analysis phase will begin shortly.</p>
    """
    
    mail_sender = MailSender()
    success = mail_sender.send_report_email(recipients, subject, message)
    
    if success:
        logger.info(f"Collection notification email sent successfully to {', '.join(recipients)}")
    
    return success

def detect_sentiment_change(current_data: pd.DataFrame, previous_data: pd.DataFrame, 
                           threshold: float = 0.1) -> Dict[str, Any]:
    """
    Detect significant changes in sentiment between current and previous data.
    
    Args:
        current_data (pd.DataFrame): The current processed data
        previous_data (pd.DataFrame): The previous processed data
        threshold (float): The threshold for significant change (0.1 = 10%)
    
    Returns:
        Dict[str, Any]: Dictionary with change information
    """
    import pandas as pd
    
    result = {
        "sentiment_changed": False,
        "sentiment_change": 0,
        "positive_change": 0,
        "negative_change": 0,
        "neutral_change": 0,
        "new_topics": [],
        "fading_topics": []
    }
    
    # Check if both dataframes have sentiment data
    if 'sentiment_score' not in current_data.columns or 'sentiment_score' not in previous_data.columns:
        return result
    
    # Calculate overall sentiment scores
    current_sentiment = current_data['sentiment_score'].mean() if len(current_data) > 0 else 0
    previous_sentiment = previous_data['sentiment_score'].mean() if len(previous_data) > 0 else 0
    
    # Calculate sentiment change
    sentiment_change = current_sentiment - previous_sentiment
    
    # Calculate percentage of positive, negative, and neutral mentions
    def get_sentiment_percentages(df):
        total = len(df)
        if total == 0:
            return {"positive": 0, "negative": 0, "neutral": 0}
            
        if 'sentiment_label' in df.columns:
            # If we have categorical labels
            positive = len(df[df['sentiment_label'] == 'positive']) / total * 100
            negative = len(df[df['sentiment_label'] == 'negative']) / total * 100
            neutral = len(df[df['sentiment_label'] == 'neutral']) / total * 100
        else:
            # Calculate from numeric scores
            positive = len(df[df['sentiment_score'] > 0.2]) / total * 100
            negative = len(df[df['sentiment_score'] < -0.2]) / total * 100
            neutral = 100 - positive - negative
            
        return {"positive": positive, "negative": negative, "neutral": neutral}
    
    current_percentages = get_sentiment_percentages(current_data)
    previous_percentages = get_sentiment_percentages(previous_data)
    
    # Calculate percentage changes
    positive_change = current_percentages["positive"] - previous_percentages["positive"]
    negative_change = current_percentages["negative"] - previous_percentages["negative"]
    neutral_change = current_percentages["neutral"] - previous_percentages["neutral"]
    
    # Check if the change is significant
    significant_change = (abs(sentiment_change) >= threshold or 
                         abs(positive_change) >= threshold*100 or 
                         abs(negative_change) >= threshold*100)
    
    result["sentiment_changed"] = significant_change
    result["sentiment_change"] = sentiment_change
    result["positive_change"] = positive_change
    result["negative_change"] = negative_change
    result["neutral_change"] = neutral_change
    
    # Detect topic changes if keywords column exists
    if 'keywords' in current_data.columns and 'keywords' in previous_data.columns:
        # Get all keywords from current and previous data
        current_keywords = {}
        previous_keywords = {}
        
        # Process current keywords
        for _, row in current_data.iterrows():
            if isinstance(row.get('keywords'), str):
                for keyword in row['keywords'].split(','):
                    keyword = keyword.strip()
                    if keyword:
                        current_keywords[keyword] = current_keywords.get(keyword, 0) + 1
        
        # Process previous keywords
        for _, row in previous_data.iterrows():
            if isinstance(row.get('keywords'), str):
                for keyword in row['keywords'].split(','):
                    keyword = keyword.strip()
                    if keyword:
                        previous_keywords[keyword] = previous_keywords.get(keyword, 0) + 1
        
        # Find new topics (in current but not in previous)
        for keyword, count in current_keywords.items():
            if keyword not in previous_keywords and count >= 3:  # At least 3 mentions
                result["new_topics"].append({"topic": keyword, "count": count})
        
        # Find fading topics (in previous but disappeared or significantly reduced)
        for keyword, prev_count in previous_keywords.items():
            curr_count = current_keywords.get(keyword, 0)
            if prev_count >= 3 and (curr_count == 0 or curr_count < prev_count * 0.5):
                result["fading_topics"].append({
                    "topic": keyword, 
                    "previous_count": prev_count,
                    "current_count": curr_count
                })
    
    return result 