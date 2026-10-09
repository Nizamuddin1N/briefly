from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Define exactly what structure you want back
class ResearchSummary(BaseModel):
    topic: str
    summary: str
    key_points: List[str]
    difficulty_level: str
    related_topics: List[str]
    estimated_read_time: str

# Convert schema to JSON format for the API
schema = ResearchSummary.model_json_schema()

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": f"""You are a research assistant. 
            Always respond with valid JSON that matches this schema exactly:
            {json.dumps(schema, indent=2)}
            Return only the JSON, no extra text."""
        },
        {
            "role": "user",
            "content": "Explain the topic: neural networks"
        }
    ],
    temperature=0,
    response_format={"type": "json_object"}  # forces JSON output
)

# Parse the response into your Python object
raw = response.choices[0].message.content
data = ResearchSummary.model_validate_json(raw)

# Now you can access each field like a normal Python object
print(f"Topic: {data.topic}")
print(f"Difficulty: {data.difficulty_level}")
print(f"\nSummary: {data.summary}")
print(f"\nKey Points:")
for point in data.key_points:
    print(f"  - {point}")
print(f"\nRelated Topics: {', '.join(data.related_topics)}")
print(f"\nInput tokens: {response.usage.prompt_tokens}")
print(f"Output tokens: {response.usage.completion_tokens}")
print(f"Read time: {data.estimated_read_time}")