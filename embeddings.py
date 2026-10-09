import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# Load the embedding model (runs locally, no API needed)
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded!\n")

# Create a local ChromaDB database
client = chromadb.Client()
collection = client.create_collection(name="research_docs")

# Sample documents — imagine these are web pages your agent scraped
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

# Convert documents to embeddings and store them
print("Storing documents in vector database...")
embeddings = model.encode(documents).tolist()

collection.add(
    documents=documents,
    embeddings=embeddings,
    ids=[f"doc_{i}" for i in range(len(documents))]
)
print(f"Stored {len(documents)} documents\n")

# Now search by meaning
queries = [
    "how do machines learn from data?",
    "what is used for building web services?",
    "how do brain-inspired systems work?"
]

print("=" * 50)
for query in queries:
    # Convert query to embedding
    query_embedding = model.encode([query]).tolist()
    
    # Search for most similar documents
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=2  # return top 2 matches
    )
    
    print(f"\nQuery: '{query}'")
    print("Top matches:")
    for i, doc in enumerate(results["documents"][0]):
        print(f"  {i+1}. {doc}")
print("=" * 50)