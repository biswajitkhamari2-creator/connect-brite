import os
import logging
from groq import Groq
import google.generativeai as genai

logger = logging.getLogger(__name__)

def generate_mentor_reply(messages: list, system_prompt: str) -> str:
    # 1. Try Ollama (Local/Self-hosted)
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
            
        logger.info(f"Attempting to generate mentor response using Ollama ({OLLAMA_MODEL}) at {chat_url}")
        
        api_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            role = msg.get("role", "user")
            if role not in ["user", "assistant", "system"]:
                role = "user"
            api_messages.append({"role": role, "content": msg.get("content", "")})
            
        payload = {
            "model": OLLAMA_MODEL,
            "messages": api_messages,
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }
        
        response = requests.post(chat_url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            reply = result.get("message", {}).get("content", "")
            if reply:
                logger.info("Ollama response generated successfully")
                return reply
    except Exception as e:
        logger.warning(f"Ollama call failed or skipped: {e}")

    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    # 1. Try Groq
    if groq_api_key:
        try:
            logger.info("Attempting to generate mentor response using Groq (llama-3.3-70b-versatile)")
            client = Groq(api_key=groq_api_key)
            
            # Build messages list incorporating system prompt
            api_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                role = msg.get("role", "user")
                if role not in ["user", "assistant", "system"]:
                    role = "user"
                api_messages.append({"role": role, "content": msg.get("content", "")})
                
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=api_messages,
                temperature=0.7,
                max_tokens=4096,
            )
            reply = completion.choices[0].message.content
            if reply:
                logger.info("Groq response generated successfully")
                return reply
        except Exception as e:
            logger.error(f"Groq API call failed: {e}. Falling back to Gemini...")
            
    # 2. Try Gemini
    if gemini_api_key:
        try:
            logger.info("Attempting to generate mentor response using Gemini (gemini-2.0-flash)")
            genai.configure(api_key=gemini_api_key)
            
            # Map messages to Gemini SDK format
            contents = []
            for msg in messages:
                role = "model" if msg.get("role") == "assistant" else "user"
                contents.append({
                    "role": role,
                    "parts": [msg.get("content", "")]
                })
                
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_prompt
            )
            
            response = model.generate_content(
                contents,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=4096
                )
            )
            reply = response.text
            if reply:
                logger.info("Gemini response generated successfully")
                return reply
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise e
            
    raise Exception("Ollama, Groq, and Gemini API clients failed or were missing configurations.")
