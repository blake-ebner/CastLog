import type { Achievement } from '../types'

const ICONS: Record<string, string> = {
  catches_1: '🎣',
  catches_10: '📈',
  catches_100: '🏅',
  catches_1000: '🏆',
  weight_5: '⚖️',
  weight_10: '💪',
  weight_50: '🦈',
  weight_100: '👑',
  species_5: '🐟',
  species_10: '🌊',
  species_25: '🗺️',
  species_100: '🎓',
}

interface Props {
  achievements: Achievement[]
}

export default function Achievements({ achievements }: Props) {
  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
        Achievements
        <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
          {unlocked.length}/{achievements.length}
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex flex-col items-center text-center shadow-sm"
          >
            <span className="text-3xl mb-2">{ICONS[a.id] ?? '🎖️'}</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>
          </div>
        ))}

        {locked.map((a) => (
          <div
            key={a.id}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center text-center opacity-50"
          >
            <span className="text-3xl mb-2 grayscale">{ICONS[a.id] ?? '🎖️'}</span>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{a.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
