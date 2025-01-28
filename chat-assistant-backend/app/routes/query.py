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


pinecone_api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)

index_name = "faqsv2"

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")  # Free, lightweight model

index = pc.Index(index_name)

# Initialize Pinecone Vector Store using the created Pinecone index
faq_store = Pinecone(index=index, embedding_function=embedding_model.encode)

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    conversation_id: str  

"""
    Handles user queries, retrieves relevant FAQs using Pinecone, 
    and generates AI responses if necessary.
    
    Args:
        query (str): The query entered by the user.
        conversation_id (str): The unique identifier for the conversation.
        
    Returns:
        dict: The FAQ answers and/or AI-generated response.
"""
@router.post("/")
async def get_faq(request: QueryRequest):
    query = request.query.strip()  # Remove leading/trailing spaces
    conversation_id = request.conversation_id  

    if not query:
        return {"error": "Query cannot be empty."}

    faqs = retrieve_faqs(query) 

    if not faqs:
        # If no relevant FAQ is found, generate an AI response
        context = "Sorry, I can't help you with that right now as we are facing technical issues. Would you like to create a ticket for this?"
        ai_response = generate_response(query, context, conversation_id=conversation_id)
        return {"conversation_id": conversation_id, "ai_response": ai_response}

    # Extract relevant FAQ answers from search results
    context = " ".join([faq['answer'] for faq in faqs])

    # Use the context to generate an AI response
    ai_response = generate_response(query, context, conversation_id=conversation_id)
    return {"conversation_id": conversation_id, "ai_response": ai_response}
