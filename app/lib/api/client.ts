/**
 * Base HTTP Client for Helix Insight API
 * Follows Lumiere pattern with proper error handling
 *
 * Reads JWT from cookie (shared with marketing site).
 * On 401 response, clears cookie and redirects to /login.
 */

import { tokenUtils } from '@/lib/auth/token'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
const DEFAULT_TIMEOUT = 30000

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

function getAuthToken(): string | null {
  return tokenUtils.get()
}

function getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const token = tokenUtils.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Always send token if it exists -- let the server validate expiry.
  // Previously this checked tokenUtils.isValid() which silently dropped
  // the Authorization header when close to expiry, causing 401 cascades.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders)
  }

  return headers
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle 401 -- token expired or invalid
    if (response.status === 401) {
      tokenUtils.remove()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    let errorMessage = `HTTP ${response.status}`
    let errorCode: string | undefined

    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
      errorCode = errorData.code
    } catch {
      errorMessage = response.statusText || errorMessage
    }

    throw new ApiError(errorMessage, response.status, errorCode)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return undefined as T
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const headers = getHeaders(options.headers)

  const response = await fetchWithTimeout(
    url,
    { ...options, headers },
    timeout
  )

  return handleResponse<T>(response)
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

export async function post<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function patch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function put<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

// File upload helper (without progress)
export async function uploadFile<T>(
  endpoint: string,
  file: File,
  additionalFields?: Record<string, string>
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)

  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value)
    })
  }

  const url = `${API_URL}${endpoint}`
  const token = getAuthToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  return handleResponse<T>(response)
}

// File upload with progress tracking
export async function uploadFileWithProgress<T>(
  endpoint: string,
  file: File,
  additionalFields?: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${API_URL}${endpoint}`

    // Setup form data
    const formData = new FormData()
    formData.append('file', file)

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    // CRITICAL: Open connection FIRST
    xhr.open('POST', url)
    xhr.timeout = 300000 // 5 minutes for large files

    // THEN set headers (after open)
    const token = getAuthToken()
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress(Math.round(percentComplete))
      }
    })

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new ApiError('Invalid JSON response', xhr.status))
        }
      } else {
        // Handle 401 in upload
        if (xhr.status === 401) {
          tokenUtils.remove()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }

        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(
            new ApiError(
              errorData.detail || errorData.message || `HTTP ${xhr.status}`,
              xhr.status,
              errorData.code
            )
          )
        } catch {
          reject(new ApiError(xhr.statusText || `HTTP ${xhr.status}`, xhr.status))
        }
      }
    })

    // Error handler
    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error occurred'))
    })

    // Timeout handler
    xhr.addEventListener('timeout', () => {
      reject(new TimeoutError('Upload timeout'))
    })

    // Abort handler
    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload cancelled'))
    })

    // Send request (LAST step)
    xhr.send(formData)
  })
}
