import sys
sys.path.append("..")
import os
os.environ["OLLAMA_API_URL"] = "https://feeling-champion-contains-town.trycloudflare.com"
os.environ["OLLAMA_MODEL"] = "llama3.2:3b"

from mentor_client import generate_mentor_reply

messages = [{"role": "user", "content": "Hello"}]
system_prompt = "You are an AI."

try:
    reply = generate_mentor_reply(messages, system_prompt)
    print("SUCCESS:", reply)
except Exception as e:
    print("FAILED:", e)
