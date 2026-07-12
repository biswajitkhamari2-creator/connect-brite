import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)

# Application Configurations
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]

# Ollama Configurations
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

# Cache Expiry (in seconds) - 30 minutes
CACHE_EXPIRY_SECONDS = int(os.getenv("CACHE_EXPIRY_SECONDS", 1800))

# Network requests timeout
REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", 15))

# RSS Feeds dictionary
RSS_FEEDS = {
    "Google News UPSC": "https://news.google.com/rss/search?q=UPSC",
    "Google News India": "https://news.google.com/rss/search?q=India+current+affairs",
    "PIB (Press Information Bureau)": "https://pib.gov.in/RssMain.aspx",
    "The Hindu": "https://www.thehindu.com/opinion/feeder/default.rss",
    "Indian Express": "https://indianexpress.com/section/opinion/feed/",
    "PRS India": "https://prsindia.org/feed",
    "ISRO": "https://www.isro.gov.in/feed.xml",
    "Ministry of External Affairs": "https://www.mea.gov.in/rss/press-releases.xml"
}
