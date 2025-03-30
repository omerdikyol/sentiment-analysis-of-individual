import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get target individual and query variations from env if available
target_individual = os.getenv('TARGET_INDIVIDUAL')
env_variations = os.getenv('QUERY_VARIATIONS')

if target_individual and env_variations:
    try:
        # Convert string representation of list to actual list
        query_variations = []
        query_variations.append(target_individual)
        for variation in env_variations.split(','):
            query_variations.append(variation.strip())
    except:
        # Broader query variations 
        query_variations = [
            "Tamim ibn Hamad Al Thani",
            "Tamim bin Hamad Al Thani",
            "Tamim bin Hamad",
            "Sheikh Tamim",
            "Qatar Emir",
            "Qatar ruler",
            "Qatar leader",
            "Tamim Qatar",
            "Sheikh Tamim bin Hamad"  # Common alternate spelling
        ]