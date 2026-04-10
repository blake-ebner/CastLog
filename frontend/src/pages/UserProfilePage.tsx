import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGetUserProfile, apiGetUserCatches } from '../api/client'
import type { UserProfile, PaginatedCatches } from '../types'
import CatchCard from '../components/CatchCard'
import Pagination from '../components/Pagination'
import { useAuth } from '../context/AuthContext'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: me } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [catches, setCatches] = useState<PaginatedCatches | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const uid = Number(id)
    setError('')
    apiGetUserProfile(uid).then(setProfile).catch((e: Error) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (!id) return
    apiGetUserCatches(Number(id), page).then(setCatches).catch(() => {})
  }, [id, page])

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
      </div>
    )
  }

  const isMe = me?.id === Number(id)
  const joined = profile
    ? new Date(profile.user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        {!profile ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  @{profile.user.username}
                  {isMe && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium align-middle">
                      You
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Member since {joined}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {profile.stats.total_catches}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Total catches</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {profile.stats.species_count}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Species caught</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {profile.stats.personal_best_lbs != null
                    ? `${profile.stats.personal_best_lbs} lbs`
                    : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Personal best</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Catches */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
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
        <div className="text-center py-16 text-slate-500">
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
