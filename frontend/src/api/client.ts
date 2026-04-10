import type { Token, UserProfile, CatchOut, PaginatedCatches } from '../types'

const BASE = '/api'

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiRegister(
  username: string,
  email: string,
  password: string,
): Promise<Token> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  return handleResponse<Token>(res)
}

export async function apiLogin(username: string, password: string): Promise<Token> {
  const body = new URLSearchParams({ username, password })
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return handleResponse<Token>(res)
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function apiGetMyProfile(): Promise<UserProfile> {
  const res = await fetch(`${BASE}/users/me/profile`, {
    headers: authHeader(),
  })
  return handleResponse<UserProfile>(res)
}

export async function apiGetUserProfile(userId: number): Promise<UserProfile> {
  const res = await fetch(`${BASE}/users/${userId}`)
  return handleResponse<UserProfile>(res)
}

export async function apiGetUserCatches(
  userId: number,
  page = 1,
  pageSize = 20,
): Promise<PaginatedCatches> {
  const res = await fetch(`${BASE}/users/${userId}/catches?page=${page}&page_size=${pageSize}`)
  return handleResponse<PaginatedCatches>(res)
}

// ── Catches ───────────────────────────────────────────────────────────────────

export async function apiListCatches(page = 1, pageSize = 20): Promise<PaginatedCatches> {
  const res = await fetch(`${BASE}/catches?page=${page}&page_size=${pageSize}`)
  return handleResponse<PaginatedCatches>(res)
}

export async function apiGetCatch(id: number): Promise<CatchOut> {
  const res = await fetch(`${BASE}/catches/${id}`)
  return handleResponse<CatchOut>(res)
}

export async function apiCreateCatch(formData: FormData): Promise<CatchOut> {
  const res = await fetch(`${BASE}/catches`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  })
  return handleResponse<CatchOut>(res)
}

export async function apiDeleteCatch(id: number): Promise<void> {
  const res = await fetch(`${BASE}/catches/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}
