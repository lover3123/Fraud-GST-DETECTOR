from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, auth, jobs
import models
from database import engine

# Automatically create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GST Fraud Detection API", version="2.0.0 (Enterprise)")

# Configure CORS
origins = [
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:5173",
    "*" # Adjust in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/api", tags=["Jobs"])
app.include_router(upload.router, prefix="/api", tags=["Uploads"])

@app.get("/")
def read_root():
    return {"message": "Welcome to GST Fraud Detection Enterprise API"}
