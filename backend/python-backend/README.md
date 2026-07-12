# UPSC AI News Assistant

A production-ready, fully private, 100% free, local AI-powered UPSC Current Affairs backend and responsive visual dashboard using Python, FastAPI, and Ollama (`llama3.2:3b`).

No third-party APIs (like OpenAI or Gemini) are used; everything runs locally on your own machine.

## Features

- **RSS News Aggregator**: Fetches news from 8 premium sources (Google News UPSC, PIB, The Hindu, Indian Express, PRS India, ISRO, MEA, and Google News India) with robust timeout, retry, and deduplication logic.
- **Local AI Analysis (Ollama)**: Automatically processes aggregated news articles to extract executive summaries, GS mapping, Prelims facts, editorial analyses, keywords, and revision notes.
- **Automatic Exam Item Creation**: Generates 10 high-quality Prelims MCQs with answers/explanations and 5 Mains questions with outline blueprints.
- **Interview Preparation**: Drafts personality test questions with balanced administrative standpoints.
- **Smart Caching**: Stores feed queries and AI analysis in a file-based cache for 30 minutes to reduce compute loads.
- **Premium Interface**: Responsive dashboard featuring interactive tab switching, full-text live searching, theme toggling (dark/light modes), and loading progress states.

---

## Installation & Setup

### 1. Prerequisites
- **Python 3.12** or higher installed on your path.
- **Ollama** installed on your system. Download it from [ollama.com](https://ollama.com).

### 2. Install Project Dependencies
In your terminal, navigate to this project's directory and run:
```bash
pip install -r requirements.txt
```

### 3. Fetch the Local LLM
Ensure your Ollama app is running in the background, then pull the required Llama model:
```bash
ollama pull llama3.2:3b
```

### 4. Set Up Environment (Optional)
Copy `.env.example` to `.env` to customize settings:
```bash
copy .env.example .env
```

---

## Running the Application

Start the FastAPI backend and web server with the following command:
```bash
uvicorn app:app --reload
```

After startup, open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## API Endpoints

- `GET /` - Serves the HTML frontend dashboard.
- `GET /news` - Fetches and returns deduplicated news articles from RSS.
- `GET /summary` - Returns the Executive Summary, GS Mapping, Editorial Analysis, and Revision Notes.
- `GET /mcqs` - Returns 10 statement-based current affairs MCQs.
- `GET /mains` - Returns 5 GS syllabus Mains questions.
- `GET /interview` - Returns Personality test interview prep topics.
- `GET /health` - Simple status and cache health check.

> **Tip:** You can append `?refresh=true` to any endpoint to bypass the 30-minute cache and force a new fetch/generation.
