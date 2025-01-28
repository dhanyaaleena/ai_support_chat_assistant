import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# Load environment variables from the .env file
load_dotenv()

# Fetch Hugging Face API Key from environment variables
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Check if the API Key is loaded correctly
if not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API Key not set in .env file.")

# Initialize the Inference Client
client = InferenceClient(token=HUGGINGFACE_API_KEY)

def categorize_ticket(chat_history: str):
    """
    Categorizes the ticket based on the chat history using Hugging Face's InferenceClient.
    
    Args:
        chat_history (str): The entire conversation or user query.
        
    Returns:
        str: The predicted category, such as "bug", "feature_request", etc.
    """
    # Format the prompt message
    prompt = f"""
    You are a ticket categorization assistant. Based on the following chat history, 
    determine the category of the issue. Categories include "bug", "feature_request", 
    or "general_question".
    
    Chat History: {chat_history}
    
    Provide only the category name as the response.
    """
    
    # Create the messages list
    messages = [
        {"role": "user", "content": prompt}
    ]
    
    # Call the InferenceClient's chat completion API
    try:
        # Specify the model and generate the response
        completion = client.chat.completions.create(
            model="google/gemma-2-2b-it",  # Replace with the desired model
            messages=messages,
            max_tokens=10  # Optional: Limit the token output
        )
        
        # Extract the generated text from the response
        generated_text = completion['choices'][0]['message']['content']
        return {"category": generated_text.strip()}
    
    except Exception as e:
        return {"error": f"An error occurred while fetching the response: {str(e)}"}
