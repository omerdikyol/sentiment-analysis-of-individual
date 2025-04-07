import os
import time
import schedule
import logging
from datetime import datetime, timedelta
import pandas as pd
from typing import Dict, List, Any, Callable, Optional
import json
from pathlib import Path
import subprocess
import signal
import sys
import glob
import threading
import queue
import asyncio
import re
import threading
import requests
from src.utils.mail_config import is_email_notification_enabled, get_email_recipients, NOTIFY_ON_PROCESSING
from src.utils.notification_service import send_analysis_report
from .brain import AgentBrain
from .autogen_agents import AutogenAgentSystem
import inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('AgentCore')

# Define API endpoint URL (Best practice: move to config or env var)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000") # Default for local dev
DATA_UPDATE_ENDPOINT = f"{API_BASE_URL}/data/update"

class SentimentAnalysisAgent:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent.parent
        self.config = self.load_config()
        self.brain = AgentBrain(self.base_path / 'config')
        self.autogen_system = AutogenAgentSystem(self.base_path / 'config')
        self.data_history: Dict[str, List[Any]] = {
            'sentiment_trends': [],
            'data_quality_metrics': [],
            'system_health': []
        }
        self.initialize_directories()
        self.collection_scripts = self.discover_collection_scripts()
        self.command_queue = queue.Queue()
        self.is_running = True
        self.current_task = None
        self.task_status = {
            'is_busy': False,
            'current_task': None,
            'last_run': {},
            'next_run': {},
            'suggestions': []
        }
        self.event_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.event_loop)
        
    def load_config(self) -> dict:
        """Load configuration from config.json or create default"""
        config_path = self.base_path / 'config' / 'default_config.json'
        if config_path.exists():
            with open(config_path, 'r') as f:
                return json.load(f)
        
        # Default configuration
        default_config = {
            'collection_interval_minutes': 60,
            'processing_interval_minutes': 120,
            'data_retention_days': 30,
            'monitoring': {
                'min_data_points': 100,
                'max_duplicate_ratio': 0.2,
                'sentiment_threshold': 0.7
            },
            'sources': {
                'x': True,
                'news': True,
                'mention': True,
                'social_searcher': True,
                'instagram': False,  # Not implemented yet
                'linkedin': False    # Not implemented yet
            },
            'target': {
                'individual_name': 'Sheikh Tamim bin Hamad Al Thani',
                'query_variations': [
                    'Sheikh Tamim bin Hamad Al Thani',
                    'Sheikh Tamim',
                    'Tamim bin Hamad',
                    'Qatar Emir',
                    'Qatar ruler',
                    'Qatar leader',
                    'Tamim Qatar',
                    'Sheikh Tamim bin Hamad'
                ]
            },
            'adaptive_scheduling': True,
            'auto_optimization': True
        }
        
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config

    def get_status(self) -> dict:
        """Get current agent status with brain insights"""
        next_collection = schedule.next_run()
        
        # Get brain suggestions
        metrics = {
            'data_quality': self.data_history['data_quality_metrics'][-1] if self.data_history['data_quality_metrics'] else {},
            'system_health': self.data_history['system_health'][-1] if self.data_history['system_health'] else {}
        }
        suggestions = self.brain.suggest_improvements(metrics)
        
        return {
            **self.task_status,
            'config': self.config,
            'system_health': self.data_history['system_health'][-1] if self.data_history['system_health'] else None,
            'next_scheduled_run': str(next_collection) if next_collection else None,
            'suggestions': suggestions,
            'performance_metrics': self.brain.performance_metrics
        }

    def execute_command(self, command: str, params: dict = None) -> dict:
        """Execute a command and return the result with brain evaluation"""
        if self.task_status['is_busy']:
            return {
                'success': False,
                'message': f"Agent is busy with task: {self.task_status['current_task']}"
            }

        try:
            start_time = time.time()
            result = {'success': False, 'message': ''}

            if command == 'collect':
                thread = threading.Thread(target=self._run_task, args=(self.collect_data, 'collect'))
                thread.start()
                result = {'success': True, 'message': 'Data collection started'}
            
            elif command == 'process':
                thread = threading.Thread(target=self._run_task, args=(self.process_data, 'process'))
                thread.start()
                result = {'success': True, 'message': 'Data processing started'}
            
            elif command == 'collect_and_process':
                thread = threading.Thread(target=self._run_collect_and_process)
                thread.start()
                result = {'success': True, 'message': 'Collection and processing started'}
            
            elif command == 'cleanup':
                thread = threading.Thread(target=self._run_task, args=(self.cleanup_old_data, 'cleanup'))
                thread.start()
                result = {'success': True, 'message': 'Cleanup started'}
            
            elif command == 'update_config':
                if not params:
                    return {'success': False, 'message': 'No configuration provided'}
                self.config.update(params)
                with open(self.base_path / 'config' / 'default_config.json', 'w') as f:
                    json.dump(self.config, f, indent=4)
                result = {'success': True, 'message': 'Configuration updated'}
            
            elif command == 'optimize':
                if self.config.get('auto_optimization', True):
                    new_config = self.brain.optimize_schedule(self.config)
                    self.config.update(new_config)
                    with open(self.base_path / 'config' / 'default_config.json', 'w') as f:
                        json.dump(self.config, f, indent=4)
                    result = {'success': True, 'message': 'Configuration optimized'}
                else:
                    result = {'success': False, 'message': 'Auto-optimization is disabled'}
            
            else:
                result = {'success': False, 'message': f'Unknown command: {command}'}

            # Add execution time and let brain evaluate the action
            result['duration'] = time.time() - start_time
            score = self.brain.evaluate_action(command, result)
            result['brain_score'] = score

            return result
            
        except Exception as e:
            logger.error(f"Error executing command {command}: {str(e)}")
            error_result = {'success': False, 'message': str(e), 'duration': time.time() - start_time}
            self.brain.evaluate_action(command, error_result)
            return error_result

    def _run_task(self, task_func, task_name):
        """Run a task and update status with brain monitoring"""
        self.task_status['is_busy'] = True
        self.task_status['current_task'] = task_name
        start_time = datetime.now()
        success = False # Initialize success status

        try:
            # Check if the task function is a coroutine function
            if inspect.iscoroutinefunction(task_func):
                # Run the async task function blocking until complete
                # This assumes schedule library calls tasks sequentially from the main thread.
                # If tasks need to run concurrently or if schedule runs in a separate thread,
                # using asyncio.run_coroutine_threadsafe might be necessary.
                result = self.event_loop.run_until_complete(task_func())
            else:
                # Run the regular synchronous function
                result = task_func()

            success = result # Capture the success status from the task's return value
            duration = (datetime.now() - start_time).total_seconds()

            self.task_status['last_run'][task_name] = {
                'time': start_time.isoformat(),
                'success': success,
                'duration': duration
            }

            # Update brain's memory
            self.brain.update_memory({
                'type': task_name,
                'success': success,
                'duration': duration,
                'timestamp': start_time.isoformat()
            })

        except Exception as e:
            logger.error(f"Error in task {task_name}: {str(e)}")
            duration = (datetime.now() - start_time).total_seconds()
            success = False # Ensure success is False on exception

            self.task_status['last_run'][task_name] = {
                'time': start_time.isoformat(),
                'success': False,
                'error': str(e),
                'duration': duration
            }

            # Update brain's memory with failure
            self.brain.update_memory({
                'type': task_name,
                'success': False,
                'error': str(e),
                'duration': duration,
                'timestamp': start_time.isoformat()
            })

        finally:
            self.task_status['is_busy'] = False
            self.task_status['current_task'] = None

            # Check if schedule optimization is needed
            if self.config.get('adaptive_scheduling', True):
                new_config = self.brain.optimize_schedule(self.config)
                if new_config != self.config:
                    logger.info("Updating schedule based on performance metrics")
                    self.config = new_config
                    with open(self.base_path / 'config' / 'default_config.json', 'w') as f:
                        json.dump(self.config, f, indent=4)

            # Return the success status of the task function
            return success # Return the captured success status

    def _run_collect_and_process(self):
        """Run collection and processing in sequence"""
        # Run collection for all sources
        collection_success = self._run_task(self.collect_data, 'collect')
        
        # Always run processing after collection, regardless of individual collector success
        processing_success = self._run_task(self.process_data, 'process')
        
        # Send email notifications if enabled
        try:
            from src.utils.notification_service import send_analysis_report, detect_sentiment_change
            from src.utils.mail_config import NOTIFY_ON_ANALYSIS, get_email_recipients
            
            if NOTIFY_ON_ANALYSIS and processing_success:
                logger.info("Analysis notifications enabled and processing successful. Triggering report email...")
                try:
                    # Send report email (function now handles data loading/comparison)
                    recipients = get_email_recipients()
                    if recipients:
                        logger.info(f"Attempting to send analysis report email to: {recipients}")
                        send_analysis_report(recipients)
                        logger.info("Analysis report email triggered successfully.") 
                    else:
                        logger.warning("Analysis notifications enabled, but no recipients configured.")
                        
                except Exception as e:
                    logger.error(f"Error triggering analysis notification email: {str(e)}", exc_info=True)
            elif not NOTIFY_ON_ANALYSIS:
                 logger.info("Analysis notifications are disabled (NOTIFY_ON_ANALYSIS=False). Skipping notification.")
            elif not processing_success:
                 logger.warning("Skipping analysis notification because the data processing step failed.")
        
        except ImportError as e:
            logger.warning(f"Email notification module could not be imported: {str(e)}. Notifications disabled.")
        except Exception as e:
            logger.error(f"Error in email notification: {str(e)}", exc_info=True)

    def discover_collection_scripts(self) -> Dict[str, Path]:
        """Discover all available collection scripts"""
        scripts = {}
        collectors_dir = self.base_path / 'src' / 'collectors'
        
        # Map collector script names to config source names based on actual files
        name_mapping = {
            'news_apify': 'news_apify',
            'news_from_api': 'news_from_api',
            'rss': 'rss',
            'social_searcher_api': 'social_searcher_api',
            'twitter_apify': 'twitter_apify'
        }
        
        # Find all Python files in the main collectors directory that start with 'collect_'
        for script_path in collectors_dir.glob('collect_*.py'):
            source_name = script_path.stem.replace('collect_', '')
            if source_name in name_mapping:
                scripts[name_mapping[source_name]] = script_path
            
        logger.info(f"Discovered collection scripts: {list(scripts.keys())}")
        return scripts

    def initialize_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            'data/raw',
            'data/processed',
            'data/metrics',
            'logs',
            'logs/archive',
            'models/sentiment'
        ]
        for directory in directories:
            (self.base_path / directory).mkdir(parents=True, exist_ok=True)

    def collect_data(self):
        """Execute data collection using the centralized collector script with brain monitoring"""
        try:
            logger.info(f"\n{'='*80}\nStarting Data Collection Process\n{'='*80}")
            collector_script = self.base_path / 'src' / 'collectors' / 'run_collectors.py'
            
            # Run the centralized collector script
            logger.info("Launching centralized collector script...")
            start_time = time.time()
            
            # Run the centralized collector script, allowing its output to stream to the console
            logger.info("Launching centralized collector script (output will stream below)...")
            start_time = time.time()
            
            # Removed capture_output=True and text=True to allow real-time output
            # Added '-u' flag to force unbuffered output from the subprocess
            result = subprocess.run(
                ['python', '-u', str(collector_script)], # Added -u flag
                check=True,
                cwd=str(self.base_path) 
                # stdout and stderr should now stream directly to the console without buffering
            )
            
            collection_duration = time.time() - start_time
            logger.info(f"Collection script execution completed in {collection_duration:.2f}s")
            
            # Removed the redundant post-collection analysis block.
            # The data processor will handle loading and analyzing all raw files later.
            # Success is determined by the subprocess completing without error (check=True).
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Centralized data collection script failed with exit code {e.returncode}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in centralized collection: {str(e)}", exc_info=True)
            return False

    def _get_memory_usage(self) -> float:
        """Get current memory usage of the process"""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_percent()
        except:
            return 0.0

    def process_data(self):
        """Process collected raw data, perform analysis, and send to API."""
        logger.info("Starting data processing...")
        raw_data_path = self.base_path / 'data' / 'raw'
        processed_data_path = self.base_path / 'data' / 'processed'
        processed_data_path.mkdir(parents=True, exist_ok=True)

        all_raw_files = list(raw_data_path.glob('*.csv'))
        if not all_raw_files:
            logger.warning("No raw data files found to process.")
            return False # Indicate no processing happened

        # Aggregate raw data
        try:
            all_data = pd.concat([pd.read_csv(f) for f in all_raw_files], ignore_index=True)
            logger.info(f"Aggregated {len(all_data)} records from {len(all_raw_files)} raw files.")
        except Exception as e:
            logger.error(f"Error aggregating raw data: {e}")
            return False # Indicate failure

        # --- Data Cleaning & Preprocessing ---
        # (Keep your existing cleaning logic here)
        # Example: Deduplication, handling missing values
        initial_count = len(all_data)
        # Ensure 'text' and 'timestamp' columns exist before dropping duplicates
        if 'text' in all_data.columns and 'timestamp' in all_data.columns:
            all_data.drop_duplicates(subset=['text', 'timestamp'], inplace=True)
            cleaned_count = len(all_data)
            logger.info(f"Removed {initial_count - cleaned_count} duplicate records.")
        else:
            logger.warning("Columns 'text' or 'timestamp' not found for deduplication.")
            cleaned_count = initial_count
        # ... other cleaning steps ...

        # --- Sentiment Analysis ---
        # (Keep your existing sentiment analysis logic here)
        try:
            logger.info("Performing sentiment analysis...")
            # Assuming analysis adds 'sentiment_score' and 'sentiment_label' columns
            # Replace this with your actual analysis call
            if 'text' in all_data.columns:
                 all_data['sentiment_score'] = all_data['text'].apply(lambda x: self.brain.analyze_sentiment(x) if isinstance(x, str) else 0.5)
                 all_data['sentiment_label'] = all_data['sentiment_score'].apply(lambda score: 'positive' if score > 0.6 else ('negative' if score < 0.4 else 'neutral'))
                 logger.info("Sentiment analysis completed.")
                 processed_df = all_data # Or the result of your analysis
            else:
                 logger.error("Column 'text' not found for sentiment analysis.")
                 return False
        except Exception as e:
            logger.error(f"Error during sentiment analysis: {e}")
            return False

        # --- Prepare Data for API ---
        if processed_df.empty:
             logger.warning("Processed data is empty. Nothing to send to API.")
             # Clean up raw files even if nothing is sent? Decide based on your logic.
             # for f in all_raw_files: os.remove(f)
             return True # Processing technically succeeded, just no output

        try:
            logger.info(f"Preparing {len(processed_df)} records for API update...")
            # Convert DataFrame to list of dicts compatible with DataRecord model
            processed_df_copy = processed_df.copy()

            # Convert NaNs/NaTs to None for JSON compatibility
            processed_df_copy = processed_df_copy.where(pd.notnull(processed_df_copy), None)

            # Convert specific datetime columns to ISO format string if they exist and are expected by API
            # Adjust column names as needed ('timestamp', 'created_at', etc.)
            if 'timestamp' in processed_df_copy.columns and pd.api.types.is_datetime64_any_dtype(processed_df_copy['timestamp']):
                 # Ensure it's datetime before conversion
                 processed_df_copy['timestamp'] = pd.to_datetime(processed_df_copy['timestamp'], errors='coerce')
                 # Remove timezone info if present (Render might use UTC)
                 if processed_df_copy['timestamp'].dt.tz is not None:
                    processed_df_copy['timestamp'] = processed_df_copy['timestamp'].dt.tz_localize(None)
                 # Convert valid datetimes to ISO format, leave others as None
                 processed_df_copy['timestamp'] = processed_df_copy['timestamp'].apply(lambda x: x.isoformat(timespec='seconds') if pd.notna(x) else None)

            # Add similar conversions for other datetime columns if necessary

            # Ensure column names match the Pydantic model 'DataRecord' in the API
            # Rename columns here if needed, e.g.:
            # processed_df_copy.rename(columns={'some_name': 'api_field_name'}, inplace=True)

            data_list = processed_df_copy.to_dict(orient='records')
            payload = {"data": data_list}

        except Exception as e:
            logger.error(f"Error preparing data for API: {e}")
            return False

        # --- Send Data to API ---
        try:
            logger.info(f"Sending data to API endpoint: {DATA_UPDATE_ENDPOINT}")
            response = requests.post(DATA_UPDATE_ENDPOINT, json=payload, timeout=60) # Added timeout
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

            logger.info(f"API update successful: {response.json().get('message', 'OK')}")

            # Clean up raw files after successful processing and API send
            logger.info("Cleaning up raw data files...")
            for f in all_raw_files:
                try:
                    os.remove(f)
                except Exception as e_rm:
                    logger.warning(f"Could not remove raw file {f}: {e_rm}")
            logger.info("Raw data files cleaned up.")

            # Notify via email if configured
            if is_email_notification_enabled() and NOTIFY_ON_PROCESSING:
                recipients = get_email_recipients()
                if recipients:
                    subject = "Data Processing Completed"
                    message = f"Data processing completed successfully at {datetime.now()}.\n{len(processed_df)} records processed and sent to API."
                    try:
                        # Assuming you have a send_notification utility
                        from src.utils.notification_service import send_notification # Ensure import is correct
                        send_notification(recipients, subject, message)
                        logger.info(f"Sent processing completion notification to: {', '.join(recipients)}")
                    except ImportError:
                         logger.error("Could not import send_notification. Email not sent.")
                    except Exception as e_mail:
                        logger.error(f"Failed to send processing notification email: {e_mail}")

            return True # Indicate success

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send data to API: {e}")
            # Decide how to handle failure: Maybe save locally as backup?
            # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # failed_api_path = processed_data_path / f'failed_api_update_{timestamp}.csv'
            # try:
            #     processed_df.to_csv(failed_api_path, index=False)
            #     logger.info(f"Saved data locally due to API failure: {failed_api_path}")
            # except Exception as e_save:
            #     logger.error(f"Failed to save backup data locally: {e_save}")
            return False # Indicate failure
        except Exception as e:
             logger.error(f"An unexpected error occurred after preparing data: {e}")
             return False

    def update_metrics(self, latest_data: pd.DataFrame, analysis_result: Dict[str, Any]):
        """Update system metrics and performance indicators with Autogen insights"""
        try:
            # Calculate basic metrics
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'total_records': len(latest_data),
                'sentiment_distribution': latest_data['sentiment_label'].value_counts().to_dict(),
                'average_sentiment_score': latest_data['sentiment_score'].mean(),
                'data_sources': latest_data['source'].value_counts().to_dict()
            }
            
            # Add Autogen insights
            if 'insights' in analysis_result:
                metrics.update({
                    'autogen_insights': analysis_result['insights'],
                    'data_quality': analysis_result['insights'].get('data_quality', {}),
                    'analysis_recommendations': analysis_result['insights'].get('recommendations', [])
                })
            
            # Update history
            self.data_history['sentiment_trends'].append(metrics)
            
            # Keep only last 30 days of metrics
            cutoff = len(self.data_history['sentiment_trends']) - (self.config['data_retention_days'] * 48)
            if cutoff > 0:
                self.data_history['sentiment_trends'] = self.data_history['sentiment_trends'][cutoff:]
            
            # Save metrics
            metrics_file = self.base_path / 'data' / 'metrics' / 'history.json'
            with open(metrics_file, 'w') as f:
                json.dump(self.data_history, f, indent=4)
            
            # Update task status with Autogen suggestions
            if 'recommendations' in analysis_result.get('insights', {}):
                self.task_status['suggestions'] = analysis_result['insights']['recommendations']
            
            logger.info("Metrics updated successfully with Autogen insights")
        except Exception as e:
            logger.error(f"Failed to update metrics: {str(e)}")

    async def optimize_system(self):
        """Optimize system parameters using Autogen based on performance data."""
        logger.info("Starting system optimization...")
        try:
            # Gather performance data
            latest_sentiment_metrics = self.data_history['sentiment_trends'][-1] if self.data_history['sentiment_trends'] else {}
            latest_health_metrics = self.data_history['system_health'][-1] if self.data_history['system_health'] else {}
            latest_data_quality = latest_sentiment_metrics.get('data_quality', {}) # Get quality from sentiment metrics
            last_collection_run = self.task_status['last_run'].get('collect', {}) # Get overall collection status
            
            performance_data = {
                'overall_collection_status': {
                    'timestamp': last_collection_run.get('timestamp'),
                    'duration_seconds': last_collection_run.get('duration'),
                    'success': last_collection_run.get('success')
                 },
                'latest_sentiment_analysis': {
                    'timestamp': latest_sentiment_metrics.get('timestamp'),
                    'total_records_processed': latest_sentiment_metrics.get('total_records'),
                    'average_sentiment_score': latest_sentiment_metrics.get('average_sentiment_score'),
                    'sentiment_distribution': latest_sentiment_metrics.get('sentiment_distribution'),
                    'autogen_insights_summary': latest_sentiment_metrics.get('autogen_insights', {}).get('summary', [])[:3] # Sample of insights
                },
                'latest_data_quality': latest_data_quality,
                'system_health': latest_health_metrics, # e.g., memory usage if tracked
                'current_collection_interval_minutes': self.config.get('collection_interval_minutes'),
                'current_processing_interval_minutes': self.config.get('processing_interval_minutes')
            }

            # Remove collection_stats which is often empty/unavailable
            # 'collection_stats': {
            #     source: self.task_status['last_run'].get(f'collect_{source}', {})
            #     for source in self.config['sources']
            #     if self.config['sources'][source]
            # }

            # Clean up None values before sending to LLM
            performance_data = json.loads(json.dumps(performance_data, default=str)) # Convert non-serializable first

            logger.info(f"Sending performance data to Autogen for optimization: {json.dumps(performance_data, indent=2)}")

            # Get optimization suggestions from Autogen - now awaited
            optimization_result = await self.autogen_system.optimize_collection(performance_data)

            if optimization_result and 'optimizations' in optimization_result:
                logger.info(f"Received optimization suggestions: {optimization_result['optimizations']}")
                # Update collection frequency if suggested and valid
                new_frequency = optimization_result['optimizations'].get('collection_frequency')
                if isinstance(new_frequency, (int, float)) and 15 <= new_frequency <= 1440:  # Check type and reasonable bounds (15 min to 1 day)
                    self.config['collection_interval_minutes'] = int(new_frequency)
                    schedule.clear('collect-task') # Clear existing collection schedule
                    schedule.every(self.config['collection_interval_minutes']).minutes.do(
                        lambda: self._run_task(self.collect_data, 'collect')
                    ).tag('collect-task') # Re-add with new interval and tag
                    logger.info(f"Updated collection frequency to {int(new_frequency)} minutes based on optimization.")
                elif new_frequency is not None:
                     logger.warning(f"Received invalid collection frequency suggestion: {new_frequency}. Ignoring.")

                # --- Placeholder for applying other suggested changes --- 
                # Example: Adjusting data sources based on quality/performance
                suggested_changes = optimization_result['optimizations'].get('suggested_changes', [])
                for change in suggested_changes:
                     # Implement logic to apply changes to self.config or elsewhere
                     logger.info(f"Applying suggested change: {change}")
                     pass # Add actual implementation later
                # -----------------------------------------------------------

                # Save updated config if changes were made (e.g., frequency)
                if new_frequency is not None: # Check if frequency was actually updated
                    self.save_config()
                    logger.info("Configuration saved after applying optimizations.")

                logger.info("System optimization processing completed.")
                return True
            else:
                logger.warning("No valid optimization suggestions received from Autogen.")
                return False

        except Exception as e:
            logger.error(f"Error in system optimization: {str(e)}", exc_info=True)
            return False

    def save_config(self):
        """Save the current agent configuration to file."""
        try:
            config_path = self.base_path / 'config' / 'default_config.json'
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=4, default=str) # Use default=str for non-serializable types
            logger.info(f"Configuration successfully saved to {config_path}")
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}", exc_info=True)

    def cleanup_old_data(self):
        """Clean up old data files based on retention policy"""
        try:
            retention_days = self.config['data_retention_days']
            current_time = datetime.now()
            
            # Clean up processed data
            processed_dir = self.base_path / 'data' / 'processed'
            for file in processed_dir.glob('*.csv'):
                if file.name == 'latest.csv':
                    continue
                file_stat = file.stat()
                file_age = (current_time - datetime.fromtimestamp(file_stat.st_mtime)).days
                if file_age > retention_days:
                    file.unlink()
                    logger.info(f"Deleted old processed file: {file}")
            
            # Clean up raw data
            raw_dir = self.base_path / 'data' / 'raw'
            for file in raw_dir.glob('*.csv'):
                file_stat = file.stat()
                file_age = (current_time - datetime.fromtimestamp(file_stat.st_mtime)).days
                if file_age > retention_days:
                    file.unlink()
                    logger.info(f"Deleted old raw data file: {file}")
            
            # Archive old logs
            log_file = self.base_path / 'logs' / 'agent.log'
            if log_file.exists() and log_file.stat().st_size > 10 * 1024 * 1024:  # 10MB
                archive_name = f"agent_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
                archive_path = self.base_path / 'logs' / 'archive' / archive_name
                log_file.rename(archive_path)
                logger.info(f"Archived log file to: {archive_path}")
            
            logger.info("Data cleanup completed successfully")
        except Exception as e:
            logger.error(f"Failed to clean up old data: {str(e)}")

    def run(self):
        """Main execution loop with enhanced Autogen-powered optimization"""
        def signal_handler(signum, frame):
            logger.info("Shutdown signal received. Cleaning up...")
            self.is_running = False
            self.brain.save_brain_state()
            self.event_loop.close()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        # Schedule tasks
        schedule.every(self.config['collection_interval_minutes']).minutes.do(
            lambda: self._run_task(self.collect_data, 'collect'))
        schedule.every(self.config['processing_interval_minutes']).minutes.do(
            lambda: self._run_task(self.process_data, 'process'))
        schedule.every().day.at("00:00").do(
            lambda: self._run_task(self.cleanup_old_data, 'cleanup'))
        
        # Add system optimization schedule
        if self.config.get('auto_optimization', True):
            schedule.every(6).hours.do(
                lambda: self._run_task(self.optimize_system, 'optimize'))

        logger.info("Agent started successfully with Autogen enhancement. Starting main loop...")
        
        # Main loop with enhanced monitoring
        # Initial run is now handled in the main execution block based on user input
        while self.is_running:
            schedule.run_pending()
            
            # Let both brain and Autogen suggest improvements
            if self.config.get('auto_optimization', True):
                metrics = {
                    'data_quality': self.data_history['data_quality_metrics'][-1] if self.data_history['data_quality_metrics'] else {},
                    'system_health': self.data_history['system_health'][-1] if self.data_history['system_health'] else {}
                }
                
                # Combine suggestions from both systems
                brain_suggestions = self.brain.suggest_improvements(metrics)
                self.task_status['suggestions'] = brain_suggestions
                
                # Periodically run system optimization
                if not self.task_status['is_busy'] and time.time() % 3600 < 1:  # Check every hour
                    self._run_task(self.optimize_system, 'optimize')
            
            time.sleep(1)

def parse_delay_to_seconds(delay_str: str) -> Optional[int]:
    """Parses a delay string (e.g., '10min', '30sec', 'now') into seconds."""
    delay_str = delay_str.strip().lower()
    
    if not delay_str:
        return None # Skip initial run if blank
        
    if delay_str == 'now':
        return 0
        
    # Updated regex to include hour units (h, hr, hour)
    match = re.match(r'^(\d+)\s*(min|sec|s|m|h|hr|hour)?$', delay_str)
    if not match:
        logger.warning(f"Invalid delay format: '{delay_str}'. Skipping initial run.")
        return None
        
    value = int(match.group(1))
    unit = match.group(2)
    
    if unit in ['min', 'm']:
        return value * 60
    elif unit in ['sec', 's', None]: # Default to seconds if no unit
        return value
    elif unit in ['h', 'hr', 'hour']: # Added hour support
        return value * 3600
    else:
        # This case should technically not be reached with the updated regex, but kept for safety
        logger.warning(f"Unknown time unit in delay: '{unit}'. Skipping initial run.")
        return None

if __name__ == "__main__":
    agent = SentimentAnalysisAgent()
    logger.info("Starting agent's main loop...")
    agent.run()
