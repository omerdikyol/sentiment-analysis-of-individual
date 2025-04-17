import logging
from pathlib import Path
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('SentimentAnalyzer')

class ImprovedSentimentAnalyzer:
    def __init__(self):
        logger.debug("ImprovedSentimentAnalyzer.__init__: Initializing...")
        self.base_path = Path(__file__).resolve().parent.parent.parent
        self.model_dir = self.base_path / "models" / "sentiment_improved"
        logger.info(f"!!! Determined model directory path: {self.model_dir} !!!")
        self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        logger.debug(f"ImprovedSentimentAnalyzer.__init__: Model name set to '{self.model_name}'.")
        logger.debug("ImprovedSentimentAnalyzer.__init__: Calling get_sentiment_model()...")
        self.sentiment_pipeline = self.get_sentiment_model()
        logger.debug("ImprovedSentimentAnalyzer.__init__: Initialization finished.")

    def get_sentiment_model(self):
        logger.debug("get_sentiment_model: Entering method.")
        config_file_path = self.model_dir / "config.json"
        logger.debug(f"get_sentiment_model: Checking for config file at {config_file_path}")
        if config_file_path.exists():
            logger.info(f"Loading improved model from local directory ({self.model_dir}) as config file exists...")
            try:
                logger.debug("get_sentiment_model: Loading model...")
                model = AutoModelForSequenceClassification.from_pretrained(str(self.model_dir))
                logger.debug("get_sentiment_model: Loading tokenizer...")
                tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir))
                logger.info("Model and tokenizer loaded successfully.")
                logger.debug("get_sentiment_model: Creating pipeline...")
                pipeline_obj = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
                logger.debug("get_sentiment_model: Pipeline created. Exiting method.")
                return pipeline_obj
            except Exception as load_e:
                logger.error(f"Error loading model from {self.model_dir} even though config exists: {load_e}", exc_info=True)
                logger.warning("Attempting to re-download model due to loading error.")
                # Fall through
        
        logger.info(f"Config file not found at {config_file_path} or loading failed. Downloading and saving improved model...")
        try:
            logger.debug(f"get_sentiment_model: Downloading pipeline for model '{self.model_name}'...")
            sentiment_pipe = pipeline("sentiment-analysis", model=self.model_name)
            logger.debug("get_sentiment_model: Download complete.")
            logger.info(f"Attempting to save model to {self.model_dir}...")
            logger.debug(f"get_sentiment_model: Creating directory {self.model_dir} if needed...")
            self.model_dir.mkdir(parents=True, exist_ok=True)
            logger.debug(f"get_sentiment_model: Saving model pre-trained weights...")
            sentiment_pipe.model.save_pretrained(str(self.model_dir))
            logger.debug(f"get_sentiment_model: Saving tokenizer...")
            sentiment_pipe.tokenizer.save_pretrained(str(self.model_dir))
            logger.info(f"Model successfully downloaded and saved to {self.model_dir}.")
            logger.debug("get_sentiment_model: Exiting method after download.")
            return sentiment_pipe
        except Exception as download_e:
            logger.error(f"Failed to download or save model to {self.model_dir}: {download_e}", exc_info=True)
            raise RuntimeError(f"Fatal error: Could not download/save sentiment model.") from download_e

    def analyze(self, text):
        # logger.debug(f"analyze: Entering method for text: '{str(text)[:50]}...'")
        if not text or str(text).strip() == "" or str(text).lower() == "none":
            return "neutral", 0.5

        # Ensure text is a string and limit length to prevent issues
        text = str(text)[:512]
        
        try:
            # logger.debug(f"analyze: Calling pipeline...")
            result = self.sentiment_pipeline(text)[0]
            # logger.debug(f"analyze: Pipeline returned: {result}")
            
            # Map the model output to our desired format
            # The model outputs POSITIVE/NEGATIVE
            sentiment = result["label"].lower()
            score = result["score"]
            
            # Convert binary classification to include neutral based on confidence
            if score < 0.6:  # If model isn't very confident
                return "neutral", score
            
            return sentiment, score
            
        except Exception as e:
            # logger.debug(f"analyze: Exception occurred.")
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return "neutral", 0.5

    def batch_analyze(self, texts):
        logger.debug(f"batch_analyze: Entering method for {len(texts)} texts.")
        if not texts:
            return []

        # Filter out None/empty texts and limit length
        processed_texts = [str(text)[:512] for text in texts if text and str(text).strip() and str(text).lower() != "none"]
        
        if not processed_texts:
            return [(("neutral", 0.5)) for _ in texts]

        logger.debug(f"batch_analyze: Processing {len(processed_texts)} non-empty texts.")
        try:
            logger.debug(f"batch_analyze: Calling pipeline for batch...")
            results = self.sentiment_pipeline(processed_texts)
            logger.debug(f"batch_analyze: Pipeline returned {len(results)} results.")
            
            # Process results
            sentiments = []
            for result in results:
                sentiment = result["label"].lower()
                score = result["score"]
                
                # Convert to neutral if low confidence
                if score < 0.6:
                    sentiments.append(("neutral", score))
                else:
                    sentiments.append((sentiment, score))
                    
            logger.debug(f"batch_analyze: Exiting method. Returning {len(sentiments)} results.")
            return sentiments
            
        except Exception as e:
            logger.debug(f"batch_analyze: Exception occurred. Returning default results.")
            logger.error(f"Error in batch sentiment analysis: {str(e)}")
            return [("neutral", 0.5) for _ in texts] 