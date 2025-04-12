from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks, Depends, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from .database import SessionLocal, engine, get_db

# Import the agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.core import SentimentAnalysisAgent
from utils.mail_sender import MailSender
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
try:
    agent = SentimentAnalysisAgent(db_factory=SessionLocal)
except Exception as e:
    logger.error(f"Failed to initialize SentimentAnalysisAgent: {e}", exc_info=True)
    # Decide how to handle this error - exit, run without agent?
    agent = None # Or a dummy agent

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
    # Updated to match SentimentData model fields derived from CSV header
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    published_date: Optional[datetime] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    query: Optional[str] = None
    language: Optional[str] = None
    platform: Optional[str] = None
    date: Optional[datetime] = None # Specific 'date' field
    text: Optional[str] = None
    file_source: Optional[str] = None
    id: Optional[str] = None # This corresponds to 'original_id' in the DB model
    alert_id: Optional[int] = None
    published_at: Optional[datetime] = None # Specific 'published_at' field
    source_type: Optional[str] = None
    country: Optional[str] = None
    favorite: Optional[bool] = None
    tone: Optional[str] = None
    source_name: Optional[str] = None
    parent_url: Optional[str] = None
    parent_id: Optional[str] = None
    children: Optional[int] = None
    direct_reach: Optional[int] = None
    cumulative_reach: Optional[int] = None
    domain_reach: Optional[int] = None
    tags: Optional[str] = None # Consider Union[List[str], str] or just str
    score: Optional[float] = None # General score
    alert_name: Optional[str] = None
    type: Optional[str] = None # 'type' field
    post_id: Optional[str] = None
    retweets: Optional[int] = None
    likes: Optional[int] = None
    user_location: Optional[str] = None
    comments: Optional[int] = None
    user_name: Optional[str] = None
    user_handle: Optional[str] = None
    user_avatar: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None

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
            # Helper function to parse and clean datetime fields
            def parse_datetime(dt_input: Optional[Any]) -> Optional[datetime]:
                if dt_input is None:
                    return None
                parsed_dt = None
                if isinstance(dt_input, str):
                    try:
                        # Handle potential 'Z' timezone indicator
                        parsed_dt = datetime.fromisoformat(dt_input.replace('Z', '+00:00'))
                    except ValueError:
                        logger.warning(f"Could not parse timestamp: {dt_input}. Setting to None.")
                        return None
                elif isinstance(dt_input, datetime):
                    parsed_dt = dt_input
                else:
                     logger.warning(f"Unexpected type for timestamp: {type(dt_input)}. Setting to None.")
                     return None
                
                # Ensure timezone is naive for DB storage
                if parsed_dt and parsed_dt.tzinfo:
                    return parsed_dt.replace(tzinfo=None)
                return parsed_dt

            # Map DataRecord fields to SentimentData model columns
            db_obj = models.SentimentData(
                run_timestamp=current_run_time,
                # Map all fields from DataRecord to SentimentData
                title=record.title,
                description=record.description,
                content=record.content,
                url=record.url,
                published_date=parse_datetime(record.published_date),
                source=record.source,
                source_url=record.source_url,
                query=record.query,
                language=record.language,
                platform=record.platform,
                date=parse_datetime(record.date), # Specific 'date' field
                text=record.text,
                file_source=record.file_source,
                original_id=record.id, # Map request 'id' to DB 'original_id'
                alert_id=record.alert_id,
                published_at=parse_datetime(record.published_at), # Specific 'published_at'
                source_type=record.source_type,
                country=record.country,
                favorite=record.favorite,
                tone=record.tone,
                source_name=record.source_name,
                parent_url=record.parent_url,
                parent_id=record.parent_id,
                children=record.children,
                direct_reach=record.direct_reach,
                cumulative_reach=record.cumulative_reach,
                domain_reach=record.domain_reach,
                tags=record.tags, # Assuming tags is a string; adjust if it's list/JSON
                score=record.score,
                alert_name=record.alert_name,
                type=record.type,
                post_id=record.post_id,
                retweets=record.retweets,
                likes=record.likes,
                user_location=record.user_location,
                comments=record.comments,
                user_name=record.user_name,
                user_handle=record.user_handle,
                user_avatar=record.user_avatar,
                sentiment_label=record.sentiment_label,
                sentiment_score=record.sentiment_score
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
async def send_email(request: EmailNotificationRequest, db: Session = Depends(get_db)):
    """Send an email using the configured mail sender, requires DB session."""
    try:
        # Pass the db session to mail_sender
        success = mail_sender.send_email(
            db=db,
            recipients=request.recipients,
            subject=request.subject,
            message=request.message # Assuming send_email handles message param correctly
        )
        if success:
            return {"status": "success", "message": "Email sent successfully"}
        else:
            # Mail sender logs errors, return a generic failure
            raise HTTPException(status_code=500, detail="Failed to send email. Check logs for details.")
    except Exception as e:
        logger.error(f"Error in /email/send endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/email/config")
async def get_email_config(db: Session = Depends(get_db)):
    """Get the current email notification configuration from the database"""
    try:
        latest_config = db.query(models.EmailConfiguration).order_by(models.EmailConfiguration.created_at.desc()).first()
        
        if not latest_config:
            # Return default values if no configuration is found
            default_config = EmailConfig( 
                provider="mailersend",
                recipients=[], 
                enabled=False,
                notifyOnCollection=False,
                notifyOnProcessing=False,
                notifyOnAnalysis=True
            )
            return JSONResponse(status_code=status.HTTP_200_OK, content=default_config.dict())
            
        # Convert DB model to Pydantic model
        config_data = EmailConfig(
            # Ensure provider from DB is returned, which should be 'mailersend' after a POST
            provider=latest_config.provider, 
            recipients=latest_config.recipients if latest_config.recipients else [], 
            enabled=latest_config.enabled,
            notifyOnCollection=latest_config.notify_on_collection,
            notifyOnProcessing=latest_config.notify_on_processing,
            notifyOnAnalysis=latest_config.notify_on_analysis
        )
        
        return JSONResponse(status_code=status.HTTP_200_OK, content=config_data.dict())
        
    except Exception as e:
        error_message = f"Failed to retrieve email configuration: {str(e)}"
        logger.error(f"Error getting email config: {e}", exc_info=True)
        # Return a JSON response with the error detail
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            content={"detail": error_message}
        )

@app.post("/email/config")
async def update_email_config(config: EmailConfig, db: Session = Depends(get_db)):
    """Update the email notification configuration by adding a new record to the database.
       Assumes MailerSend is the provider based on .env credentials.
    """
    try:
        # Hardcode provider and SMTP server for MailerSend based on .env config
        provider_name = "mailersend"
        smtp_server = "smtp.mailersend.net" # From .env
        
        # Ignore config.provider from request, always use mailersend

        # Create new configuration record in the database, including recipients
        new_config = models.EmailConfiguration(
            provider=provider_name, # Always mailersend
            smtp_server=smtp_server, # Always mailersend server
            enabled=config.enabled,
            recipients=config.recipients, 
            notify_on_collection=config.notifyOnCollection,
            notify_on_processing=config.notifyOnProcessing,
            notify_on_analysis=config.notifyOnAnalysis
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        
        return {"status": "success", "message": "Email configuration updated successfully (using MailerSend)", "new_config_id": new_config.id}
    # Removed HTTPException check for unsupported provider as it's fixed now
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating email config: {e}", exc_info=True)
        # Return JSON error response
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            content={"detail": f"Failed to update email configuration: {str(e)}"}
        )

@app.post("/email/test")
async def send_test_email(request: TestEmailRequest, db: Session = Depends(get_db)):
    """Send a test email to verify configuration, requires DB session."""
    try:
        # Pass the db session to mail_sender
        success = mail_sender.send_email(
            db=db, 
            recipients=[request.recipient], # send_email expects a list
            subject="Test Email from Sentiment Analysis System",
            body="This is a test email to verify that your email configuration is working correctly."
        )
        if success:
            return {"status": "success", "message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email. Check logs for details.")
    except Exception as e:
        logger.error(f"Error in /email/test endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/protonmail-test")
async def test_protonmail_connection(request: TestEmailRequest, db: Session = Depends(get_db)):
    """Test specifically the ProtonMail connection, requires DB session."""
    # This test seems less relevant now as the server is fetched from DB. 
    # Keeping structure but relying on DB config.
    try:
        # We don't need to manually set provider/server anymore.
        # mail_sender.send_email will fetch the latest config (which includes the server)
        
        success = mail_sender.send_email(
            db=db,
            recipients=[request.recipient],
            subject="DB Config Test from Sentiment Analysis System", # Changed subject slightly
            body="This is a test email sent using the configuration currently stored in the database."
        )
        
        if success:
            return {"status": "success", "message": "Test email sent successfully using DB configuration"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email using DB configuration. Check logs.")
            
    except Exception as e:
        logger.error(f"Error in /email/protonmail-test endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.post("/email/send-report")
async def send_report_email(request: ReportEmailRequest, db: Session = Depends(get_db)):
    """Send a formatted report email, requires DB session."""
    try:
        attachment = request.attachment_path if request.include_attachment else None
        # Pass the db session to mail_sender
        success = mail_sender.send_report_email(
            db=db,
            recipients=request.recipients,
            subject=request.subject,
            report_content=request.report_content,
            report_file=attachment
        )
        if success:
            return {"status": "success", "message": "Report email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send report email. Check logs.")
    except Exception as e:
        logger.error(f"Error in /email/send-report endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/schedule")
async def schedule_reports(config: ScheduleConfig, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Configure and start the email report scheduler, requires DB factory."""
    global report_scheduler
    
    try:
        # Stop existing scheduler if running
        if report_scheduler:
            logger.info("Stopping existing report scheduler...")
            report_scheduler.stop()
        
        logger.info(f"Creating new report scheduler with recipients: {config.recipients}")
        # Create new scheduler with DB factory and updated configuration (recipients)
        report_scheduler = ReportScheduler(db_factory=SessionLocal, recipients=config.recipients)
        
        report_scheduler.schedule_reports(
            daily_time=config.daily_time,
            weekly_day=config.weekly_day,
            monthly_day=config.monthly_day
        )
        
        # Start scheduler in background
        # Ensure start_scheduler function uses the global report_scheduler
        logger.info("Adding scheduler start task to background...")
        background_tasks.add_task(start_scheduler) 
        
        return {
            "status": "success", 
            "message": "Report scheduler configured and started",
            "config": config.dict()
        }
    except Exception as e:
        logger.error(f"Error configuring scheduler: {e}", exc_info=True)
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
    """Start the report scheduler (called by background task)."""
    global report_scheduler
    if report_scheduler:
        try:
             logger.info("Starting report scheduler thread...")
             report_scheduler.start() 
             logger.info("Report scheduler started successfully.")
        except Exception as e:
             logger.error(f"Failed to start report scheduler thread: {e}", exc_info=True)

# Update model for target individual management
class TargetIndividualConfig(BaseModel):
    individual_name: str
    query_variations: List[str]

@app.get("/target")
async def get_target_individual(db: Session = Depends(get_db)):
    """Get the current target individual configuration from the database"""
    try:
        latest_config = db.query(models.TargetIndividualConfiguration).order_by(models.TargetIndividualConfiguration.created_at.desc()).first()
        
        if not latest_config:
            # Return default values if no configuration is found
            default_data = TargetIndividualConfig(individual_name="Default", query_variations=[]).dict()
            return JSONResponse(content={"status": "success", "data": default_data})
            
        # Convert DB model to Pydantic model
        config_data = TargetIndividualConfig(
            individual_name=latest_config.individual_name,
            query_variations=latest_config.query_variations # Assumes query_variations is stored as JSON
        )
        
        # Return explicit success structure
        return JSONResponse(content={"status": "success", "data": config_data.dict()})
    except Exception as e:
        logger.error(f"Error getting target config: {e}", exc_info=True)
        # Keep raising HTTPException on error
        raise HTTPException(status_code=500, detail=f"Failed to retrieve target individual configuration: {str(e)}")

@app.post("/target")
async def update_target_individual(target_config: TargetIndividualConfig, db: Session = Depends(get_db)):
    """Update the target individual configuration by adding a new record to the database"""
    try:
        # Create new configuration record in the database
        new_config = models.TargetIndividualConfiguration(
            individual_name=target_config.individual_name,
            query_variations=target_config.query_variations # Store as JSON
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        
        # TODO: Determine if agent needs to be explicitly notified or if it reads 
        # from DB directly. If agent holds state, it might need an update call.
        # E.g., agent.update_target_config(new_config)
        
        # Broadcast the update via websocket
        await broadcast_update({
            'type': 'target_update',
            'data': target_config.dict() # Send the newly set config
        })
        
        return {
            "status": "success", 
            "message": "Target individual configuration updated successfully",
            "new_config_id": new_config.id,
            "data": target_config.dict()
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating target config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update target individual configuration: {str(e)}")

@app.on_event("startup")
async def startup_event():
    global report_scheduler
    logger.info("API Service starting up...")
    # Initialize scheduler at startup, passing DB factory 
    # Starts without specific recipients - they are configured via API
    try:
        logger.info("Initializing report scheduler at startup...")
        report_scheduler = ReportScheduler(db_factory=SessionLocal)
        # Optional: Start scheduler immediately? Or wait for config?
        # start_scheduler() # Uncomment if you want it running by default
        logger.info("Report scheduler initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize report scheduler at startup: {e}", exc_info=True)

    # Optional: Start the agent if it has a background loop
    if agent and hasattr(agent, 'start'):
        try:
             logger.info("Starting SentimentAnalysisAgent background tasks...")
             agent.start() # Assuming agent has a start method for its loops
             logger.info("SentimentAnalysisAgent started.")
        except Exception as e:
             logger.error(f"Failed to start SentimentAnalysisAgent: {e}", exc_info=True)

    logger.info("API Service startup complete.")

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