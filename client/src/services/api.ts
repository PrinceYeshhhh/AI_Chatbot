import { auth } from '../lib/supabase'
import axios from 'axios'
import useSWR from 'swr'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { session } = await auth.getSession()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

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
    const { session } = await auth.getSession()
    
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

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