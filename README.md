# MedCouncil AI 🏥

**Мультиагентна медична система попередньої діагностики.**  
*(Дипломний проєкт, 2026)*

MedCouncil AI — це розумна платформа, що симулює роботу медичного консиліуму. Завдяки архітектурі RAG (Retrieval-Augmented Generation), система аналізує скарги пацієнта та формує висновки, спираючись виключно на офіційні медичні протоколи ВООЗ та МОЗ.

---

## ✨ Особливості

- 🤖 **ШІ-Консиліум:** Маршрутизація скарг між кількома ШІ-агентами (Сімейний лікар → Вузький спеціаліст → Координатор).
- 📚 **База Знань (RAG):** Автоматичний парсинг PDF-протоколів та аналізів "на льоту" через ChromaDB.
- 📋 **Смарт-профіль:** Динамічне фонове створення медичної картки пацієнта під час діалогу.
- 🎨 **Сучасний UI:** Мінімалістичний Glassmorphism-інтерфейс з підтримкою темної теми.

## 🛠 Технології

- **Backend:** Python 3.9+, FastAPI, ChromaDB, SQLite, Google Gemini API.
- **Frontend:** React 18, Vite, TailwindCSS.

---

## 🚀 Швидкий старт

1. **Клонування:**
   ```bash
   git clone https://github.com/bogdanluginin/diploma_bogdanluginin_tb.git
   cd diploma_bogdanluginin_tb
   ```

2. **Запуск Backend (`/backend`):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt chromadb PyPDF2 python-multipart sqlean.py
   
   # Створіть файл .env і додайте: GEMINI_API_KEY=ваш_ключ
   uvicorn main:app --reload --port 8000
   ```

3. **Запуск Frontend (`/frontend`):**
   ```bash
   npm install
   npm run dev
   ```

Відкрийте `http://localhost:5173` у браузері.
