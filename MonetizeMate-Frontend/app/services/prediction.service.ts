import { PredictionData } from '@/app/types/prediction';

export const getPredictionData = async (fileId: string): Promise<PredictionData> => {
  if (!fileId) {
    throw new Error('File ID is required to fetch prediction data.');
  }
  // In a real app, this would be one or more API calls.
  // e.g., await Promise.all([apiFetch(...), apiFetch(...)])
  // For this example, I'll mock the data.
  console.log(`Fetching prediction data for file ID: ${fileId}`);

  // Mock data
  const mockData: PredictionData = {
    inputDataAccuracy: 80,
    anomalies: {
      request_spike: [
        { timestamp: '2023-10-26 14:30', request_count: 200, user_id: 'user-1', user_count: 5, response_time: 120, response_code: 200, endpoint: '/api/v1/data', cpu_usage: 45, memory_usage: 60, rps: 10, feature_usage: 'read', session_duration: 300, current_usage: 200, quota_limit: 1200, ip_address: '192.168.1.1', revenue: 0, customers: 3, anomaly_score: 0.9, type: 'request_spike', reason: 'Sudden drop in API calls' },
      ],
      latency_spike: [
        { timestamp: '2023-10-26 18:45', request_count: 500, user_id: 'user-2', user_count: 10, response_time: 850, response_code: 500, endpoint: '/api/v1/users', cpu_usage: 80, memory_usage: 75, rps: 25, feature_usage: 'write', session_duration: 120, current_usage: 500, quota_limit: 1000, ip_address: '192.168.1.2', revenue: 0, customers: 8, anomaly_score: 0.75, type: 'latency_spike', reason: 'Unusually high error rate' },
      ],
      resource_spike: [
        { timestamp: '2023-10-27 09:15', request_count: 350, user_id: 'user-3', user_count: 7, response_time: 350, response_code: 200, endpoint: '/api/v1/metrics', cpu_usage: 90, memory_usage: 88, rps: 18, feature_usage: 'read', session_duration: 200, current_usage: 350, quota_limit: 1000, ip_address: '192.168.1.3', revenue: 0, customers: 5, anomaly_score: 0.6, type: 'resource_spike', reason: 'Slightly elevated latency' },
      ],
    },
    peakUsage: [
      { time: '00:00', usage: 250 },
      { time: '02:00', usage: 300 },
      { time: '04:00', usage: 280 },
      { time: '06:00', usage: 400 },
      { time: '08:00', usage: 800 },
      { time: '10:00', usage: 1200 },
      { time: '12:00', usage: 1500 },
      { time: '14:00', usage: 1450 },
      { time: '16:00', usage: 1300 },
      { time: '18:00', usage: 1600 },
      { time: '20:00', usage: 1100 },
      { time: '22:00', usage: 600 },
    ],
    errorClassification: [
      { errorType: '500 Internal Server Error', count: 45, percentage: 50 },
      { errorType: '401 Unauthorized', count: 25, percentage: 27.8 },
      { errorType: '404 Not Found', count: 15, percentage: 16.7 },
      { errorType: '429 Too Many Requests', count: 5, percentage: 5.5 },
    ],
    futureVolume: {
      model: 'Random Forest',
      history_days: 30,
      predicted_days: 7,
      predictions: [
        { date: '2023-11-01', predicted_request_count: 2200 },
        { date: '2023-11-02', predicted_request_count: 2300 },
        { date: '2023-11-03', predicted_request_count: 2250 },
        { date: '2023-11-04', predicted_request_count: 2400 },
        { date: '2023-11-05', predicted_request_count: 2500 },
        { date: '2023-11-06', predicted_request_count: 2600 },
        { date: '2023-11-07', predicted_request_count: 2550 },
      ],
    },
    modelPerformance: [
      {
        id: 'linear',
        name: 'Linear Regression',
        description: 'Simple and interpretable model for linear relationships',
        accuracy: 87.3,
        trainingTime: 'Fast',
        modelType: 'Linear',
        strengths: ['Fast training', 'Easy to explain', 'Good baseline'],
        bestFor: ['Linear trends', 'Simple relationships'],
      },
      {
        id: 'gradient_boosting',
        name: 'Gradient Boosting',
        description: 'Ensemble method that builds models sequentially',
        accuracy: 98.0,
        trainingTime: 'Medium',
        modelType: 'Ensemble',
        strengths: ['High accuracy', 'Handles non-linear patterns', 'Feature importance'],
        bestFor: ['Complex patterns', 'High accuracy needs'],
      },
      {
        id: 'random_forest',
        name: 'Random Forest',
        description: 'Ensemble of decision trees with averaging',
        accuracy: 93.0,
        trainingTime: 'Medium',
        modelType: 'Ensemble',
        strengths: ['Mixed data support', 'Robust predictions', 'Feature importance'],
        bestFor: ['Mixed data types', 'Robust predictions'],
      },
    ],
    quotaExceedances: [
      { userId: 'user-123', apiKey: '...key1', usage: 9800, quota: 10000, exceedancePercentage: 98 },
      { userId: 'user-456', apiKey: '...key2', usage: 15000, quota: 15000, exceedancePercentage: 100 },
      { userId: 'user-789', apiKey: '...key3', usage: 8500, quota: 10000, exceedancePercentage: 85 },
    ],
    rateLimitOptimization: {
      modelUsed: 'Random Forest',
      description: 'Prediction performed using pattern recognition to analyze request patterns, detect abuse, and optimize rate limits per endpoint based on historical traffic data.',
      forecastInsight: 'Based on 10,346 request records, the model identified endpoint-specific abuse patterns and capacity constraints to recommend optimal rate limits.',
      recommendations: [
        { endpoint: '/api/v1/search', currentLimit: 1000, recommendedLimit: 850, insight: 'High abuse pattern detected', status: 'reduce' },
        { endpoint: '/api/v1/data', currentLimit: 5000, recommendedLimit: 6500, insight: 'Capacity available for growth', status: 'increase' },
        { endpoint: '/api/v1/export', currentLimit: 100, recommendedLimit: 100, insight: 'Optimal configuration', status: 'keep' },
      ],
    },
    resourceUsagePredictions: [
      { resource: 'CPU', currentUsage: 60, predictedUsage: 85, unit: 'GHz' },
      { resource: 'Memory', currentUsage: 12, predictedUsage: 14, unit: 'GB' },
    ],
    userPatterns: [
      { userSegment: 'Power Users', description: 'Users with high daily API usage.', avgRequestsPerDay: 5000, peakTime: '10:00-12:00' },
      { userSegment: 'Normal Users', description: 'Users with moderate and consistent usage.', avgRequestsPerDay: 500, peakTime: '14:00-16:00' },
      { userSegment: 'Night Owls', description: 'Users who are most active during off-peak hours.', avgRequestsPerDay: 1200, peakTime: '02:00-04:00' },
    ]
  };

  return new Promise(resolve => setTimeout(() => resolve(mockData), 1000));
};
