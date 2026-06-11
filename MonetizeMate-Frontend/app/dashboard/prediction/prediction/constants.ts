import { TrendingUp, Zap, Brain, BarChart3, Shield, Users, Target, AlertTriangle, Clock, Cpu, Eye } from "lucide-react";
import { MLModel, PredictionType, DataAttribute } from "../../../types/prediction";

export const ML_MODELS: MLModel[] = [
  {
    id: "linear",
    name: "Linear Regression",
    description: "Simple and interpretable model for linear relationships",
    accuracy: 0,
    trainingTime: "Fast",
    strengths: ["Fast training", "Interpretable", "Good baseline"],
    bestFor: ["Linear trends", "Simple relationships", "Quick insights"],
    icon: TrendingUp,
    color: "text-blue-600"
  },
  {
    id: "gradient_boosting",
    name: "Gradient Boosting",
    description: "Ensemble method that builds models sequentially",
    accuracy: 0,
    trainingTime: "Medium",
    strengths: ["High accuracy", "Handles non-linear patterns", "Feature importance"],
    bestFor: ["Complex patterns", "High accuracy needs", "Feature selection"],
    icon: Zap,
    color: "text-purple-600"
  },
  {
    id: "random_forest",
    name: "Random Forest",
    description: "Ensemble of decision trees with averaging",
    accuracy: 0,
    trainingTime: "Medium",
    strengths: ["Robust to overfitting", "Handles missing data", "Good performance"],
    bestFor: ["Mixed data types", "Robust predictions", "Feature importance"],
    icon: Brain,
    color: "text-green-600"
  }
];

export const PREDICTION_TYPES: PredictionType[] = [
  {
    id: "request_volume",
    name: "Future Request Volume",
    description: "Predict API request volumes to anticipate usage tiers and potential revenue",
    requiredAttributes: ["timestamp", "request_count", "user_count"],
    icon: BarChart3,
    enabled: false
  },
  {
    id: "rate_limits",
    name: "Rate Limit Optimization Forecast",
    description: "Analyze request patterns, detect abuse, and recommend endpoint-specific rate limits",
    requiredAttributes: ["timestamp", "request_count", "user_id", "endpoint"],
    icon: Shield,
    enabled: false
  },
  {
    id: "user_behavior",
    name: "User Behavior & Usage Patterns",
    description: "Personalize pricing plans and offer targeted features based on usage",
    requiredAttributes: ["user_id", "feature_usage", "session_duration", "timestamp"],
    icon: Users,
    enabled: false
  },
  {
    id: "quota_limits",
    name: "Quota Limit Exceedance",
    description: "Trigger upsell opportunities or usage-based billing adjustments",
    requiredAttributes: ["user_id", "current_usage", "quota_limit", "timestamp"],
    icon: Target,
    enabled: false
  },
  {
    id: "error_classification",
    name: "Error Type Classification",
    description: "Classify error types (404, 500, 503) based on request attributes",
    requiredAttributes: ["request_attributes", "response_code", "system_metrics"],
    icon: AlertTriangle,
    enabled: false
  },
  {
    id: "peak_usage",
    name: "Peak Usage Period Identification",
    description: "Identify peak usage periods for capacity planning and resource optimization",
    requiredAttributes: ["timestamp", "request_count", "response_time", "cpu_usage"],
    icon: Clock,
    enabled: false
  },
  {
    id: "resource_prediction",
    name: "Resource Usage Prediction",
    description: "Predict future RPS, CPU utilization, and memory usage",
    requiredAttributes: ["timestamp", "rps", "cpu_usage", "memory_usage", "request_count"],
    icon: Cpu,
    enabled: false
  },
  {
    id: "anomaly_detection",
    name: "Anomaly Detection",
    description: "Identify fraudulent usage or unauthorized access patterns",
    requiredAttributes: ["user_id", "request_pattern", "ip_address", "timestamp", "request_count"],
    icon: Eye,
    enabled: false
  }
];

export const DATA_ATTRIBUTES: DataAttribute[] = [
  { name: "timestamp", type: "datetime", required: true, description: "Date/time of the event", present: false, mappedKeys: ["date", "datetime", "time", "created_at", "timestamp"] },
  { name: "request_count", type: "numeric", required: true, description: "Number of API requests", present: false, mappedKeys: ["requests", "request_count", "api_requests", "calls", "hits"] },
  { name: "user_id", type: "categorical", required: false, description: "Unique user identifier", present: false, mappedKeys: ["user_id", "user", "client_id", "customer_id"] },
  { name: "user_count", type: "numeric", required: false, description: "Number of active users", present: false, mappedKeys: ["users", "user_count", "active_users", "clients"] },
  { name: "response_time", type: "numeric", required: false, description: "API response time in milliseconds", present: false, mappedKeys: ["response_time", "latency", "duration", "time_ms"] },
  { name: "response_code", type: "categorical", required: false, description: "HTTP response status code", present: false, mappedKeys: ["status", "response_code", "http_status", "status_code"] },
  { name: "endpoint", type: "categorical", required: false, description: "API endpoint path", present: false, mappedKeys: ["endpoint", "path", "url", "route", "api_endpoint"] },
  { name: "cpu_usage", type: "numeric", required: false, description: "CPU utilization percentage", present: false, mappedKeys: ["cpu", "cpu_usage", "cpu_percent", "processor"] },
  { name: "memory_usage", type: "numeric", required: false, description: "Memory usage in MB", present: false, mappedKeys: ["memory", "memory_usage", "ram", "memory_mb"] },
  { name: "rps", type: "numeric", required: false, description: "Requests per second", present: false, mappedKeys: ["rps", "requests_per_second", "throughput", "rate"] },
  { name: "feature_usage", type: "categorical", required: false, description: "Features used in the request", present: false, mappedKeys: ["features", "feature_usage", "functionality", "modules"] },
  { name: "session_duration", type: "numeric", required: false, description: "User session duration in minutes", present: false, mappedKeys: ["session_duration", "session_time", "duration_minutes"] },
  { name: "current_usage", type: "numeric", required: false, description: "Current usage against quota", present: false, mappedKeys: ["usage", "current_usage", "consumed", "utilized"] },
  { name: "quota_limit", type: "numeric", required: false, description: "User's quota limit", present: false, mappedKeys: ["quota", "quota_limit", "limit", "max_usage"] },
  { name: "ip_address", type: "categorical", required: false, description: "Client IP address", present: false, mappedKeys: ["ip", "ip_address", "client_ip", "source_ip"] },
  { name: "request_pattern", type: "categorical", required: false, description: "Request pattern signature", present: false, mappedKeys: ["pattern", "request_pattern", "signature", "fingerprint"] },
  { name: "system_metrics", type: "numeric", required: false, description: "Various system performance metrics", present: false, mappedKeys: ["metrics", "system_metrics", "performance", "stats"] },
  { name: "request_attributes", type: "categorical", required: false, description: "Request headers and parameters", present: false, mappedKeys: ["attributes", "headers", "params", "metadata"] },
  { name: "revenue", type: "numeric", required: false, description: "Revenue generated", present: false, mappedKeys: ["revenue", "income", "earnings", "money"] },
  { name: "customers", type: "numeric", required: false, description: "Number of customers", present: false, mappedKeys: ["customers", "clients", "accounts", "subscribers"] }
];

export const MOCK_PREDICTION_RESULTS = {
  request_volume: [
    { period: "Week 1", predicted: 12500, confidence: 94 },
    { period: "Week 2", predicted: 13200, confidence: 91 },
    { period: "Week 3", predicted: 14100, confidence: 88 },
    { period: "Week 4", predicted: 15200, confidence: 85 }
  ],
  resource_prediction: [
    { metric: "RPS", current: 45, predicted: 58, change: "+29%" },
    { metric: "CPU Usage", current: 68, predicted: 76, change: "+12%" },
    { metric: "Memory Usage", current: 4.2, predicted: 5.1, change: "+21%" }
  ]
};
