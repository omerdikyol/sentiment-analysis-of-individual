import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from config/.env
# Assume .env is in the config directory relative to project root
project_root = Path(__file__).parent.parent.parent
load_dotenv(project_root / "config" / ".env")

logger = logging.getLogger(__name__)

class MailSender:
    """
    Utility class for sending emails using SMTP configuration from .env file.
    """
    
    def __init__(self):
        """Initialize email configuration directly from environment variables."""
        # Remove provider-specific logic
        # self.email_provider = os.getenv("EMAIL_PROVIDER", "gmail").lower()
        
        # Load SMTP settings directly from .env
        self.smtp_server = os.getenv("EMAIL_SERVER")
        self.smtp_port = int(os.getenv("EMAIL_PORT", 587)) # Default to 587 if not set
        self.smtp_username = os.getenv("EMAIL_USERNAME")
        self.smtp_password = os.getenv("EMAIL_PASSWORD")
        self.sender_email = os.getenv("EMAIL_SENDER") # Use the dedicated sender email
        
        # Validate configuration
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password, self.sender_email]):
            logger.warning(
                "Email configuration incomplete. Check EMAIL_SERVER, EMAIL_PORT, "
                "EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_SENDER in config/.env file."
            )
            # Set a flag or handle appropriately if config is invalid
            self.valid_config = False
        else:
            self.valid_config = True
    
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
        if not self.valid_config:
            logger.error("Cannot send email: SMTP configuration is incomplete or invalid.")
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
            
            # Send email using configured SMTP settings
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls() # Assume TLS is needed for ports 587/2525
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