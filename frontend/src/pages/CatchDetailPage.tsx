import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiGetCatch, apiDeleteCatch } from '../api/client'
import type { CatchOut } from '../types'
import { useAuth } from '../context/AuthContext'

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-100 font-medium text-right">{String(value)}</span>
    </div>
  )
}

export default function CatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [catch_, setCatch] = useState<CatchOut | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    apiGetCatch(Number(id))
      .then(setCatch)
      .catch((e: Error) => setError(e.message))
  }, [id])

  const handleDelete = async () => {
    if (!catch_ || !confirm('Delete this catch? This cannot be undone.')) return
    setDeleting(true)
    try {
      await apiDeleteCatch(catch_.id)
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">{error}</div>
      </div>
    )
  }

  if (!catch_) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-xl" />
        <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-1/3" />
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
      </div>
    )
  }

  const isOwner = user?.id === catch_.user_id

  const fmt = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {catch_.photo_url && (
        <img
          src={catch_.photo_url}
          alt={catch_.species}
          className="w-full h-72 object-cover rounded-xl mb-6 shadow-sm"
        />
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{catch_.species}</h1>
          {catch_.username && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Logged by{' '}
              <Link to={`/users/${catch_.user_id}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                @{catch_.username}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {catch_.is_personal_best && catch_.weight_lbs != null && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 px-2 py-1 rounded-full font-semibold">
              🏆 Species PB
            </span>
          )}
          {catch_.kept && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
              Kept
            </span>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 divide-y divide-slate-100 dark:divide-slate-700">
        <Row label="Caught" value={fmt(catch_.caught_at)} />
        <Row label="Water body" value={catch_.water_body} />
        <Row label="Weight" value={catch_.weight_lbs != null ? `${catch_.weight_lbs} lbs` : null} />
        <Row label="Length" value={catch_.length_inches != null ? `${catch_.length_inches}"` : null} />
        <Row label="Bait / Lure" value={catch_.bait_lure} />
        <Row label="Technique" value={catch_.technique} />
        <Row label="Weather" value={catch_.weather} />
        <Row label="Water temp" value={catch_.water_temp_f != null ? `${catch_.water_temp_f}°F` : null} />
      </div>

      {catch_.notes && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{catch_.notes}</p>
        </div>
      )}

      <div className="mt-6">
        <Link to="/" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">
          ← Back to feed
        </Link>
      </div>
    </div>
  )
}
