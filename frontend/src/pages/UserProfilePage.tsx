import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  apiGetUserProfile,
  apiGetUserCatches,
  apiGetFriendshipStatus,
  apiSendFriendRequest,
  apiAcceptFriendRequest,
  apiDeclineFriendRequest,
  apiCancelFriendRequest,
  apiRemoveFriend,
} from '../api/client'
import type { UserProfile, PaginatedCatches, FriendshipStatus } from '../types'
import CatchCard from '../components/CatchCard'
import Pagination from '../components/Pagination'
import Achievements from '../components/Achievements'
import { useAuth } from '../context/AuthContext'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: me } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [catches, setCatches] = useState<PaginatedCatches | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus | null>(null)
  const [friendPending, setFriendPending] = useState(false)

  useEffect(() => {
    if (!id) return
    const uid = Number(id)
    setError('')
    apiGetUserProfile(uid).then(setProfile).catch((e: Error) => setError(e.message))
    if (me && me.id !== uid) {
      apiGetFriendshipStatus(uid).then(setFriendStatus).catch(() => {})
    }
  }, [id, me])

  useEffect(() => {
    if (!id) return
    apiGetUserCatches(Number(id), page).then(setCatches).catch(() => {})
  }, [id, page])

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">{error}</div>
      </div>
    )
  }

  const isMe = me?.id === Number(id)

  const handleFriendAction = async () => {
    if (!friendStatus || !id) return
    setFriendPending(true)
    try {
      const uid = Number(id)
      if (friendStatus.status === 'none') {
        await apiSendFriendRequest(uid)
      } else if (friendStatus.status === 'pending_received' && friendStatus.request_id) {
        await apiAcceptFriendRequest(friendStatus.request_id)
      } else if (friendStatus.status === 'pending_sent' && friendStatus.request_id) {
        await apiCancelFriendRequest(friendStatus.request_id)
      } else if (friendStatus.status === 'friends') {
        await apiRemoveFriend(uid)
      }
      const updated = await apiGetFriendshipStatus(uid)
      setFriendStatus(updated)
    } catch {
      // silently ignore — user stays on the page
    } finally {
      setFriendPending(false)
    }
  }

  const handleDecline = async () => {
    if (!friendStatus?.request_id || !id) return
    setFriendPending(true)
    try {
      await apiDeclineFriendRequest(friendStatus.request_id)
      setFriendStatus({ status: 'none', request_id: null })
    } catch {
      // ignore
    } finally {
      setFriendPending(false)
    }
  }

  const joined = profile
    ? new Date(profile.user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        {!profile ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-1/4" />
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  @{profile.user.username}
                  {isMe && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium align-middle">
                      You
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Member since {joined}</p>
              </div>

              {/* Friend button — only visible to logged-in users viewing someone else */}
              {me && !isMe && friendStatus && (
                <div className="flex gap-2 ml-4">
                  {friendStatus.status === 'pending_received' && (
                    <button
                      disabled={friendPending}
                      onClick={handleDecline}
                      className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      Decline
                    </button>
                  )}
                  <button
                    disabled={friendPending}
                    onClick={handleFriendAction}
                    className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${
                      friendStatus.status === 'friends'
                        ? 'bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400'
                        : friendStatus.status === 'pending_sent'
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                        : friendStatus.status === 'pending_received'
                        ? 'bg-blue-700 hover:bg-blue-600 text-white'
                        : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {friendStatus.status === 'friends'
                      ? 'Remove Friend'
                      : friendStatus.status === 'pending_sent'
                      ? 'Request Sent'
                      : friendStatus.status === 'pending_received'
                      ? 'Accept Request'
                      : 'Add Friend'}
                  </button>
                  {friendStatus.status === 'friends' && (
                    <Link
                      to={`/messages/${Number(id)}`}
                      className="text-sm px-3 py-1.5 rounded-md font-medium transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    >
                      Message
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {profile.stats.total_catches}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total catches</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {profile.stats.species_count}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Species caught</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {profile.stats.personal_best_lbs != null
                    ? `${profile.stats.personal_best_lbs} lbs`
                    : '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personal best</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Achievements */}
      {profile && (
        <div className="mb-8">
          <Achievements achievements={profile.stats.achievements} />
        </div>
      )}

      {/* Species records */}
      {profile && profile.stats.species_records.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Species Records</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {profile.stats.species_records.map((r) => (
              <Link
                key={r.catch_id}
                to={`/catches/${r.catch_id}`}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 rounded transition-colors"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">{r.species}</span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{r.weight_lbs} lbs</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Catches */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isMe ? 'Your catches' : 'Catches'}
        </h2>
        {isMe && (
          <Link
            to="/log"
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Log a Catch
          </Link>
        )}
      </div>

      {catches && catches.items.length === 0 && (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <p className="text-3xl mb-2">🎣</p>
          <p className="text-sm">No catches logged yet</p>
        </div>
      )}

      {catches && catches.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {catches.items.map((c) => (
              <CatchCard key={c.id} catch_={c} />
            ))}
          </div>
          <Pagination page={catches.page} pages={catches.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
