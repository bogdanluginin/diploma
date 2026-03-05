# Stage 1: Build the React frontend
FROM node:20 AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.10-slim

# Create a non-root user (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install
COPY --chown=user backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY --chown=user backend/ ./backend/

# Copy built frontend from Stage 1
COPY --chown=user --from=build /app/frontend/dist ./frontend/dist

# Expose Hugging Face Space default port
EXPOSE 7860

# Command to run the application (run from within the backend directory)
WORKDIR $HOME/app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
