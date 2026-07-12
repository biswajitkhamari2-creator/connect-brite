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

def search_tavily(query: str, api_key: str, max_results: int = 3) -> str:
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": query,
            "max_results": max_results
        }
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            results = data.get("results", [])
            snippets = []
            for idx, r in enumerate(results[:max_results]):
                title = r.get("title", "No Title")
                url_src = r.get("url", "")
                snippet = r.get("content", "")
                snippets.append(f"Result {idx+1}: {title} ({url_src})\nSnippet: {snippet}")
            if snippets:
                return "\n\n".join(snippets)
    except Exception as e:
        logger.warning(f"Tavily search failed: {e}")
    return ""

def search_serpapi(query: str, api_key: str, max_results: int = 3) -> str:
    try:
        url = "https://serpapi.com/search"
        params = {
            "api_key": api_key,
            "q": query,
            "engine": "google"
        }
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json()
            organic = data.get("organic_results", [])
            snippets = []
            for idx, r in enumerate(organic[:max_results]):
                title = r.get("title", "No Title")
                url_src = r.get("link", "")
                snippet = r.get("snippet", "")
                snippets.append(f"Result {idx+1}: {title} ({url_src})\nSnippet: {snippet}")
            if snippets:
                return "\n\n".join(snippets)
    except Exception as e:
        logger.warning(f"SerpAPI search failed: {e}")
    return ""

def search_brave(query: str, api_key: str, max_results: int = 3) -> str:
    try:
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": api_key
        }
        params = {
            "q": query,
            "count": max_results
        }
        res = requests.get(url, headers=headers, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json()
            web_results = data.get("web", {}).get("results", [])
            snippets = []
            for idx, r in enumerate(web_results[:max_results]):
                title = r.get("title", "No Title")
                url_src = r.get("url", "")
                snippet = r.get("description", "")
                snippets.append(f"Result {idx+1}: {title} ({url_src})\nSnippet: {snippet}")
            if snippets:
                return "\n\n".join(snippets)
    except Exception as e:
        logger.warning(f"Brave search failed: {e}")
    return ""

def search_google_custom(query: str, api_key: str, cx: str, max_results: int = 3) -> str:
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": api_key,
            "cx": cx,
            "q": query,
            "num": max_results
        }
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json()
            items = data.get("items", [])
            snippets = []
            for idx, r in enumerate(items[:max_results]):
                title = r.get("title", "No Title")
                url_src = r.get("link", "")
                snippet = r.get("snippet", "")
                snippets.append(f"Result {idx+1}: {title} ({url_src})\nSnippet: {snippet}")
            if snippets:
                return "\n\n".join(snippets)
    except Exception as e:
        logger.warning(f"Google Custom Search failed: {e}")
    return ""

def search_with_firecrawl_or_fallback(query: str, max_results: int = 3) -> str:
    import os
    
    # 1. Tavily
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if tavily_key:
        logger.info("Using Tavily Search")
        res = search_tavily(query, tavily_key, max_results)
        if res: return res
        
    # 2. SerpAPI
    serpapi_key = os.getenv("SERPAPI_API_KEY", "").strip()
    if serpapi_key:
        logger.info("Using SerpAPI Search")
        res = search_serpapi(query, serpapi_key, max_results)
        if res: return res
        
    # 3. Brave Search
    brave_key = os.getenv("BRAVE_API_KEY", "").strip()
    if brave_key:
        logger.info("Using Brave Search")
        res = search_brave(query, brave_key, max_results)
        if res: return res

    # 4. Google Custom Search
    google_key = os.getenv("GOOGLE_SEARCH_API_KEY", "").strip()
    google_cx = os.getenv("GOOGLE_CX", "").strip()
    if google_key and google_cx:
        logger.info("Using Google Custom Search")
        res = search_google_custom(query, google_key, google_cx, max_results)
        if res: return res

    # 5. Firecrawl
    firecrawl_key = (os.getenv("FIRECRAWL_API_KEY") or os.getenv("FIRECRAWAL_API_KEY") or "").strip()
    if firecrawl_key:
        logger.info(f"Searching via Firecrawl for: '{query}'")
        try:
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
                    if snippets:
                        return "\n\n".join(snippets)
        except Exception as e:
            logger.warning(f"Firecrawl search failed: {e}")

    # 6. DuckDuckGo Fallback
    logger.info("Falling back to DuckDuckGo search.")
    return search_ddg(query, max_results)
