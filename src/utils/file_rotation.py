import os
import shutil
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def rotate_processed_files(new_csv_path, dashboard_public_dir='../../dashboard/public'):
    """
    Handles the rotation of processed CSV files:
    1. Moves the current processed_data_old.csv to an archive location if it exists
    2. Renames the current processed_data.csv to processed_data_old.csv
    3. Copies the newly generated CSV file to the dashboard/public folder as processed_data.csv
    
    Args:
        new_csv_path (str): Path to the newly generated CSV file
        dashboard_public_dir (str): Path to the dashboard's public directory
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the dashboard public directory exists
        if not os.path.exists(dashboard_public_dir):
            os.makedirs(dashboard_public_dir)
            logger.info(f"Created directory: {dashboard_public_dir}")
        
        # Define file paths
        old_csv_path = os.path.join(dashboard_public_dir, "processed_data_old.csv")
        current_csv_path = os.path.join(dashboard_public_dir, "processed_data.csv")
        archive_dir = os.path.join("../../data", "processed", "archive")
        
        # Create archive directory if it doesn't exist
        if not os.path.exists(archive_dir):
            os.makedirs(archive_dir)
            logger.info(f"Created archive directory: {archive_dir}")
        
        # Step 1: Move old CSV to archive if it exists
        if os.path.exists(old_csv_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_path = os.path.join(archive_dir, f"processed_data_archive_{timestamp}.csv")
            shutil.copy2(old_csv_path, archive_path)
            logger.info(f"Archived old CSV to: {archive_path}")
        
        # Step 2: Rename current processed_data.csv to processed_data_old.csv if it exists
        if os.path.exists(current_csv_path):
            # If old file exists, remove it first
            if os.path.exists(old_csv_path):
                os.remove(old_csv_path)
                logger.info(f"Removed existing old CSV: {old_csv_path}")
            
            # Rename current to old
            shutil.copy2(current_csv_path, old_csv_path)
            logger.info(f"Renamed current CSV to old: {current_csv_path} -> {old_csv_path}")
        
        # Step 3: Copy new CSV to dashboard/public as processed_data.csv
        shutil.copy2(new_csv_path, current_csv_path)
        logger.info(f"Copied new CSV to dashboard: {new_csv_path} -> {current_csv_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error rotating processed files: {str(e)}")
        return False

if __name__ == "__main__":
    # For testing purposes
    logging.basicConfig(level=logging.INFO)
    # Example usage: rotate_processed_files("data/processed/latest.csv")
    print("This module is for importing. Run through the main agent process.") 