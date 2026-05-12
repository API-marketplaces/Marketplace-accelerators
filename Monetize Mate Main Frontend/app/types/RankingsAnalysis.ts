export interface RankingsAnalysis {
  top_20_failed_apis: { api_name: string; failure_count: number }[];
  top_20_clients: { client_id: string; total_requests: number }[];
  top_20_apis_accessed: { api_name: string; total_requests: number }[];
}