# MonetizeMate Three Feature Results Technical Document

This document explains how MonetizeMate shows results for the three dashboard features:

- API Analytics
- Prediction Models
- Monetization Strategy Advisor

It also explains how the FastAPI backend receives files, validates them, processes data, and returns result data to the frontend.

## 1. High-Level Architecture

MonetizeMate uses a Next.js frontend and a FastAPI backend.

The normal result flow is:

1. User logs in.
2. User uploads a CSV or Excel file from the dashboard upload page.
3. The frontend sends the file to a Next.js API route.
4. The Next.js API route forwards the request to FastAPI with the user's JWT token.
5. FastAPI validates the uploaded file, stores it on disk, and saves file metadata in the database.
6. The frontend navigates to the correct result page based on `decisionMetrics`.
7. The result page fetches or prepares feature-specific result data.
8. The result page renders charts, cards, tables, recommendations, and explanations.

The three `decisionMetrics` values are:

| Feature | decisionMetrics | Frontend result page |
|---|---|---|
| API Analytics | `analytics` | `/dashboard/api-stats/[id]` |
| Prediction Models | `prediction` | `/dashboard/prediction/[id]` |
| Monetization Strategy Advisor | `strategy` | `/dashboard/strategy-adviser` and `/dashboard/recommendation` |

## 2. Upload and File Handling

Frontend upload route:

`MonetizeMate-Frontend/app/api/uploads/mark/route.ts`

Backend upload endpoint:

`POST /api/v1/uploadfile/`

Backend file code:

`MonetizeMate-Backend/app/api/file_endpoints.py`

When a file is uploaded, FastAPI:

1. Checks authentication with `get_current_user`.
2. Accepts only `.csv` and `.xlsx`.
3. Saves the file into `UPLOAD_DIRECTORY`.
4. Validates required columns based on `decisionMetrics`.
5. Creates a file metadata record in the database.
6. Returns metadata, including the file `id`.

Required validation examples:

| Feature | Required data |
|---|---|
| Analytics | `timestamp`, `endpoint`, `client_id`, `requests`, `status_code` |
| Prediction | mapped timestamp field and mapped request count field |
| Strategy | exactly `question` and `answer` columns |

This file `id` becomes the link between the frontend result page and backend processing.

## 3. Feature 1: API Analytics Results

### Frontend Result Flow

Main analytics result page:

`MonetizeMate-Frontend/app/dashboard/api-stats/[id]/page.tsx`

Analytics data service:

`MonetizeMate-Frontend/app/services/analytics.service.ts`

The frontend calls internal Next.js API routes:

- `/api/analytics/overview?fileId={id}&time_filter={filter}`
- `/api/analytics/analysis?fileId={id}&time_filter={filter}`
- `/api/analytics/temporal?fileId={id}&time_filter={filter}`
- `/api/analytics/clients?fileId={id}&time_filter={filter}`
- `/api/analytics/distribution?fileId={id}&time_filter={filter}`
- `/api/analytics/rankings?fileId={id}&time_filter={filter}`

The internal Next.js routes read the session cookie, extract the JWT token, and forward requests to FastAPI.

### Backend Analytics Endpoints

Backend file:

`MonetizeMate-Backend/app/api/dashboard_endpoints.py`

FastAPI endpoints:

- `GET /api/v1/overview/{file_id}`
- `GET /api/v1/analysis/{file_id}`
- `GET /api/v1/temporal/{file_id}`
- `GET /api/v1/clients/{file_id}`
- `GET /api/v1/distribution/{file_id}`
- `GET /api/v1/rankings/{file_id}`

Before calculating analytics, the backend:

1. Loads file metadata by `file_id`.
2. Confirms the current user owns the file.
3. Confirms the file exists on disk.
4. Confirms the file path is inside the upload directory.
5. Reads only required columns using pandas.
6. Applies `time_filter` where applicable.

### How Analytics Results Are Calculated

| Result area | Backend calculation |
|---|---|
| Overview cards | Sums total requests, successful requests, errors, and average response time |
| Daily usage | Groups requests by date |
| Top APIs | Groups by endpoint/API name and sums requests |
| APIs with errors | Filters non-200 status codes and groups by endpoint |
| Temporal analysis | Groups request volume by day and hour |
| Clients | Groups requests by `client_id` |
| Distribution | Counts geographic, brand, partner, and team values |
| Rankings | Returns top clients, top APIs, and top failed APIs |

The frontend receives JSON and renders result cards, charts, and tables.

## 4. Feature 2: Prediction Model Results

### Frontend Result Flow

Main prediction result page:

`MonetizeMate-Frontend/app/dashboard/prediction/[id]/page.tsx`

Prediction service:

`MonetizeMate-Frontend/app/services/prediction.service.ts`

Current frontend implementation note:

The prediction result page currently uses `getPredictionData(fileId)` from `prediction.service.ts`, which returns mock/structured prediction data and then derives additional visual values in the frontend. The FastAPI backend already has prediction endpoints, but this result page is not yet fully wired to call all of them in production style.

### What the Prediction Page Shows

The prediction dashboard currently displays:

1. Model Used
2. User Pattern Behaviour
3. Peak Usage Times
4. Future Request Volume Prediction
5. Rate Limit Optimization Forecast
6. Quota Limit Utilization
7. Predicted Resource Usage
8. Detected Anomalies
9. Error Classification

### Model Used

The frontend shows Random Forest as the selected model.

For non-technical users, the page explains that Random Forest compares many small decision trees and combines their output. In this dashboard it uses historical requests, endpoints, errors, and usage behavior to estimate likely outcomes.

The page also shows:

- Input Data Accuracy
- Model Accuracy

### Time Filter for Prediction

The prediction time filter controls the future request volume chart:

- Next 24h
- Next 7 days
- Next 30 days
- Next 90 days

The frontend builds the selected prediction window using existing forecast points and extends them with a simple trend and weekly seasonality calculation in `buildPredictionWindow`.

### Backend Prediction Endpoints Available

Backend file:

`MonetizeMate-Backend/app/api/prediction_endpoints.py`

Available FastAPI endpoints:

- `GET /api/v1/anomalies/{file_id}`
- `GET /api/v1/peak-usage/{file_id}`
- `GET /api/v1/error-type-classification/{file_id}`
- `GET /api/v1/quota-limit-exceedance/{file_id}`
- `GET /api/v1/predict-future-volume/{file_id}`
- `GET /api/v1/rate-limit-prediction/{file_id}`
- `GET /api/v1/predict-resource-usage/{file_id}`
- `GET /api/v1/user-behavior-patterns/{file_id}`

### How Backend Prediction Works

For each prediction endpoint, FastAPI follows the same base process:

1. Loads the file metadata by `file_id`.
2. Confirms the logged-in user owns the file.
3. Checks that the file was uploaded for `decisionMetrics = prediction`.
4. Reads CSV or Excel into a pandas DataFrame.
5. Validates required columns for that prediction.
6. Runs model-specific calculations.
7. Returns JSON result data.

Prediction backend examples:

| Result area | Backend approach |
|---|---|
| Detected Anomalies | Uses `IsolationForest` on request count, response time, CPU usage, memory usage, and error columns |
| Peak Usage | Groups request count by day of week and hour |
| Error Classification | Trains `RandomForestClassifier` to classify response codes from request/system/user features |
| Quota Utilization | Uses logistic regression logic to predict quota exceedance risk |
| Future Request Volume | Uses linear regression on day number versus daily request count |
| Rate Limit Prediction | Uses logistic regression on RPS, allowed RPS, recent RPS, and user behavior |
| Resource Usage | Uses linear regression to forecast CPU and memory usage |
| User Behavior | Groups by user and calculates request averages, peak hour, top endpoints, and error rate |

### Current Integration Gap

The backend prediction endpoints exist, but the current frontend prediction dashboard is still using a local structured mock service. To make prediction fully backend-driven, `prediction.service.ts` should be updated to call the FastAPI prediction endpoints, merge their responses into `PredictionData`, and remove hardcoded mock values.

## 5. Feature 3: Monetization Strategy Advisor Results

### Frontend Result Flow

Strategy pages:

- `MonetizeMate-Frontend/app/dashboard/strategy-adviser`
- `MonetizeMate-Frontend/app/dashboard/recommendation/page.tsx`
- `MonetizeMate-Frontend/app/dashboard/implementation/page.tsx`

Frontend strategy helper:

`MonetizeMate-Frontend/app/constants/strategy-helpers.ts`

The frontend collects questionnaire answers or derives some answers from uploaded file data. It then calculates strategy recommendations and shows ranked monetization models.

### Backend Strategy Endpoints

Backend file:

`MonetizeMate-Backend/app/api/monetization_recommendation_endpoints.py`

FastAPI endpoints:

- `POST /api/v1/monetization/recommend`
- `GET /api/v1/monetization/recommend/from-file/{file_id}`

### How Backend Strategy Recommendation Works

The backend contains a base list of monetization models:

- Usage-Based Pricing
- Hybrid Model
- Freemium Model
- Subscription Model
- Value-Based Pricing

For questionnaire-based recommendation:

1. Frontend sends answers as `{ question_id: answer }`.
2. Backend loads matching questions from the database.
3. `score_models` loops over answers.
4. Each answer increases scores for matching monetization models.
5. Backend sorts models by score.
6. Backend returns ranked recommendations.

For file-based recommendation:

1. Backend loads the uploaded strategy file.
2. It expects `id`, `question`, and `answer` columns.
3. It converts rows into questionnaire answers.
4. It reuses the same `score_models` logic.
5. It returns ranked monetization models.

### Current Frontend Strategy Note

The frontend recommendation page also has local scoring logic in `strategy-helpers.ts`. That means strategy recommendations may be calculated on the frontend in some flows, while the backend recommendation endpoints also exist. For a single source of truth, the frontend should call the backend recommendation endpoint for final results.

## 6. Authentication and Security

FastAPI protects core APIs using JWT authentication.

Key backend dependency:

`get_current_user`

Security checks include:

- User must be authenticated.
- User can access only their own uploaded files.
- Uploaded file paths must remain inside `UPLOAD_DIRECTORY`.
- CSV and Excel are the only accepted upload formats.
- Required columns are validated before calculation.

The Next.js frontend stores the JWT in a cookie. Internal API routes read the cookie and forward the token to FastAPI using:

`Authorization: Bearer <token>`

## 7. Result Rendering Pattern

Across all three features, the rendering pattern is similar:

1. Result page reads `file_id` or selected answers.
2. Frontend service or hook fetches result data.
3. Page stores data in React state or SWR cache.
4. Loading, error, and empty states are handled.
5. Result sections render using cards, charts, tables, badges, and explanatory text.

Analytics is the most backend-driven result flow today.

Prediction has backend ML endpoints available, but current displayed prediction data is primarily assembled in the frontend service.

Strategy has both backend recommendation endpoints and frontend scoring helpers; the current UI can use local scoring in the recommendation page.

## 8. Recommended Next Step

To make the architecture cleaner:

1. Wire `prediction.service.ts` to FastAPI prediction endpoints.
2. Wire strategy recommendation results to `POST /api/v1/monetization/recommend`.
3. Keep frontend pages focused on rendering only.
4. Keep calculation, validation, and model logic in FastAPI.

This will make all three features consistent:

Upload file or answers -> backend calculates result -> frontend renders result.
