import { apiFetch } from '@/app/lib/fetcher';
import { AnalyticsOverview } from '@/app/types/AnalyticsOverview';
import { Analysis } from '@/app/types/Analysis';
import { TemporalAnalysis } from '@/app/types/TemporalAnalysis';
import { ClientsAnalysis } from '@/app/types/ClientsAnalysis';
import { DistributionAnalysis } from '@/app/types/DistributionAnalysis';
import { RankingsAnalysis } from '@/app/types/RankingsAnalysis';

export const getAnalyticsOverview = async (id: string | number, timeFilter = '7d'): Promise<AnalyticsOverview> => {
  if (!id) throw new Error('File ID is required');
  return apiFetch<AnalyticsOverview>(`/api/analytics/overview?fileId=${id}&time_filter=${timeFilter}`);
};

export const getAnalysis = async (fileId: string | number, timeFilter = '7d'): Promise<Analysis> => {
  if (!fileId) throw new Error('File ID is required');
  return apiFetch<Analysis>(`/api/analytics/analysis?fileId=${fileId}&time_filter=${timeFilter}`);
};

export const getTemporalAnalysis = async (fileId: string | number, timeFilter = '30d'): Promise<TemporalAnalysis> => {
  if (!fileId) throw new Error('File ID is required');
  return apiFetch<TemporalAnalysis>(`/api/analytics/temporal?fileId=${fileId}&time_filter=${timeFilter}`);
};

export const getClientsAnalysis = async (fileId: string | number, timeFilter = '7d'): Promise<ClientsAnalysis> => {
  if (!fileId) throw new Error('File ID is required');
  return apiFetch<ClientsAnalysis>(`/api/analytics/clients?fileId=${fileId}&time_filter=${timeFilter}`);
};

export const getDistributionAnalysis = async (fileId: string | number, timeFilter = '7d'): Promise<DistributionAnalysis> => {
  if (!fileId) throw new Error('File ID is required');
  return apiFetch<DistributionAnalysis>(`/api/analytics/distribution?fileId=${fileId}&time_filter=${timeFilter}`);
};

export const getRankingsAnalysis = async (fileId: string | number, timeFilter = '7d'): Promise<RankingsAnalysis> => {
  if (!fileId) throw new Error('File ID is required');
  return apiFetch<RankingsAnalysis>(`/api/analytics/rankings?fileId=${fileId}&time_filter=${timeFilter}`);
};