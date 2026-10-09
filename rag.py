import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

# Setup
print("Loading models...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma_client = chromadb.Client()
collection = chroma_client.create_collection(name="research_docs")
print("Ready!\n")

# Store documents
documents = [
    "Machine learning is a subset of AI where algorithms learn from data to make predictions.",
    "Neural networks are computing systems inspired by biological neural networks in animal brains.",
    "Python is a high-level programming language known for simplicity and readability.",
    "Deep learning uses multiple layers of neural networks to learn complex patterns in data.",
    "FastAPI is a modern web framework for building APIs with Python, known for high performance.",
    "Vector databases store embeddings and allow similarity search across large datasets.",
    "Supervised learning trains models on labeled data to predict outcomes for new data.",
    "Docker is a platform for developing and running applications in isolated containers.",
]

embeddings = embedding_model.encode(documents).tolist()
collection.add(
    documents=documents,
    embeddings=embeddings,
    ids=[f"doc_{i}" for i in range(len(documents))]
)

def answer_question(question: str):
    # Step 1 — find relevant documents
    query_embedding = embedding_model.encode([question]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=3
    )
    relevant_docs = results["documents"][0]
    
    # Step 2 — build context from retrieved docs
    context = "\n".join([f"- {doc}" for doc in relevant_docs])
    
    # Step 3 — send to LLM with context
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """You are a research assistant. 
                Answer the user's question using ONLY the context provided.
                If the context doesn't contain enough information, say so.
                Always mention which concepts from the context you used."""
            },
            {
                "role": "user",
                "content": f"""Context:
{context}

Question: {question}"""
            }
        ],
        temperature=0.3
    )
    
    answer = response.choices[0].message.content
    
    # Display everything
    print(f"\n{'='*50}")
    print(f"Question: {question}")
    print(f"\nRetrieved context:")
    for doc in relevant_docs:
        print(f"  - {doc}")
    print(f"\nAnswer: {answer}")
    print(f"{'='*50}\n")

# Test it
answer_question("How do computers learn to recognize patterns?")
answer_question("What tools can I use to build a Python API?")
answer_question("What is the relationship between deep learning and neural networks?")