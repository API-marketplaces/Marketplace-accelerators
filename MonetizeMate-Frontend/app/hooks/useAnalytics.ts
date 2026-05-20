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

// SWR options shared across all hooks.
// Key decisions:
// - dedupingInterval: 30_000  → de-duplicate identical requests within 30s.
// - revalidateOnFocus: false  → don't re-fetch when window regains focus.
// - revalidateOnReconnect: false → don't re-fetch on network reconnect.
// - shouldRetryOnError: true  → retry on error (e.g. AbortError from slow responses).
// - errorRetryCount: 3        → retry up to 3 times before giving up.
// - errorRetryInterval: 2000  → wait 2s between retries.
// - onErrorRetry: custom      → skip retry for 4xx errors (bad request, auth failure);
//   only retry on AbortError / network errors which are transient.
const SWR_OPTIONS = {
  dedupingInterval: 30_000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: true,
  errorRetryCount: 5,
  errorRetryInterval: 3000,
  onErrorRetry: (error: any, _key: string, _config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
    // Never retry on 4xx — these are deterministic failures (auth, bad request).
    if (error?.status >= 400 && error?.status < 500) return;
    // Retry AbortErrors and network errors up to 3 times.
    if (retryCount >= 5) return;
    setTimeout(() => revalidate({ retryCount }), 3000);
  },
};

// FIX: SWR cache keys use query-param style (?fileId=X&time_filter=Y) to match
// the actual Next.js route handlers at /app/api/analytics/*/route.ts.
// The old path-segment style (/overview/${id}) had no matching route file,
// causing Next.js to return 404 on every request.

export const useAnalyticsOverview = (id: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<AnalyticsOverview>(
    id ? `/api/analytics/overview?fileId=${id}&time_filter=${timeFilter}` : null,
    () => getAnalyticsOverview(id!, timeFilter),
    SWR_OPTIONS
  );
  return { overview: data, isLoading, isError: error };
};

export const useAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<Analysis>(
    fileId ? `/api/analytics/analysis?fileId=${fileId}&time_filter=${timeFilter}` : null,
    () => getAnalysis(fileId!, timeFilter),
    SWR_OPTIONS
  );
  return { analysis: data, isLoading, isError: error };
};

export const useTemporalAnalysis = (fileId: string | number | null, timeFilter = '30d') => {
  const { data, error, isLoading } = useSWR<TemporalAnalysis>(
    fileId ? `/api/analytics/temporal?fileId=${fileId}&time_filter=${timeFilter}` : null,
    () => getTemporalAnalysis(fileId!, timeFilter),
    SWR_OPTIONS
  );
  return { temporalAnalysis: data, isLoading, isError: error };
};

export const useClientsAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<ClientsAnalysis>(
    fileId ? `/api/analytics/clients?fileId=${fileId}&time_filter=${timeFilter}` : null,
    () => getClientsAnalysis(fileId!, timeFilter),
    SWR_OPTIONS
  );
  return { clientsAnalysis: data, isLoading, isError: error };
};

export const useDistributionAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<DistributionAnalysis>(
    fileId ? `/api/analytics/distribution?fileId=${fileId}&time_filter=${timeFilter}` : null,
    () => getDistributionAnalysis(fileId!, timeFilter),
    SWR_OPTIONS
  );
  return { distributionAnalysis: data, isLoading, isError: error };
};

export const useRankingsAnalysis = (fileId: string | number | null, timeFilter = '7d') => {
  const { data, error, isLoading } = useSWR<RankingsAnalysis>(
    fileId ? `/api/analytics/rankings?fileId=${fileId}&time_filter=${timeFilter}` : null,
    () => getRankingsAnalysis(fileId!, timeFilter),
    SWR_OPTIONS
  );
  return { rankingsAnalysis: data, isLoading, isError: error };
};