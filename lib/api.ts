import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface ApiError {
  error: string
  detail: string
}

interface AuthTokens {
  access_token: string
  token_type: string
  expires_in: number
}

class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.clearToken()
          // In a real app, you'd redirect to login page
          console.warn('Authentication expired, please login again')
        }
        
        return Promise.reject({
          message: error.response?.data?.detail || error.message || 'An error occurred',
          status: error.response?.status,
          data: error.response?.data,
        })
      }
    )

    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
    }
  }

  setToken(token: string) {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  clearToken() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<AuthTokens> {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await this.client.post<AuthTokens>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    this.setToken(response.data.access_token)
    return response.data
  }

  async logout() {
    this.clearToken()
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }

  // Matches endpoints
  async getMatches(params?: {
    page?: number
    size?: number
    status?: string
    team_id?: string
    season_id?: string
    date_from?: string
    date_to?: string
  }) {
    const response = await this.client.get('/matches', { params })
    return response.data
  }

  async getMatch(matchId: string) {
    const response = await this.client.get(`/matches/${matchId}`)
    return response.data
  }

  async getMatchStats(seasonId?: string) {
    const response = await this.client.get('/matches/stats/overview', {
      params: { season_id: seasonId }
    })
    return response.data
  }

  // Statistics endpoints
  async getTeamAnalysis(homeTeamId: string, awayTeamId: string, seasonId?: string) {
    const response = await this.client.get('/statistics/team-analysis', {
      params: {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        season_id: seasonId
      }
    })
    return response.data
  }

  async getMatchPrediction(homeTeamId: string, awayTeamId: string) {
    const response = await this.client.get('/statistics/prediction', {
      params: {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId
      }
    })
    return response.data
  }

  async getTeamStats(teamId: string, params?: {
    season_id?: string
    home_only?: boolean
    away_only?: boolean
    last_n_matches?: number
  }) {
    const response = await this.client.get(`/statistics/team-stats/${teamId}`, { params })
    return response.data
  }

  async getLeagueTable(seasonId?: string) {
    const response = await this.client.get('/statistics/league-table', {
      params: { season_id: seasonId }
    })
    return response.data
  }

  async getMatchStatistics(params?: {
    season_id?: string
    team_id?: string
    date_from?: string
    date_to?: string
  }) {
    const response = await this.client.get('/statistics/match-stats', { params })
    return response.data
  }

  // Predictions endpoints  
  async getPredictions(params?: {
    page?: number
    size?: number
    status?: string
    model_id?: string
    confidence_min?: number
  }) {
    const response = await this.client.get('/predictions', { params })
    return response.data
  }

  async getPrediction(predictionId: string) {
    const response = await this.client.get(`/predictions/${predictionId}`)
    return response.data
  }

  async createPrediction(data: {
    match_id: string
    model_id: string
    prediction_type: string
    predicted_outcome: string
    confidence: number
    odds?: Record<string, number>
  }) {
    const response = await this.client.post('/predictions', data)
    return response.data
  }

  // Models endpoints
  async getModels(params?: {
    page?: number
    size?: number
    status?: string
  }) {
    const response = await this.client.get('/models', { params })
    return response.data
  }

  async getModel(modelId: string) {
    const response = await this.client.get(`/models/${modelId}`)
    return response.data
  }

  async trainModel(modelId: string, data?: any) {
    const response = await this.client.post(`/models/${modelId}/train`, data)
    return response.data
  }

  async getModelPerformance(modelId: string) {
    const response = await this.client.get(`/models/${modelId}/performance`)
    return response.data
  }

  // Admin endpoints
  async getSystemStatus() {
    const response = await this.client.get('/admin/system-status')
    return response.data
  }

  async getUsers(params?: { page?: number; size?: number }) {
    const response = await this.client.get('/admin/users', { params })
    return response.data
  }

  // Generic request method for custom endpoints
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config)
    return response.data
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { ApiError, AuthTokens }
