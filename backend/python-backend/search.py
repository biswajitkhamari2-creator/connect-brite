import logging
import requests
from bs4 import BeautifulSoup
from config import REQUEST_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

def search_ddg(query: str, max_results: int = 3) -> str:
    """Perform a free, keyless search on DuckDuckGo and return top snippets."""
    url = "https://html.duckduckgo.com/html/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    payload = {"q": query}
    
    try:
        logger.info(f"Searching web for context: '{query}'")
        response = requests.post(url, data=payload, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        results = soup.find_all("div", class_="result")
        
        snippets = []
        for idx, result in enumerate(results[:max_results]):
            snippet_elem = result.find("a", class_="result__snippet")
            title_elem = result.find("a", class_="result__url")
            
            title = title_elem.get_text(strip=True) if title_elem else "Search Result"
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
            
            if snippet:
                snippets.append(f"Result {idx+1}: {title}\nSummary: {snippet}")
                
        if not snippets:
            return "No real-time search context found."
            
        return "\n\n".join(snippets)
        
    except Exception as e:
        logger.warning(f"Failed to fetch search context for '{query}': {e}")
        return "Search service temporarily unavailable."
