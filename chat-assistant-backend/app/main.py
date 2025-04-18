import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import query

# Configure logging to write logs to a file
log_file = "api_requests.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),  # Log to file
    ]
)

logger = logging.getLogger("api_logger")

app = FastAPI(title="Chat Assistant Backend")

# Register Routes
app.include_router(query.router, prefix="/support-chat/api/chat", tags=["Query"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost",
        "http://www.sagestack.org",
        "https://www.sagestack.org"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Read and log the request body
    body_bytes = await request.body()
    body_text = body_bytes.decode("utf-8") if body_bytes else ""

    logger.info(f"Incoming request: {request.method} {request.url} Body: {body_text}")

    # Reset the request body so the actual endpoint can read it
    async def receive():
        return {"type": "http.request", "body": body_bytes}
    request._receive = receive

    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"message": "Chat Assistant API is running!"}
