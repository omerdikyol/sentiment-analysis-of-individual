import os
import time
import schedule
import logging
from datetime import datetime
import pandas as pd
from typing import Dict, List, Any
import json
from pathlib import Path
import subprocess
import signal
import sys
import glob
import threading
import queue

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
            'next_run': {}
        }
        
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
            }
        }
        
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config

    def get_status(self) -> dict:
        """Get current agent status"""
        next_collection = schedule.next_run()
        
        return {
            **self.task_status,
            'config': self.config,
            'system_health': self.data_history['system_health'][-1] if self.data_history['system_health'] else None,
            'next_scheduled_run': str(next_collection) if next_collection else None
        }

    def execute_command(self, command: str, params: dict = None) -> dict:
        """Execute a command and return the result"""
        if self.task_status['is_busy']:
            return {
                'success': False,
                'message': f"Agent is busy with task: {self.task_status['current_task']}"
            }

        try:
            if command == 'collect':
                thread = threading.Thread(target=self._run_task, args=(self.collect_data, 'collect'))
                thread.start()
                return {'success': True, 'message': 'Data collection started'}
            
            elif command == 'process':
                thread = threading.Thread(target=self._run_task, args=(self.process_data, 'process'))
                thread.start()
                return {'success': True, 'message': 'Data processing started'}
            
            elif command == 'collect_and_process':
                thread = threading.Thread(target=self._run_collect_and_process)
                thread.start()
                return {'success': True, 'message': 'Collection and processing started'}
            
            elif command == 'cleanup':
                thread = threading.Thread(target=self._run_task, args=(self.cleanup_old_data, 'cleanup'))
                thread.start()
                return {'success': True, 'message': 'Cleanup started'}
            
            elif command == 'update_config':
                if not params:
                    return {'success': False, 'message': 'No configuration provided'}
                self.config.update(params)
                with open(self.base_path / 'config' / 'default_config.json', 'w') as f:
                    json.dump(self.config, f, indent=4)
                return {'success': True, 'message': 'Configuration updated'}
            
            else:
                return {'success': False, 'message': f'Unknown command: {command}'}
            
        except Exception as e:
            logger.error(f"Error executing command {command}: {str(e)}")
            return {'success': False, 'message': str(e)}

    def _run_task(self, task_func, task_name):
        """Run a task and update status"""
        self.task_status['is_busy'] = True
        self.task_status['current_task'] = task_name
        start_time = datetime.now()
        
        try:
            result = task_func()
            self.task_status['last_run'][task_name] = {
                'time': start_time.isoformat(),
                'success': result,
                'duration': (datetime.now() - start_time).total_seconds()
            }
        except Exception as e:
            logger.error(f"Error in task {task_name}: {str(e)}")
            self.task_status['last_run'][task_name] = {
                'time': start_time.isoformat(),
                'success': False,
                'error': str(e),
                'duration': (datetime.now() - start_time).total_seconds()
            }
        finally:
            self.task_status['is_busy'] = False
            self.task_status['current_task'] = None

    def _run_collect_and_process(self):
        """Run collection and processing in sequence"""
        # Run collection for all sources
        self._run_task(self.collect_data, 'collect')
        # Always run processing after collection, regardless of individual collector success
        self._run_task(self.process_data, 'process')

    def discover_collection_scripts(self) -> Dict[str, Path]:
        """Discover all available collection scripts"""
        scripts = {}
        collectors_dir = self.base_path / 'src' / 'collectors'
        
        # Map collector script names to config source names
        name_mapping = {
            'x': 'x',
            'news': 'news',
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
        """Execute all enabled data collection processes"""
        success_count = 0
        total_count = 0
        print("Collection Scripts:", self.collection_scripts)
        for source, script_path in self.collection_scripts.items():
            if self.config['sources'].get(source, False):
                total_count += 1
                try:
                    logger.info(f"Starting data collection for source: {source}")
                    result = subprocess.run(
                        ['python', str(script_path)],
                        check=True,
                        capture_output=True,
                        text=True,
                        cwd=str(self.base_path)
                    )
                    logger.info(f"Collection completed for {source}: {result.stdout.strip()}")
                    success_count += 1
                except subprocess.CalledProcessError as e:
                    logger.error(f"Data collection failed for {source}: {str(e)}")
                    logger.error(f"Error output: {e.stderr}")
                except Exception as e:
                    logger.error(f"Unexpected error in {source} collection: {str(e)}")

        # Update system health metrics
        self.data_history['system_health'].append({
            'timestamp': datetime.now().isoformat(),
            'collection_success_rate': success_count / total_count if total_count > 0 else 0,
            'active_sources': success_count,
            'total_sources': total_count
        })

        return True  # Always return True to ensure processing continues

    def process_data(self):
        """Execute data processing and analysis"""
        try:
            logger.info("Starting data processing...")
            processor_path = self.base_path / 'src' / 'processing' / 'data_processor.py'
            subprocess.run(['python', str(processor_path)], check=True, cwd=str(self.base_path))
            self.update_metrics()
            logger.info("Data processing completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Data processing failed: {str(e)}")
            return False

    def update_metrics(self):
        """Update system metrics and performance indicators"""
        try:
            latest_data = pd.read_csv(self.base_path / 'data' / 'processed' / 'latest.csv')
            
            # Calculate metrics
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'total_records': len(latest_data),
                'sentiment_distribution': latest_data['sentiment_label'].value_counts().to_dict(),
                'average_sentiment_score': latest_data['sentiment_score'].mean(),
                'data_sources': latest_data['source'].value_counts().to_dict()
            }
            
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
                
            logger.info("Metrics updated successfully")
        except Exception as e:
            logger.error(f"Failed to update metrics: {str(e)}")

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
        """Main execution loop"""
        def signal_handler(signum, frame):
            logger.info("Shutdown signal received. Cleaning up...")
            self.is_running = False
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

        logger.info("Agent started successfully")
        
        # Initial run
        self._run_collect_and_process()

        # Main loop
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)

if __name__ == "__main__":
    agent = SentimentAnalysisAgent()
    agent.run() 