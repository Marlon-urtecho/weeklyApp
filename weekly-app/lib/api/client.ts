const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

class ApiClient {
  private token: string | null = null
  private tokenRefreshHandler: (() => Promise<string | null>) | null = null
  private unauthorizedHandler: ((message?: string) => void) | null = null
  private handlingUnauthorized = false
  private refreshInFlight: Promise<string | null> | null = null

  setToken(token: string | null) {
    this.token = token
  }

  onUnauthorized(handler: ((message?: string) => void) | null) {
    this.unauthorizedHandler = handler
  }

  onTokenRefresh(handler: (() => Promise<string | null>) | null) {
    this.tokenRefreshHandler = handler
  }

  private async refreshToken(): Promise<string | null> {
    if (!this.tokenRefreshHandler) return null
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.tokenRefreshHandler().finally(() => {
        this.refreshInFlight = null
      })
    }
    return this.refreshInFlight
  }

  private async request(endpoint: string, options: RequestInit = {}, retryAttempt = 0): Promise<any> {
    let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    // Evita URLs duplicadas como /api/api/...
    if (API_URL.endsWith('/api') && normalizedEndpoint.startsWith('/api/')) {
      normalizedEndpoint = normalizedEndpoint.slice(4)
    }

    const url = `${API_URL}${normalizedEndpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.error || `Error ${response.status}`

      const isAuthRoute =
        normalizedEndpoint === '/auth/login' || normalizedEndpoint === '/auth/refresh'

      if (
        response.status === 401 &&
        !isAuthRoute &&
        retryAttempt === 0
      ) {
        const refreshedToken = await this.refreshToken()
        if (refreshedToken) {
          this.setToken(refreshedToken)
          return this.request(endpoint, options, retryAttempt + 1)
        }
      }

      if (
        response.status === 401 &&
        !isAuthRoute &&
        this.unauthorizedHandler &&
        !this.handlingUnauthorized
      ) {
        this.handlingUnauthorized = true
        try {
          this.unauthorizedHandler(message)
        } finally {
          setTimeout(() => {
            this.handlingUnauthorized = false
          }, 150)
        }
      }
      throw new Error(message)
    }

    return response.json()
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
