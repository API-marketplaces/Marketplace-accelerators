export interface DistributionAnalysis {
    geographic_distribution: { geo: string; count: number }[];
    brand_distribution: { brand: string; count: number }[];
    partner_distribution: { partner: string; count: number }[];
    team_distribution: { team: string; count: number }[];
}
