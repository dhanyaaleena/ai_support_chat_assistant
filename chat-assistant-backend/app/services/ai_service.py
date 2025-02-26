import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph.message import add_messages
from langgraph.graph import MessagesState
from typing import Dict, Union
import json
from langchain_core.tools import Tool, StructuredTool

# Load environment variables from the .env file
load_dotenv()

# Fetch Hugging Face API Key from environment variables
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

if not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API Key not set in .env file.")

# Initialize the Inference Client
client = InferenceClient(token=HUGGINGFACE_API_KEY)

class State(MessagesState):
    def __init__(self, messages=None, ticket_prompted=False):
        super().__init__()  # Initialize the parent class (MessagesState)
        self.messages = messages if messages is not None else []
        self.ticket_prompted = ticket_prompted

# Dictionary to store conversation states
conversations: Dict[str, State] = {}

def get_conversation_state(conversation_id: str) -> State:
    if conversation_id not in conversations:
        conversations[conversation_id] = State(messages=[], ticket_prompted=False)
    return conversations[conversation_id]

def create_ticket(chat_context: str) -> dict:
    """Generates a ticket based on chat context."""
    ticket_prompt = f"""
        Generate a support ticket with:
        - **Summary**: Brief issue description.
        - **Category**: "bug", "feature request", or "general question".
        - **Additional Notes**: Relevant chat context.
        
        **Chat History**:
        {chat_context}
        - Provide your response in JSON format with the following structure: 
        {{
        "summary": "<Brief summary of issue>",
        "category": "<General question / Feature request / Bug / Other>",
        "additional_notes": "<User's concern summarized>"
        }}

    """
    
    completion = client.chat.completions.create(
        model="google/gemma-2-2b-it",
        messages=[{"role": "user", "content": ticket_prompt}],
        max_tokens=300
    )
    
    ticket_details = completion['choices'][0]['message']['content']
    return json.loads(ticket_details.split("```json")[-1].strip().strip("```"))

create_ticket_tool = Tool(
    name="create_ticket",
    func=lambda chat_context: create_ticket(chat_context),
    description="Creates a support ticket based on chat context."
)

def faq_lookup(question: str, faq_context: str, chat_context: str) -> str:
    """Looks up the answer in the FAQ context."""
    prompt = f"""
        You are a support chat assistant designed to provide accurate and concise responses. You are given two inputs: a FAQ context and a chat history. Use these to draft your response.

        **FAQ Context**:  
        {faq_context}  

        **Chat History**:  
        {chat_context}  

        **Instructions**:  
        1. **FAQ Match**: If the user's last message or question aligns with the FAQ context, respond directly with the relevant answer from the FAQ.  
        2. **Out of Scope**: If the user's last message is outside the scope of the FAQ context, respond with:  
            "Sorry, I couldn't help. Would you like to create a ticket for this?(y/n)"  
        3. **Suggestion/Feature Request**: If the user's message is a suggestion or pertains to a new feature, respond with:  
        "Thank you for the suggestion! We are always looking for ways to improve. Would you like to create a ticket for this?"  
        4. **Acknowledgment**: If the user's last message is an acknowledgment like "Thank you," "Okay," or similar, respond warmly and joyfully with phrases such as:  
        - "You're welcome! Let me know if you need further assistance."  
        - "Happy to help! Feel free to reach out anytime."  
        - "I'm glad I could assist! Have a great day!"  
        5. **Greeting**: If the user's last message is a greeting like "Hi," "Hello," or includes their name, respond warmly with:  
        - "Hello! How can I assist you today?"  
        - "Hi there! What can I help you with?"  
        - "Hello [User's Name]! How may I assist you?" (if the name is provided).  
        6. **Follow-Up Questions**: If the user's last message is a follow-up question, provide additional details or guide the user to the next step. For example:  
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
        {question}  

        Based on the above guidelines, provide a **single, clear, and concise response** to the user's last message.
    """
    completion = client.chat.completions.create(
            model="google/gemma-2-2b-it",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
    generated_text = completion['choices'][0]['message']['content']
    return generated_text

faq_tool = StructuredTool.from_function(
    name="faq_lookup",
    func=faq_lookup,
    description="Looks up the answer in the FAQ context and provides a response."
)

def generate_response(question: str, faq_context: str, conversation_id: str) -> Dict[str, Union[str, dict]]:
    try:
        # Retrieve the state for the conversation
        state = get_conversation_state(conversation_id)

        # Add the user's message to the state
        user_message = HumanMessage(content=question)
        state["messages"] = add_messages(state["messages"], [user_message])

        # Prepare chat context from the conversation history
        chat_context = "\n".join(
            [f"{message.type.capitalize()}: {message.content}" for message in state["messages"]]
        )
        response = {}
        if question.lower() in ["y", "n"] and state["ticket_prompted"]:
            if question.lower() == "y":
                ticket_result = create_ticket_tool.invoke(chat_context)
                response = {"generated_text": "I’ve created a ticket for you.", "ticket_details": ticket_result}
            else:
                response = {"generated_text": "Okay, let me know if you need further assistance."}
            state["ticket_prompted"] = False
            assistant_message = AIMessage(content=str(response))
        else:
            faq_answer = faq_tool.invoke({
                "question": question, 
                "faq_context": faq_context, 
                "chat_context": chat_context
            })
            if "Would you like to create a ticket" in faq_answer:
                state["ticket_prompted"] = True 
            assistant_message = AIMessage(content=faq_answer)
            response = {"generated_text": faq_answer}
        state["messages"] = add_messages(state["messages"], [assistant_message])

        return response

    except Exception as e:
        return {"error": f"An error occurred while fetching the response: {str(e)}"}