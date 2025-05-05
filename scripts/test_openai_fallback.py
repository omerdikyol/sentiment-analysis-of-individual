import os
import sys
import logging
from dotenv import load_dotenv

# Add the project root to the Python path to allow importing 'src'
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Explicitly load the .env file from the project root
dotenv_path = os.path.join(project_root, '.env')
loaded = load_dotenv(dotenv_path=dotenv_path)

from src.processing.sentiment_analyzer import ImprovedSentimentAnalyzer

# Configure basic logging 
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('OpenAIFallbackTest')

# --- Configuration ---
# Choose a text likely to get a low-confidence score from the base model
# Examples:
# text_to_analyze = "The meeting was okay, I guess."
# text_to_analyze = "It wasn't terrible, but not great either."
# text_to_analyze = "I'm not particularly excited about the outcome."
text_to_analyze = "I don't really like this very much" # Changed text to potentially trigger low-confidence negative
# -------------------

def run_test():
    logger.info("Initializing Sentiment Analyzer...")
    try:
        # Make sure OPENAI_API_KEY is set in your environment (load_dotenv should handle this)
        if not os.getenv("OPENAI_API_KEY"):
            logger.error("ERROR: OPENAI_API_KEY environment variable is not set or .env file not loaded.")
            if not loaded:
                 logger.error(f"Attempted to load .env from: {dotenv_path}, but failed.")
            logger.error("Please ensure the .env file exists in the project root and contains the key, or set the environment variable manually.")
            return
            
        analyzer = ImprovedSentimentAnalyzer()
    except Exception as e:
        logger.error(f"Failed to initialize ImprovedSentimentAnalyzer: {e}", exc_info=True)
        return

    logger.info(f"Analyzing text: \"{text_to_analyze}\"")
    
    try:
        sentiment, score = analyzer.analyze(text_to_analyze)
        logger.info("--- Analysis Result ---")
        logger.info(f"Text:      \"{text_to_analyze}\"")
        logger.info(f"Sentiment: {sentiment}")
        logger.info(f"Score:     {score:.4f}")
        logger.info("---------------------")
        if score == 0.5 and sentiment != 'neutral': # Check if score was reset, indicating potential AI override
             logger.info("(Score of 0.5 might indicate an override by the OpenAI check)")
        elif sentiment == 'neutral' and score != 0.5:
             logger.info("(Neutral sentiment likely determined by initial model or fallback rules)")
        elif score < analyzer.confidence_threshold:
             logger.warning(f"Initial score {score} was below threshold {analyzer.confidence_threshold}, OpenAI check was likely triggered.")


    except Exception as e:
        logger.error(f"An error occurred during analysis: {e}", exc_info=True)

if __name__ == "__main__":
    run_test() 