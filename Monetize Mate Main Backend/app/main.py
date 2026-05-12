from app.api import monetization_recommendation_endpoints
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api import user_endpoints
from app.api import file_endpoints
from app.api import dashboard_endpoints
from app.api import prediction_endpoints
from app.api import questionnaire_endpoints
from app.api import concierge_endpoints  # ← import here
from app.database.database import create_tables
from fastapi.middleware.cors import CORSMiddleware 

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup: Creating database tables if they don't exist...")
    create_tables()
    print("Database tables checked/created.")
    yield
    print("Application shutdown: Cleaning up resources (if any)...")

app = FastAPI(
    title="Monetize Mate",
    description="Monetize your APIs in a smart way.",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3001",
    "http://localhost:3001/",
    "http://localhost:3002/",
    "http://localhost:3002",
    "http://localhost:3000",   # ← add this too
    "http://localhost:3000/",
    "http://10.6.122.47:3001",
    "http://10.6.122.47:3001/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_endpoints.router, prefix="/api/v1", tags=["Users & Auth"])
app.include_router(file_endpoints.router, prefix="/api/v1", tags=["File Management"])
app.include_router(dashboard_endpoints.router, prefix="/api/v1", tags=["Dashboard Analytics"])
app.include_router(prediction_endpoints.router, prefix="/api/v1", tags=["Prediction Model"])
app.include_router(questionnaire_endpoints.router, prefix="/api/v1", tags=["Questionnaire"])
app.include_router(monetization_recommendation_endpoints.router, prefix="/api/v1", tags=["Monetization Recommendation"])
app.include_router(concierge_endpoints.router, prefix="/api/v1", tags=["AI Concierge"])  # ← add here

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI User Authentication API. Go to /docs for API documentation."}