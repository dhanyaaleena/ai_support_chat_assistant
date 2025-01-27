import os
from dotenv import load_dotenv
import requests

# Load environment variables from the .env file
load_dotenv()

# Fetch API URL and API Key from environment variables
HUGGINGFACE_API_URL = os.getenv("HUGGINGFACE_API_URL")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Check if the environment variables are loaded correctly
if not HUGGINGFACE_API_URL or not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API URL or API Key not set in .env file.")

HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

def categorize_ticket(chat_history: str):
    """
    Categorizes the ticket based on the chat history using Hugging Face API.
    
    Args:
        chat_history (str): The entire conversation or user query.
        
    Returns:
        str: The predicted category, such as "bug", "feature_request", etc.
    """
    payload = {
        "inputs": chat_history,
    }

    # Call Hugging Face API to get the categorization
    response = requests.post(HUGGINGFACE_API_URL, json=payload, headers=HEADERS)
    
    if response.status_code == 200:
        category = response.json()[0]['label']
        return category
    return "uncategorized"
