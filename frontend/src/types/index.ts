export interface Token {
  access_token: string
  token_type: string
}

export interface UserOut {
  id: number
  username: string
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
}

export interface SpeciesRecord {
  species: string
  weight_lbs: number
  catch_id: number
}

export interface UserStats {
  total_catches: number
  species_count: number
  personal_best_lbs: number | null
  species_records: SpeciesRecord[]
  achievements: Achievement[]
}

export interface UserProfile {
  user: UserOut
  stats: UserStats
}

export interface CatchOut {
  id: number
  user_id: number
  species: string
  weight_lbs: number | null
  length_inches: number | null
  water_body: string | null
  caught_at: string
  bait_lure: string | null
  technique: string | null
  weather: string | null
  water_temp_f: number | null
  kept: boolean
  notes: string | null
  photo_url: string | null
  created_at: string
  username: string | null
  is_personal_best: boolean
}

export interface PaginatedCatches {
  items: CatchOut[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ── Friends ───────────────────────────────────────────────────────────────────

export interface FriendRequestOut {
  id: number
  user: UserOut
  created_at: string
}

export interface FriendshipStatus {
  // "none" | "pending_sent" | "pending_received" | "friends" | "self"
  status: string
  request_id: number | null
}

export interface FriendData {
  friends: UserOut[]
  incoming_requests: FriendRequestOut[]
  outgoing_requests: FriendRequestOut[]
}

export interface UserSearchResult {
  users: UserOut[]
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface MessageOut {
  id: number
  sender_id: number
  receiver_id: number
  body: string
  created_at: string
}

export interface ConversationSummary {
  friend: UserOut
  last_message: MessageOut
  unread_count: number
}

// ── Comments ──────────────────────────────────────────────────────────────────

export interface CommentOut {
  id: number
  catch_id: number
  user_id: number
  username: string
  body: string
  created_at: string
}
