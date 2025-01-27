from fastapi import FastAPI
from app.routes import query, ticket

app = FastAPI(title="Chat Assistant Backend")

# Register Routes
app.include_router(query.router, prefix="/api/faq", tags=["Query"])
app.include_router(ticket.router, prefix="/api/ticket", tags=["Ticket"])

@app.get("/")
async def root():
    return {"message": "Chat Assistant API is running!"}
