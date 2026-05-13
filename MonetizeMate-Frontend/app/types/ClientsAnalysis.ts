export interface ClientsAnalysis {
  top_consumers: { client_id: string; total_requests: number }[];
  client_error_rates: { client_id: string; error_rate: number }[];
}