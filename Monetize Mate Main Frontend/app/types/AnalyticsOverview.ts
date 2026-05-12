export interface DailyUsage {
  date: string;
  total_requests: number;
  errors: number;
}

export interface AnalyticsOverview {
  total_requests: number;
  successful_requests: number;
  errors: number;
  avg_response_time: number;
  daily_usage: DailyUsage[];
}