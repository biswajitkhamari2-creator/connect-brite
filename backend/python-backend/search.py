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

def search_with_firecrawl_or_fallback(query: str, max_results: int = 3) -> str:
    import os
    firecrawl_key = (os.getenv("FIRECRAWL_API_KEY") or os.getenv("FIRECRAWAL_API_KEY") or "").strip()
    if not firecrawl_key:
        logger.info("Firecrawl API Key not found. Falling back to DuckDuckGo search.")
        return search_ddg(query, max_results)
        
    try:
        logger.info(f"Searching via Firecrawl for: '{query}'")
        url = "https://api.firecrawl.dev/v1/search"
        headers = {
            "Authorization": f"Bearer {firecrawl_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "query": query,
            "limit": max_results
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("data"):
                snippets = []
                for idx, item in enumerate(data["data"][:max_results]):
                    title = item.get("title", "No Title")
                    snippet = item.get("description") or item.get("markdown") or ""
                    snippet_clean = snippet[:500].strip()
                    url_src = item.get("url", "")
                    snippets.append(f"Result {idx+1}: {title} ({url_src})\nSnippet: {snippet_clean}")
                return "\n\n".join(snippets)
        logger.warning(f"Firecrawl API returned error status {response.status_code}. Falling back to DuckDuckGo.")
    except Exception as e:
        logger.warning(f"Firecrawl search failed: {e}. Falling back to DuckDuckGo.")
        
    return search_ddg(query, max_results)
