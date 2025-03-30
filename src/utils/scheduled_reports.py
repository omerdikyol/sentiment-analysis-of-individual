#!/usr/bin/env python3
"""
Scheduled email reporting module for the Sentiment Analysis System.
"""

import os
import time
import logging
import schedule
import threading
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.utils.mail_sender import MailSender

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class ReportScheduler:
    """
    Handles scheduling and sending of periodic sentiment analysis reports.
    """
    
    def __init__(self, recipients=None):
        """
        Initialize the report scheduler.
        
        Args:
            recipients (list, optional): List of email recipients for reports.
        """
        self.mail_sender = MailSender()
        self.recipients = recipients or []
        self.stop_event = threading.Event()
        self.scheduler_thread = None
        
        # Load recipients from environment if available
        env_recipients = os.getenv("REPORT_RECIPIENTS")
        if env_recipients and not self.recipients:
            self.recipients = [r.strip() for r in env_recipients.split(",")]
    
    def add_recipient(self, email):
        """Add an email recipient to the list."""
        if email not in self.recipients:
            self.recipients.append(email)
            logger.info(f"Added recipient: {email}")
    
    def remove_recipient(self, email):
        """Remove an email recipient from the list."""
        if email in self.recipients:
            self.recipients.remove(email)
            logger.info(f"Removed recipient: {email}")
    
    def send_daily_report(self):
        """Send a daily sentiment analysis report."""
        if not self.recipients:
            logger.warning("No recipients configured for daily report")
            return
        
        logger.info("Generating daily sentiment report...")
        
        # Generate report content - this would typically come from your analysis system
        # For now, we'll use placeholder content
        yesterday = datetime.now() - timedelta(days=1)
        date_str = yesterday.strftime("%B %d, %Y")
        
        report_content = f"""
        <h2>Daily Sentiment Analysis Report</h2>
        <p>Analysis date: {date_str}</p>
        
        <h3>Daily Sentiment Score: 6.8/10 (Moderately Positive)</h3>
        
        <h3>Today's Activity:</h3>
        <ul>
            <li>Total mentions: 142</li>
            <li>Positive: 87 (61%)</li>
            <li>Neutral: 38 (27%)</li>
            <li>Negative: 17 (12%)</li>
        </ul>
        
        <h3>Key Trends:</h3>
        <p>Sentiment has remained stable compared to yesterday, with a slight 
        increase in positive mentions related to the recent public appearance.</p>
        
        <h3>Top Sources:</h3>
        <ul>
            <li>Twitter: 78 mentions</li>
            <li>News articles: 31 mentions</li>
            <li>Blogs: 22 mentions</li>
            <li>Other social media: 11 mentions</li>
        </ul>
        """
        
        success = self.mail_sender.send_report_email(
            self.recipients,
            f"Daily Sentiment Report - {date_str}",
            report_content
        )
        
        if success:
            logger.info(f"Daily report sent successfully to {len(self.recipients)} recipients")
        else:
            logger.error("Failed to send daily report")
    
    def send_weekly_report(self):
        """Send a weekly sentiment analysis report."""
        if not self.recipients:
            logger.warning("No recipients configured for weekly report")
            return
        
        logger.info("Generating weekly sentiment report...")
        
        # Get date range for the past week
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        date_range = f"{week_ago.strftime('%B %d')} - {today.strftime('%B %d, %Y')}"
        
        report_content = f"""
        <h2>Weekly Sentiment Analysis Report</h2>
        <p>Analysis period: {date_range}</p>
        
        <h3>Weekly Sentiment Score: 7.3/10 (Positive)</h3>
        
        <h3>Week Summary:</h3>
        <ul>
            <li>Total mentions: 843</li>
            <li>Positive: 529 (63%)</li>
            <li>Neutral: 231 (27%)</li>
            <li>Negative: 83 (10%)</li>
        </ul>
        
        <h3>Week-over-Week Change:</h3>
        <p>Overall sentiment improved by 8% compared to last week. 
        Negative mentions decreased by 5 percentage points.</p>
        
        <h3>Key Events Affecting Sentiment:</h3>
        <ul>
            <li>Charity Gala Appearance (May 3): Positive impact</li>
            <li>Economic Policy Announcement (May 5): Mixed reception</li>
            <li>International Summit (May 6-7): Overall positive</li>
        </ul>
        
        <h3>Recommendations:</h3>
        <p>Based on this week's analysis, we recommend highlighting charitable 
        initiatives and international cooperation in upcoming communications.</p>
        """
        
        success = self.mail_sender.send_report_email(
            self.recipients,
            f"Weekly Sentiment Report - {date_range}",
            report_content
        )
        
        if success:
            logger.info(f"Weekly report sent successfully to {len(self.recipients)} recipients")
        else:
            logger.error("Failed to send weekly report")
    
    def send_monthly_report(self):
        """Send a monthly sentiment analysis report."""
        if not self.recipients:
            logger.warning("No recipients configured for monthly report")
            return
        
        logger.info("Generating monthly sentiment report...")
        
        # Get month information
        today = datetime.now()
        month_name = today.strftime("%B %Y")
        
        report_content = f"""
        <h2>Monthly Sentiment Analysis Report</h2>
        <p>Analysis period: {month_name}</p>
        
        <h3>Monthly Sentiment Score: 7.5/10 (Strongly Positive)</h3>
        
        <h3>Month Summary:</h3>
        <ul>
            <li>Total mentions: 3,247</li>
            <li>Positive: 2,143 (66%)</li>
            <li>Neutral: 847 (26%)</li>
            <li>Negative: 257 (8%)</li>
        </ul>
        
        <h3>Month-over-Month Change:</h3>
        <p>Overall sentiment improved by 12% compared to last month.
        This represents the highest positive sentiment score in the past 6 months.</p>
        
        <h3>Top Performing Topics:</h3>
        <ul>
            <li>International Relations: 9.2/10</li>
            <li>Economic Initiatives: 8.5/10</li>
            <li>Charitable Work: 8.3/10</li>
            <li>Public Appearances: 7.8/10</li>
        </ul>
        
        <h3>Areas for Improvement:</h3>
        <ul>
            <li>Policy Explanations: 5.6/10</li>
            <li>Media Interviews: 6.2/10</li>
        </ul>
        
        <h3>Strategic Recommendations:</h3>
        <p>Based on this month's analysis, we recommend focusing on:</p>
        <ol>
            <li>Continuing to emphasize international cooperation</li>
            <li>Providing more context for policy decisions</li>
            <li>Increasing presence in carefully selected media appearances</li>
        </ol>
        """
        
        success = self.mail_sender.send_report_email(
            self.recipients,
            f"Monthly Sentiment Report - {month_name}",
            report_content
        )
        
        if success:
            logger.info(f"Monthly report sent successfully to {len(self.recipients)} recipients")
        else:
            logger.error("Failed to send monthly report")
    
    def schedule_reports(self, daily_time="08:00", weekly_day="Monday", monthly_day=1):
        """
        Schedule regular reports.
        
        Args:
            daily_time (str): Time for daily reports (24-hour format, HH:MM)
            weekly_day (str): Day of week for weekly reports
            monthly_day (int): Day of month for monthly reports (1-28)
        """
        # Schedule daily reports
        schedule.every().day.at(daily_time).do(self.send_daily_report)
        logger.info(f"Scheduled daily reports at {daily_time}")
        
        # Schedule weekly reports
        getattr(schedule.every(), weekly_day.lower()).at(daily_time).do(self.send_weekly_report)
        logger.info(f"Scheduled weekly reports on {weekly_day}s at {daily_time}")
        
        # Schedule monthly reports
        if 1 <= monthly_day <= 28:
            schedule.every().month.at(f"{monthly_day:02d} {daily_time}").do(self.send_monthly_report)
            logger.info(f"Scheduled monthly reports on day {monthly_day} at {daily_time}")
        else:
            logger.error(f"Invalid monthly day: {monthly_day}. Must be between 1 and 28.")
    
    def start(self):
        """Start the scheduler in a background thread."""
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            logger.warning("Scheduler is already running")
            return
        
        self.stop_event.clear()
        self.scheduler_thread = threading.Thread(target=self._run_scheduler)
        self.scheduler_thread.daemon = True
        self.scheduler_thread.start()
        logger.info("Report scheduler started")
    
    def stop(self):
        """Stop the scheduler."""
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.stop_event.set()
            self.scheduler_thread.join(timeout=5)
            logger.info("Report scheduler stopped")
        else:
            logger.warning("Scheduler is not running")
    
    def _run_scheduler(self):
        """Run the scheduler loop."""
        while not self.stop_event.is_set():
            schedule.run_pending()
            time.sleep(1)


def main():
    """Example usage of the report scheduler."""
    # Get email recipients
    recipients = input("Enter email recipients (comma-separated): ").split(",")
    recipients = [r.strip() for r in recipients if r.strip()]
    
    if not recipients:
        logger.error("No recipients specified. Exiting.")
        return
    
    # Create scheduler
    scheduler = ReportScheduler(recipients)
    
    # Schedule reports
    scheduler.schedule_reports()
    
    try:
        # Start scheduler
        scheduler.start()
        logger.info("Press Ctrl+C to stop...")
        
        # Run indefinitely until interrupted
        while True:
            time.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Stopping scheduler...")
        scheduler.stop()
        logger.info("Done!")


if __name__ == "__main__":
    main() 