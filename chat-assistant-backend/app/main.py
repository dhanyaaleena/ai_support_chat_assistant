from fastapi import FastAPI
from app.routes import query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chat Assistant Backend")

# Register Routes
app.include_router(query.router, prefix="/api/chat", tags=["Query"])

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000", "http://www.sagestack.org", "https://www.sagestack.org"], # Allow frontend to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
async def root():
    return {"message": "Chat Assistant API is running!"}
