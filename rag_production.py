import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import os

load_dotenv()

# Setup
print("Loading models...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Persistent ChromaDB — data survives restarts this time
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Delete collection if exists (for clean start during learning)
try:
    chroma_client.delete_collection("research_docs")
except:
    pass

collection = chroma_client.create_collection(name="research_docs")
print("Ready!\n")

# Simulate a large document — imagine this is a scraped webpage or PDF
large_document = """
Artificial Intelligence (AI) is intelligence demonstrated by machines, 
as opposed to natural intelligence displayed by animals including humans. 
AI research has been defined as the field of study of intelligent agents, 
which refers to any system that perceives its environment and takes actions 
that maximize its chance of achieving its goals.

Machine learning is a method of data analysis that automates analytical 
model building. It is based on the idea that systems can learn from data, 
identify patterns and make decisions with minimal human intervention. 
Machine learning algorithms include linear regression, decision trees, 
random forests, and neural networks.

Deep learning is part of a broader family of machine learning methods 
based on artificial neural networks with representation learning. 
Learning can be supervised, semi-supervised or unsupervised. Deep learning 
architectures such as deep neural networks, recurrent neural networks, 
convolutional neural networks have been applied to fields including 
computer vision, speech recognition and natural language processing.

Natural Language Processing (NLP) is a subfield of linguistics, computer 
science, and artificial intelligence concerned with the interactions between 
computers and human language, in particular how to program computers to 
process and analyze large amounts of natural language data. NLP is used in 
machine translation, spam detection, sentiment analysis and chatbots.

Vector databases are specialized databases designed to store and query 
high-dimensional vectors efficiently. They are essential for AI applications 
that require similarity search, such as recommendation systems, image search, 
and semantic search. Popular vector databases include Pinecone, Weaviate, 
Milvus and ChromaDB.

Retrieval Augmented Generation (RAG) is a technique that combines information 
retrieval with text generation. It works by first retrieving relevant documents 
from a knowledge base, then using those documents as context for a language 
model to generate accurate and grounded responses. RAG helps reduce 
hallucinations and keeps responses factually accurate.

FastAPI is a modern, fast web framework for building APIs with Python based 
on standard Python type hints. It has automatic API documentation, high 
performance comparable to NodeJS and Go, and easy integration with databases 
and AI models. FastAPI is widely used for building AI-powered backends.

Docker is a set of platform as a service products that use OS-level 
virtualization to deliver software in packages called containers. Containers 
are isolated from one another and bundle their own software, libraries and 
configuration files. Docker makes it easy to deploy applications consistently 
across different environments.
"""

# ---- CONCEPT 1: CHUNKING ----
print("Chunking document...")
splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,       # each chunk is max 300 characters
    chunk_overlap=50,     # 50 character overlap between chunks
    length_function=len
)

chunks = splitter.split_text(large_document)
print(f"Document split into {len(chunks)} chunks")
print(f"\nExample chunk:")
print(f"'{chunks[0]}'\n")

# ---- CONCEPT 2: PERSISTENT STORAGE ----
print("Storing chunks in persistent database...")
embeddings = embedding_model.encode(chunks).tolist()

collection.add(
    documents=chunks,
    embeddings=embeddings,
    ids=[f"chunk_{i}" for i in range(len(chunks))]
)
print(f"Stored {len(chunks)} chunks — database saved to ./chroma_db folder\n")

# ---- CONCEPT 3: BETTER RETRIEVAL WITH SCORES ----
def answer_question(question: str):
    query_embedding = embedding_model.encode([question]).tolist()
    
    # Get results with distance scores
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=3,
        include=["documents", "distances"]
    )
    
    relevant_docs = results["documents"][0]
    distances = results["distances"][0]
    
    # Convert distance to similarity score (lower distance = more similar)
    print(f"\n{'='*50}")
    print(f"Question: {question}")
    print(f"\nRetrieved chunks with similarity scores:")
    for doc, dist in zip(relevant_docs, distances):
        similarity = round((1 - dist) * 100, 1)
        print(f"  [{similarity}% match] {doc[:80]}...")
    
    # Build context
    context = "\n".join([f"- {doc}" for doc in relevant_docs])
    
    # Send to LLM
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """You are a research assistant.
                Answer using ONLY the provided context.
                Be concise and specific."""
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}"
            }
        ],
        temperature=0.3
    )
    
    print(f"\nAnswer: {response.choices[0].message.content}")
    print(f"{'='*50}\n")

# Test with questions
answer_question("What is RAG and why is it useful?")
answer_question("How does deep learning relate to neural networks?")
answer_question("What makes FastAPI good for AI applications?")