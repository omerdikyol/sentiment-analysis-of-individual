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
        self.base_path = Path(__file__).resolve().parent.parent.parent
        self.model_dir = self.base_path / "models" / "sentiment_improved"
        logger.info(f"!!! Determined model directory path: {self.model_dir} !!!")
        self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        self.sentiment_pipeline = self.get_sentiment_model()

    def get_sentiment_model(self):
        """Load or download sentiment model"""
        if self.model_dir.exists():
            logger.info("Loading improved model from local directory...")
            model = AutoModelForSequenceClassification.from_pretrained(str(self.model_dir))
            tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir))
            return pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
        else:
            logger.info("Downloading and saving improved model...")
            # Download and create the pipeline
            sentiment_pipe = pipeline("sentiment-analysis", model=self.model_name)
            # Save the model and tokenizer
            self.model_dir.mkdir(parents=True, exist_ok=True)
            sentiment_pipe.model.save_pretrained(str(self.model_dir))
            sentiment_pipe.tokenizer.save_pretrained(str(self.model_dir))
            return sentiment_pipe

    def analyze(self, text):
        """
        Analyze the sentiment of given text using the improved model.
        Returns a tuple of (sentiment_label, confidence_score)
        """
        if not text or str(text).strip() == "" or str(text).lower() == "none":
            return "neutral", 0.5

        # Ensure text is a string and limit length to prevent issues
        text = str(text)[:512]
        
        try:
            result = self.sentiment_pipeline(text)[0]
            
            # Map the model output to our desired format
            # The model outputs POSITIVE/NEGATIVE
            sentiment = result["label"].lower()
            score = result["score"]
            
            # Convert binary classification to include neutral based on confidence
            if score < 0.6:  # If model isn't very confident
                return "neutral", score
            
            return sentiment, score
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return "neutral", 0.5

    def batch_analyze(self, texts):
        """
        Analyze sentiment for a batch of texts.
        Returns a list of (sentiment_label, confidence_score) tuples
        """
        if not texts:
            return []

        # Filter out None/empty texts and limit length
        processed_texts = [str(text)[:512] for text in texts if text and str(text).strip() and str(text).lower() != "none"]
        
        if not processed_texts:
            return [(("neutral", 0.5)) for _ in texts]

        try:
            results = self.sentiment_pipeline(processed_texts)
            
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
                    
            return sentiments
            
        except Exception as e:
            logger.error(f"Error in batch sentiment analysis: {str(e)}")
            return [("neutral", 0.5) for _ in texts] 