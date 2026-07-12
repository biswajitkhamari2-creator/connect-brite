import json
import logging
import os
import time
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from config import CACHE_DIR, CACHE_EXPIRY_SECONDS, HOST, PORT, CORS_ORIGINS
from rss import get_all_news
from ollama_client import generate_upsc_analysis, get_empty_fallback_response
from mentor_client import generate_mentor_reply, generate_mentor_reply_stream
from pydantic import BaseModel
from typing import List, Optional, Literal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="UPSC AI News Assistant", version="1.0.0")

# Enable CORS
allow_all = "*" in CORS_ORIGINS or len(CORS_ORIGINS) == 0
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else CORS_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static and templates directories exist
BASE_DIR = Path(__file__).resolve().parent
templates_dir = BASE_DIR / "templates"
static_dir = BASE_DIR / "static"
templates_dir.mkdir(exist_ok=True)
static_dir.mkdir(exist_ok=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
templates = Jinja2Templates(directory=str(templates_dir))

# Cache file paths
NEWS_CACHE_FILE = CACHE_DIR / "news_cache.json"
ANALYSIS_CACHE_FILE = CACHE_DIR / "analysis_cache.json"

def get_cached_data(cache_file: Path) -> dict | list | None:
    """Retrieve data from cache file if it is not expired."""
    if not cache_file.exists():
        return None
        
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            cached = json.load(f)
            
        timestamp = cached.get("timestamp", 0)
        current_time = time.time()
        
        # Check if the cache is still valid
        if current_time - timestamp < CACHE_EXPIRY_SECONDS:
            logger.info(f"Serving cache from {cache_file.name}")
            return cached.get("data")
        else:
            logger.info(f"Cache expired for {cache_file.name}")
    except Exception as e:
        logger.error(f"Error reading cache {cache_file.name}: {e}")
        
    return None

def save_to_cache(cache_file: Path, data: dict | list) -> None:
    """Save data to cache file with current timestamp."""
    try:
        cached = {
            "timestamp": time.time(),
            "data": data
        }
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cached, f, indent=2, ensure_ascii=False)
        logger.info(f"Successfully cached data to {cache_file.name}")
    except Exception as e:
        logger.error(f"Error writing to cache {cache_file.name}: {e}")

def get_or_update_news(force_refresh: bool = False) -> list:
    """Get news from cache or fetch fresh if expired/forced."""
    if not force_refresh:
        cached_news = get_cached_data(NEWS_CACHE_FILE)
        if cached_news is not None:
            return cached_news
            
    # Fetch fresh news
    fresh_news = get_all_news()
    save_to_cache(NEWS_CACHE_FILE, fresh_news)
    return fresh_news

def get_or_update_analysis(force_refresh: bool = False) -> dict:
    """Get analysis from cache or generate new using Ollama."""
    if not force_refresh:
        cached_analysis = get_cached_data(ANALYSIS_CACHE_FILE)
        if cached_analysis is not None:
            return cached_analysis
            
    # Need to have latest news first
    news = get_or_update_news(force_refresh=force_refresh)
    if not news:
        return get_empty_fallback_response("No current affairs articles found to process.")
        
    # Generate new analysis
    analysis = generate_upsc_analysis(news)
    
    # Only cache if we didn't receive a fallback error response, or cache it anyway but warn
    if "Error" not in analysis.get("executive_summary", ""):
        save_to_cache(ANALYSIS_CACHE_FILE, analysis)
    else:
        logger.warning("Ollama returned an error fallback response, not saving to persistent cache.")
        
    return analysis

# --- Routes ---

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    """Serve the index.html template."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/news")
async def get_news_endpoint(refresh: bool = Query(default=False)):
    """Fetch and return all latest current affairs news articles."""
    try:
        news = get_or_update_news(force_refresh=refresh)
        return {"status": "success", "count": len(news), "news": news}
    except Exception as e:
        logger.error(f"Error in /news endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary")
async def get_summary_endpoint(refresh: bool = Query(default=False)):
    """Return the Executive Summary, GS Mapping, Editorial Analysis, and Revision Notes."""
    try:
        analysis = get_or_update_analysis(force_refresh=refresh)
        return {
            "status": "success",
            "executive_summary": analysis.get("executive_summary", ""),
            "top_10_current_affairs": analysis.get("top_10_current_affairs", []),
            "upsc_gs_mapping": analysis.get("upsc_gs_mapping", []),
            "prelims_facts": analysis.get("prelims_facts", []),
            "editorial_analysis": analysis.get("editorial_analysis", []),
            "important_data": analysis.get("important_data", []),
            "keywords": analysis.get("keywords", []),
            "revision_notes": analysis.get("revision_notes", "")
        }
    except Exception as e:
        logger.error(f"Error in /summary endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcqs")
async def get_mcqs_endpoint(refresh: bool = Query(default=False)):
    """Return generated Multiple Choice Questions with Answers."""
    try:
        analysis = get_or_update_analysis(force_refresh=refresh)
        return {
            "status": "success",
            "mcqs": analysis.get("mcqs", [])
        }
    except Exception as e:
        logger.error(f"Error in /mcqs endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mains")
async def get_mains_endpoint(refresh: bool = Query(default=False)):
    """Return generated Mains Questions."""
    try:
        analysis = get_or_update_analysis(force_refresh=refresh)
        return {
            "status": "success",
            "mains_questions": analysis.get("mains_questions", [])
        }
    except Exception as e:
        logger.error(f"Error in /mains endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interview")
async def get_interview_endpoint(refresh: bool = Query(default=False)):
    """Return generated Interview Questions."""
    try:
        analysis = get_or_update_analysis(force_refresh=refresh)
        return {
            "status": "success",
            "interview_questions": analysis.get("interview_questions", [])
        }
    except Exception as e:
        logger.error(f"Error in /interview endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    role: str
    content: str

class MentorRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    mode: Optional[Literal["simple", "advanced"]] = "simple"
    language: Optional[Literal["en", "hi", "hinglish", "or"]] = "en"

def is_factual_query(query: str) -> bool:
    q = query.lower().strip()
    factual_starters = ["who", "what", "where", "when", "which", "name", "current minister", "current governor", "current chief minister"]
    for starter in factual_starters:
        if q.startswith(starter) or f" {starter} " in f" {q} " or q.startswith(f"{starter} "):
            analytical_keywords = ["explain", "discuss", "describe", "analyse", "analyze", "notes", "essay", "detailed"]
            has_analytical = any(keyword in q for keyword in analytical_keywords)
            if not has_analytical:
                return True
    return False

@app.post("/mentor")
async def post_mentor_endpoint(req: MentorRequest):
    try:
        messages = []
        latest_query = ""
        if req.messages:
            messages = [{"role": m.role, "content": m.content} for m in req.messages]
            user_msgs = [m.content for m in req.messages if m.role == "user"]
            if user_msgs:
                latest_query = user_msgs[-1]
        elif req.message:
            messages = [{"role": "user", "content": req.message}]
            latest_query = req.message
        else:
            raise HTTPException(status_code=400, detail="Either 'message' or 'messages' must be provided.")
            
        if is_factual_query(latest_query):
            system_prompt = (
                "You are an experienced UPSC Civil Services mentor. Give a direct answer to the user's factual question in the first sentence. "
                "Do NOT use generic headings like 'About', 'Key Facts', 'Responsibilities', or 'One-Liner Takeaway'. "
                "Only add 2-3 supporting sentences if useful. Keep the response very brief."
            )
        else:
            system_prompt = (
                "You are an experienced UPSC Civil Services mentor. Explain concepts with syllabus anchors (GS Paper, topic), "
                "link to PYQs and current affairs, and end with a one-line takeaway. Use markdown for structure."
            )
        
        if req.mode == "simple":
            system_prompt += "\nUse simple, clear language, short sentences, and everyday analogies."
        elif req.mode == "advanced":
            system_prompt += "\nUse precise terminology, cite Articles/Sections/Committees/Reports/judgements, and surface inter-topic connections."
            
        if req.language == "hi":
            system_prompt += "\nRespond in Hindi (Devanagari script)."
        elif req.language == "hinglish":
            system_prompt += "\nRespond in Hinglish — natural Hindi + English mix."
        elif req.language == "or":
            system_prompt += (
                "\nRespond ENTIRELY in pure Odia script (ଓଡ଼ିଆ). No English, no Roman letters, no Devanagari. "
                "Translate every technical term into Odia."
            )
            
        return StreamingResponse(
            generate_mentor_reply_stream(messages, system_prompt),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        logger.error(f"Error in /mentor endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple API health check endpoint."""
    # Check if cache directory exists and is writeable
    cache_ok = CACHE_DIR.exists()
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "cache_directory": "ready" if cache_ok else "missing"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
