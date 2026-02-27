/**
 * API Client Wrapper
 *
 * Calls backend API at NEXT_PUBLIC_API_URL
 *
 * Public routes:  apiGet / apiPost (no token required)
 * Private routes: apiGetAuth / apiPostAuth (require session.accessToken)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiError {
  error: string
  message?: string
  code?: string
}

/**
 * Helper: make API request
 * Supports optional Authorization header for authenticated requests
 */
async function makeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  token?: string // Optional JWT token for authenticated requests
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_URL}${path}`
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Parse response
  const data = await response.json()

  if (!response.ok) {
    const error = data as ApiError
    throw new Error(error.message || error.error || `API error: ${response.status}`)
  }

  return data as T
}

/**
 * GET request (no auth) — for public routes like GET /markets
 */
export async function apiGet<T>(path: string): Promise<T> {
  return makeRequest<T>('GET', path)
}

/**
 * GET request with required auth — for private routes like /me/balance
 */
export async function apiGetAuth<T>(path: string, token: string): Promise<T> {
  return makeRequest<T>('GET', path, undefined, token)
}

/**
 * POST request (no auth)
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return makeRequest<T>('POST', path, body)
}

/**
 * POST request with required auth — for routes like POST /markets, POST /bets
 */
export async function apiPostAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  return makeRequest<T>('POST', path, body, token)
}

/**
 * PATCH request with required auth
 */
export async function apiPatchAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  return makeRequest<T>('PATCH', path, body, token)
}

/**
 * PUT request with optional auth
 */
export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  return makeRequest<T>('PUT', path, body, token)
}

/**
 * DELETE request with optional auth
 */
export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  return makeRequest<T>('DELETE', path, undefined, token)
}

/**
 * GET request with admin secret — for admin-only routes
 */
export async function apiGetAdmin<T>(path: string, adminSecret: string): Promise<T> {
  return makeRequest<T>('GET', path, undefined, adminSecret)
}

/**
 * POST request with admin secret — for admin-only routes
 */
export async function apiPostAdmin<T>(path: string, body: unknown, adminSecret: string): Promise<T> {
  return makeRequest<T>('POST', path, body, adminSecret)
}
