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
    anomalies: [
      { id: '1', timestamp: '2023-10-26 14:30', severity: 'High', description: 'Sudden drop in API calls', expectedValue: 1200, actualValue: 200 },
      { id: '2', timestamp: '2023-10-26 18:45', severity: 'Medium', description: 'Unusually high error rate', expectedValue: 5, actualValue: 25 },
      { id: '3', timestamp: '2023-10-27 09:15', severity: 'Low', description: 'Slightly elevated latency', expectedValue: 200, actualValue: 350 },
    ],
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
    futureVolume: [
        { date: '2023-11-01', predictedVolume: 2200, upperBound: 2500, lowerBound: 1900 },
        { date: '2023-11-02', predictedVolume: 2300, upperBound: 2600, lowerBound: 2000 },
        { date: '2023-11-03', predictedVolume: 2250, upperBound: 2550, lowerBound: 1950 },
        { date: '2023-11-04', predictedVolume: 2400, upperBound: 2700, lowerBound: 2100 },
        { date: '2023-11-05', predictedVolume: 2500, upperBound: 2800, lowerBound: 2200 },
        { date: '2023-11-06', predictedVolume: 2600, upperBound: 2900, lowerBound: 2300 },
        { date: '2023-11-07', predictedVolume: 2550, upperBound: 2850, lowerBound: 2250 },
    ],
    quotaExceedances: [
      { userId: 'user-123', apiKey: '...key1', usage: 9800, quota: 10000, exceedancePercentage: 98 },
      { userId: 'user-456', apiKey: '...key2', usage: 15000, quota: 15000, exceedancePercentage: 100 },
      { userId: 'user-789', apiKey: '...key3', usage: 8500, quota: 10000, exceedancePercentage: 85 },
    ],
    rateLimitPredictions: [
      { time: '14:00', predictedHits: 50 },
      { time: '14:05', predictedHits: 120 },
      { time: '14:10', predictedHits: 250 },
      { time: '14:15', predictedHits: 180 },
      { time: '14:20', predictedHits: 90 },
    ],
    resourceUsagePredictions: [
      { resource: 'CPU', currentUsage: 60, predictedUsage: 85, unit: 'GHz' },
      { resource: 'Memory', currentUsage: 12, predictedUsage: 14, unit: 'GB' },
      { resource: 'Bandwidth', currentUsage: 500, predictedUsage: 750, unit: 'Mbps' },
    ],
    userPatterns: [
      { userSegment: 'Power Users', description: 'Users with high daily API usage.', avgRequestsPerDay: 5000, peakTime: '10:00-12:00' },
      { userSegment: 'Normal Users', description: 'Users with moderate and consistent usage.', avgRequestsPerDay: 500, peakTime: '14:00-16:00' },
      { userSegment: 'Night Owls', description: 'Users who are most active during off-peak hours.', avgRequestsPerDay: 1200, peakTime: '02:00-04:00' },
    ]
  };

  return new Promise(resolve => setTimeout(() => resolve(mockData), 1000));
};
