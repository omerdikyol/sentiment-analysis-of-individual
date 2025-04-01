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
from .brain import AgentBrain
from .autogen_agents import AutogenAgentSystem

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
            'collection_interval_minutes': 30,
            'processing_interval_minutes': 60,
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
        
        try:
            result = task_func()
            duration = (datetime.now() - start_time).total_seconds()
            
            self.task_status['last_run'][task_name] = {
                'time': start_time.isoformat(),
                'success': result,
                'duration': duration
            }

            # Update brain's memory
            self.brain.update_memory({
                'type': task_name,
                'success': result,
                'duration': duration,
                'timestamp': start_time.isoformat()
            })

        except Exception as e:
            logger.error(f"Error in task {task_name}: {str(e)}")
            duration = (datetime.now() - start_time).total_seconds()
            
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
                logger.info("Analysis notifications enabled and processing successful. Checking for sentiment changes...")
                try:
                    # Load data for comparison from the dashboard directory
                    dashboard_dir = self.base_path / 'dashboard' / 'public'
                    latest_file = dashboard_dir / 'processed_data.csv' # Path to current dashboard file
                    previous_file = dashboard_dir / 'processed_data_old.csv' # Path to previous dashboard file

                    if not latest_file.exists():
                         logger.warning(f"Cannot send analysis notification: {latest_file.name} not found in dashboard/public.")
                         return # Exit if no latest data
                         
                    latest_data = pd.read_csv(latest_file)
                    previous_data = pd.read_csv(previous_file) if previous_file.exists() else None
                    
                    if previous_data is None:
                         logger.info(f"Previous data file ({previous_file.name}) not found. Cannot detect changes for first run.")
                         sentiment_changed = False
                         sentiment_change_data = {}
                    else:
                         # Detect sentiment change
                         sentiment_changed, sentiment_change_data = detect_sentiment_change(latest_data, previous_data)
                    
                    if sentiment_changed:
                        logger.info(f"Significant sentiment change detected: {sentiment_change_data.get('change_direction')} by {abs(sentiment_change_data.get('change_value', 0)):.2f} points")
                    else:
                        logger.info("No significant sentiment change detected.")

                    # Calculate necessary stats for report
                    # ... (existing code for positive/negative counts, percentages, topics)
                    positive_count = (latest_data['sentiment_label'] == 'positive').sum()
                    negative_count = (latest_data['sentiment_label'] == 'negative').sum()
                    neutral_count = len(latest_data) - positive_count - negative_count
                    
                    # Calculate percentages
                    total = len(latest_data)
                    positive_pct = (positive_count / total * 100) if total > 0 else 0
                    negative_pct = (negative_count / total * 100) if total > 0 else 0
                    neutral_pct = (neutral_count / total * 100) if total > 0 else 0
                    
                    # Extract top topics by sentiment
                    positive_topics = {}
                    negative_topics = {}
                    
                    if 'keywords' in latest_data.columns and 'sentiment_score' in latest_data.columns:
                        for _, row in latest_data.iterrows():
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
                    
                    # Get insights from autogen if available
                    insights = []
                    if hasattr(self, 'autogen_system') and hasattr(self.autogen_system, 'latest_insights'):
                        insights = self.autogen_system.latest_insights
                    
                    # Add new topics and fading topics to insights if available
                    if sentiment_changed:
                        # Add new topics
                        for topic_data in sentiment_change_data.get("new_topics", []):
                            topic = topic_data.get("topic")
                            count = topic_data.get("count")
                            insights.append(f"New topic detected: '{topic}' with {count} mentions")
                        
                        # Add fading topics
                        for topic_data in sentiment_change_data.get("fading_topics", []):
                            topic = topic_data.get("topic")
                            prev_count = topic_data.get("previous_count")
                            curr_count = topic_data.get("current_count")
                            if curr_count == 0:
                                insights.append(f"Topic no longer mentioned: '{topic}' (previously {prev_count} mentions)")
                            else:
                                insights.append(f"Topic declining: '{topic}' reduced from {prev_count} to {curr_count} mentions")
                    
                    # Prepare report data
                    logger.info("Preparing analysis report data...") # Log before prep
                    analysis_data = {
                        "overall_sentiment": latest_data['sentiment_score'].mean() if 'sentiment_score' in latest_data.columns else 0,
                        "positive_mentions": positive_pct,
                        "neutral_mentions": neutral_pct,
                        "negative_mentions": negative_pct,
                        "total_mentions": total,
                        "positive_topics": positive_topics,
                        "negative_topics": negative_topics,
                        "insights": insights
                    }
                    
                    # Add sentiment change data if available
                    if sentiment_changed:
                        analysis_data.update(sentiment_change_data)
                    
                    # Send report email
                    recipients = get_email_recipients()
                    logger.info(f"Sending analysis report email to: {recipients}") # Log before sending
                    send_analysis_report(analysis_data, recipients)
                    logger.info("Analysis report email sent successfully.") # Log after sending
                    
                    # After successful processing and notification, the file rotation already handles the state.
                    # No need to copy files here manually as we are reading the dashboard files directly.
                    # try:
                    #     import shutil
                    #     shutil.copy2(latest_file, previous_file) # This was incorrect logic
                    #     logger.info(f"Successfully copied {latest_file.name} to {previous_file.name} for next comparison.")
                    # except Exception as copy_err:
                    #     logger.error(f"Failed to copy latest data to previous data file: {copy_err}")
                        
                except Exception as e:
                    logger.error(f"Error during analysis notification preparation or sending: {str(e)}", exc_info=True)
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
        """Execute data processing and analysis with Autogen assistance"""
        try:
            logger.info("Starting data processing...")
            processor_path = self.base_path / 'src' / 'processing' / 'data_processor.py'
            subprocess.run(['python', str(processor_path)], check=True, cwd=str(self.base_path))
            
            # Load processed data for Autogen analysis
            latest_data = pd.read_csv(self.base_path / 'data' / 'processed' / 'latest.csv')
            data_dict = latest_data.to_dict(orient='records')
            
            # Run Autogen analysis
            analysis_result = self.event_loop.run_until_complete(
                self.autogen_system.analyze_data({
                    'data': data_dict,
                    'metadata': {
                        'timestamp': datetime.now().isoformat(),
                        'source_count': len(latest_data['source'].unique()),
                        'total_records': len(latest_data)
                    }
                })
            )
            
            # Update metrics with Autogen insights
            self.update_metrics(latest_data, analysis_result)
            
            logger.info("Data processing and analysis completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Data processing failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in data processing: {str(e)}")
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

    def optimize_system(self):
        """Use Autogen to optimize system performance based on available high-level metrics."""
        logger.info("Starting system optimization analysis...")
        try:
            # Prepare available performance metrics (high-level)
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

            # Get optimization suggestions from Autogen
            optimization_result = self.autogen_system.optimize_collection(performance_data)

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
    start_confirmation = input("Do you want to start the Sentiment Analysis Agent now? (yes/no): ")
    
    if start_confirmation.lower() in ['yes', 'y']:
        logger.info("User confirmed agent start.")
        
        # Updated prompt to include hour example
        delay_input = input("Enter delay for initial collection (e.g., '1h', '10min', '30sec', 'now', or leave blank to skip): ")
        delay_seconds = parse_delay_to_seconds(delay_input)

        initial_run_scheduled = False
        if delay_seconds == 0:
            logger.info("Starting initial data collection and processing immediately...")
            # Run synchronously before starting the main loop
            agent._run_collect_and_process()
            logger.info("Initial run complete.")
            initial_run_scheduled = True
        elif delay_seconds is not None and delay_seconds > 0:
            logger.info(f"Scheduling initial data collection to run in {delay_seconds} seconds...")
            # Run asynchronously after the delay
            timer = threading.Timer(delay_seconds, agent._run_collect_and_process)
            timer.start()
            initial_run_scheduled = True
        else:
             logger.info("Skipping initial data collection. Agent will run based on schedule.")

        # Start the main agent loop (scheduling, etc.) regardless of initial run
        logger.info("Starting agent's main loop...")
        agent.run()
        
    else:
        logger.info("Agent start cancelled by user.")
        sys.exit(0)
