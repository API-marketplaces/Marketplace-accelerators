import useSWR from 'swr';
import {
  getAnalyticsOverview,
  getAnalysis,
  getTemporalAnalysis,
  getClientsAnalysis,
  getDistributionAnalysis,
  getRankingsAnalysis,
} from '@/app/services/analytics.service';
import { AnalyticsOverview } from '@/app/types/AnalyticsOverview';
import { Analysis } from '@/app/types/Analysis';
import { TemporalAnalysis } from '@/app/types/TemporalAnalysis';
import { ClientsAnalysis } from '@/app/types/ClientsAnalysis';
import { DistributionAnalysis } from '@/app/types/DistributionAnalysis';
import { RankingsAnalysis } from '@/app/types/RankingsAnalysis';

export const useAnalyticsOverview = (id: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<AnalyticsOverview>(
    id ? `/api/analytics/overview/${id}?tf=${timeFilter}` : null,
    () => getAnalyticsOverview(id!, timeFilter)
  );
  return { overview: data, isLoading, isError: error };
};

export const useAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<Analysis>(
    fileId ? `/api/analytics/analysis/${fileId}?tf=${timeFilter}` : null,
    () => getAnalysis(fileId!, timeFilter)
  );
  return { analysis: data, isLoading, isError: error };
};

export const useTemporalAnalysis = (fileId: string | number | null, timeFilter = '30d') => {
  const { data, error, isLoading } = useSWR<TemporalAnalysis>(
    fileId ? `/api/analytics/temporal/${fileId}?tf=${timeFilter}` : null,
    () => getTemporalAnalysis(fileId!, timeFilter)
  );
  return { temporalAnalysis: data, isLoading, isError: error };
};

export const useClientsAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<ClientsAnalysis>(
    fileId ? `/api/analytics/clients/${fileId}?tf=${timeFilter}` : null,
    () => getClientsAnalysis(fileId!, timeFilter)
  );
  return { clientsAnalysis: data, isLoading, isError: error };
};

export const useDistributionAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<DistributionAnalysis>(
    fileId ? `/api/analytics/distribution/${fileId}?tf=${timeFilter}` : null,
    () => getDistributionAnalysis(fileId!, timeFilter)
  );
  return { distributionAnalysis: data, isLoading, isError: error };
};

export const useRankingsAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<RankingsAnalysis>(
    fileId ? `/api/analytics/rankings/${fileId}?tf=${timeFilter}` : null,
    () => getRankingsAnalysis(fileId!, timeFilter)
  );
  return { rankingsAnalysis: data, isLoading, isError: error };
};