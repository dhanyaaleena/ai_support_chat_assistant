from fastapi import APIRouter
from app.services.ai_service import generate_response
from pydantic import BaseModel
from langchain_community.vectorstores import Pinecone
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import os
from dotenv import load_dotenv
from app.services.faq_service import retrieve_faqs


load_dotenv()

# Fetch the Pinecone API key from the environment
pinecone_api_key = os.getenv("PINECONE_API_KEY")
# Initialize Pinecone with the correct API key
pc = Pinecone(api_key=pinecone_api_key)

# Define the index name
index_name = "faqsv2"  

# Initialize Sentence Transformers for embeddings
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")  # Free, lightweight model

index = pc.Index(index_name)

# Initialize Pinecone Vector Store using the created Pinecone index
faq_store = Pinecone(index=index, embedding_function=embedding_model.encode)

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

"""
    Handles user queries, retrieves relevant FAQs using Pinecone, 
    and generates AI responses if necessary.
    
    Args:
        query (str): The query entered by the user.
        
    Returns:
        dict: The FAQ answers and/or AI-generated response.
"""
@router.post("/")
async def get_faq(request: QueryRequest):
    query = request.query.strip()  # Remove leading/trailing spaces
    
    if not query:
        return {"error": "Query cannot be empty."}

    # Generate embedding for the query using Sentence Transformers
    faqs = retrieve_faqs(query)  # k = number of relevant results to fetch

    if not faqs:
        # If no relevant FAQ is found, generate an AI response
        context = "Sorry, the answer to the provided question is not currently available. Would you like to create a ticket?"
        ai_response = generate_response(query, context)
        return {"ai_response": ai_response}
    
    # Extract relevant FAQ answers from search results
    context = " ".join([faq['answer'] for faq in faqs])
    
    # Use the context to generate an AI response
    ai_response = generate_response(query, context)
    return {"ai_response": ai_response}
