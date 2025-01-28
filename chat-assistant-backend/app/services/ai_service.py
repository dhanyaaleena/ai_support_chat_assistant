import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph.message import add_messages
from langgraph.graph import MessagesState

# Load environment variables from the .env file
load_dotenv()

# Fetch Hugging Face API URL and API Key from environment variables
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Check if the environment variables are loaded correctly
if not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API Key not set in .env file.")

# Initialize the Inference Client
client = InferenceClient(token=HUGGINGFACE_API_KEY)

class State(MessagesState):
    documents: list[str] = []  

conversations = {}

def get_conversation_state(conversation_id: str) -> State:
    """
    Retrieves or initializes the conversation state for a given conversation ID.

    Args:
        conversation_id (str): Unique identifier for the conversation.

    Returns:
        State: The conversation's current state.
    """
    if conversation_id not in conversations:
        # Initialize a new state if it doesn't exist
        conversations[conversation_id] = State(messages=[])
    return conversations[conversation_id]

def generate_response(question: str, faq_context: str, conversation_id: str):
    """
    Generates a response to a question based on a conversation context using Hugging Face's InferenceClient
    and LangChain's graph-based state management.

    Args:
        question (str): User's question.
        faq_context (str): FAQ context to guide the response.
        conversation_id (str): Unique identifier for the conversation.

    Returns:
        dict: The AI-generated response or error message.
    """
    # Retrieve the state for the conversation
    state = get_conversation_state(conversation_id)
    # Add the user's message to the state using add_messages
    user_message = HumanMessage(content=question)
    state["messages"] = add_messages(state["messages"], [user_message])

    # Prepare context by combining messages in the state
    chat_context = "\n".join(
        [f"{message.type.capitalize()}: {message.content}" for message in state["messages"]]
    )

    # Format the prompt
    prompt = f"""
        You are a support chat assistant designed to provide accurate and concise responses. You are given two inputs: a FAQ context and a chat history. Use these to draft your response.

        **FAQ Context**:  
        {faq_context}  

        **Chat History**:  
        {chat_context}  

        **Instructions**:  
        1. **FAQ Match**: If the user's last message or question aligns with the FAQ context, respond directly with the relevant answer from the FAQ.  
        2. **Out of Scope**: If the user's last message is outside the scope of the FAQ context, respond with:  
        "Sorry, I can't help you with that now. Would you like to create a ticket for this?"  
        3. **Suggestion/Feature Request**: If the user's message is a suggestion or pertains to a new feature, or ask for something not in the faq respond with:  
        "Thank you for the suggestion! We are always looking for ways to improve. Would you like to create a ticket for this?"  
        4. **Acknowledgment**: If the user's last message is an acknowledgment like "Thank you," "Okay," "Great," or similar, respond warmly and joyfully with phrases such as:  
        - "You're welcome! Let me know if you need further assistance."  
        - "Happy to help! Feel free to reach out anytime."  
        - "I'm glad I could assist! Have a great day!"  
        5. **Greeting**: If the user's last message is a greeting like "Hi," "Hello," or includes their name, respond warmly with:  
        - "Hello! How can I assist you today?"  
        - "Hi there! What can I help you with?"  
        - "Hello [User's Name]! How may I assist you?" (if the name is provided). 
        6. **Follow-Up Questions**: If the user's last message is a follow-up question (e.g., "Yes," "Tell me more," "How?"), provide additional details or guide the user to the next step. For example:  
        - If the user asks about discounts and then says "Yes," respond with:  
            - If discount details are available in the FAQ context:  
            "Here are the current discounts: [Provide details from FAQ context]. Let me know if you need help with anything else!"  
            - If discount details are **not** available in the FAQ context:  
            "I currently don't have information about discounts. Would you like to create a ticket for further assistance?"  

        **Anti-Hallucination Rules**:  
        - **Do not make up information**. If the required details are not available in the FAQ context, respond honestly and guide the user to the next step (e.g., creating a ticket).  
        - **Do not include placeholders** like "[List discounts or provide a link]"—provide only concrete information. 

        **Tone Requirements**:  
        - Maintain a joyful, formal, and professional tone.  
        - Avoid repeating information from the FAQ or chat history unless explicitly asked.  
        - Do not engage in storytelling or provide creative responses.  

        **Focus**:  (VERY IMPORTANT)
        - Respond only to the user's last message.  
        - Do not repeat the user's last message in your response.  
        - Provide **only one response**—do not list alternatives or examples.

        **User's Last Message**:  
        {user_message.content}  

        Based on the above guidelines, provide a **single, clear, and concise response** to the user's last message.
    """
            
    # Print the prompt for debugging purposes
    print("PROMPT", prompt)

    # Pass the prompt to the InferenceClient's chat completion API
    try:
        # Specify the model and make the API call
        completion = client.chat.completions.create(
            model="google/gemma-2-2b-it",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        
        # Extract the response from the AI
        generated_text = completion['choices'][0]['message']['content']

        # Add the assistant's response to the state
        assistant_message = AIMessage(content=generated_text)
        state["messages"] = add_messages(state["messages"], [assistant_message])

        return {"generated_text": generated_text}
    
    except Exception as e:
        return {"error": f"An error occurred while fetching the response: {str(e)}"}
