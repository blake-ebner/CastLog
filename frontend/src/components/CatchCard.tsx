import { Link } from 'react-router-dom'
import type { CatchOut } from '../types'

interface Props {
  catch_: CatchOut
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CatchCard({ catch_: c }: Props) {
  return (
    <Link to={`/catches/${c.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        {c.photo_url ? (
          <img
            src={c.photo_url}
            alt={c.species}
            className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center text-4xl">
            🎣
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 text-lg leading-tight">{c.species}</h3>
            {c.kept && (
              <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Kept
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
            {c.weight_lbs != null && <span>{c.weight_lbs} lbs</span>}
            {c.length_inches != null && <span>{c.length_inches}"</span>}
            {c.water_body && <span>{c.water_body}</span>}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{fmt(c.caught_at)}</span>
            {c.username && (
              <span
                className="text-blue-600 hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                <Link to={`/users/${c.user_id}`} onClick={(e) => e.stopPropagation()}>
                  @{c.username}
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
