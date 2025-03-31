import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
load_dotenv(Path("config/.env"))

logger = logging.getLogger(__name__)

class MailSender:
    """
    Utility class for sending emails from the sentiment analysis system.
    Supports Proton Mail and other SMTP providers.
    """
    
    def __init__(self):
        """Initialize email configuration from environment variables."""
        # Get email provider type from environment
        self.email_provider = os.getenv("EMAIL_PROVIDER", "gmail").lower()
        
        # Set default SMTP settings based on provider
        if self.email_provider == "protonmail":
            self.smtp_server = os.getenv("SMTP_SERVER", "smtp.protonmail.ch")
            self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        else:
            # Default to Gmail settings
            self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
            
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", self.smtp_username)
        
        # Validate configuration
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("Email configuration incomplete. Check SMTP settings in .env file.")
    
    def send_email(self, recipients, subject, body, attachments=None, html=False):
        """
        Send an email to one or more recipients.
        
        Args:
            recipients (str or list): Email address(es) of the recipient(s)
            subject (str): Email subject
            body (str): Email body content
            attachments (list, optional): List of file paths to attach
            html (bool, optional): Whether the body is HTML content
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not all([self.smtp_username, self.smtp_password]):
            logger.error("Cannot send email: SMTP configuration is incomplete")
            return False
            
        # Convert single recipient to list
        if isinstance(recipients, str):
            recipients = [recipients]
            
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = ", ".join(recipients)
            msg['Subject'] = subject
            
            # Attach body
            if html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
                
            # Attach files if provided
            if attachments:
                for file_path in attachments:
                    try:
                        with open(file_path, 'rb') as file:
                            part = MIMEApplication(file.read(), Name=Path(file_path).name)
                            part['Content-Disposition'] = f'attachment; filename="{Path(file_path).name}"'
                            msg.attach(part)
                    except Exception as e:
                        logger.error(f"Failed to attach file {file_path}: {str(e)}")
            
            # Send email - handle both ProtonMail and other providers
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {', '.join(recipients)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    def send_report_email(self, recipients, subject, report_content, report_file=None):
        """
        Send a sentiment analysis report via email.
        
        Args:
            recipients (str or list): Email address(es) of the recipient(s)
            subject (str): Email subject
            report_content (str): HTML content for the report
            report_file (str, optional): Path to a report file to attach
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        # Create basic HTML template
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #2c3e50; }}
                .content {{ margin: 20px 0; }}
                .footer {{ color: #7f8c8d; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <h1>Sentiment Analysis Report</h1>
            <div class="content">
                {report_content}
            </div>
            <div class="footer">
                <p>This is an automated message from your Sentiment Analysis System.</p>
            </div>
        </body>
        </html>
        """
        
        attachments = [report_file] if report_file else None
        return self.send_email(recipients, subject, html_body, attachments, html=True)


def send_notification(recipients, subject, message):
    """
    Convenience function to send a simple notification email.
    
    Args:
        recipients (str or list): Email address(es) of the recipient(s)
        subject (str): Email subject
        message (str): Email message body
        
    Returns:
        bool: True if sent successfully, False otherwise
    """
    mail_sender = MailSender()
    return mail_sender.send_email(recipients, subject, message) 