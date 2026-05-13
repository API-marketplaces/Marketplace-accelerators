export interface MLModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  trainingTime: string;
  strengths: string[];
  bestFor: string[];
  icon: any;
  color: string;
}

export interface PredictionType {
  id: string;
  name: string;
  description: string;
  requiredAttributes: string[];
  icon: any;
  enabled: boolean;
}

export interface DataAttribute {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime';
  required: boolean;
  description: string;
  present: boolean;
  mappedKeys: string[];
}

export interface PredictionResults {

  request_volume: Array<{

    period: string;

    predicted: number;

    confidence: number;

  }>;

  resource_prediction: Array<{

    metric: string;

    current: number;

    predicted: number;

    change: string;

  }>;

}



export interface Anomaly {
  timestamp: string;
  request_count: number;
  user_id: string;
  user_count: number;
  response_time: number;
  response_code: number;
  endpoint: string;
  cpu_usage: number;
  memory_usage: number;
  rps: number;
  feature_usage: string;
  session_duration: number;
  current_usage: number;
  quota_limit: number;
  ip_address: string;
  revenue: number;
  customers: number;
  anomaly_score: number;
  type: string;
  reason: string;
}

export interface AnomalyData {
  request_spike: Anomaly[];
  latency_spike: Anomaly[];
  resource_spike: Anomaly[];
}

export interface PeakUsage {

  time: string;

  usage: number;

}



export interface ErrorClassification {

  errorType: string;

  count: number;

  percentage: number;

}



export interface FutureVolumePredictionItem {
  date: string;
  predicted_request_count: number;
}

export interface FutureVolumePrediction {
  predictions: FutureVolumePredictionItem[];
  model: string;
  history_days: number;
  predicted_days: number;
}



export interface QuotaExceedance {

  userId: string;

  apiKey: string;

  usage: number;

  quota: number;

  exceedancePercentage: number;

}



export interface RateLimitPrediction {

  time: string;

  predictedHits: number;

}



export interface ResourceUsagePrediction {

  resource: 'CPU' | 'Memory' | 'Bandwidth' | 'Storage';

  currentUsage: number;

  predictedUsage: number;

  unit: 'GHz' | 'GB' | 'Mbps' | 'TB';

}



export interface UserPattern {

  userSegment: string;

  description: string;

  avgRequestsPerDay: number;

  peakTime: string;

}



export interface PredictionData {

  anomalies: AnomalyData;

  peakUsage: PeakUsage[];

  errorClassification: ErrorClassification[];

  futureVolume: FutureVolumePrediction;

  quotaExceedances: QuotaExceedance[];

  rateLimitPredictions: RateLimitPrediction[];

  resourceUsagePredictions: ResourceUsagePrediction[];

  userPatterns: UserPattern[];

}
