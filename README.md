AI Support Chat Assistant
Overview
The AI Support Chat Assistant is an AI-powered support system that enables users to interact with a chatbot for assistance and create support tickets when needed. The system allows admins and engineers to manage tickets efficiently.

Features
User Features
AI-powered chat assistant for real-time responses.
Users can create support tickets for unresolved issues.
Ability to track the status of tickets.
Admin Features
View all support tickets.
Change ticket statuses (Open, In Progress, Completed, Blocked).
Assign/unassign tickets to engineers.
Visualize ticket trends.
Engineer Features
View and manage assigned tickets.
Update ticket statuses.
Tech Stack
Frontend:
React.js with Chakra UI for a clean and responsive design.
Recharts for visualizing ticket statistics.
Backend:
FastAPI for building RESTful APIs.
Pinecone for vector storage and search.
Google's gemma-2-2b-it model for AI-based responses.

Installation Guide
1. Clone the Repository
sh
Copy
Edit
git clone https://github.com/your-repo/ai-support-chat.git
cd ai-support-chat
2. Install Dependencies
Frontend
sh
Copy
Edit
cd frontend
npm install
Backend
sh
Copy
Edit
cd backend
python -m venv venv
source venv/bin/activate   # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
3. Configure Environment Variables
Create a .env file in the backend folder and add the following:

makefile
Copy
Edit
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENV=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index_name
PORT=8000
HUGGING_FACE_API_KEY=your_hugging_face_api_key
4. Run the Project
Backend
sh
Copy
Edit
cd backend
uvicorn main:app --reload
Frontend
sh
Copy
Edit
cd frontend
npm start
API Endpoints
1. AI Chat API
Chat with AI
Endpoint:

http
Copy
Edit
POST /api/chat
Request:

json
Copy
Edit
{
  "query": "hi",
  "conversation_id": "conv-1738223037195-756"
}
Response:

json
Copy
Edit
{
  "conversation_id": "conv-1738223037195-756",
  "ai_response": {
    "generated_text": "Hi there! How can I help you today?",
    "ticket_details": null
  }
}