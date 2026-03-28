# agents.py
import os
import google.generativeai as genai
from dotenv import load_dotenv
from prompts import SYSTEM_PROMPTS

# Завантаження ключа
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class AgentSystem:
    def __init__(self):
        # Використовуємо нову модель, доступну вам
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _call_llm(self, role_prompt, user_input, context="", history=""):
        """Допоміжна функція запиту до LLM"""
        combined_prompt = f"""
        SYSTEM INSTRUCTIONS (ROLE):
        {role_prompt}

        PATIENT HISTORY (Previous Chat):
        {history}

        INTERNAL CONTEXT (Previous Doctors in this turn):
        {context}

        CURRENT PATIENT INPUT:
        {user_input}
        """
        try:
            response = self.model.generate_content(combined_prompt)
            return response.text
        except Exception as e:
            return f"Error generating content: {e}"

    def run_medical_council(self, patient_symptoms, response_format="text", history=""):
        logs = []

        # --- КРОК 1: Сімейний лікар (Triage) ---
        doc_response = self._call_llm(SYSTEM_PROMPTS['family_doctor'], patient_symptoms, history=history)
        logs.append(f"👨‍⚕️ Family Doctor: {doc_response}")

        # --- КРОК 2: Маршрутизація ---
        specialist_response = ""

        if "REFER: PHTHISIATRICIAN" in doc_response:
            # Направляємо до Фтизіатра
            spec_prompt = SYSTEM_PROMPTS['phthisiatrician']
            specialist_response = self._call_llm(spec_prompt, patient_symptoms, context=doc_response, history=history)
            logs.append(f"🩻 Phthisiatrician: {specialist_response}")
        else:
            # Направляємо до Інфекціоніста
            spec_prompt = SYSTEM_PROMPTS['infectious_specialist']
            specialist_response = self._call_llm(spec_prompt, patient_symptoms, context=doc_response, history=history)
            logs.append(f"🦠 Infectious Specialist: {specialist_response}")

        # --- КРОК 3: Координатор (Фінальна відповідь) ---
        coord_context = f"Family Doc: {doc_response}\nSpecialist Report: {specialist_response}"
        
        # Вибір промпта на основі формату
        if response_format == "table":
            coord_prompt = SYSTEM_PROMPTS['coordinator'] # Це табличний промпт
        else:
            coord_prompt = SYSTEM_PROMPTS.get('coordinator_text', SYSTEM_PROMPTS['coordinator']) # Текстовий або дефолтний

        final_report = self._call_llm(coord_prompt, patient_symptoms, context=coord_context, history=history)

        return {
            "final_report": final_report,
            "logs": logs
        }

    def generate_title(self, user_message):
        """Generates a short, concise title for the chat based on the first message."""
        prompt = f"""
        Analyze the following patient data/symptoms and generate a VERY SHORT title (max 4-5 words).
        If a patient name is present, use it. Format: "Name - Condition" or just "Condition" if no name.
        Do not use markdown or special characters. Keep it clinical and concise.
        
        Input: {user_message}
        Title:
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except:
            return "Clinical Case"