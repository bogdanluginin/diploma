import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "hospital.db")

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, nothing to migrate.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        print("Attempting to add 'logs' column to 'messages' table...")
        c.execute("ALTER TABLE messages ADD COLUMN logs TEXT")
        conn.commit()
        print("Successfully added 'logs' column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("'logs' column already exists.")
        else:
            print(f"Error migrating database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
