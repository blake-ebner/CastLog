export interface Token {
  access_token: string
  token_type: string
}

export interface UserOut {
  id: number
  username: string
  email: string
  created_at: string
}

export interface UserStats {
  total_catches: number
  species_count: number
  personal_best_lbs: number | null
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
}

export interface PaginatedCatches {
  items: CatchOut[]
  total: number
  page: number
  page_size: number
  pages: number
}
