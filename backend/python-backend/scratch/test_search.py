import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from search import search_with_firecrawl_or_fallback

# Test without Firecrawl (should use DuckDuckGo)
print("Testing DuckDuckGo search...")
res_ddg = search_with_firecrawl_or_fallback("current CM of Odisha")
print("\n--- DDG Search Results ---")
print(res_ddg.encode("utf-8", errors="ignore").decode("utf-8"))
print("---------------------------\n")

# Test with Firecrawl if key available
firecrawl_key = os.getenv("FIRECRAWL_API_KEY", "")
if firecrawl_key:
    print("Testing Firecrawl search...")
    res_fc = search_with_firecrawl_or_fallback("current CM of Odisha")
    print("\n--- Firecrawl Search Results ---")
    print(res_fc)
    print("---------------------------------\n")
else:
    print("FIRECRAWL_API_KEY is empty in local environment.")
