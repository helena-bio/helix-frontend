/**
 * Variant Analysis Query Hooks
 * React Query hooks for GET operations
 */
import {
  useQuery,
  useInfiniteQuery,
  type UseQueryResult,
  type InfiniteData,
} from '@tanstack/react-query'
import * as api from '@/lib/api/variant-analysis'
import type {
  Variant,
  QCMetrics,
  AnalysisSession,
  VariantsResponse,
  VariantFilters,
  GeneAggregatedResponse,
  GeneAggregatedFilters,
} from '@/types/variant.types'
import type { StatisticsFilters } from '@/lib/api/variant-analysis'

/**
 * Variant statistics response type
 */
export interface VariantStatistics {
  total_variants: number
  classification_breakdown: Record<string, number>
  impact_breakdown: Record<string, number>
  top_genes: Array<{ gene_symbol: string; variant_count: number }>
}

// Custom options type for our hooks
interface QueryHookOptions {
  enabled?: boolean
  staleTime?: number
  retry?: number | boolean
}

// Query Keys Factory
export const variantAnalysisKeys = {
  all: ['variant-analysis'] as const,
  sessions: () => [...variantAnalysisKeys.all, 'sessions'] as const,
  session: (id: string) => [...variantAnalysisKeys.sessions(), id] as const,
  qc: (sessionId: string) => [...variantAnalysisKeys.session(sessionId), 'qc'] as const,
  variants: (sessionId: string) => [...variantAnalysisKeys.session(sessionId), 'variants'] as const,
  variantsList: (sessionId: string, filters?: VariantFilters) =>
    [...variantAnalysisKeys.variants(sessionId), 'list', filters] as const,
  variantsByGene: (sessionId: string, filters?: GeneAggregatedFilters) =>
    [...variantAnalysisKeys.variants(sessionId), 'by-gene', filters] as const,
  variantsByGeneInfinite: (sessionId: string, filters?: Omit<GeneAggregatedFilters, 'page'>) =>
    [...variantAnalysisKeys.variants(sessionId), 'by-gene-infinite', JSON.stringify(filters)] as const,
  variant: (sessionId: string, variantIdx: number) =>
    [...variantAnalysisKeys.variants(sessionId), variantIdx] as const,
  statistics: (sessionId: string, filters?: StatisticsFilters) =>
    [...variantAnalysisKeys.variants(sessionId), 'statistics', JSON.stringify(filters)] as const,
}

// Session
export function useSession(
  sessionId: string,
  options?: QueryHookOptions
): UseQueryResult<AnalysisSession, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.session(sessionId),
    queryFn: () => api.getSession(sessionId),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}

// QC Metrics
export function useQCMetrics(
  sessionId: string,
  options?: QueryHookOptions
): UseQueryResult<QCMetrics, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.qc(sessionId),
    queryFn: () => api.getQCMetrics(sessionId),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 10 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}

// Variants List
export function useVariants(
  sessionId: string,
  filters?: VariantFilters,
  options?: QueryHookOptions
): UseQueryResult<VariantsResponse, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variantsList(sessionId, filters),
    queryFn: () => api.getVariants(sessionId, filters),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}

// Variants Grouped by Gene
export function useVariantsByGene(
  sessionId: string,
  filters?: GeneAggregatedFilters,
  options?: QueryHookOptions
): UseQueryResult<GeneAggregatedResponse, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variantsByGene(sessionId, filters),
    queryFn: () => api.getVariantsByGene(sessionId, filters),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}

// Return type for infinite query
export interface UseInfiniteVariantsByGeneResult {
  data: InfiniteData<GeneAggregatedResponse> | undefined
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  error: Error | null
}

// Infinite Query for Variants by Gene (for lazy loading)
export function useInfiniteVariantsByGene(
  sessionId: string,
  filters?: Omit<GeneAggregatedFilters, 'page'>,
  options?: QueryHookOptions
): UseInfiniteVariantsByGeneResult {
  const pageSize = filters?.page_size ?? 50

  const query = useInfiniteQuery({
    queryKey: variantAnalysisKeys.variantsByGeneInfinite(sessionId, filters),
    queryFn: ({ pageParam }) =>
      api.getVariantsByGene(sessionId, {
        ...filters,
        page: pageParam,
        page_size: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.has_next_page) {
        return lastPage.page + 1
      }
      return undefined
    },
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    retry: options?.retry ?? 3,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  }
}

// Single Variant
export function useVariant(
  sessionId: string,
  variantIdx: number,
  options?: QueryHookOptions
): UseQueryResult<{ variant: Variant }, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.variant(sessionId, variantIdx),
    queryFn: () => api.getVariant(sessionId, variantIdx),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 10 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}

// Variant Statistics with optional ACMG filter
export function useVariantStatistics(
  sessionId: string,
  filters?: StatisticsFilters,
  options?: QueryHookOptions
): UseQueryResult<VariantStatistics, Error> {
  return useQuery({
    queryKey: variantAnalysisKeys.statistics(sessionId, filters),
    queryFn: () => api.getVariantStatistics(sessionId, filters),
    enabled: (options?.enabled ?? true) && !!sessionId,
    staleTime: options?.staleTime ?? 10 * 60 * 1000,
    retry: options?.retry ?? 3,
  })
}
