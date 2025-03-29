# Sentiment Analysis Agent

An advanced Agentic AI system for autonomous data collection, real-time sentiment analysis, and actionable insights generation.

## Project Structure

```
sentiment-analysis/
├── src/                      # Source code
│   ├── agent/               # Agent core functionality
│   ├── collectors/          # Data collection modules
│   ├── processing/          # Data processing and analysis
│   └── api/                 # API service
├── data/                    # Data storage
│   ├── raw/                # Raw collected data
│   ├── processed/          # Processed data
│   └── metrics/            # System metrics and history
├── config/                 # Configuration files
├── logs/                   # System logs
│   └── archive/           # Archived logs
├── models/                # ML models
│   └── sentiment/        # Sentiment analysis models
├── tests/                 # Test files
├── dashboard/            # React dashboard
└── requirements.txt      # Python dependencies

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
cd dashboard && npm install
```

3. Configure the system:
- Copy `config/.env.example` to `config/.env`
- Add your API keys and credentials
- Adjust settings in `config/default_config.json` if needed

## Running the System

1. Start the Agent:
```bash
python -m src.agent.core
```

2. Start the API Service:
```bash
python -m src.api.service
```

3. Start the Dashboard:
```bash
cd dashboard && npm start
```

## Features

- Multi-source data collection (X, News, Instagram, LinkedIn, etc.)
- Real-time sentiment analysis
- Automated data processing and cleanup
- Interactive dashboard with real-time updates
- Historical data comparison with visualization reports
- Automatic file rotation for trend analysis
- Configurable data retention and processing intervals
- Automatic log rotation and archiving
- System health monitoring

## Configuration

The system can be configured through `config/default_config.json`:

```json
{
    "collection_interval_minutes": 30,
    "processing_interval_minutes": 60,
    "data_retention_days": 30,
    "monitoring": {
        "min_data_points": 100,
        "max_duplicate_ratio": 0.2,
        "sentiment_threshold": 0.7
    },
    "sources": {
        "x": true,
        "news": true,
        "instagram": true,
        "linkedin": true,
        "mention": true,
        "social_searcher": true
    }
}
```

## API Endpoints

- `GET /metrics` - Get current metrics and analysis results
- `GET /latest-data` - Get most recent processed data
- `GET /config` - Get current configuration
- `POST /config` - Update configuration
- `WS /ws` - WebSocket endpoint for real-time updates

## Development

- Add new collectors in `src/collectors/`
- Add new processing modules in `src/processing/`
- Add tests in `tests/`
- Update dashboard components in `dashboard/src/components/`

## License

MIT License 