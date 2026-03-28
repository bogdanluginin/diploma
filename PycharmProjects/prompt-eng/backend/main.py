# backend/main.py
import sqlite3
import uuid
import os
import logging
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import AgentSystem

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ініціалізація AI системи
try:
    agent_system = AgentSystem()
except Exception as e:
    logger.error(f"Failed to initialize AgentSystem: {e}")
    agent_system = None

# --- Database Path ---
DB_PATH = os.path.join(os.path.dirname(__file__), 'hospital.db')

# --- Database Context Manager ---
@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row  # Access columns by name
        yield conn
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn:
            conn.close()

# --- Налаштування Бази Даних ---
def init_db():
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            # Таблиця сесій (чатів)
            c.execute('''CREATE TABLE IF NOT EXISTS sessions
                         (id TEXT PRIMARY KEY, title TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
            # Таблиця повідомлень
            c.execute('''CREATE TABLE IF NOT EXISTS messages
                         (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, role TEXT, content TEXT, logs TEXT)''')
            conn.commit()
            logger.info("Database initialized successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize database: {e}")

init_db()


# ... (imports remain same)
from datetime import datetime

# ... (previous code)

# --- Pydantic Моделі ---
class ChatRequest(BaseModel):
    session_id: str
    message: str
    response_format: str = "text" # "text" or "table"


# --- API Endpoints ---

@app.post("/api/chats/new")
async def create_chat():
    session_id = str(uuid.uuid4())
    title = "Новий пацієнт"

    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("INSERT INTO sessions (id, title) VALUES (?, ?)", (session_id, title))
        conn.commit()
    
    return {"session_id": session_id, "title": title}


@app.get("/api/chats")
async def get_chats():
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT id, title FROM sessions ORDER BY created_at DESC")
        rows = c.fetchall()
        return [{"id": r["id"], "title": r["title"]} for r in rows]


@app.get("/api/chats/{session_id}/messages")
async def get_messages(session_id: str):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT role, content, logs FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
        rows = c.fetchall()
        
        messages = []
        for r in rows:
            logs = []
            if r["logs"]:
                logs = r["logs"].split("|||")
            messages.append({"role": r["role"], "content": r["content"], "logs": logs})
        return messages

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not agent_system:
        raise HTTPException(status_code=503, detail="AI System is not initialized.")

    with get_db_connection() as conn:
        c = conn.cursor()

        # 1. Зберегти повідомлення користувача
        c.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
                  (req.session_id, 'user', req.message))
        conn.commit()

        # 2. Виклик Агентів
        try:
            # Retrieve history (last 5 messages) to provide context
            c.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 5", (req.session_id,))
            history_rows = c.fetchall()
            # Reverse to chronological order
            history_rows.reverse()
            
            history_str = ""
            for row in history_rows:
                history_str += f"{row['role'].upper()}: {row['content']}\n"

            # Pass response format and history to the agent system
            ai_result = agent_system.run_medical_council(
                req.message, 
                response_format=req.response_format,
                history=history_str
            )
            final_answer = ai_result.get('final_report', "No response generated.")
            logs_list = ai_result.get('logs', [])
            logs_str = "|||".join(logs_list) if logs_list else ""

            # --- Smart Titling Logic ---
            # Check if title is still "New Patient" (default)
            c.execute("SELECT title FROM sessions WHERE id = ?", (req.session_id,))
            current_title = c.fetchone()[0]
            
            if current_title == "Новий пацієнт":
                # Generate smart title using AI
                ai_title = agent_system.generate_title(req.message)
                short_id = req.session_id[:8]
                
                # Format: "AI Title | ID"
                # We store ID in the title string to make it easy for frontend to parse, 
                # but we could also just store it in the ID column (which we do).
                # The user wants ID visible always.
                new_title = f"{ai_title} | {short_id}"
                
                c.execute("UPDATE sessions SET title = ? WHERE id = ?", (new_title, req.session_id))
                conn.commit()

        except Exception as e:
            logger.error(f"AI Error: {e}")
            final_answer = f"System Error: {str(e)}"
            logs_str = ""
            logs_list = []

        # 3. Зберегти відповідь AI
        c.execute("INSERT INTO messages (session_id, role, content, logs) VALUES (?, ?, ?, ?)",
                  (req.session_id, 'assistant', final_answer, logs_str))
        conn.commit()

        return {"response": final_answer, "logs": logs_list}


class UpdateChatTitleRequest(BaseModel):
    title: str

@app.put("/api/chats/{session_id}/title")
async def update_chat_title(session_id: str, req: UpdateChatTitleRequest):
    with get_db_connection() as conn:
        c = conn.cursor()
        # Ensure we keep the ID suffix if it exists, or just update the name part?
        # The user likely wants to rename the "Name - Condition" part but keep the ID.
        # However, the frontend sends the *full* title usually.
        # Let's assume the frontend handles the ID appending or we just update what is sent.
        # Given the previous logic `new_title = f"{ai_title} | {short_id}"`, 
        # if the user renames, they probably just want to change the text part.
        # But to be flexible, let's just update the whole title column with what is sent.
        # The frontend can ensure the ID is preserved if needed, or we can enforce it here.
        
        # Let's enforce ID preservation to be safe, or just trust the frontend?
        # Trusting the frontend is easier for now.
        
        c.execute("UPDATE sessions SET title = ? WHERE id = ?", (req.title, session_id))
        conn.commit()
    return {"status": "success", "title": req.title}

@app.delete("/api/chats/{session_id}")
async def delete_chat(session_id: str):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        c.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.commit()
    return {"status": "success", "message": "Chat deleted"}