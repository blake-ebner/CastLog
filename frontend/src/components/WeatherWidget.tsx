import { useEffect, useState } from 'react'

interface CurrentWeather {
  temperature_2m: number
  weathercode: number
  windspeed_10m: number
  surface_pressure: number
}

interface DailyWeather {
  time: string[]
  weathercode: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  windspeed_10m_max: number[]
  precipitation_sum: (number | null)[]
}

interface WeatherData {
  current: CurrentWeather
  daily: DailyWeather
  pressureTrend: number // hPa change over last 6 hours
}

function wmoEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}

function wmoLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code === 66 || code === 67) return 'Freezing rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code === 95) return 'Thunderstorm'
  if (code === 96 || code === 99) return 'Hail storm'
  return 'Unknown'
}

function fishingScore(
  weathercode: number,
  windMph: number,
  precipMm: number | null,
  pressureTrend?: number,
  currentPressure?: number,
): number {
  let score = 65
  const precip = precipMm ?? 0

  if (windMph < 5) score += 20
  else if (windMph < 10) score += 15
  else if (windMph < 15) score += 5
  else if (windMph < 20) score -= 10
  else if (windMph < 30) score -= 25
  else score -= 40

  if (weathercode <= 1) score += 5
  else if (weathercode === 2) score += 15
  else if (weathercode === 3) score += 10
  else if (weathercode <= 48) score += 0
  else if (weathercode <= 55) score -= 5
  else if (weathercode <= 67) score -= 15
  else if (weathercode <= 77) score -= 20
  else if (weathercode <= 82) score -= 10
  else score -= 35

  if (precip > 15) score -= 15
  else if (precip > 5) score -= 8
  else if (precip > 1) score -= 3

  if (pressureTrend !== undefined) {
    if (pressureTrend > 4) score += 15       // rapidly rising — fish feeding aggressively
    else if (pressureTrend > 2) score += 10  // rising
    else if (pressureTrend < -4) score -= 20 // rapidly falling — fish going deep
    else if (pressureTrend < -2) score -= 12 // falling
    else if (currentPressure !== undefined) {
      // stable — absolute value matters
      if (currentPressure > 1015) score += 5
      else if (currentPressure < 1009) score -= 8
    }
  }

  return Math.max(0, Math.min(100, score))
}

function scoreInfo(score: number): { label: string; dotClass: string; badgeClass: string } {
  if (score >= 80) return {
    label: 'Great',
    dotClass: 'bg-green-500',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  }
  if (score >= 60) return {
    label: 'Good',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  }
  if (score >= 40) return {
    label: 'Fair',
    dotClass: 'bg-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  }
  return {
    label: 'Poor',
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }
}

function conditionTip(weathercode: number, windMph: number, pressureTrend: number): string {
  if (weathercode >= 95) return 'Thunderstorms — stay off the water'
  if (windMph >= 25) return 'High winds make casting difficult'
  if (pressureTrend < -4) return 'Pressure dropping fast — fish going deep, slow down your presentation'
  if (pressureTrend > 4) return 'Pressure rising fast — fish are feeding aggressively near the surface'
  if (weathercode >= 80) return 'Rain showers — fish may be feeding near the surface'
  if (weathercode >= 61) return 'Rainy — try slow presentations and deeper cover'
  if (pressureTrend > 2) return 'Rising pressure — good time to be on the water'
  if (pressureTrend < -2) return 'Falling pressure — fish slowing down, try bottom rigs'
  if (weathercode === 2 || weathercode === 3) return 'Overcast skies keep fish active and less wary'
  if (weathercode <= 1 && windMph < 10) return 'Calm and clear — try early morning or shaded structure'
  if (windMph >= 15) return 'Moderate wind — seek sheltered bays or coves'
  return 'Decent overall — standard approaches should work'
}

function dayLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tmrw'
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function fullDayLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function detailedTip(weathercode: number, windMph: number, precipMm: number | null): string[] {
  const precip = precipMm ?? 0
  const tips: string[] = []

  if (weathercode >= 95) {
    tips.push('Thunderstorms are forecast — stay off the water entirely.')
    return tips
  }

  if (windMph >= 25) tips.push(`Winds up to ${Math.round(windMph)} mph will make casting very difficult. Seek sheltered bays or skip the day.`)
  else if (windMph >= 15) tips.push(`Moderate winds up to ${Math.round(windMph)} mph — fish coves and spots protected from the wind.`)
  else if (windMph < 8) tips.push(`Light winds (${Math.round(windMph)} mph max) — great conditions for precision casting.`)
  else tips.push(`Wind up to ${Math.round(windMph)} mph — manageable, but factor it into your casting angle.`)

  if (weathercode === 0 || weathercode === 1) tips.push('Clear skies will push fish into shaded structure and deeper water. Focus on early morning or evening when light is low.')
  else if (weathercode === 2) tips.push('Partly cloudy skies are ideal — fish will be more active and less wary of surface presentations.')
  else if (weathercode === 3) tips.push('Overcast all day, which is great for fishing. Fish are less skittish and will roam wider.')
  else if (weathercode === 45 || weathercode === 48) tips.push('Foggy conditions — fish are often active in the shallows, but be cautious on the water.')
  else if (weathercode >= 51 && weathercode <= 55) tips.push('Light drizzle expected — fish tend to feed actively during light rain, especially near the surface.')
  else if (weathercode >= 61 && weathercode <= 67) tips.push('Rain in the forecast. Fishing can be good just before the rain picks up, but activity slows in heavy downpours.')
  else if (weathercode >= 71 && weathercode <= 77) tips.push('Snow forecast — cold water will slow fish metabolism. Target deeper, warmer water.')
  else if (weathercode >= 80 && weathercode <= 82) tips.push('Scattered showers throughout the day. Fish between the showers for the best bite.')

  if (precip > 15) tips.push(`Heavy precipitation expected (${precip.toFixed(1)} mm) — runoff may muddy the water and reduce visibility.`)
  else if (precip > 3) tips.push(`Some precipitation expected (${precip.toFixed(1)} mm).`)

  return tips
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,weathercode,windspeed_10m,surface_pressure` +
            `&hourly=surface_pressure` +
            `&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum` +
            `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5&past_hours=6`
          )
          const data = await res.json()
          // past_hours=6 puts 6 historical readings at the start of the hourly array
          const pastPressures: number[] = (data.hourly?.surface_pressure ?? []).slice(0, 6)
          const pressureTrend =
            pastPressures.length >= 2
              ? pastPressures[pastPressures.length - 1] - pastPressures[0]
              : 0
          setWeather({ current: data.current, daily: data.daily, pressureTrend })
        } catch {
          // silently fail
        } finally {
          setLoading(false)
        }
      },
      () => {
        setDenied(true)
        setLoading(false)
      }
    )
  }, [])

  if (denied) return null

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-40 mb-4" />
        <div className="h-12 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-20 bg-slate-100 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!weather) return null

  const { current, daily, pressureTrend } = weather
  const todayScore = fishingScore(
    current.weathercode,
    current.windspeed_10m,
    daily.precipitation_sum[0],
    pressureTrend,
    current.surface_pressure,
  )
  const todayInfo = scoreInfo(todayScore)
  const pressureArrow = pressureTrend > 2 ? '↑' : pressureTrend < -2 ? '↓' : '→'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
          Fishing Conditions
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">📍 Near you</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl leading-none">{wmoEmoji(current.weathercode)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {Math.round(current.temperature_2m)}°F
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{wmoLabel(current.weathercode)}</span>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>💨 {Math.round(current.windspeed_10m)} mph</span>
            <span>🌡 {Math.round(current.surface_pressure)} hPa {pressureArrow}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${todayInfo.badgeClass}`}>
            {todayInfo.label}
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">fishing today</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4 border-l-2 border-slate-200 dark:border-slate-600 pl-2">
        {conditionTip(current.weathercode, current.windspeed_10m, pressureTrend)}
      </p>

      <div className="grid grid-cols-5 gap-1.5">
        {daily.time.map((date, i) => {
          const score = fishingScore(daily.weathercode[i], daily.windspeed_10m_max[i], daily.precipitation_sum[i])
          const info = scoreInfo(score)
          const isSelected = selectedDay === i
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(isSelected ? null : i)}
              className={`flex flex-col items-center gap-1 rounded-lg py-2.5 px-1 transition-colors w-full
                ${isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400 dark:ring-blue-500'
                  : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dayLabel(date, i)}</span>
              <span className="text-xl leading-none">{wmoEmoji(daily.weathercode[i])}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {Math.round(daily.temperature_2m_max[i])}°
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${info.dotClass}`} title={info.label} />
            </button>
          )
        })}
      </div>

      {selectedDay !== null && (() => {
        const i = selectedDay
        const score = fishingScore(daily.weathercode[i], daily.windspeed_10m_max[i], daily.precipitation_sum[i])
        const info = scoreInfo(score)
        const tips = detailedTip(daily.weathercode[i], daily.windspeed_10m_max[i], daily.precipitation_sum[i])
        const precip = daily.precipitation_sum[i] ?? 0
        return (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{wmoEmoji(daily.weathercode[i])}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    {fullDayLabel(daily.time[i], i)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{wmoLabel(daily.weathercode[i])}</p>
                </div>
              </div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${info.badgeClass}`}>
                {info.label} fishing
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-white dark:bg-slate-800 rounded-lg py-2 px-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">High / Low</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {Math.round(daily.temperature_2m_max[i])}° / {Math.round(daily.temperature_2m_min[i])}°F
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg py-2 px-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Max Wind</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {Math.round(daily.windspeed_10m_max[i])} mph
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg py-2 px-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Rain</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {precip > 0 ? `${precip.toFixed(1)} mm` : 'None'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {tips.map((tip, t) => (
                <p key={t} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                  <span className="text-slate-300 dark:text-slate-500 shrink-0">•</span>
                  {tip}
                </p>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="flex gap-3 mt-2 justify-end">
        {[
          { cls: 'bg-green-500', label: 'Great' },
          { cls: 'bg-blue-500', label: 'Good' },
          { cls: 'bg-yellow-400', label: 'Fair' },
          { cls: 'bg-red-500', label: 'Poor' },
        ].map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
