export interface MonetizationStrategy {
  id: string;
  name: string;
  score: number;
  description: string;
  pros: string[];
  cons: string[];
  implementation: string;
  timeframe: string;
  expectedRevenue: string;
  icon: any;
  color: string;
  bgColor: string;
  reasoning?: string;
}