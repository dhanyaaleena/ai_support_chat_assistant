from fastapi import APIRouter
from app.services.category_service import categorize_ticket

router = APIRouter()

@router.post("/")
async def categorize(chat_history: str):
    category = categorize_ticket(chat_history)
    return {"category": category}
