import logging
from pathlib import Path
import importlib
import sys
from datetime import datetime
import time

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(module)s:%(funcName)s] - %(message)s',
    handlers=[
        logging.FileHandler('logs/collectors.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('Collectors')

def run_collector(module_name: str) -> None:
    """Run a collector module by importing and executing its main function."""
    collector_name = module_name.split('.')[-1]
    start_time = time.time()
    
    try:
        logger.info(f"{'='*20} Starting collector: {collector_name} {'='*20}")
        # Import the module
        module = importlib.import_module(module_name)
        
        # Check if module has main function
        if hasattr(module, 'main'):
            module.main()
            end_time = time.time()
            duration = end_time - start_time
            logger.info(f"{'='*20} Finished collector: {collector_name} - Duration: {duration:.2f}s {'='*20}")
        else:
            logger.warning(f"{collector_name} does not have a main function")
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        logger.error(f"Error running {collector_name} (Duration: {duration:.2f}s): {str(e)}", exc_info=True)

def main():
    """Run all available collectors."""
    # Add src directory to Python path to enable imports
    src_dir = Path(__file__).parent.parent
    sys.path.append(str(src_dir))
    
    # List of collector modules to run
    collectors = [
        'collectors.collect_news_from_api',
        'collectors.collect_news_apify',
        'collectors.collect_rss',
        'collectors.collect_social_searcher_api',
        'collectors.collect_twitter_apify',
    ]
    
    total_start_time = time.time()
    logger.info(f"{'#'*30} Starting collectors run {'#'*30}")
    
    successful_collectors = 0
    total_collectors = len(collectors)
    
    # Run each collector
    for collector in collectors:
        run_collector(collector)
        if collector in sys.modules:  # Check if module was successfully imported
            successful_collectors += 1
    
    total_duration = time.time() - total_start_time
    success_rate = (successful_collectors / total_collectors) * 100
    
    logger.info(f"{'#'*30} Collection Summary {'#'*30}")
    logger.info(f"Total Duration: {total_duration:.2f}s")
    logger.info(f"Success Rate: {success_rate:.1f}% ({successful_collectors}/{total_collectors} collectors)")
    logger.info(f"{'#'*30} End of Collection Run {'#'*30}")

if __name__ == "__main__":
    main() 