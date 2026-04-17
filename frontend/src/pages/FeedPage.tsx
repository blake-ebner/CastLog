import { useEffect, useState } from 'react'
import { apiListCatches } from '../api/client'
import type { PaginatedCatches } from '../types'
import CatchCard from '../components/CatchCard'
import Pagination from '../components/Pagination'

export default function FeedPage() {
  const [data, setData] = useState<PaginatedCatches | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    apiListCatches(page)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [page])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Recent Catches</h1>
          {data && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{data.total} catches logged</p>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="h-44 bg-slate-100 dark:bg-slate-700 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-3">🎣</p>
          <p className="text-lg font-medium">No catches yet</p>
          <p className="text-sm mt-1">Be the first to log one!</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((c) => (
              <CatchCard key={c.id} catch_={c} />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
