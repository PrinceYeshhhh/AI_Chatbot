import axios from 'axios'
import useSWR from 'swr'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // Supabase auth headers removed
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Supabase auth headers removed
    return headers
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${endpoint}`
    const headers = await this.getAuthHeaders()

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async getCurrentUser() {
    return this.makeRequest('/api/auth/me')
  }

  async verifyToken() {
    return this.makeRequest('/api/auth/verify')
  }

  // Health check
  async getHealthStatus() {
    return this.makeRequest('/api/health')
  }

  // Generic API methods for future use
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' })
  }

  // File upload method (for future use)
  async uploadFile(file: File, endpoint: string = '/api/upload') {
    // Supabase auth headers removed
    
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    // Supabase auth headers removed

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed! status: ${response.status}`)
    }

    return await response.json()
  }

  async postWithParams<T>(endpoint: string, data: any, params: Record<string, any>): Promise<T> {
    const url = new URL(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return this.makeRequest<T>(url.toString(), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Onboarding progress endpoints
  async getOnboardingProgress() {
    return this.get('/api/user-settings/onboarding-progress');
  }
  async updateOnboardingProgress(data: { has_completed_onboarding?: boolean; onboarding_progress?: number; last_seen_docs_version?: string }) {
    return this.post('/api/user-settings/onboarding-progress', data);
  }
  // Support ticket endpoints
  async createSupportTicket(data: { subject: string; message: string }) {
    return this.post('/api/support/ticket', data);
  }
  async getSupportFaqs() {
    return this.get('/api/support/faqs');
  }
}

export const apiService = new ApiService()
export default apiService

export async function getFiles() {
  try {
    const res = await api.get('/files');
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function uploadFiles(formData: FormData) {
  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export const swrFetcher = (url: string) => api.get(url).then(res => res.data); 