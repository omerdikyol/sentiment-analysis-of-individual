from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field

# Import the agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.core import SentimentAnalysisAgent
from utils.mail_sender import MailSender, send_notification
from utils.scheduled_reports import ReportScheduler

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent = SentimentAnalysisAgent()

# Store active WebSocket connections
active_connections: List[WebSocket] = []

# Initialize email services
mail_sender = MailSender()
report_scheduler = None

class CommandRequest(BaseModel):
    command: str
    params: Optional[Dict[str, Any]] = None

async def broadcast_update(message: Dict[str, Any]):
    """Broadcast updates to all connected clients"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            active_connections.remove(connection)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "status":
                await websocket.send_json(agent.get_status())
    except:
        active_connections.remove(websocket)

@app.get("/status")
async def get_status():
    """Get current agent status"""
    return agent.get_status()

@app.post("/command")
async def execute_command(request: CommandRequest):
    """Execute a command on the agent"""
    result = agent.execute_command(request.command, request.params)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    # Broadcast status update to all connected clients
    await broadcast_update({
        'type': 'status_update',
        'data': agent.get_status()
    })
    
    return result

@app.get("/metrics")
async def get_metrics():
    """Get current metrics and analysis results"""
    try:
        metrics_file = Path('data/metrics/history.json')
        if metrics_file.exists():
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
            return {"status": "success", "data": metrics}
        return {"status": "error", "message": "No metrics data available"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/latest-data")
async def get_latest_data():
    """Get the most recent processed data"""
    try:
        latest_file = Path('data/processed/latest.csv')
        if not latest_file.exists():
            return {"status": "error", "message": "No processed data available"}
        
        data = pd.read_csv(latest_file)
        return {
            "status": "success",
            "data": data.to_dict(orient='records'),
            "timestamp": datetime.fromtimestamp(latest_file.stat().st_mtime).isoformat()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/config")
async def get_config():
    """Get current agent configuration"""
    return {"status": "success", "data": agent.config}

@app.post("/config")
async def update_config(config: Dict[str, Any]):
    """Update agent configuration"""
    result = agent.execute_command('update_config', config)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    return result

# Additional model classes for email endpoints
class EmailNotificationRequest(BaseModel):
    recipients: List[EmailStr]
    subject: str
    message: str

class ReportEmailRequest(BaseModel):
    recipients: List[EmailStr]
    subject: str
    report_content: str
    include_attachment: bool = False
    attachment_path: Optional[str] = None

class ScheduleConfig(BaseModel):
    recipients: List[EmailStr]
    daily_time: str = "08:00"
    weekly_day: str = "Monday"
    monthly_day: int = Field(1, ge=1, le=28)

class EmailConfig(BaseModel):
    provider: str = "protonmail"
    recipients: List[EmailStr] = []
    notifyOnCollection: bool = False
    notifyOnProcessing: bool = False
    notifyOnAnalysis: bool = True
    enabled: bool = False

class TestEmailRequest(BaseModel):
    recipient: EmailStr

@app.post("/email/send")
async def send_email(request: EmailNotificationRequest):
    """Send a simple email notification"""
    try:
        success = mail_sender.send_email(
            request.recipients, 
            request.subject, 
            request.message
        )
        if success:
            return {"status": "success", "message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add new endpoints for email configuration
@app.get("/email/config")
async def get_email_config():
    """Get the current email notification configuration"""
    try:
        from utils.mail_config import get_email_recipients, is_email_notification_enabled, get_email_provider
        from utils.mail_config import NOTIFY_ON_COLLECTION, NOTIFY_ON_PROCESSING, NOTIFY_ON_ANALYSIS
        
        config = {
            "provider": get_email_provider(),
            "recipients": get_email_recipients(),
            "enabled": is_email_notification_enabled(),
            "notifyOnCollection": NOTIFY_ON_COLLECTION,
            "notifyOnProcessing": NOTIFY_ON_PROCESSING,
            "notifyOnAnalysis": NOTIFY_ON_ANALYSIS
        }
        
        return {"status": "success", "data": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/config")
async def update_email_config(config: EmailConfig):
    """Update the email notification configuration"""
    try:
        import os
        from pathlib import Path
        from dotenv import load_dotenv, set_key

        env_path = Path("config/.env")
        
        # Load current .env file
        load_dotenv(env_path)
        
        # Update the values
        set_key(env_path, "EMAIL_PROVIDER", config.provider)
        set_key(env_path, "EMAIL_RECIPIENTS", ",".join(config.recipients))
        set_key(env_path, "EMAIL_NOTIFICATION_ENABLED", str(config.enabled).lower())
        set_key(env_path, "NOTIFY_ON_COLLECTION", str(config.notifyOnCollection).lower())
        set_key(env_path, "NOTIFY_ON_PROCESSING", str(config.notifyOnProcessing).lower())
        set_key(env_path, "NOTIFY_ON_ANALYSIS", str(config.notifyOnAnalysis).lower())
        
        # Set correct SMTP server based on provider
        if config.provider.lower() == "protonmail":
            set_key(env_path, "SMTP_SERVER", "smtp.protonmail.ch")
        elif config.provider.lower() == "gmail":
            set_key(env_path, "SMTP_SERVER", "smtp.gmail.com")
        
        # Refresh mail sender with new settings
        mail_sender.email_provider = config.provider.lower()
        mail_sender.smtp_server = os.getenv("SMTP_SERVER", "smtp.protonmail.ch" if config.provider.lower() == "protonmail" else "smtp.gmail.com")
        
        return {"status": "success", "message": "Email configuration updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/test")
async def send_test_email(request: TestEmailRequest):
    """Send a test email to verify configuration"""
    try:
        success = mail_sender.send_email(
            request.recipient,
            "Test Email from Sentiment Analysis System",
            "This is a test email to verify that your email configuration is working correctly."
        )
        if success:
            return {"status": "success", "message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/protonmail-test")
async def test_protonmail_connection(request: TestEmailRequest):
    """Test specifically the ProtonMail connection"""
    try:
        # Force ProtonMail configuration for this test
        original_provider = mail_sender.email_provider
        original_server = mail_sender.smtp_server
        original_port = mail_sender.smtp_port
        
        # Temporarily switch to ProtonMail settings
        mail_sender.email_provider = "protonmail"
        mail_sender.smtp_server = "smtp.protonmail.ch"
        mail_sender.smtp_port = 587
        
        try:
            success = mail_sender.send_email(
                request.recipient,
                "ProtonMail Test from Sentiment Analysis System",
                "This is a test email sent via ProtonMail to verify your configuration."
            )
            
            if success:
                return {"status": "success", "message": "ProtonMail test successful"}
            else:
                raise HTTPException(status_code=500, detail="Failed to send email via ProtonMail")
                
        finally:
            # Restore original settings
            mail_sender.email_provider = original_provider
            mail_sender.smtp_server = original_server
            mail_sender.smtp_port = original_port
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ProtonMail test failed: {str(e)}")

@app.post("/email/send-report")
async def send_report_email(request: ReportEmailRequest):
    """Send a formatted report email"""
    try:
        attachment = request.attachment_path if request.include_attachment else None
        success = mail_sender.send_report_email(
            request.recipients,
            request.subject,
            request.report_content,
            attachment
        )
        if success:
            return {"status": "success", "message": "Report email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send report email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/schedule")
async def schedule_reports(config: ScheduleConfig, background_tasks: BackgroundTasks):
    """Configure and start the email report scheduler"""
    global report_scheduler
    
    try:
        # Stop existing scheduler if running
        if report_scheduler:
            report_scheduler.stop()
        
        # Create new scheduler with updated configuration
        report_scheduler = ReportScheduler(config.recipients)
        report_scheduler.schedule_reports(
            daily_time=config.daily_time,
            weekly_day=config.weekly_day,
            monthly_day=config.monthly_day
        )
        
        # Start scheduler in background
        background_tasks.add_task(start_scheduler)
        
        return {
            "status": "success", 
            "message": "Report scheduler configured and started",
            "config": {
                "recipients": config.recipients,
                "daily_time": config.daily_time,
                "weekly_day": config.weekly_day,
                "monthly_day": config.monthly_day
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/email/schedule/status")
async def get_scheduler_status():
    """Get the current status of the report scheduler"""
    global report_scheduler
    
    if not report_scheduler:
        return {"status": "inactive", "message": "Scheduler has not been configured"}
    
    is_running = (report_scheduler.scheduler_thread and 
                 report_scheduler.scheduler_thread.is_alive())
    
    return {
        "status": "active" if is_running else "stopped",
        "recipients": report_scheduler.recipients,
        "message": "Scheduler is running" if is_running else "Scheduler is stopped"
    }

@app.post("/email/schedule/stop")
async def stop_scheduler():
    """Stop the email report scheduler"""
    global report_scheduler
    
    if not report_scheduler:
        return {"status": "inactive", "message": "Scheduler has not been configured"}
        
    report_scheduler.stop()
    return {"status": "success", "message": "Scheduler stopped successfully"}

def start_scheduler():
    """Start the report scheduler"""
    global report_scheduler
    if report_scheduler:
        report_scheduler.start()

# Add new models for target individual management
class TargetIndividualConfig(BaseModel):
    individual_name: str
    query_variations: List[str]

@app.get("/target")
async def get_target_individual():
    """Get the current target individual configuration"""
    config = agent.config
    if 'target' not in config:
        return {
            "status": "error", 
            "message": "Target individual not configured. Using defaults."
        }
    
    return {
        "status": "success",
        "data": config['target']
    }

@app.post("/target")
async def update_target_individual(target_config: TargetIndividualConfig):
    """Update the target individual configuration"""
    try:
        # Create updated config
        updated_config = {'target': {
            'individual_name': target_config.individual_name,
            'query_variations': target_config.query_variations
        }}
        
        # Update agent configuration
        result = agent.execute_command('update_config', updated_config)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
        
        # Broadcast status update to all connected clients
        await broadcast_update({
            'type': 'target_update',
            'data': updated_config['target']
        })
        
        return {
            "status": "success", 
            "message": "Target individual configuration updated successfully",
            "data": updated_config['target']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def start():
    """Start the API service and the agent"""
    import uvicorn
    # Start the agent in a separate thread
    import threading
    agent_thread = threading.Thread(target=agent.run)
    agent_thread.daemon = True
    agent_thread.start()
    
    # Start the API server
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start() 