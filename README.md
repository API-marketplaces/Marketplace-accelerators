# MonetizeMate - API Monetization Platform

A comprehensive platform for monetizing APIs intelligently with AI-powered recommendations, analytics, and strategic insights. MonetizeMate helps API providers analyze their API usage, predict demand, optimize pricing strategies, and implement monetization recommendations.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [How to Run Locally](#how-to-run-locally)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Common Configuration Terms](#common-configuration-terms)

## 🎯 Project Overview

**MonetizeMate** is a full-stack web application designed to help API providers:

- **Analyze API Usage**: Track and visualize API consumption patterns with detailed analytics
- **Predict Demand**: Use machine learning models to forecast future API demand
- **Optimize Monetization**: Get AI-powered recommendations for pricing strategies and implementation
- **Strategic Advisory**: Access an AI concierge for personalized monetization guidance
- **Manage Files & Data**: Upload and parse API metrics data (CSV, Excel formats)
- **User Management**: Secure authentication and user profile management
- **Questionnaire System**: Gather business requirements through structured questionnaires

**Key Features:**
- Interactive dashboards with real-time analytics
- ML-powered demand prediction
- Anomaly detection in API metrics
- Monetization strategy recommendations
- AI-powered concierge chatbot
- File upload and data parsing
- Secure JWT-based authentication

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 15
- **Authentication**: JWT with passlib & python-jose
- **ORM**: SQLAlchemy
- **ML Libraries**: scikit-learn, pandas, numpy
- **Data Processing**: openpyxl (Excel), pandas (CSV)
- **Server**: Uvicorn

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query
- **Authentication**: JWT with jsonwebtoken
- **UI Components**: Radix UI
- **Icons**: Lucide React

### Deployment
- **Cloud Platform**: Microsoft Azure
- **Static Web Apps**: Azure Static Web Apps
- **Container**: Docker & Docker Compose (for local development)

## 📁 Project Structure

```
MonetizeMate/
├── Monetize Mate Main Backend/          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                      # FastAPI application entry point
│   │   ├── api/                         # API route handlers
│   │   │   ├── user_endpoints.py        # Authentication & user management
│   │   │   ├── file_endpoints.py        # File upload & management
│   │   │   ├── dashboard_endpoints.py   # Analytics & dashboard data
│   │   │   ├── prediction_endpoints.py  # ML prediction endpoints
│   │   │   ├── questionnaire_endpoints.py
│   │   │   ├── monetization_recommendation_endpoints.py
│   │   │   └── concierge_endpoints.py   # AI concierge endpoints
│   │   ├── core/
│   │   │   ├── config.py                # Configuration settings
│   │   │   └── security.py              # JWT & authentication logic
│   │   ├── crud/                        # Database operations
│   │   ├── database/                    # Database connection & initialization
│   │   ├── models/                      # SQLAlchemy database models
│   │   └── schemas/                     # Pydantic request/response schemas
│   ├── docker-compose.yml               # PostgreSQL Docker setup
│   └── requirements.txt                 # Python dependencies
│
├── MonetizeMate-Frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Home page
│   │   ├── (auth)/                      # Auth routes (login, signup)
│   │   ├── (public)/                    # Public routes
│   │   ├── api/                         # Next.js API routes
│   │   ├── dashboard/                   # Dashboard components
│   │   │   ├── analytics/               # Analytics dashboard
│   │   │   ├── api-stats/               # API statistics
│   │   │   ├── prediction/              # Prediction results
│   │   │   ├── recommendation/          # Recommendations view
│   │   │   └── concierge/               # AI concierge chat
│   │   ├── components/                  # Reusable React components
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── services/                    # API service clients
│   │   ├── types/                       # TypeScript type definitions
│   │   ├── constants/                   # Application constants
│   │   └── utils/                       # Utility functions
│   ├── public/                          # Static assets
│   ├── package.json                     # Node dependencies
│   └── staticwebapp.config.json        # Azure Static Web Apps configuration
│
└── README.md                            # This file
```

## 📦 Prerequisites

Before setting up the project, ensure you have the following installed:

### Required
- **Node.js** 18.x or higher
- **Python** 3.9 or higher
- **Docker** and **Docker Compose** (for local PostgreSQL)
- **Git**

### Optional but Recommended
- **VS Code** with Python and TypeScript extensions
- **Postman** for API testing
- **pgAdmin** for database management

### Verify Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version

# Check Docker
docker --version
docker-compose --version
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd /path/to/workspace
git clone <repository-url>
cd MonetizeMate
```

### 2. Setup Backend

```bash
cd "Monetize Mate Main Backend"

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Setup Frontend

```bash
cd ../MonetizeMate-Frontend

# Install Node dependencies
npm install
# or
yarn install
```

### 4. Setup Database

```bash
# From the backend directory, start PostgreSQL using Docker Compose
cd "../Monetize Mate Main Backend"
docker-compose up -d

# Verify the database is running
# The database will be available at localhost:5432
# Default credentials from docker-compose.yml:
# - User: postgres
# - Password: Password@123
# - Database: monetize_mate
```

## ⚙️ Configuration & Environment Variables

### Backend Environment Variables

Create a `.env` file in the `Monetize Mate Main Backend` directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:Password@123@localhost:5432/monetize_mate

# JWT Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Upload
UPLOAD_DIRECTORY=uploads
MODEL_STORAGE_DIR=trained_ml_models

# Groq API (for AI features)
GROQ_API_KEY=your-groq-api-key-here

# CORS Origins
# Frontend URL for local development or production
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create a `.env.local` file in the `MonetizeMate-Frontend` directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token

# Application Configuration
NEXT_PUBLIC_APP_NAME=MonetizeMate
```

### Configuration File Reference

#### Backend Configuration (`app/core/config.py`)

| Setting | Default | Description | Production Note |
|---------|---------|-------------|------------------|
| `SECRET_KEY` | `your-super-secret-key` | JWT signing key | **MUST change for production** |
| `ALGORITHM` | `HS256` | JWT algorithm | HS256 or RS256 for production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT token expiry (24 hours) | Consider reducing to 60 minutes |
| `DATABASE_URL` | PostgreSQL URL | Database connection string | Use Azure Database for PostgreSQL in production |
| `UPLOAD_DIRECTORY` | `uploads` | Directory for file uploads | Use Azure Blob Storage in production |
| `MODEL_STORAGE_DIR` | `trained_ml_models` | ML models storage | Use persistent storage |
| `GROQ_API_KEY` | Empty string | Groq API key for AI | Required for concierge feature |

#### Frontend Configuration (`next.config.ts`)

| Setting | Purpose |
|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `basePath` | Custom base path if deploying to subdirectory |
| `i18n.locales` | Supported locales for internationalization |

#### Azure Static Web Apps Configuration (`staticwebapp.config.json`)

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  }
}
```

This configuration ensures that all navigation requests are rewritten to `/index.html` for client-side routing to work correctly.

## 🏃 How to Run Locally

### Option 1: Run Everything Together

```bash
# Terminal 1: Start PostgreSQL
cd "Monetize Mate Main Backend"
docker-compose up -d

# Terminal 2: Start Backend
cd "Monetize Mate Main Backend"
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start Frontend
cd MonetizeMate-Frontend
npm run dev
```

### Option 2: Run Individually

**Backend Only:**
```bash
cd "Monetize Mate Main Backend"
docker-compose up -d                    # Start database
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend API will be available at: `http://localhost:8000`
API documentation (Swagger): `http://localhost:8000/docs`

**Frontend Only:**
```bash
cd MonetizeMate-Frontend
npm run dev
```

The frontend will be available at: `http://localhost:3000`

### Available npm Scripts (Frontend)

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Verify Installation

1. **Backend is running:**
   - Open `http://localhost:8000`
   - Should see: `{"message": "Welcome to the FastAPI User Authentication API. Go to /docs for API documentation."}`

2. **Frontend is running:**
   - Open `http://localhost:3000`
   - Should see the login/signup page

3. **Database is running:**
   ```bash
   psql postgresql://postgres:Password@123@localhost:5432/monetize_mate
   ```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main API Endpoints

All endpoints are prefixed with `/api/v1`

#### Authentication & Users
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

#### File Management
- `POST /files/upload` - Upload API metrics file (CSV/Excel)
- `GET /files` - List uploaded files
- `DELETE /files/{file_id}` - Delete file

#### Dashboard Analytics
- `GET /dashboard/overview` - Get analytics overview
- `GET /dashboard/temporal` - Get temporal analysis
- `GET /dashboard/clients` - Get client analysis
- `GET /dashboard/rankings` - Get rankings analysis
- `GET /dashboard/distributions` - Get distribution analysis

#### Predictions
- `POST /predictions/predict` - Generate demand predictions
- `GET /predictions/{prediction_id}` - Get prediction details

#### Questionnaire
- `POST /questionnaire/submit` - Submit questionnaire answers
- `GET /questionnaire/questions` - Get questionnaire

#### Monetization Recommendations
- `POST /recommendations/generate` - Generate monetization recommendations
- `GET /recommendations` - Get recommendations list

#### AI Concierge
- `POST /concierge/chat` - Send message to AI concierge

## 🚀 Deployment

### Azure Static Web Apps Deployment

**MonetizeMate** is configured for deployment on **Microsoft Azure Static Web Apps**, which provides:

- ✅ Automatic builds from GitHub/GitLab
- ✅ Free SSL/TLS certificates
- ✅ Global CDN
- ✅ Serverless backend APIs
- ✅ Built-in staging environments

#### Prerequisites for Deployment

1. **Azure Account**: Create a free account at [azure.microsoft.com](https://azure.microsoft.com)
2. **GitHub/GitLab Account**: With your repository pushed
3. **Azure Database for PostgreSQL**: Create for production database
4. **Azure Storage Account**: For file uploads
5. **Azure Key Vault**: For managing secrets

#### Deployment Steps

**Step 1: Prepare Azure Resources**

```bash
# Create resource group
az group create --name monetize-mate-rg --location eastus

# Create PostgreSQL database
az postgres flexible-server create \
  --resource-group monetize-mate-rg \
  --name monetize-mate-db \
  --admin-user postgres \
  --admin-password <strong-password>

# Create storage account
az storage account create \
  --resource-group monetize-mate-rg \
  --name monetizematestg \
  --sku Standard_LRS
```

**Step 2: Configure Environment Variables in Azure**

In your Azure Static Web App settings, add these application settings:

```
DATABASE_URL = postgresql://postgres:<password>@monetize-mate-db.postgres.database.azure.com:5432/monetize_mate?sslmode=require
SECRET_KEY = <generate-strong-key>
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
GROQ_API_KEY = <your-groq-api-key>
UPLOAD_DIRECTORY = /tmp/uploads
```

**Step 3: Create Static Web App**

```bash
# Using Azure Portal or CLI
az staticwebapp create \
  --name monetize-mate \
  --resource-group monetize-mate-rg \
  --source <github-repo-url> \
  --branch main \
  --location eastus
```

**Step 4: Configure GitHub Actions Workflow**

Azure automatically creates a GitHub Actions workflow. Update `.github/workflows/azure-static-web-apps.yml` to:

1. Build the Next.js frontend
2. Deploy backend to Azure Functions or App Service
3. Configure API routing

**Step 5: Deploy**

```bash
# Push to main branch - automatic deployment triggers
git push origin main
```

#### Azure Configuration Details

**staticwebapp.config.json Configuration:**

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'"
  },
  "routes": [
    {
      "route": "/api/*",
      "methods": ["POST", "GET", "PUT", "DELETE"],
      "allowedRoles": ["authenticated", "anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

#### Post-Deployment Checklist

- ✅ Test all API endpoints
- ✅ Verify database connectivity
- ✅ Check file upload to blob storage
- ✅ Enable HTTPS everywhere
- ✅ Configure custom domain
- ✅ Set up monitoring and alerts
- ✅ Review security headers
- ✅ Test JWT authentication flow
- ✅ Verify CORS configuration
- ✅ Setup automated backups

#### Common Deployment Issues

| Issue | Solution |
|-------|----------|
| 404 on refresh | Ensure `staticwebapp.config.json` is correctly configured |
| CORS errors | Add frontend URL to `origins` in backend `main.py` |
| Database connection fails | Check firewall rules and connection string |
| File uploads fail | Verify Azure Storage account access and permissions |
| API calls timeout | Check backend resource limits and scale up if needed |

#### Monitoring & Logging

```bash
# View application logs
az staticwebapp logs list --name monetize-mate --resource-group monetize-mate-rg

# View database logs
az postgres flexible-server server-logs list \
  --resource-group monetize-mate-rg \
  --server-name monetize-mate-db
```

## 📖 Common Configuration Terms

### Authentication & Security

- **JWT (JSON Web Token)**: Stateless authentication token containing user information
- **Secret Key**: Cryptographic key used to sign and verify JWT tokens
- **Algorithm**: Cryptographic method for token signing (HS256 = HMAC SHA-256)
- **Token Expiry**: Duration JWT token remains valid after issuance
- **Passlib**: Password hashing library using bcrypt
- **CORS (Cross-Origin Resource Sharing)**: Security mechanism controlling cross-domain requests

### Database

- **PostgreSQL**: Open-source relational database management system
- **SQLAlchemy**: Python ORM (Object-Relational Mapping) for database interactions
- **Database URL**: Connection string format: `postgresql://user:password@host:port/database`
- **Connection Pool**: Manages reusable database connections for performance
- **Migration**: Schema version control and updates

### File Management

- **Upload Directory**: Server location where user-uploaded files are stored
- **File Parsing**: Converting file formats (CSV, Excel) into usable data structures
- **Multipart Form Data**: HTTP format for uploading files with additional metadata

### Machine Learning

- **scikit-learn**: Python library for ML algorithms
- **Model Training**: Process of teaching ML model patterns from data
- **Model Serialization**: Saving trained models for later use (joblib format)
- **Prediction**: Using trained model to forecast future values
- **Features**: Input variables used by ML model
- **Target Variable**: Output value being predicted

### API & Performance

- **Rate Limiting**: Restricting number of requests in time period
- **Caching**: Storing frequently accessed data for faster retrieval
- **Pagination**: Breaking large result sets into manageable chunks
- **Query Optimization**: Improving database query performance
- **API Versioning**: Maintaining compatibility while adding new features (/api/v1)

### Frontend Technologies

- **Next.js**: React framework for production applications
- **TypeScript**: Superset of JavaScript with static typing
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library built on Radix UI
- **React Query**: Data synchronization library for API calls
- **Client-side Routing**: Navigation without full page reload
- **Server-Side Rendering (SSR)**: Rendering React on server for performance

### Deployment

- **Azure Static Web Apps**: Serverless platform for hosting static and dynamic applications
- **Container**: Docker package containing application and dependencies
- **Environment Variables**: Configuration values loaded at runtime
- **CI/CD Pipeline**: Automated build, test, and deployment process
- **Staging Environment**: Testing environment before production release
- **CDN (Content Delivery Network)**: Distributes content globally for faster access

### Development

- **Hot Reload**: Automatically reloading application on code changes
- **Linting**: Checking code for style and error compliance
- **Type Checking**: Validating variable types at development time
- **Debug Mode**: Running application with additional logging for troubleshooting
- **Development Server**: Local server for testing during development

## 📞 Support & Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port 8000 is in use
lsof -i :8000
# Kill the process if needed
kill -9 <PID>
```

**Database connection error**
```bash
# Verify PostgreSQL is running
docker-compose ps
# Check database credentials
docker-compose logs db
```

**Frontend won't connect to backend**
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend `main.py`
- Ensure backend is running on port 8000

**Port already in use**
```bash
# Backend (port 8000)
lsof -i :8000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Frontend (port 3000)
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Performance Optimization

- Enable query pagination for large datasets
- Use React Query for client-side caching
- Implement database indexing for frequently queried fields
- Use CDN for static assets
- Enable gzip compression
- Implement lazy loading for components

## 📄 License

This project is part of the Marketplace Accelerators initiative.

## 👥 Contributing

For contribution guidelines and development workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md) (if available).

---

**Last Updated**: May 2026
**Version**: 1.0.0
