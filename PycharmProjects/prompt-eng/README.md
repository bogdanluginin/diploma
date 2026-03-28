# MedCouncil AI - Clinical Decision Support System

A sophisticated AI-powered medical consultation platform featuring multi-agent collaboration, context-aware conversations, and a beautiful light/dark theme interface.

## Features

✨ **Multi-Agent Medical Council**
- Family Doctor (Triage)
- Phthisiatrician (TB Specialist)
- Infectious Disease Specialist
- AI Coordinator for final diagnosis

🎨 **Modern UI/UX**
- Light/Dark theme toggle
- Apple-inspired design with glassmorphism
- Medical color palette (Clinical Teal & Slate)
- Smooth animations and transitions

💬 **Smart Chat Features**
- Context-aware conversations (AI remembers chat history)
- AI-powered smart chat titling
- Inline chat renaming
- Search functionality
- Response format toggle (Text/Table)

🔒 **Data Persistence**
- SQLite database for chat history
- Session management
- Message logging

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Google Gemini 2.5 Flash** - AI model
- **SQLite** - Database
- **Uvicorn** - ASGI server

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering

## Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bogdanluginin/ppfinal.git
cd ppfinal
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn google-generativeai python-dotenv

# Create .env file with your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Create a New Consultation**
   - Click "New Consultation" button in the sidebar
   - A new chat session will be created

2. **Enter Patient Data**
   - Type symptoms, medical history, or patient information
   - Choose response format (Text or Table)
   - Press Enter or click Send

3. **View AI Analysis**
   - See clinical reasoning from multiple specialists
   - Get final diagnosis and treatment recommendations
   - View in your preferred format

4. **Manage Chats**
   - Search chats by name, condition, or ID
   - Rename chats by clicking the pencil icon
   - Delete chats with the trash icon
   - Toggle between light/dark theme

## Project Structure

```
ppfinal/
├── backend/
│   ├── main.py           # FastAPI application & API endpoints
│   ├── agents.py         # Multi-agent AI system
│   ├── prompts.py        # System prompts for AI agents
│   ├── hospital.db       # SQLite database (auto-created)
│   └── .env             # Environment variables (create this)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component
│   │   ├── main.jsx     # Entry point
│   │   └── index.css    # Global styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## API Endpoints

### Chat Management
- `POST /api/chats/new` - Create new chat session
- `GET /api/chats` - Get all chat sessions
- `GET /api/chats/{session_id}/messages` - Get messages for a session
- `DELETE /api/chats/{session_id}` - Delete a chat session
- `PUT /api/chats/{session_id}/title` - Update chat title

### Messaging
- `POST /api/chat` - Send message and get AI response
  ```json
  {
    "session_id": "uuid",
    "message": "Patient symptoms...",
    "response_format": "text" // or "table"
  }
  ```

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

## Troubleshooting

### Backend Issues

**Database errors:**
```bash
# Delete and recreate database
rm backend/hospital.db
# Restart backend server
```

**Import errors:**
```bash
# Reinstall dependencies
pip install --upgrade -r backend/requirements.txt
```

### Frontend Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Change port in vite.config.js or kill process
lsof -ti:5173 | xargs kill -9
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational purposes.

## Acknowledgments

- Google Gemini AI for powering the medical agents
- Tailwind CSS for the beautiful UI framework
- Lucide for the icon set

## Contact

For questions or support, please open an issue on GitHub.

---

**⚠️ Disclaimer:** This is an AI-powered educational tool and should NOT be used for actual medical diagnosis or treatment. Always consult qualified healthcare professionals for medical advice.
