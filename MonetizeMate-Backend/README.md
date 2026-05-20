# MonetizeMate Backend

FastAPI-based REST API backend for the MonetizeMate platform. This service provides all business logic, database management, and ML prediction capabilities for the monetization platform.

## 📋 Quick Start

```bash
# 1. Setup virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start PostgreSQL database
docker-compose up -d

# 4. Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

## 🏗️ Project Structure

```
app/
├── main.py                              # FastAPI app initialization & router setup
├── core/
│   ├── config.py                        # Configuration settings (DATABASE_URL, SECRET_KEY, etc.)
│   └── security.py                      # JWT token creation & validation
├── api/
│   ├── user_endpoints.py                # Authentication, login, user profile
│   ├── file_endpoints.py                # File upload, parsing, management
│   ├── dashboard_endpoints.py           # Analytics data endpoints
│   ├── prediction_endpoints.py          # ML predictions for demand forecasting
│   ├── questionnaire_endpoints.py       # Questionnaire management
│   ├── monetization_recommendation_endpoints.py  # Monetization recommendations
│   └── concierge_endpoints.py           # AI concierge chat endpoints
├── database/
│   └── database.py                      # SQLAlchemy setup & table creation
├── models/
│   ├── user.py                          # User database model
│   ├── file.py                          # File metadata model
│   ├── questionnaire.py                 # Questionnaire & answers model
│   └── audience.py                      # Audience/client model
├── schemas/
│   ├── user.py                          # Pydantic schemas for user requests/responses
│   ├── file.py                          # File schemas
│   ├── questionnaire.py                 # Questionnaire schemas
│   └── audience.py                      # Audience schemas
└── crud/
    ├── users.py                         # User database operations
    ├── files.py                         # File database operations
    ├── audiences.py                     # Audience database operations
    └── questionnaire.py                 # Questionnaire database operations
```

## ⚙️ Configuration

### Environment Variables (.env)

Create a `.env` file in the backend directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:Password@123@localhost:5432/monetize_mate

# JWT Security
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Uploads
UPLOAD_DIRECTORY=uploads
MAX_UPLOAD_SIZE_MB=250
MODEL_STORAGE_DIR=trained_ml_models

# External APIs
GROQ_API_KEY=your-groq-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Core Configuration (app/core/config.py)

| Variable | Purpose | Default | Production |
|----------|---------|---------|------------|
| `SECRET_KEY` | JWT signing key | `your-super-secret-key` | **Change to strong 32+ char key** |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...localhost...` | Use Azure Database for PostgreSQL |
| `GROQ_API_KEY` | AI API for concierge | Empty | Required for concierge feature |
| `UPLOAD_DIRECTORY` | File storage path | `uploads` | Use Azure Blob Storage |
| `MAX_UPLOAD_SIZE_MB` | Maximum upload size in MB | `250` | Tune for your hosting limits |
| `MODEL_STORAGE_DIR` | ML models storage | `trained_ml_models` | Use persistent storage |

## 📚 API Endpoints

All endpoints use `/api/v1` prefix.

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/{user_id}` - Get specific user

### Files
- `POST /files/upload` - Upload CSV or Excel file
- `GET /files` - List user's files
- `GET /files/{file_id}` - Get file details
- `DELETE /files/{file_id}` - Delete file

### Dashboard
- `GET /dashboard/overview` - Analytics overview (KPIs, summaries)
- `GET /dashboard/temporal` - Time-series analysis
- `GET /dashboard/clients` - Client analysis
- `GET /dashboard/rankings` - Top clients/APIs ranking
- `GET /dashboard/distributions` - Statistical distributions
- `GET /dashboard/anomalies` - Anomaly detection results

### Predictions
- `POST /predictions/predict` - Generate demand predictions
- `GET /predictions` - List predictions
- `GET /predictions/{prediction_id}` - Get prediction details

### Questionnaire
- `GET /questionnaire/questions` - Get questionnaire
- `POST /questionnaire/submit` - Submit answers
- `GET /questionnaire/results/{user_id}` - Get results

### Monetization Recommendations
- `POST /recommendations/generate` - Generate recommendations
- `GET /recommendations` - List recommendations
- `GET /recommendations/{rec_id}` - Get recommendation details

### AI Concierge
- `POST /concierge/chat` - Send message to AI assistant
- `GET /concierge/history` - Get conversation history

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  hashed_password VARCHAR NOT NULL,
  full_name VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Files Table
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_type VARCHAR,
  size_bytes INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

Similar schemas exist for: `questionnaires`, `audiences`, `predictions`, `recommendations`

## 🔐 Authentication & Security

### JWT Flow
1. User submits credentials
2. Server validates and creates JWT token
3. Client stores token in localStorage/sessionStorage
4. Client sends token in `Authorization: Bearer <token>` header
5. Server validates token on each request

### Password Security
- Passwords hashed with bcrypt (via passlib)
- Never stored in plain text
- Hash verification on login

### CORS Configuration
Backend allows requests from:
- `http://localhost:3000` (development)
- `http://localhost:3001` (testing)
- `https://salmon-smoke-01c830800.7.azurestaticapps.net` (production)

Update `origins` in `app/main.py` for your deployment URL.

## 🧠 Machine Learning Features

### Prediction Model
- Uses scikit-learn for ML algorithms
- Trained on historical API metrics
- Predicts future demand/usage patterns
- Models stored in `trained_ml_models/` directory

### Anomaly Detection
- Identifies unusual patterns in API metrics
- Detects sudden spikes or drops
- Configured in dashboard endpoints

## 🐘 PostgreSQL Database

### Connect to Database
```bash
# Using psql
psql postgresql://postgres:Password@123@localhost:5432/monetize_mate

# View all tables
\dt

# Exit
\q
```

### Common Queries
```sql
-- View all users
SELECT id, email, full_name FROM users;

-- View recent uploads
SELECT filename, uploaded_at FROM files ORDER BY uploaded_at DESC LIMIT 10;

-- Count API predictions
SELECT COUNT(*) FROM predictions;
```

### Database Maintenance
```bash
# Backup database
pg_dump postgresql://postgres:Password@123@localhost:5432/monetize_mate > backup.sql

# Restore database
psql postgresql://postgres:Password@123@localhost:5432/monetize_mate < backup.sql
```

## 📊 Dependency Management

### Python Dependencies (requirements.txt)

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | ORM for database |
| `pydantic` | Data validation |
| `passlib[bcrypt]` | Password hashing |
| `python-jose[cryptography]` | JWT handling |
| `psycopg2` | PostgreSQL driver |
| `pandas` | Data processing |
| `openpyxl` | Excel file handling |
| `scikit-learn` | Machine learning |
| `joblib` | Model serialization |

### Install Dependencies
```bash
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn sqlalchemy pydantic
```

## 🚀 Running the Server

### Development Mode (with hot reload)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Environment Variables
```bash
# Load from .env and run
export $(cat .env | xargs)
uvicorn app.main:app --reload
```

## 🧪 Testing API

### Using curl
```bash
# Health check
curl http://localhost:8000

# View API docs
curl http://localhost:8000/docs

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Using Postman
1. Import the API documentation from `http://localhost:8000/docs`
2. Set base URL to `http://localhost:8000`
3. Create environment variables for `token`, `user_id`, etc.
4. Test each endpoint

## 🐳 Docker & Docker Compose

### Start PostgreSQL
```bash
docker-compose up -d
```

### Stop PostgreSQL
```bash
docker-compose down
```

### View PostgreSQL Logs
```bash
docker-compose logs db
```

### Access Database Container
```bash
docker exec -it monetize_mate_main_backend-db-1 psql -U postgres -d monetize_mate
```

## 🚢 Deployment

### Azure App Service
```bash
# Deploy using Azure CLI
az webapp up --runtime PYTHON:3.9 --name monetize-mate-api
```

### Azure Functions
- Requires wrapping FastAPI with Azure Functions adapter
- Better for serverless, event-driven architecture

### Docker to Azure Container Registry
```bash
# Build image
docker build -t monetize-mate-api .

# Push to Azure
az acr build --registry myregistry --image monetize-mate-api:latest .

# Deploy from registry
az container create --resource-group mygroup \
  --name monetize-mate-api \
  --image myregistry.azurecr.io/monetize-mate-api:latest
```

## 📈 Performance Optimization

- Use connection pooling for database
- Implement caching for frequently accessed data
- Add database indexing on common filter fields
- Use pagination for large result sets
- Enable gzip compression in Uvicorn

## 🐛 Debugging

### Enable Debug Logging
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Running Processes
```bash
# View all Python processes
ps aux | grep python

# View specific port
lsof -i :8000
```

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Activate venv and run `pip install -r requirements.txt` |
| `Port 8000 already in use` | Kill process: `lsof -i :8000 \| grep -v COMMAND \| awk '{print $2}' \| xargs kill -9` |
| `Database connection refused` | Ensure PostgreSQL is running: `docker-compose ps` |
| `JWT token expired` | Login again to get new token |
| `CORS error on frontend` | Add frontend URL to `origins` in `main.py` |
| `File upload fails` | Check `uploads/` directory permissions: `chmod 755 uploads/` |

---

For the complete project setup and deployment, see the main [README.md](../README.md) in the project root.

**Version**: 1.0.0
**Last Updated**: May 2026
