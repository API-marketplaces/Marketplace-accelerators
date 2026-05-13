export interface DistributionAnalysis {
    geographic_distribution: { country: string; count: number }[];
    brand_distribution: { endpoint: string; count: number }[];
    partner_distribution: { method: string; count: number }[];
    team_distribution: { team: string; count: number }[];
}