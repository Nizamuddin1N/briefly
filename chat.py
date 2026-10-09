from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# This list is the "memory" — it grows with every message
conversation_history = [
    {
        "role": "system",
        "content": "You are a helpful research assistant. Be concise."
    }
]

print("Chat started! Type 'quit' to exit.\n")

while True:
    # Get input from user
    user_input = input("You: ")
    
    if user_input.lower() == "quit":
        break
    
    # Add user message to history
    conversation_history.append({
        "role": "user",
        "content": user_input
    })
    
    # Send entire history to the model
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=conversation_history,
        temperature=0.7
    )
    
    # Extract reply
    reply = response.choices[0].message.content
    
    # Add assistant reply to history too
    conversation_history.append({
        "role": "assistant",
        "content": reply
    })
    
    print(f"\nAssistant: {reply}")
    print(f"(tokens used so far: {response.usage.prompt_tokens} input)\n")