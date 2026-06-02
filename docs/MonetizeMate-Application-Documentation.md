# MonetizeMate Application Documentation

## 1. Application Overview

MonetizeMate is an API monetization intelligence platform. It helps users upload API/business data, analyze API usage, forecast future behavior, detect operational risks, and receive monetization strategy recommendations such as Subscription, Freemium, Usage-Based Pricing, Hybrid Pricing, and Value-Based Pricing.

The application has two main parts:

- **Frontend:** Next.js application used by customers for registration, login, dashboards, uploads, analytics, prediction workflows, strategy recommendation, and AI concierge chat.
- **Backend:** FastAPI service that handles authentication, file storage, analytics APIs, prediction endpoints, recommendation/questionnaire APIs, and AI concierge support.

## 2. Core User Roles

### End User

An authenticated customer who uses the application to:

- Register and sign in.
- Upload API analytics or prediction files.
- View API performance dashboards.
- Generate monetization strategy recommendations.
- Run prediction and anomaly workflows.
- Ask AI concierge questions about uploaded data.

### System

The backend system:

- Validates users and JWT sessions.
- Stores uploaded CSV/XLSX files.
- Parses uploaded datasets.
- Runs analytics and ML calculations.
- Returns structured data to the frontend.

## 3. High-Level User Journey

1. User lands on the public home page.
2. User creates an account or signs in.
3. User reaches the dashboard.
4. User selects one of the main tools:
   - Monetization Strategy Advisor
   - API Statistics
   - Prediction Models
5. Depending on the selected workflow:
   - User fills business data or questionnaire for strategy recommendations.
   - User uploads API analytics data for charts and statistics.
   - User uploads prediction data for ML-based insights.
6. The system processes data and shows results.
7. User can ask AI Concierge for additional explanation.

## 4. Frontend Features

### 4.1 Public Home Page

The public page introduces MonetizeMate and routes users to authentication or dashboard workflows.

Main actions:

- Navigate to sign up.
- Navigate to sign in.
- Enter the main platform after authentication.

### 4.2 Authentication

Authentication includes:

- User registration.
- User login.
- Session persistence through cookies.
- Logout.
- Protected dashboard routes.

Registration validation includes:

- Required fields.
- Valid email.
- Minimum password length.
- Password confirmation match.
- Terms and privacy agreement check.
- Duplicate email handling.

User-facing messages include:

- Success: `Successfully registered. Please go to sign in.`
- Duplicate user: `User already exists. Please sign in.`
- Failure: `Registration failed. Please try again.`

### 4.3 Dashboard

The dashboard is the authenticated landing area. It contains three primary feature cards:

- **Monetization Strategy Advisor:** Generates pricing and monetization recommendations.
- **API Statistics:** Analyzes usage, errors, clients, endpoints, and distribution.
- **Prediction Models:** Runs forecasting, anomaly detection, and behavior prediction.

The dashboard also includes a welcome section that guides users toward the main workflows.

### 4.4 Monetization Strategy Advisor

The Strategy Advisor offers two paths:

#### Business Data

The user fills a structured business profile form with fields such as:

- Company Name
- Industry
- Region
- Primary Business Goal
- Number of APIs
- API Consumer Type
- Number of Active Consumers
- Current API Access Model
- Perceived Business Value of APIs
- API Usage Growth YoY
- Monthly API Transactions
- Consumer Growth Expectation
- Importance of API Adoption vs Revenue
- Preferred Charging Method
- Need for Premium Support/SLA
- Competitive Landscape
- Revenue Target from APIs Annual
- Strategic Importance of APIs

If the user selects **Other** for industry, an input box appears so the user can enter a custom industry name.

After submission:

1. Business form data is transformed into recommendation scoring inputs.
2. A loading screen displays: `Generating Strategy Recommendations`.
3. The user is routed to the recommendation result page.

#### Questionnaire

The user selects an industry and answers a 10-question MCQ assessment. If the user selects **Other** industry, a custom industry field appears.

The questionnaire uses answer values:

- Strongly Disagree: `-2`
- Disagree: `-1`
- Neutral: `0`
- Agree: `1`
- Strongly Agree: `2`

Each answer contributes to the recommendation profile.

### 4.5 Recommendation Result Page

The result page displays monetization models ranked by match score.

Available strategies:

- Freemium Model
- Subscription Model
- Usage-Based Pricing
- Hybrid Model
- Value-Based Pricing

Each recommendation card includes:

- Strategy name.
- Match percentage.
- Recommended badge for top strategy.
- Description.
- Why it is recommended.
- Timeframe.
- Expected revenue.
- Implementation summary.
- Pros.
- Considerations.
- Start Implementation action.

### 4.6 API Statistics

The API Statistics workflow allows users to upload analytics files and view API usage insights.

Supported file formats:

- CSV
- XLSX

Required analytics columns:

- `timestamp`
- `endpoint`
- `client_id`
- `requests`
- `status_code`

Analytics views include:

- Total requests.
- Successful requests.
- Errors.
- Average response time.
- Daily usage.
- Top APIs by consumption.
- APIs with most errors.
- Daily request volume.
- Hourly call distribution.
- Top consumers.
- Geographic distribution.
- Brand, partner, and team distribution.
- Top 20 clients.
- Top 20 APIs accessed.
- Top 20 failed APIs.

### 4.7 Prediction Models

Prediction workflows use uploaded prediction datasets to run ML-based analysis.

Supported prediction capabilities:

- Future request volume prediction.
- Future CPU and memory prediction.
- Anomaly detection.
- Peak usage identification.
- Error type classification.
- Quota limit exceedance prediction.
- Rate limit prediction.
- User behavior and usage pattern summary.

Required prediction columns vary by model. Common examples include:

- `timestamp`
- `request_count`
- `response_time`
- `cpu_usage`
- `memory_usage`
- `response_code`
- `endpoint`
- `user_id`
- `current_usage`
- `quota_limit`
- `rps`
- `allowed_rps`

### 4.8 AI Concierge

AI Concierge is a chat assistant for API monetization and data interpretation.

It can:

- Explain uploaded API usage data.
- Summarize performance.
- Identify top clients and endpoints.
- Suggest monetization strategies.
- Explain anomalies and errors.
- Answer API monetization questions.

When a file is selected, the backend summarizes the dataset and passes that context into the AI prompt.

## 5. Backend Features

### 5.1 FastAPI Application

The backend is a FastAPI application with routers for:

- Users and authentication.
- File management.
- Dashboard analytics.
- Prediction models.
- Questionnaire.
- Monetization recommendations.
- AI Concierge.

The backend also:

- Creates database tables during startup.
- Ensures the upload directory exists.
- Configures CORS for local and deployed frontend URLs.

### 5.2 Authentication Backend

Authentication endpoints include:

- `POST /api/v1/register`
- `POST /api/v1/token`
- `GET /api/v1/users/me`

Security behavior:

- Passwords are hashed before storage.
- Login returns a JWT access token.
- Protected endpoints use the current authenticated user.
- Users can access only their own uploaded files.

### 5.3 File Management Backend

File endpoints include:

- `POST /api/v1/uploadfile/`
- `GET /api/v1/files/`
- `GET /api/v1/files/{file_id}`
- `DELETE /api/v1/files/`

File safety features:

- Only CSV and XLSX files are allowed.
- Upload size is limited by configuration.
- File paths are checked to prevent path traversal.
- File ownership is validated before access.
- Partial uploads are cleaned up on failure.

### 5.4 Analytics Backend

Analytics endpoints include:

- `GET /api/v1/overview/{file_id}`
- `GET /api/v1/analysis/{file_id}`
- `GET /api/v1/temporal/{file_id}`
- `GET /api/v1/clients/{file_id}`
- `GET /api/v1/distribution/{file_id}`
- `GET /api/v1/rankings/{file_id}`

These endpoints use Pandas to:

- Read CSV/XLSX data.
- Parse timestamps.
- Apply time filters.
- Aggregate request counts.
- Calculate errors and success metrics.
- Group data by endpoint, client, geography, brand, partner, and team.

### 5.5 Prediction Backend

Prediction endpoints include:

- `GET /api/v1/anomalies/{file_id}`
- `GET /api/v1/peak-usage/{file_id}`
- `GET /api/v1/error-type-classification/{file_id}`
- `GET /api/v1/quota-limit-exceedance/{file_id}`
- `GET /api/v1/predict-future-volume/{file_id}`
- `GET /api/v1/rate-limit-prediction/{file_id}`
- `GET /api/v1/predict-resource-usage/{file_id}`
- `GET /api/v1/user-behavior-patterns/{file_id}`

Machine learning models used:

- **Linear Regression:** Forecasts future request volume, CPU usage, and memory usage.
- **Isolation Forest:** Detects anomalous records in operational data.
- **Random Forest Classifier:** Classifies error types.
- **Logistic Regression:** Predicts quota and rate-limit risk.

### 5.6 AI Concierge Backend

Concierge endpoints include:

- `POST /api/v1/concierge/chat`
- `GET /api/v1/concierge/suggestions`

The backend:

- Summarizes selected uploaded data.
- Sends conversation and dataset context to Groq.
- Uses the `llama-3.1-8b-instant` model.
- Returns concise, data-aware responses.

## 6. Recommendation and Match Score Logic

Recommendation scoring is implemented in:

`MonetizeMate-Frontend/app/constants/strategy-helpers.ts`

Each strategy starts with a base score:

```text
score = 50
```

Additional points are added based on:

- Selected industry.
- Business type.
- User base size.
- Revenue target/current revenue.
- Primary goal.
- Customer willingness to pay.
- Competition.
- API complexity.
- Target market.
- Time-to-market requirement.
- Resource level.

Examples:

- Fintech increases Subscription and Usage-Based scores.
- Healthcare increases Value-Based and Subscription scores.
- E-commerce increases Usage-Based and Hybrid scores.
- Social Media increases Freemium and Subscription scores.
- SaaS/B2B Tech increases Subscription and Value-Based scores.
- B2B signals increase Subscription and Value-Based scores.
- B2C signals increase Freemium score.
- Large user base increases Subscription score.
- Smaller user base increases Freemium score.

After scoring:

```text
final_score = min(100, max(0, score))
```

Then strategies are sorted from highest match to lowest match.

The match percentage shown in the UI is the final score.

## 7. Business Data to Recommendation Mapping

Business Data form values are converted into the questionnaire-style scoring object.

Examples:

- `API Consumer Type = B2B` maps to a positive business type score.
- `API Consumer Type = B2C` maps to a Freemium-friendly score.
- `Number of Active Consumers >= 1000` maps to a large user base score.
- Higher annual revenue target maps to a stronger revenue score.
- `Revenue First` maps to a stronger revenue-growth goal score.
- High perceived API value and premium SLA need increase customer willingness score.
- Higher API count or high monthly transactions increase API complexity score.
- High or critical strategic importance increases resource/readiness score.

This lets Business Data and Questionnaire use the same recommendation engine.

## 8. Frontend Technical Architecture

### Framework

- **Next.js:** React framework used for routing, API routes, rendering, and application structure.
- **React:** UI component library.
- **TypeScript:** Static typing for safer frontend development.

### Key Frontend Concepts

- **App Router:** Next.js routing structure inside the `app/` directory.
- **Client Components:** Components using browser state, hooks, or interactions are marked with `'use client'`.
- **API Routes:** Frontend server routes proxy authentication and backend calls.
- **React Query:** Used for authentication mutations and session queries.
- **Tailwind-style utility classes:** Used for UI styling.
- **Lucide React:** Icon library.
- **Radix UI:** Used for accessible UI primitives such as dialogs, selects, radio groups, and progress bars.

### Important Frontend Directories

- `app/(auth)/login`: Login screen.
- `app/(auth)/signup`: Signup screen.
- `app/dashboard`: Main dashboard.
- `app/dashboard/strategy-adviser`: Strategy advisor option screen.
- `app/dashboard/strategy-adviser/business-data`: Business data form.
- `app/dashboard/strategy-adviser/questionnaire`: MCQ questionnaire.
- `app/dashboard/recommendation`: Strategy recommendation results.
- `app/dashboard/upload`: File upload workflow.
- `app/dashboard/analytics`: Analytics dashboard.
- `app/dashboard/prediction`: Prediction model workflows.
- `app/components`: Shared UI and custom components.
- `app/constants`: Routes, scoring constants, and strategy helpers.
- `app/services`: Frontend service wrappers.
- `app/hooks`: Shared React hooks.

## 9. Backend Technical Architecture

### Framework

- **FastAPI:** Python web framework for backend APIs.
- **SQLAlchemy:** ORM for database models and queries.
- **Pydantic:** Schema validation and request/response models.
- **Pandas:** Data loading, transformation, grouping, and aggregation.
- **Scikit-learn:** Machine learning algorithms for prediction features.

### Important Backend Directories

- `app/main.py`: FastAPI app setup and router registration.
- `app/api`: API route modules.
- `app/models`: SQLAlchemy database models.
- `app/schemas`: Pydantic schemas.
- `app/crud`: Database helper functions.
- `app/core`: Security and configuration.
- `app/database`: Database engine/session setup.

## 10. Security and Validation

Implemented security controls:

- JWT-based authentication.
- Password hashing.
- Protected backend endpoints.
- File ownership checks.
- Upload extension validation.
- Upload size validation.
- Safe file path validation.
- Required column validation.
- Authenticated session checks in frontend routes.
- User-friendly negative-case messages.

## 11. Deployment Notes

The project is configured for local and cloud deployment.

Known deployed frontend/backend origins are configured in backend CORS settings, including Azure-hosted URLs.

Typical local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## 12. Technical Glossary

### API

Application Programming Interface. A way for software systems to communicate.

### API Monetization

The process of generating revenue from APIs using pricing models such as subscription, pay-per-use, freemium, tiered pricing, or value-based pricing.

### JWT

JSON Web Token. A compact token used to securely represent an authenticated user session.

### CORS

Cross-Origin Resource Sharing. Browser security mechanism that controls which frontend domains can call the backend.

### ORM

Object Relational Mapper. A tool that maps database tables to programming language objects.

### Pydantic Schema

A Python data validation model used by FastAPI for request and response validation.

### Pandas DataFrame

A tabular data structure used for reading, transforming, and analyzing CSV/XLSX data.

### Linear Regression

A machine learning model used to predict a numeric value based on historical trends.

### Logistic Regression

A classification model used to predict binary outcomes, such as whether a user will exceed a quota.

### Random Forest

An ensemble machine learning model made of multiple decision trees. Used here for error classification.

### Isolation Forest

An anomaly detection algorithm that identifies unusual records in data.

### Feature Engineering

The process of creating model-ready input columns from raw data, such as extracting day, month, hour, or usage ratios.

### Anomaly Detection

Finding unusual records or patterns that differ from normal behavior.

### Rate Limit

A maximum number of API calls allowed in a specific time period.

### Quota

A usage allowance assigned to a customer or API consumer.

### SLA

Service Level Agreement. A support or reliability commitment between provider and customer.

### Freemium

A monetization model where basic access is free and advanced features require payment.

### Subscription Model

A recurring payment model, usually monthly or annually.

### Usage-Based Pricing

A pricing model where customers pay based on API calls, transactions, or consumed units.

### Hybrid Pricing

A pricing model combining fixed subscription fees with variable usage charges.

### Value-Based Pricing

A pricing model based on the business value delivered to the customer.

## 13. Summary

MonetizeMate combines authentication, file-based analytics, machine learning predictions, business-data-driven strategy recommendations, questionnaire-based assessment, and AI-assisted explanations into one API monetization platform. It is designed to help businesses understand API usage, identify operational risks, forecast demand, and choose monetization strategies with clear reasoning and implementation guidance.
