FROM python:3.11-slim

WORKDIR /app

# Install dependencies system-wide to avoid permission issues when volume mounting
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# We mount volume at runtime for hot-reloading but copy src for prod build compatibility
COPY . .

# Expose port and run uvicorn
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
