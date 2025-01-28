from sentence_transformers import SentenceTransformer
import pinecone
from dotenv import load_dotenv
import os
from pinecone import ServerlessSpec
import json

load_dotenv()

pinecone_api_key = os.getenv("PINECONE_API_KEY")

# Initialize Pinecone with the API key from the environment
pc = pinecone.Pinecone(api_key=pinecone_api_key)

# Initialize SentenceTransformer model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2') 

faq_data = []
current_dir = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(current_dir, "faq_data.json")


# Read and load the JSON data into a variable
with open(file_path, "r") as json_file:
    faq_data = json.load(json_file)

# Define Pinecone index name
index_name = "faqsv2"

# Create Pinecone index if it doesn't exist (done once)
if index_name not in pc.list_indexes().names():
    # Define the index specifications
    index_spec = ServerlessSpec(
        cloud="aws",  
        region="us-east-1", 
    )

    # Create the index with the proper specifications
    pc.create_index(
        name=index_name,
        dimension=384,  # Dimension should match your embedding model (384 for all-MiniLM)
        metric="cosine",  # Use cosine similarity or other metric
        spec=index_spec,  # Provide the spec
    )

# Initialize the Pinecone index
index = pc.Index(index_name)

def retrieve_faqs(query: str):
    try:

        query_embedding = embedding_model.encode(query).tolist() 

        # Search Pinecone for the most relevant FAQ
        search_results = index.query(vector=query_embedding, top_k=5, include_metadata=True)

        faqs = []
        
        if 'matches' in search_results:
            for match in search_results['matches']:
                faq = match.get('metadata', {}) 
                
                # Ensure there's both a question and answer
                question = faq.get('question', 'No question available')
                answer = faq.get('answer', 'No answer available')
                
                # Append the question and answer to the list
                faqs.append({
                    "question": question,
                    "answer": answer
                })
        else:
            print("No matches found in the search results.")
        
        return faqs

    except Exception as e:
        print(f"Error during FAQ retrieval: {e}")
        return []


def upsert_faq_to_pinecone():
    faq_embeddings = []
    faq_ids = []

    for i, faq in enumerate(faq_data):
        # Combine question and answer to generate a single embedding
        faq_text = f"Question: {faq['question']} Answer: {faq['answer']}"
        faq_embedding = embedding_model.encode(faq_text)  # Convert text to embedding

        faq_embeddings.append(faq_embedding)
        faq_ids.append(str(i))  # Use the index as ID

    # Upsert embeddings into Pinecone with metadata
    index = pc.Index(index_name)  
    vectors = [
        (faq_ids[i], faq_embeddings[i], {"question": faq_data[i]["question"], "answer": faq_data[i]["answer"]})
        for i in range(len(faq_ids))
    ]
    
    index.upsert(vectors=vectors)

    return "FAQ data successfully added to Pinecone."
