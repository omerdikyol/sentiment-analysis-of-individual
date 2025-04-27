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
        self.model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
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
                logger.debug("get_sentiment_model: Creating pipeline with all scores...")
                # Use top_k=None instead of deprecated return_all_scores=True
                pipeline_obj = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer, top_k=None)
                logger.debug("get_sentiment_model: Pipeline created. Exiting method.")
                return pipeline_obj
            except Exception as load_e:
                logger.error(f"Error loading model from {self.model_dir} even though config exists: {load_e}", exc_info=True)
                logger.warning("Attempting to re-download model due to loading error.")
                # Fall through
        
        logger.info(f"Config file not found at {config_file_path} or loading failed. Downloading and saving improved model...")
        try:
            logger.debug(f"get_sentiment_model: Downloading pipeline for model '{self.model_name}'...")
            # Download the specific model, requesting all scores using top_k=None
            sentiment_pipe = pipeline("sentiment-analysis", model=self.model_name, top_k=None)
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
        if not text or str(text).strip() == "" or str(text).lower() == "none":
            return "neutral", 0.5

        text = str(text)[:512]
        
        try:
            # Pipeline now returns a list containing a list of dicts (one for each label)
            # e.g., [[{'label': 'Negative', 'score': 0.1}, {'label': 'Neutral', 'score': 0.5}, {'label': 'Positive', 'score': 0.4}]]
            all_results = self.sentiment_pipeline(text)[0]
            
            # Sort results by score descending
            all_results.sort(key=lambda x: x['score'], reverse=True)
            
            top_result = all_results[0]
            top_sentiment = top_result["label"].lower()
            top_score = top_result["score"]
            
            final_sentiment = top_sentiment
            final_score = top_score # Return the score of the originally highest label

            # Check for ambiguity if there's more than one label result
            if len(all_results) > 1:
                second_score = all_results[1]['score']
                score_diff = top_score - second_score
                
                # Define ambiguity threshold (tune if needed)
                ambiguity_threshold = 0.2 
                
                if score_diff < ambiguity_threshold:
                    # logger.debug(f"Ambiguity detected (score diff {score_diff:.4f} < {ambiguity_threshold}). Overriding {top_sentiment} with neutral.")
                    final_sentiment = "neutral"
                    # Find the neutral score to return (optional, could also return top_score)
                    for res in all_results:
                        if res['label'].lower() == 'neutral':
                            final_score = res['score']
                            break
            
            return final_sentiment, final_score
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis for text '{text[:50]}...': {str(e)}", exc_info=True)
            return "neutral", 0.5

    def batch_analyze(self, texts):
        logger.debug(f"batch_analyze: Entering method for {len(texts)} texts.")
        if not texts:
            return []

        original_indices = [i for i, text in enumerate(texts) if text and str(text).strip() and str(text).lower() != "none"]
        processed_texts = [str(texts[i])[:512] for i in original_indices]
        
        final_results = [("neutral", 0.5)] * len(texts)

        if not processed_texts:
            logger.debug("batch_analyze: No valid texts to process.")
            return final_results

        logger.debug(f"batch_analyze: Processing {len(processed_texts)} non-empty texts.")
        try:
            logger.debug(f"batch_analyze: Calling pipeline for batch...")
            batch_results_list = self.sentiment_pipeline(processed_texts)
            logger.debug(f"batch_analyze: Pipeline returned {len(batch_results_list)} results for the batch.")
            
            ambiguity_threshold = 0.2 # Define ambiguity threshold
            
            for i, all_results in enumerate(batch_results_list):
                original_index = original_indices[i]

                # Sort results by score descending
                all_results.sort(key=lambda x: x['score'], reverse=True)
            
                top_result = all_results[0]
                top_sentiment = top_result["label"].lower()
                top_score = top_result["score"]

                final_sentiment = top_sentiment
                final_score = top_score

                # Check for ambiguity
                if len(all_results) > 1:
                    second_score = all_results[1]['score']
                    score_diff = top_score - second_score
                    
                    if score_diff < ambiguity_threshold:
                        final_sentiment = "neutral"
                        for res in all_results:
                            if res['label'].lower() == 'neutral':
                                final_score = res['score']
                                break
                
                final_results[original_index] = (final_sentiment, final_score)
                    
            logger.debug(f"batch_analyze: Exiting method. Returning {len(final_results)} results (including defaults).")
            return final_results
            
        except Exception as e:
            logger.debug(f"batch_analyze: Exception occurred. Returning default results for all.")
            logger.error(f"Error in batch sentiment analysis: {str(e)}", exc_info=True)
            return [("neutral", 0.5) for _ in texts] 