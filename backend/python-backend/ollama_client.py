import json
import logging
import requests
from config import OLLAMA_API_URL, OLLAMA_MODEL, REQUEST_TIMEOUT_SECONDS
from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from search import search_ddg

logger = logging.getLogger(__name__)

def generate_upsc_analysis(articles: list) -> dict:
    """Send articles to local Ollama and return structured analysis."""
    if not articles:
        return get_empty_fallback_response("No articles found to analyze.")
        
    # Format the articles for the prompt
    # We will limit to top 20 articles to ensure we fit well within standard response times
    articles_chunk = articles[:5]
    articles_text = ""
    for idx, art in enumerate(articles_chunk, 1):
        # Retrieve real-time search verification context for the top 2 articles
        search_context = ""
        if idx <= 2:
            query = art['title']
            # Clean query a bit by using just first 10 words if too long
            query_words = query.split()[:10]
            cleaned_query = " ".join(query_words)
            search_context = search_ddg(cleaned_query, max_results=2)
            
        articles_text += f"Article {idx}:\n"
        articles_text += f"Title: {art['title']}\n"
        articles_text += f"Source: {art['source']}\n"
        articles_text += f"Summary: {art['summary']}\n"
        if search_context:
            articles_text += f"Real-time Web Search Verification Context:\n{search_context}\n"
        articles_text += f"Link: {art['link']}\n"
        articles_text += "-" * 40 + "\n"
        
    prompt = USER_PROMPT_TEMPLATE.format(articles_text=articles_text)
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "top_p": 0.9,
            "num_ctx": 2048  # Reduced to avoid memory issues on 8GB RAM
        },
        "format": "json"  # Instruct Ollama to output JSON
    }
    
    # Ollama responses can take longer depending on local hardware. We'll set a longer timeout (120s) for Ollama specifically.
    ollama_timeout = 180.0
    
    try:
        logger.info(f"Sending prompt to local Ollama ({OLLAMA_MODEL}) at {OLLAMA_API_URL}")
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=ollama_timeout)
        response.raise_for_status()
        
        result_json = response.json()
        raw_text = result_json.get("response", "").strip()
        
        if not raw_text:
            logger.error("Empty response received from Ollama")
            return get_empty_fallback_response("Empty response received from Ollama model.")
            
        # Parse the JSON response from the model
        try:
            parsed_data = json.loads(raw_text)
            logger.info("Successfully generated and parsed UPSC AI Analysis from Ollama")
            return parsed_data
        except json.JSONDecodeError as je:
            logger.error(f"Failed to decode Ollama JSON response: {je}. Raw output was: {raw_text[:500]}")
            # Try to recover by finding JSON blocks if any
            try:
                # Sometimes models wrap JSON in markdown block even with format: "json"
                if "{" in raw_text:
                    start_idx = raw_text.find("{")
                    end_idx = raw_text.rfind("}") + 1
                    recovered_json = raw_text[start_idx:end_idx]
                    return json.loads(recovered_json)
            except Exception as recover_err:
                logger.error(f"Recovery failed: {recover_err}")
            return get_empty_fallback_response("Failed to parse AI-generated output as valid JSON.")
            
    except requests.exceptions.Timeout:
        logger.error("Ollama connection timed out. Make sure Ollama is running and model is loaded.")
        return get_empty_fallback_response("Ollama request timed out. Please ensure Ollama is running locally and model is loaded.")
    except Exception as e:
        logger.error(f"Error calling Ollama API: {e}")
        return get_empty_fallback_response(f"Error calling Ollama API: {str(e)}")

def get_empty_fallback_response(error_message: str) -> dict:
    """Provide a structured empty response with error message in revision notes/summary."""
    return {
        "executive_summary": f"Error/Warning: {error_message}",
        "top_10_current_affairs": [],
        "upsc_gs_mapping": [],
        "prelims_facts": [],
        "mcqs": [],
        "mains_questions": [],
        "editorial_analysis": [],
        "interview_questions": [],
        "important_data": [],
        "keywords": [],
        "revision_notes": f"**System Alert:** {error_message}\n\nPlease check:\n1. Is Ollama running on `http://localhost:11434`?\n2. Have you run `ollama pull {OLLAMA_MODEL}`?\n3. Are there active RSS news items fetched?"
    }
