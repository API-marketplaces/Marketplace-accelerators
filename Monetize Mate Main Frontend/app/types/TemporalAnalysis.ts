export interface DailyRequestVolume {
  date: string;
  total_requests: number;
}

export interface HourlyCallDistribution {
  hour: number;
  total_requests: number;
}

export interface TemporalAnalysis {
  daily_request_volume: DailyRequestVolume[];
  hourly_call_distribution: HourlyCallDistribution[];
}