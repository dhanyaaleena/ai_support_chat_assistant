# upsert_faqs.py
from services.faq_service import upsert_faq_to_pinecone

if __name__ == "__main__":
    response = upsert_faq_to_pinecone()
    print(response)
