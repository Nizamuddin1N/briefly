from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": "You are a research assistant. Respond in simple plain English, no JSON."
        },
        {
            "role": "user",
            "content": "Summarise the topic: machine learning"
        }
    ],
    temperature=0
)

print(response.choices[0].message.content)
print(f"Input tokens: {response.usage.prompt_tokens}")
print(f"Output tokens: {response.usage.completion_tokens}")