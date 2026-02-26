/**
 * API Client Wrapper
 *
 * Calls backend API at NEXT_PUBLIC_API_URL
 * For public routes (GET /markets, etc.)
 * For authenticated routes, use server actions in components
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
 * GET request (no auth)
 */
export async function apiGet<T>(path: string): Promise<T> {
  return makeRequest<T>('GET', path)
}

/**
 * POST request with optional auth
 */
export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return makeRequest<T>('POST', path, body, token)
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
