from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
from pathlib import Path
from pydantic import BaseModel

# Import the agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.core import SentimentAnalysisAgent

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