import pytest
import os
from unittest.mock import patch, MagicMock
from src.processing.sentiment_analyzer import ImprovedSentimentAnalyzer
import openai # Import needed for mocking types

# Define a fixture for the analyzer to ensure isolation
@pytest.fixture
def analyzer():
    # Temporarily set the API key for initialization logic, even though we mock the call
    with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
        # Mock the OpenAI client initialization within the class's __init__ if needed
        # but it's often easier to mock the instance attribute after creation.
        analyzer_instance = ImprovedSentimentAnalyzer()
        # Mock the pipeline directly for predictable low-confidence output
        analyzer_instance.sentiment_pipeline = MagicMock()
        
        # Mock the OpenAI client *after* initialization and configure the nested structure
        analyzer_instance.openai_client = MagicMock(spec=openai.OpenAI)
        # Explicitly create the nested mock structure needed for the tests
        analyzer_instance.openai_client.chat = MagicMock()
        analyzer_instance.openai_client.chat.completions = MagicMock()
        # The actual method we interact with in the tests
        analyzer_instance.openai_client.chat.completions.create = MagicMock()
        
    return analyzer_instance

def test_analyze_low_confidence_positive_triggers_openai(analyzer):
    """Test low confidence POSITIVE triggers OpenAI and uses its result."""
    test_text = "This is sort of okay, maybe."
    low_confidence_score = 0.4 # Below the 0.45 threshold
    
    # Mock the internal pipeline to return a low-confidence positive result
    analyzer.sentiment_pipeline.return_value = [[
        {'label': 'POSITIVE', 'score': low_confidence_score}, 
        {'label': 'NEUTRAL', 'score': 0.3},
        {'label': 'NEGATIVE', 'score': 0.3}
    ]]
    
    # Mock the OpenAI response
    mock_openai_response = MagicMock()
    mock_openai_message = MagicMock()
    # Simulate the response structure: Sentiment = Neutral
    mock_openai_message.content = "Sentiment = Neutral\nJustification = AI decided it was neutral."
    mock_openai_response.choices = [MagicMock(message=mock_openai_message)]
    analyzer.openai_client.chat.completions.create.return_value = mock_openai_response
    
    # Run analysis
    sentiment, score = analyzer.analyze(test_text)
    
    # Assertions
    analyzer.sentiment_pipeline.assert_called_once_with(test_text)
    analyzer.openai_client.chat.completions.create.assert_called_once() # Check that OpenAI was called
    assert sentiment == "neutral" # Expecting the sentiment from the mocked OpenAI response
    assert score == 0.5 # Score should be reset to 0.5 after OpenAI override

def test_analyze_low_confidence_negative_triggers_openai(analyzer):
    """Test low confidence NEGATIVE triggers OpenAI and uses its result."""
    test_text = "This is kinda not good."
    low_confidence_score = 0.3 # Below the 0.45 threshold
    
    # Mock the internal pipeline to return a low-confidence negative result
    analyzer.sentiment_pipeline.return_value = [[
        {'label': 'NEGATIVE', 'score': low_confidence_score}, 
        {'label': 'NEUTRAL', 'score': 0.4}, # Make neutral slightly higher this time
        {'label': 'POSITIVE', 'score': 0.3}
    ]]
    
    # Mock the OpenAI response
    mock_openai_response = MagicMock()
    mock_openai_message = MagicMock()
    # Simulate the response structure: Sentiment = Positive
    mock_openai_message.content = "Sentiment = Positive\nJustification = AI thinks it leans positive actually."
    mock_openai_response.choices = [MagicMock(message=mock_openai_message)]
    analyzer.openai_client.chat.completions.create.return_value = mock_openai_response
    
    # Run analysis
    sentiment, score = analyzer.analyze(test_text)
    
    # Assertions
    analyzer.sentiment_pipeline.assert_called_once_with(test_text)
    analyzer.openai_client.chat.completions.create.assert_called_once() # Check that OpenAI was called
    assert sentiment == "positive" # Expecting the sentiment from the mocked OpenAI response
    assert score == 0.5 # Score should be reset

def test_analyze_low_confidence_openai_fails_fallback(analyzer):
    """Test low confidence triggers OpenAI, but OpenAI call fails, leading to neutral fallback."""
    test_text = "I am not sure about this."
    low_confidence_score = 0.35 # Below the 0.45 threshold
    
    # Mock the internal pipeline to return a low-confidence positive result
    analyzer.sentiment_pipeline.return_value = [[
        {'label': 'POSITIVE', 'score': low_confidence_score}, 
        {'label': 'NEUTRAL', 'score': 0.33},
        {'label': 'NEGATIVE', 'score': 0.32}
    ]]
    
    # Mock the OpenAI call to raise an exception
    analyzer.openai_client.chat.completions.create.side_effect = openai.APIError("Test API Error", request=None, body=None)
    
    # Run analysis
    sentiment, score = analyzer.analyze(test_text)
    
    # Assertions
    analyzer.sentiment_pipeline.assert_called_once_with(test_text)
    analyzer.openai_client.chat.completions.create.assert_called_once() # OpenAI was called
    assert sentiment == "neutral" # Expecting fallback to neutral because OpenAI call failed
    assert score == 0.5 # Score should be reset for neutral fallback

def test_analyze_high_confidence_does_not_trigger_openai(analyzer):
    """Test high confidence result does NOT trigger OpenAI."""
    test_text = "This is absolutely fantastic!"
    high_confidence_score = 0.98 # Above the 0.45 threshold
    
    # Mock the internal pipeline to return a high-confidence positive result
    analyzer.sentiment_pipeline.return_value = [[
        {'label': 'POSITIVE', 'score': high_confidence_score}, 
        {'label': 'NEUTRAL', 'score': 0.01},
        {'label': 'NEGATIVE', 'score': 0.01}
    ]]
    
    # Run analysis
    sentiment, score = analyzer.analyze(test_text)
    
    # Assertions
    analyzer.sentiment_pipeline.assert_called_once_with(test_text)
    analyzer.openai_client.chat.completions.create.assert_not_called() # Crucially, OpenAI should NOT be called
    assert sentiment == "positive" # Expecting the original high-confidence sentiment
    assert score == high_confidence_score # Expecting the original high-confidence score 