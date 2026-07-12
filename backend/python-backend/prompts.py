# System and User prompts for Ollama tailored for UPSC preparation

SYSTEM_PROMPT = """You are an expert UPSC Civil Services examination mentor and coach.
Your task is to analyze the provided current affairs news articles and generate a comprehensive, highly structured, and accurate analysis specifically tailored for UPSC aspirants.
You must return the analysis strictly as a single JSON object. Do not include any markdown wrapper or backticks (like ```json ... ```) in the raw response; output only the clean JSON string.
"""

USER_PROMPT_TEMPLATE = """Analyze the following UPSC current affairs news articles:

{articles_text}

Generate a comprehensive analysis covering all of the following requirements. You must return a JSON object with the exact keys described below:

{{
  "executive_summary": "A concise paragraph summarizing the key current affairs theme of the day and its overall significance to India's policy, economy, or security.",
  
  "top_10_current_affairs": [
    {{
      "title": "Title of the news item",
      "relevance": "Why this is important for UPSC",
      "details": "A detailed 2-3 sentence explanation of the news item"
    }}
  ],
  
  "upsc_gs_mapping": [
    {{
      "topic": "Name of the issue/event",
      "gs_paper": "GS Paper I, II, III, or IV",
      "syllabus_section": "Specific syllabus topic (e.g., Indian Economy, Federalism, Environment)",
      "details": "How it maps to the syllabus and its significance"
    }}
  ],
  
  "prelims_facts": [
    {{
      "fact": "The factual point (e.g., names of schemes, reports, geographical features, indices)",
      "detail": "Detailed explanation of the fact",
      "key_point_to_remember": "Critical trap/trick UPSC might use in statement-based questions"
    }}
  ],
  
  "mcqs": [
    {{
      "question": "A high-quality statement-based MCQ reflecting the UPSC Prelims pattern (2-3 statement options)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "A, B, C, or D",
      "explanation": "Detailed explanation of the correct choice and why other options are incorrect"
    }}
  ],
  
  "mains_questions": [
    {{
      "question": "An analytical Mains question of 150/250 words difficulty level",
      "gs_paper": "GS Paper I, II, III, or IV",
      "model_structure": "Brief structure of the answer (Intro, Body points, Way forward, Conclusion)"
    }}
  ],
  
  "editorial_analysis": [
    {{
      "title": "Title/Topic of editorial",
      "issue": "What is the core issue?",
      "key_takeaways": "Bullet points of major arguments",
      "challenges": "Challenges/concerns associated with it",
      "way_forward": "Constructive suggestions or solutions"
    }}
  ],
  
  "interview_questions": [
    {{
      "question": "An opinion-based question suitable for the UPSC Personality Test (Interview)",
      "contextual_relevance": "Why this is being asked based on current events",
      "hint_answer": "A balanced, administrative, and constitutional perspective to answer it"
    }}
  ],
  
  "important_data": [
    {{
      "metric": "Statistic, index value, percentage, budget allocation, etc.",
      "value": "Value/Stat detail",
      "source_relevance": "Which Ministry/Organization released it and how to use it in Mains answers"
    }}
  ],
  
  "keywords": [
    {{
      "term": "High-yield administrative, economic, or legal terminology (e.g., Cooperative Federalism, Judicial Overreach, Stagflation)",
      "definition": "Definition of the term",
      "relevance_to_upsc": "How/where to use it in answers"
    }}
  ],
  
  "revision_notes": "A Markdown string containing bulleted, highly concise revision notes of all major topics for quick review before exams."
}}

Make sure you generate exactly 10 high-quality MCQs and 5 analytical Mains questions. Ensure all details are accurate, factual, and strictly relevant to the UPSC syllabus. Provide only the JSON structure, with no additional text or code blocks.
"""
