from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
import logging

# Database imports
from sqlalchemy.orm import Session
from sqlalchemy import desc
from . import models, database
from .database import engine, get_db

# Import the agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.core import SentimentAnalysisAgent
from utils.mail_sender import MailSender, send_notification
from utils.scheduled_reports import ReportScheduler

# --- Create tables on startup (or use Alembic) ---
# database.Base.metadata.create_all(bind=engine) # Use Alembic upgrade instead
# ----------------------------------------------------

logger = logging.getLogger("api_service")

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

# === In-memory data storage ===
# Use pandas DataFrames to store the data
# latest_data_df: Optional[pd.DataFrame] = None
# previous_data_df: Optional[pd.DataFrame] = None
# last_update_time: Optional[datetime] = None
# =============================

class DataRecord(BaseModel):
    # Define the structure of a single data record based on your CSV columns
    # Example:
    id: Optional[str] = None
    text: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    platform: Optional[str] = None
    timestamp: Optional[datetime] = None
    # Add other fields as per your actual CSV structure
    # Make fields Optional if they might be missing

class DataUpdateRequest(BaseModel):
    data: List[DataRecord]

class CommandRequest(BaseModel):
    command: str
    params: Optional[Dict[str, Any]] = None

async def broadcast_update(message: Dict[str, Any]):
    """Broadcast updates to all connected clients"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            # Remove connection safely if send fails
            if connection in active_connections:
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
                # Avoid blocking websocket: run agent call in executor or make agent async
                status_data = agent.get_status() # Assuming get_status is fast
                await websocket.send_json(status_data)
    except Exception as e:
        logger.warning(f"WebSocket error or connection closed: {e}")
    finally:
        if websocket in active_connections:
             active_connections.remove(websocket)

@app.get("/status")
async def get_status():
    """Get current agent status"""
    # This likely doesn't need DB access unless status includes DB stats
    return agent.get_status()

@app.post("/command")
async def execute_command(request: CommandRequest):
    """Execute a command on the agent"""
    # This likely doesn't need DB access unless command involves DB
    result = agent.execute_command(request.command, request.params)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    # Avoid blocking: run get_status in executor if it becomes slow
    status_data = agent.get_status()
    await broadcast_update({'type': 'status_update', 'data': status_data})
    return result

@app.post("/data/update")
async def update_data(request: DataUpdateRequest, db: Session = Depends(get_db)):
    """Receive new processed data from the agent and store in DB."""
    try:
        new_records = request.data
        if not new_records:
            return {"status": "success", "message": "No new data received."}

        current_run_time = datetime.now() # Timestamp for this batch
        db_objects = []

        for record in new_records:
            # Convert timestamp string back to datetime if necessary
            record_timestamp = None
            if record.timestamp:
                 if isinstance(record.timestamp, str):
                      try:
                          # Attempt ISO format parsing, handling potential 'Z' timezone
                          record_timestamp = datetime.fromisoformat(record.timestamp.replace('Z', '+00:00'))
                      except ValueError:
                          logger.warning(f"Could not parse timestamp: {record.timestamp}. Setting to None.")
                          record_timestamp = None # Or handle error differently
                 elif isinstance(record.timestamp, datetime):
                      record_timestamp = record.timestamp
            
            # Ensure timezone is naive if DB column (DateTime(timezone=False)) is naive
            if record_timestamp and record_timestamp.tzinfo:
                record_timestamp = record_timestamp.replace(tzinfo=None)

            db_obj = models.SentimentData(
                run_timestamp=current_run_time,
                original_id=record.id, # Use the 'id' field from the request
                text=record.text,
                sentiment_score=record.sentiment_score,
                sentiment_label=record.sentiment_label,
                platform=record.platform,
                timestamp=record_timestamp # Use parsed datetime
            )
            db_objects.append(db_obj)

        if db_objects:
             db.add_all(db_objects)
             db.commit() # Commit the transaction
             logger.info(f"Successfully added {len(db_objects)} records to database for run {current_run_time.isoformat()}.")

             # Broadcast update (optional)
             await broadcast_update({
                 'type': 'data_updated',
                 'timestamp': current_run_time.isoformat(),
                 'count': len(db_objects)
             })
             return {"status": "success", "message": f"Data updated successfully with {len(db_objects)} records."}
        else:
             # If db_objects is empty after processing new_records
             logger.info("No valid records derived from the request to add to database.")
             return {"status": "success", "message": "No valid records to add to database."}

    except Exception as e:
        db.rollback() # Rollback in case of error during commit
        logger.error(f"Error updating database: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating database: {str(e)}")

def get_latest_run_timestamp(db: Session) -> Optional[datetime]:
    """Helper function to get the timestamp of the most recent run."""
    latest_run = db.query(models.SentimentData.run_timestamp)\
                   .order_by(desc(models.SentimentData.run_timestamp))\
                   .first()
    return latest_run[0] if latest_run else None

@app.get("/latest-data")
async def get_latest_data(db: Session = Depends(get_db)):
    """Get the most recent batch of processed data from the DB."""
    latest_run_time = get_latest_run_timestamp(db)
    if not latest_run_time:
        return {"status": "error", "message": "No processed data available yet."}

    try:
        results = db.query(models.SentimentData)\
                    .filter(models.SentimentData.run_timestamp == latest_run_time)\
                    .all()
        
        # Use the to_dict helper method defined in the model
        data_list = [row.to_dict() for row in results]

        return {
            "status": "success",
            "data": data_list, 
            "timestamp": latest_run_time.isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching latest data from DB: {str(e)}", exc_info=True)
        return {"status": "error", "message": f"Error fetching latest data: {str(e)}"}

@app.get("/comparison-data")
async def get_comparison_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get the latest and second-latest datasets from the DB for comparison."""
    try:
        # Find the two most recent distinct run timestamps
        distinct_timestamps = db.query(models.SentimentData.run_timestamp)\
                                .distinct()\
                                .order_by(desc(models.SentimentData.run_timestamp))\
                                .limit(2)\
                                .all()

        if len(distinct_timestamps) < 2:
            return {"status": "error", "message": "Not enough data available for comparison (need at least two distinct runs)."}

        latest_run_time = distinct_timestamps[0][0]
        previous_run_time = distinct_timestamps[1][0]

        # Fetch data for the latest run
        latest_results = db.query(models.SentimentData)\
                           .filter(models.SentimentData.run_timestamp == latest_run_time)\
                           .all()

        # Fetch data for the previous run
        previous_results = db.query(models.SentimentData)\
                             .filter(models.SentimentData.run_timestamp == previous_run_time)\
                             .all()
        
        # Use the to_dict helper method
        latest_data_list = [row.to_dict() for row in latest_results]
        previous_data_list = [row.to_dict() for row in previous_results]

        return {
            "status": "success",
            "latest_data": latest_data_list,
            "previous_data": previous_data_list,
            "latest_timestamp": latest_run_time.isoformat(),
            "previous_timestamp": previous_run_time.isoformat()
        }
    except Exception as e:
        logger.error(f"Error retrieving comparison data from DB: {str(e)}", exc_info=True)
        return {"status": "error", "message": f"Error retrieving comparison data: {str(e)}"}

@app.get("/metrics")
async def get_metrics():
    """Get current metrics and analysis results (Update if metrics move to DB)"""
    try:
        metrics_file = Path('data/metrics/history.json')
        if metrics_file.exists():
            with open(metrics_file, 'r') as f:
                metrics_data = json.load(f)
            return {"status": "success", "data": metrics_data}
        return {"status": "error", "message": "No metrics data available"}
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
        original_provider = mail_sender.email_provider
        original_server = mail_sender.smtp_server
        original_port = mail_sender.smtp_port
        
        mail_sender.email_provider = "protonmail"
        mail_sender.smtp_server = "smtp.protonmail.ch"
        mail_sender.smtp_port = 587
        
        try:
            success = mail_sender.send_email(
                request.recipient,
                "ProtonMail Test from Sentiment Analysis System",
                "This is a test email sent via ProtonMail to verify your configuration."
            )
            if not success:
                raise HTTPException(status_code=500, detail="Failed to send email via ProtonMail")
        finally:
            mail_sender.email_provider = original_provider
            mail_sender.smtp_server = original_server
            mail_sender.smtp_port = original_port
            
        return {"status": "success", "message": "ProtonMail test successful"}
            
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
        report_scheduler = ReportScheduler(mail_sender, config.recipients)
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
        try:
             # Assuming start() runs the schedule loop in a thread
             report_scheduler.start() 
             logger.info("Report scheduler started.")
        except Exception as e:
             logger.error(f"Failed to start report scheduler thread: {e}", exc_info=True)

# Add new models for target individual management
class TargetIndividualConfig(BaseModel):
    individual_name: str
    query_variations: List[str]

@app.get("/target")
async def get_target_individual():
    """Get the current target individual configuration"""
    config = agent.config
    if 'target' not in config:
        # Return default or error message
        return {
            "status": "success", 
            "data": {"individual_name": "Default", "query_variations": []}, # Provide a default
            "message": "Target individual not explicitly configured; using defaults."
        }
    
    return {
        "status": "success",
        "data": config['target']
    }

@app.post("/target")
async def update_target_individual(target_config: TargetIndividualConfig):
    """Update the target individual configuration"""
    try:
        updated_config = {'target': target_config.dict()}
        result = agent.execute_command('update_config', updated_config)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
        
        # Avoid blocking: get target data directly from request if possible
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

@app.on_event("startup")
async def startup_event():
    global report_scheduler
    # Optional: Run Alembic upgrade programmatically on startup?
    # try:
    #     print("Running Alembic upgrades...")
    #     from alembic.config import Config
    #     from alembic import command
    #     alembic_cfg = Config("src/alembic.ini") # Adjust path if needed
    #     command.upgrade(alembic_cfg, "head")
    #     print("Alembic upgrades completed.")
    # except Exception as e:
    #     print(f"Alembic upgrade failed: {e}")

    # Initialize scheduler (existing logic, ensure ReportScheduler init is correct)
    try:
       report_scheduler = ReportScheduler(mail_sender) # Assuming constructor only needs mail_sender
       start_scheduler() # Start the scheduler loop
    except Exception as e:
        logger.error(f"Failed to initialize or start report scheduler: {e}", exc_info=True)

    print("API Service started. Database connection configured.")
    # Removed initial data loading from CSV

def start():
    """Start the API service"""
    # Removed agent start from here, run agent as separate process/worker
    import uvicorn
    # Set reload=False for production/deployment
    uvicorn.run("src.api.service:app", host="0.0.0.0", port=8000, reload=False) 

if __name__ == "__main__":
    # Optional: Create tables if they don't exist (use Alembic instead for production)
    # print("Creating database tables if they don't exist...")
    # database.create_tables()
    print("Starting API server...")
    start() 