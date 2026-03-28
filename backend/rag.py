import os
import sqlean as sqlite3
import sys
sys.modules['sqlite3'] = sqlite3

import chromadb
import PyPDF2

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), 'knowledge_base')

class MedicalRAG:
    def __init__(self):
        db_path = os.path.join(os.path.dirname(__file__), 'chroma_db')
        self.client = chromadb.PersistentClient(path=db_path)
        
        self.collection = self.client.get_or_create_collection(name="medical_protocols")
        self._load_documents()

    def _extract_text_from_pdf(self, file_path):
        text = ""
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
        return text

    def _load_documents(self):
        if not os.path.exists(KNOWLEDGE_BASE_DIR):
            os.makedirs(KNOWLEDGE_BASE_DIR)
            return

        existing_ids = set()
        if self.collection.count() > 0:
            existing_ids = set(self.collection.get()['ids'])

        documents = []
        metadatas = []
        ids = []
        
        for filename in os.listdir(KNOWLEDGE_BASE_DIR):
            if filename in existing_ids:
                continue # Already loaded
                
            file_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)
            content = ""
            if filename.endswith(".txt") or filename.endswith(".md"):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            elif filename.endswith(".pdf"):
                content = self._extract_text_from_pdf(file_path)
                
            if content.strip():
                documents.append(content)
                metadatas.append({"source": filename})
                ids.append(filename)

        if documents:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"RAG: Loaded {len(documents)} new medical documents.")

    def add_document(self, text, source_name):
        """Adds a single document to the collection dynamically."""
        if not text.strip():
            return False
            
        # Optional: Save physically so it persists on deep resets
        file_path = os.path.join(KNOWLEDGE_BASE_DIR, source_name)
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(text)
                
        existing_ids = self.collection.get(ids=[source_name])['ids']
        if not existing_ids:
            self.collection.add(
                documents=[text],
                metadatas=[{"source": source_name}],
                ids=[source_name]
            )
            print(f"RAG: Dynamically added {source_name}.")
            return True
        return False

    def retrieve_context(self, query: str, n_results: int = 2) -> str:
        if self.collection.count() == 0:
            return ""

        results = self.collection.query(
            query_texts=[query],
            n_results=min(n_results, self.collection.count())
        )
        
        if not results['documents'] or not results['documents'][0]:
            return ""
            
        retrieved_docs = results['documents'][0]
        sources = results['metadatas'][0]
        
        context_parts = []
        for doc, source_meta in zip(retrieved_docs, sources):
            source_name = source_meta.get("source", "Unknown")
            context_parts.append(f"--- ДЖЕРЕЛО ({source_name}) ---\n{doc}")
            
        return "\n\n".join(context_parts)
