import os
import logging

logger = logging.getLogger(__name__)

def generate_mentor_reply(messages: list, system_prompt: str) -> str:
    # We use ONLY the local Ollama server through the Cloudflare Tunnel
    try:
        from config import OLLAMA_API_URL, OLLAMA_MODEL
        import requests
        chat_url = OLLAMA_API_URL
        if chat_url.endswith("/api/generate"):
            chat_url = chat_url.replace("/api/generate", "/api/chat")
        elif chat_url.endswith("/generate"):
            chat_url = chat_url.replace("/generate", "/chat")
            
        if "/api/chat" not in chat_url and not chat_url.endswith("/chat"):
            chat_url = chat_url.rstrip("/") + "/api/chat"
            
        clean_model = OLLAMA_MODEL.strip().replace("\ufeff", "").replace("\u200b", "")
        logger.info(f"Routing request to Ollama ({clean_model}) at {chat_url}")
        
        # Perform Google search verification via Firecrawl for the user's latest query
        search_context = ""
        user_queries = [m for m in messages if m.get("role") == "user" or "role" not in m]
        if user_queries:
            latest_query = user_queries[-1].get("content", "")
            if latest_query:
                # Clean up query text for better search performance (keep first 15 words)
                clean_query = " ".join(latest_query.split()[:15])
                from search import search_with_firecrawl_or_fallback
                search_context = search_with_firecrawl_or_fallback(clean_query, max_results=3)

        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Inject Google Search verification context to the first prompt or system instruction
        if search_context:
            verification_note = (
                f"\n\n[Google Search Verification Context (Real-time Facts)]:\n{search_context}\n"
                "IMPORTANT: Verify facts, names, dates, and titles against this context. "
                "Ensure your response is accurate, fast, and aligns directly with these validated points."
            )
            api_messages[0]["content"] += verification_note

        for msg in messages:
            role = msg.get("role", "user")
            if role not in ["user", "assistant", "system"]:
                role = "user"
            api_messages.append({"role": role, "content": msg.get("content", "")})
            
        payload = {
            "model": clean_model,
            "messages": api_messages,
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.post(chat_url, json=payload, headers=headers, timeout=180)
        if response.status_code == 200:
            result = response.json()
            reply = result.get("message", {}).get("content", "")
            if reply:
                logger.info("Ollama response generated successfully")
                return reply
            else:
                raise Exception("Empty response content from Ollama model")
        else:
            raise Exception(f"Ollama returned HTTP status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        logger.error(f"Ollama generation failed: {e}")
        raise Exception(f"Local Ollama generation failed. Error: {str(e)}")

def generate_mentor_reply_stream(messages: list, system_prompt: str):
    import json
    try:
        from config import OLLAMA_API_URL, OLLAMA_MODEL
        import requests
        chat_url = OLLAMA_API_URL
        if chat_url.endswith("/api/generate"):
            chat_url = chat_url.replace("/api/generate", "/api/chat")
        elif chat_url.endswith("/generate"):
            chat_url = chat_url.replace("/generate", "/chat")
            
        if "/api/chat" not in chat_url and not chat_url.endswith("/chat"):
            chat_url = chat_url.rstrip("/") + "/api/chat"
            
        clean_model = OLLAMA_MODEL.strip().replace("\ufeff", "").replace("\u200b", "")
        logger.info(f"Routing streaming request to Ollama ({clean_model}) at {chat_url}")
        
        # Perform Google search verification via Firecrawl for the user's latest query
        search_context = ""
        user_queries = [m for m in messages if m.get("role") == "user" or "role" not in m]
        if user_queries:
            latest_query = user_queries[-1].get("content", "")
            if latest_query:
                # Clean up query text for better search performance (keep first 15 words)
                clean_query = " ".join(latest_query.split()[:15])
                from search import search_with_firecrawl_or_fallback
                search_context = search_with_firecrawl_or_fallback(clean_query, max_results=3)

        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Inject Google Search verification context to the first prompt or system instruction
        if search_context:
            verification_note = (
                f"\n\n[Google Search Verification Context (Real-time Facts)]:\n{search_context}\n"
                "IMPORTANT: Verify facts, names, dates, and titles against this context. "
                "Ensure your response is accurate, fast, and aligns directly with these validated points."
            )
            api_messages[0]["content"] += verification_note

        for msg in messages:
            role = msg.get("role", "user")
            if role not in ["user", "assistant", "system"]:
                role = "user"
            api_messages.append({"role": role, "content": msg.get("content", "")})
            
        payload = {
            "model": clean_model,
            "messages": api_messages,
            "stream": True,
            "options": {
                "temperature": 0.7
            }
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.post(chat_url, json=payload, headers=headers, stream=True, timeout=180)
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        text = chunk.get("message", {}).get("content", "")
                        if text:
                            yield text
                    except Exception as parse_err:
                        logger.error(f"Error parsing Ollama stream chunk: {parse_err}")
        else:
            yield f"Error: Ollama returned HTTP status {response.status_code}"
    except Exception as e:
        logger.error(f"Ollama streaming failed: {e}")
        yield f"Error: Local Ollama generation failed. {str(e)}"

