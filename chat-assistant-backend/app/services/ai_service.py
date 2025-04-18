import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph.message import add_messages
from langgraph.graph import MessagesState
from typing import Dict, Union
import json
from langchain_core.tools import Tool, StructuredTool
import httpx
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


# Load environment variables from the .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

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

    payload = {
            "contents": [{
                "parts": [{"text": ticket_prompt}]
            }]
        }

    headers = {
            "Content-Type": "application/json"
        }

    response = httpx.post(GEMINI_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        logger.error("Gemini API error: %s", response.text)
        raise HTTPException(status_code=response.status_code, detail=response.text)

    gemini_response = response.json()
    ticket_details = gemini_response["candidates"][0]["content"]["parts"][0]["text"]

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
    payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

    headers = {
            "Content-Type": "application/json"
        }

    response = httpx.post(GEMINI_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        logger.error("Gemini API error: %s", response.text)
        raise HTTPException(status_code=response.status_code, detail=response.text)

    gemini_response = response.json()
    generated_text = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
    return {"generated_text": generated_text}

faq_tool = StructuredTool.from_function(
    name="faq_lookup",
    func=faq_lookup,
    description="Looks up the answer in the FAQ context and provides a response."
)

def generate_response(question: str, faq_context: str, conversation_id: str) -> Dict[str, Union[str, dict]]:
    try:
        state = get_conversation_state(conversation_id)
        user_message = HumanMessage(content=question)
        state["messages"] = add_messages(state["messages"], [user_message])

        chat_context = "\n".join(
            [f"{msg.type.capitalize()}: {msg.content}" for msg in state["messages"]]
        )

        response = {}
        if question.lower() in ["y", "n"] and state["ticket_prompted"]:
            if question.lower() == "y":
                # Attempt ticket creation
                ticket_result = create_ticket_tool.invoke(chat_context)
                
                # Check for errors in ticket creation
                if "error" in ticket_result:
                    response = {"generated_text": f"Ticket creation failed: {ticket_result['error']}"}
                else:
                    response = {
                        "generated_text": "Ticket created successfully!",
                        "ticket_details": ticket_result
                    }
            else:
                response = {"generated_text": "Okay, let me know if you need further assistance."}

            state["ticket_prompted"] = False
            assistant_message = AIMessage(content=response["generated_text"])

        else:
            # FAQ lookup logic
            faq_answer = faq_tool.invoke({
                "question": question, 
                "faq_context": faq_context, 
                "chat_context": chat_context
            })
            
            # Check if ticket prompt is needed
            if "Would you like to create a ticket" in faq_answer["generated_text"]:
                state["ticket_prompted"] = True
            
            assistant_message = AIMessage(content=faq_answer["generated_text"])
            response = {"generated_text": faq_answer["generated_text"]}

        # Update conversation history
        state["messages"] = add_messages(state["messages"], [assistant_message])
        return response

    except Exception as e:
        logger.error(f"Critical error: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}