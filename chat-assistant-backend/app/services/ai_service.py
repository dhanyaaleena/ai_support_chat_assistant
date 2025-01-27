import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# Load environment variables from the .env file
load_dotenv()

# Fetch Hugging Face API URL and API Key from environment variables
HUGGINGFACE_API_URL = os.getenv("HUGGINGFACE_API_URL")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Check if the environment variables are loaded correctly
if not HUGGINGFACE_API_URL or not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API URL or API Key not set in .env file.")

# Initialize the Inference Client
client = InferenceClient(token=HUGGINGFACE_API_KEY)

def generate_response(question: str, context: str):
    """
    Generates a response to a question based on a context using Hugging Face's InferenceClient.
    
    Args:
        question (str): User's question.
        context (str): Context or prior responses to assist in generating an answer.
        
    Returns:
        str: The AI-generated response.
    """
    # Format the prompt message with context and question

    prompt = f"""
    You are a support assistant. You are provided with a context and a question.
    
    Context: {context}
    Question: {question}
    If the question is in the context, then respond with that.
    If the question is out of the context, then respond with: 
    "Sorry I can't help you with that now. Would you like to create a ticket for this?"
    Avoid mentioning the context again and focus on providing the correct response. 
    Do not engage in any storytelling or creative answers.
    """
    print("PROMPT", prompt)

    # Create the messages list
    messages = [
        {"role": "user", "content": prompt}
    ]
    
    # Call the InferenceClient's chat completion API
    try:
        # You can specify the model, messages, and optional max_tokens limit here
        completion = client.chat.completions.create(
            model="google/gemma-2-2b-it",  # Specify your desired model
            messages=messages,
            max_tokens=500  # Optional: limit generated tokens
        )
        
        # Extract the generated text from the response
        generated_text = completion['choices'][0]['message']['content']
        return {"generated_text": generated_text}
    
    except Exception as e:
        return {"error": f"An error occurred while fetching the response: {str(e)}"}
