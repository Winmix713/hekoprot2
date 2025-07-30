import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
  deps?: any[]
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { immediate = true, deps = [] } = options
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const result = await apiCall()
      setState({ data: result, loading: false, error: null })
    } catch (error: any) {
      setState({ data: null, loading: false, error: error.message || 'An error occurred' })
    }
  }, [apiCall])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, deps)

  return {
    ...state,
    refetch: fetchData,
  }
}

// Specific hooks for common API calls

export function useMatches(params?: {
  page?: number
  size?: number
  status?: string
  team_id?: string
  season_id?: string
}) {
  return useApi(
    () => apiClient.getMatches(params),
    { deps: [JSON.stringify(params)] }
  )
}

export function useMatch(matchId: string | null) {
  return useApi(
    () => matchId ? apiClient.getMatch(matchId) : Promise.resolve(null),
    { immediate: !!matchId, deps: [matchId] }
  )
}

export function useMatchStats(seasonId?: string) {
  return useApi(
    () => apiClient.getMatchStats(seasonId),
    { deps: [seasonId] }
  )
}

export function useLeagueTable(seasonId?: string) {
  return useApi(
    () => apiClient.getLeagueTable(seasonId),
    { deps: [seasonId] }
  )
}

export function useTeamStats(teamId: string | null, params?: {
  season_id?: string
  home_only?: boolean
  away_only?: boolean
  last_n_matches?: number
}) {
  return useApi(
    () => teamId ? apiClient.getTeamStats(teamId, params) : Promise.resolve(null),
    { immediate: !!teamId, deps: [teamId, JSON.stringify(params)] }
  )
}

export function usePredictions(params?: {
  page?: number
  size?: number
  status?: string
  model_id?: string
  confidence_min?: number
}) {
  return useApi(
    () => apiClient.getPredictions(params),
    { deps: [JSON.stringify(params)] }
  )
}

export function useModels(params?: {
  page?: number
  size?: number
  status?: string
}) {
  return useApi(
    () => apiClient.getModels(params),
    { deps: [JSON.stringify(params)] }
  )
}

export function useSystemStatus() {
  return useApi(() => apiClient.getSystemStatus())
}

export function useHealthCheck() {
  return useApi(() => apiClient.healthCheck())
}

// Hook for team analysis between two teams
export function useTeamAnalysis(
  homeTeamId: string | null,
  awayTeamId: string | null,
  seasonId?: string
) {
  return useApi(
    () => homeTeamId && awayTeamId 
      ? apiClient.getTeamAnalysis(homeTeamId, awayTeamId, seasonId)
      : Promise.resolve(null),
    {
      immediate: !!(homeTeamId && awayTeamId),
      deps: [homeTeamId, awayTeamId, seasonId]
    }
  )
}

// Hook for match predictions
export function useMatchPrediction(
  homeTeamId: string | null,
  awayTeamId: string | null
) {
  return useApi(
    () => homeTeamId && awayTeamId
      ? apiClient.getMatchPrediction(homeTeamId, awayTeamId)
      : Promise.resolve(null),
    {
      immediate: !!(homeTeamId && awayTeamId),
      deps: [homeTeamId, awayTeamId]
    }
  )
}

// Hook for match statistics with filters
export function useMatchStatistics(params?: {
  season_id?: string
  team_id?: string
  date_from?: string
  date_to?: string
}) {
  return useApi(
    () => apiClient.getMatchStatistics(params),
    { deps: [JSON.stringify(params)] }
  )
}
