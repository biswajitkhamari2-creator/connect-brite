import logging
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import feedparser
import requests
from bs4 import BeautifulSoup
from config import RSS_FEEDS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sanitize_html(html_content: str) -> str:
    """Strip HTML tags and clean up whitespace."""
    if not html_content:
        return ""
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text()
        # Collapse multiple spaces and newlines
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return " ".join(chunk for chunk in chunks if chunk)
    except Exception as e:
        logger.error(f"Error sanitizing HTML: {e}")
        return html_content

def fetch_feed_with_retry(feed_name: str, feed_url: str, retries: int = 1, delay: float = 0.5) -> list:
    """Fetch feed content from URL with retry logic and timeout."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    # Use a tight timeout for news feeds so they don't block startup
    feed_timeout = 5.0
    
    for attempt in range(1, retries + 2):
        try:
            logger.info(f"Fetching {feed_name} (Attempt {attempt}/{retries + 1})")
            response = requests.get(feed_url, headers=headers, timeout=feed_timeout)
            response.raise_for_status()
            
            # Parse the XML string
            parsed_feed = feedparser.parse(response.content)
            
            articles = []
            for entry in parsed_feed.entries:
                title = entry.get("title", "")
                link = entry.get("link", "")
                
                # Try multiple fields for summary/description
                summary_raw = entry.get("summary", entry.get("description", ""))
                summary = sanitize_html(summary_raw)
                
                # Format publish date
                published_raw = entry.get("published", entry.get("pubDate", ""))
                published_parsed = entry.get("published_parsed", None)
                
                if published_parsed:
                    published_dt = datetime(*published_parsed[:6])
                    published = published_dt.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    published = published_raw or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                
                articles.append({
                    "title": title,
                    "summary": summary,
                    "source": feed_name,
                    "link": link,
                    "published": published
                })
            
            logger.info(f"Successfully fetched {len(articles)} articles from {feed_name}")
            return articles
            
        except Exception as e:
            logger.warning(f"Error fetching feed {feed_name} on attempt {attempt}: {e}")
            if attempt <= retries:
                time.sleep(delay * attempt)
            else:
                logger.error(f"Failed to fetch {feed_name} after {retries + 1} attempts")
                
    return []

def get_all_news() -> list:
    """Fetch all RSS feeds in parallel, merge, and remove duplicates."""
    all_articles = []
    
    with ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as executor:
        future_to_feed = {
            executor.submit(fetch_feed_with_retry, name, url): name 
            for name, url in RSS_FEEDS.items()
        }
        
        for future in as_completed(future_to_feed):
            feed_name = future_to_feed[future]
            try:
                feed_articles = future.result()
                all_articles.extend(feed_articles)
            except Exception as e:
                logger.error(f"Error fetching feed {feed_name}: {e}")
        
    # Deduplicate based on link or normalized title
    seen_links = set()
    seen_titles = set()
    deduplicated_articles = []
    
    for article in all_articles:
        link = article["link"].strip()
        title_norm = article["title"].strip().lower()
        
        if link not in seen_links and title_norm not in seen_titles:
            seen_links.add(link)
            seen_titles.add(title_norm)
            deduplicated_articles.append(article)
            
    # Sort by published date descending if possible
    try:
        deduplicated_articles.sort(key=lambda x: x.get("published", ""), reverse=True)
    except Exception as e:
        logger.warning(f"Failed to sort articles by date: {e}")
        
    logger.info(f"Total deduplicated articles: {len(deduplicated_articles)}")
    return deduplicated_articles
