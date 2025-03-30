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
                # Load the latest processed data and previous data for comparison
                try:
                    # Path to data files
                    processed_path = self.base_path / 'data' / 'processed'
                    latest_file = processed_path / 'latest.csv'
                    previous_file = processed_path / 'previous.csv'
                    
                    # Check if files exist
                    if not latest_file.exists():
                        logger.error(f"Latest processed data file not found: {latest_file}")
                        return
                        
                    # Load current data
                    latest_data = pd.read_csv(latest_file)
                    
                    # Initialize change detection variables
                    sentiment_changed = False
                    sentiment_change_data = {}
                    
                    # Load and compare with previous data if it exists
                    if previous_file.exists():
                        previous_data = pd.read_csv(previous_file)
                        
                        # Detect sentiment changes
                        sentiment_change_data = detect_sentiment_change(latest_data, previous_data)
                        sentiment_changed = sentiment_change_data.get("sentiment_changed", False)
                        
                        logger.info(f"Sentiment change detected: {sentiment_changed}")
                        if sentiment_changed:
                            change_value = sentiment_change_data.get("sentiment_change", 0)
                            change_direction = "improved" if change_value > 0 else "declined"
                            logger.info(f"Sentiment has {change_direction} by {abs(change_value):.2f} points")
                    
                    # Get overall sentiment score
                    overall_sentiment = latest_data['sentiment_score'].mean() if 'sentiment_score' in latest_data.columns else 0
                    
                    # Count positive, negative, and neutral mentions
                    if 'sentiment_label' in latest_data.columns:
                        positive_count = len(latest_data[latest_data['sentiment_label'] == 'positive'])
                        negative_count = len(latest_data[latest_data['sentiment_label'] == 'negative'])
                        neutral_count = len(latest_data[latest_data['sentiment_label'] == 'neutral'])
                    else:
                        positive_count = len(latest_data[latest_data['sentiment_score'] > 0.2]) if 'sentiment_score' in latest_data.columns else 0
                        negative_count = len(latest_data[latest_data['sentiment_score'] < -0.2]) if 'sentiment_score' in latest_data.columns else 0
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
                    analysis_data = {
                        "overall_sentiment": overall_sentiment,
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
                    send_analysis_report(analysis_data, recipients)
                    
                    # After successful processing, copy latest.csv to previous.csv for next comparison
                    import shutil
                    shutil.copy2(latest_file, previous_file)
                    
                except Exception as e:
                    logger.error(f"Error sending analysis notification: {str(e)}", exc_info=True)
        
        except ImportError as e:
            logger.warning(f"Email notification module not available: {str(e)}")
        except Exception as e:
            logger.error(f"Error in email notification: {str(e)}", exc_info=True)

    def discover_collection_scripts(self) -> Dict[str, Path]:
        """Discover all available collection scripts"""
        scripts = {}
        collectors_dir = self.base_path / 'src' / 'collectors'
        
        # Map collector script names to config source names
        name_mapping = {
            'x': 'x',
            'news_from_api': 'news_from_api',
            'rss': 'rss',
            'mention': 'mention',
            'social_searcher': 'social_searcher'
        }
        
        # Find all Python files that start with 'collect_'
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
            
            result = subprocess.run(
                ['python', str(collector_script)],
                check=True,
                capture_output=True,
                text=True,
                cwd=str(self.base_path)
            )
            
            collection_duration = time.time() - start_time
            logger.info(f"Collection script execution completed in {collection_duration:.2f}s")
            
            # Log collector output
            for line in result.stdout.strip().split('\n'):
                if line:
                    logger.info(f"Collector Output: {line}")

            # Load and analyze collected data
            logger.info("\nAnalyzing collected data...")
            today = datetime.now().strftime("%Y%m%d")
            collected_data = []
            success_count = 0
            total_count = 0

            # Check data from all possible sources
            for source in ['x', 'news', 'rss', 'mention', 'social_searcher']:
                if self.config['sources'].get(source, False):
                    total_count += 1
                    data_file = self.base_path / "data" / "raw" / f"{source}_data_{today}.csv"
                    logger.info(f"\nChecking data for source: {source}")
                    
                    if data_file.exists():
                        try:
                            df = pd.read_csv(data_file)
                            records_count = len(df)
                            collected_data.append(df)
                            success_count += 1
                            
                            logger.info(f"Successfully loaded {records_count} records from {source}")
                            
                            # Analyze data quality
                            logger.info(f"Analyzing data quality for {source}...")
                            quality_metrics = self.brain.analyze_data_quality(df)
                            self.data_history['data_quality_metrics'].append({
                                'timestamp': datetime.now().isoformat(),
                                'source': source,
                                'metrics': quality_metrics
                            })
                            logger.info(f"Data quality analysis completed for {source}")
                            
                        except Exception as e:
                            logger.error(f"Error processing data from {source}: {str(e)}", exc_info=True)
                    else:
                        logger.warning(f"No data file found for source: {source}")

            # Update system health metrics
            total_records = sum(len(df) for df in collected_data)
            health_metrics = {
                'timestamp': datetime.now().isoformat(),
                'collection_success_rate': success_count / total_count if total_count > 0 else 0,
                'active_sources': success_count,
                'total_sources': total_count,
                'total_records': total_records,
                'memory_usage': self._get_memory_usage()
            }
            self.data_history['system_health'].append(health_metrics)

            logger.info(f"\n{'='*80}")
            logger.info(f"Collection Summary:")
            logger.info(f"- Success Rate: {(success_count / total_count * 100):.1f}% ({success_count}/{total_count} sources)")
            logger.info(f"- Total Records: {total_records}")
            logger.info(f"- Memory Usage: {health_metrics['memory_usage']:.2f}%")
            logger.info(f"{'='*80}\n")

            return success_count > 0

        except subprocess.CalledProcessError as e:
            logger.error(f"Centralized data collection failed: {str(e)}")
            logger.error(f"Error output: {e.stderr}")
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
        """Use Autogen to optimize system performance"""
        try:
            # Prepare performance metrics
            performance_data = {
                'system_health': self.data_history['system_health'][-1] if self.data_history['system_health'] else {},
                'data_quality': self.data_history['data_quality_metrics'][-1] if self.data_history['data_quality_metrics'] else {},
                'collection_stats': {
                    source: self.task_status['last_run'].get(f'collect_{source}', {})
                    for source in self.config['sources']
                    if self.config['sources'][source]
                }
            }
            
            # Get optimization suggestions from Autogen
            optimization_result = self.event_loop.run_until_complete(
                self.autogen_system.optimize_collection(performance_data)
            )
            
            if 'optimizations' in optimization_result:
                # Update collection frequency if suggested
                if optimization_result['optimizations']['collection_frequency']:
                    new_frequency = optimization_result['optimizations']['collection_frequency']
                    if 15 <= new_frequency <= 120:  # Ensure reasonable bounds
                        self.config['collection_interval_minutes'] = new_frequency
                        logger.info(f"Updated collection frequency to {new_frequency} minutes")
                
                # Update configuration with other optimizations
                if optimization_result['optimizations']['suggested_changes']:
                    for change in optimization_result['optimizations']['suggested_changes']:
                        if isinstance(change, dict):
                            self.config.update(change)
                
                # Save updated config
                with open(self.base_path / 'config' / 'default_config.json', 'w') as f:
                    json.dump(self.config, f, indent=4)
                
                logger.info("System optimization completed successfully")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in system optimization: {str(e)}")
            return False

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

        logger.info("Agent started successfully with Autogen enhancement")
        
        # Initial run
        self._run_collect_and_process()

        # Main loop with enhanced monitoring
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

if __name__ == "__main__":
    agent = SentimentAnalysisAgent()
    agent.run() 