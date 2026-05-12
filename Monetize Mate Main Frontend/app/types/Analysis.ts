export interface ApiConsumption {
  endpoint: string;
  total_requests: number;
}

export interface ApiError {
  endpoint: string;
  error_requests: number;
}

export interface Analysis {
  top_5_apis_by_consumption: ApiConsumption[];
  apis_with_most_errors: ApiError[];
}