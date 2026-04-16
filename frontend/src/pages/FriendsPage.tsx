import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  apiGetFriends,
  apiAcceptFriendRequest,
  apiDeclineFriendRequest,
  apiCancelFriendRequest,
  apiRemoveFriend,
  apiSearchUsers,
  apiSendFriendRequest,
} from '../api/client'
import type { FriendData, UserOut } from '../types'

export default function FriendsPage() {
  const [data, setData] = useState<FriendData | null>(null)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserOut[]>([])
  const [searchError, setSearchError] = useState('')
  const [pendingActions, setPendingActions] = useState<Set<number>>(new Set())
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = () => {
    apiGetFriends()
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }

  useEffect(() => { load() }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchError('')
      return
    }
    searchTimeout.current = setTimeout(() => {
      apiSearchUsers(searchQuery.trim())
        .then((r) => { setSearchResults(r.users); setSearchError('') })
        .catch((e: Error) => setSearchError(e.message))
    }, 300)
  }, [searchQuery])

  const withPending = async (id: number, fn: () => Promise<void>) => {
    setPendingActions((s) => new Set(s).add(id))
    try {
      await fn()
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPendingActions((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }

  const friendIds = new Set(data?.friends.map((f) => f.id) ?? [])
  const outgoingIds = new Set(data?.outgoing_requests.map((r) => r.user.id) ?? [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Friends</h1>

      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* ── Incoming requests ─────────────────────────────────────────── */}
      {data && data.incoming_requests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Friend Requests
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {data.incoming_requests.length}
            </span>
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {data.incoming_requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/users/${req.user.id}`}
                  className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  @{req.user.username}
                </Link>
                <div className="flex gap-2">
                  <button
                    disabled={pendingActions.has(req.id)}
                    onClick={() => withPending(req.id, () => apiAcceptFriendRequest(req.id))}
                    className="text-sm px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    disabled={pendingActions.has(req.id)}
                    onClick={() => withPending(req.id, () => apiDeclineFriendRequest(req.id))}
                    className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Find friends ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Find Friends</h2>
        <input
          type="text"
          placeholder="Search by username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {searchResults.map((u) => {
              const isFriend = friendIds.has(u.id)
              const sentRequest = outgoingIds.has(u.id)
              const reqRow = data?.outgoing_requests.find((r) => r.user.id === u.id)
              return (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <Link
                    to={`/users/${u.id}`}
                    className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  >
                    @{u.username}
                  </Link>
                  {isFriend ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">Friends</span>
                  ) : sentRequest && reqRow ? (
                    <button
                      disabled={pendingActions.has(reqRow.id)}
                      onClick={() => withPending(reqRow.id, () => apiCancelFriendRequest(reqRow.id))}
                      className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <button
                      disabled={pendingActions.has(u.id)}
                      onClick={() => withPending(u.id, () => apiSendFriendRequest(u.id))}
                      className="text-sm px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Friends list ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
          My Friends {data && `(${data.friends.length})`}
        </h2>
        {!data ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        ) : data.friends.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            No friends yet — search for someone above!
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {data.friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/users/${friend.id}`}
                  className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  @{friend.username}
                </Link>
                <button
                  disabled={pendingActions.has(friend.id)}
                  onClick={() => withPending(friend.id, () => apiRemoveFriend(friend.id))}
                  className="text-xs px-2 py-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Sent requests ─────────────────────────────────────────────── */}
      {data && data.outgoing_requests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Sent Requests</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {data.outgoing_requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/users/${req.user.id}`}
                  className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  @{req.user.username}
                </Link>
                <button
                  disabled={pendingActions.has(req.id)}
                  onClick={() => withPending(req.id, () => apiCancelFriendRequest(req.id))}
                  className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
