import type { Token, UserProfile, CatchOut, PaginatedCatches, FriendData, FriendshipStatus, UserSearchResult, CommentOut, MessageOut, ConversationSummary } from '../types'

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

// ── Friends ───────────────────────────────────────────────────────────────────

export async function apiGetFriends(): Promise<FriendData> {
  const res = await fetch(`${BASE}/friends`, { headers: authHeader() })
  return handleResponse<FriendData>(res)
}

export async function apiGetFriendshipStatus(userId: number): Promise<FriendshipStatus> {
  const res = await fetch(`${BASE}/friends/status/${userId}`, { headers: authHeader() })
  return handleResponse<FriendshipStatus>(res)
}

export async function apiSendFriendRequest(userId: number): Promise<void> {
  const res = await fetch(`${BASE}/friends/request/${userId}`, {
    method: 'POST',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

export async function apiAcceptFriendRequest(requestId: number): Promise<void> {
  const res = await fetch(`${BASE}/friends/accept/${requestId}`, {
    method: 'POST',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

export async function apiDeclineFriendRequest(requestId: number): Promise<void> {
  const res = await fetch(`${BASE}/friends/decline/${requestId}`, {
    method: 'POST',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

export async function apiCancelFriendRequest(requestId: number): Promise<void> {
  const res = await fetch(`${BASE}/friends/request/${requestId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

export async function apiRemoveFriend(userId: number): Promise<void> {
  const res = await fetch(`${BASE}/friends/${userId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

export async function apiSearchUsers(q: string): Promise<UserSearchResult> {
  const res = await fetch(`${BASE}/users/search?q=${encodeURIComponent(q)}`)
  return handleResponse<UserSearchResult>(res)
}

export async function apiGetFriendsFeed(page = 1, pageSize = 20): Promise<PaginatedCatches> {
  const res = await fetch(`${BASE}/friends/feed?page=${page}&page_size=${pageSize}`, {
    headers: authHeader(),
  })
  return handleResponse<PaginatedCatches>(res)
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function apiGetConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE}/messages/conversations`, { headers: authHeader() })
  return handleResponse<ConversationSummary[]>(res)
}

export async function apiGetConversation(userId: number): Promise<MessageOut[]> {
  const res = await fetch(`${BASE}/messages/${userId}`, { headers: authHeader() })
  return handleResponse<MessageOut[]>(res)
}

export async function apiSendMessage(userId: number, body: string): Promise<MessageOut> {
  const res = await fetch(`${BASE}/messages/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ body }),
  })
  return handleResponse<MessageOut>(res)
}

export async function apiDeleteMessage(messageId: number): Promise<void> {
  const res = await fetch(`${BASE}/messages/${messageId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function apiGetComments(catchId: number): Promise<CommentOut[]> {
  const res = await fetch(`${BASE}/catches/${catchId}/comments`)
  return handleResponse<CommentOut[]>(res)
}

export async function apiPostComment(catchId: number, body: string): Promise<CommentOut> {
  const res = await fetch(`${BASE}/catches/${catchId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ body }),
  })
  return handleResponse<CommentOut>(res)
}

export async function apiDeleteComment(commentId: number): Promise<void> {
  const res = await fetch(`${BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return handleResponse<void>(res)
}
