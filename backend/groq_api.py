import os
import requests
from flask import Flask, request, jsonify

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def chatBot(user_input):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
            "role": "system",
            "content": (
                "You are a parser. Extract structured keywords from transit-related questions. "
                "Return an object with keys: location, train_line."
                "Always return strict JSON: keys and strings must be quoted, multiple items should be a list"
                "If something is missing, leave the value null."
            )
            },
            {"role": "user", "content": user_input}
        ]
    }
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=body
    )
    response_json = response.json()
    bot_reply = response_json["choices"][0]["message"]["content"]

    return bot_reply
