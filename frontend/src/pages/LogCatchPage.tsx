import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCreateCatch } from '../api/client'

const WEATHER_OPTIONS = ['Sunny', 'Cloudy', 'Overcast', 'Rainy', 'Windy', 'Foggy']
const TECHNIQUE_OPTIONS = [
  'Casting',
  'Trolling',
  'Jigging',
  'Fly fishing',
  'Ice fishing',
  'Bottom fishing',
  'Drift fishing',
]

export default function LogCatchPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    species: '',
    weight_lbs: '',
    length_inches: '',
    water_body: '',
    caught_at: '',
    bait_lure: '',
    technique: '',
    weather: '',
    water_temp_f: '',
    kept: false,
    notes: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPhoto(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.append('species', form.species)
    if (form.weight_lbs) fd.append('weight_lbs', form.weight_lbs)
    if (form.length_inches) fd.append('length_inches', form.length_inches)
    if (form.water_body) fd.append('water_body', form.water_body)
    if (form.caught_at) fd.append('caught_at', new Date(form.caught_at).toISOString())
    if (form.bait_lure) fd.append('bait_lure', form.bait_lure)
    if (form.technique) fd.append('technique', form.technique)
    if (form.weather) fd.append('weather', form.weather)
    if (form.water_temp_f) fd.append('water_temp_f', form.water_temp_f)
    fd.append('kept', form.kept ? 'true' : 'false')
    if (form.notes) fd.append('notes', form.notes)
    if (photo) fd.append('photo', photo)

    try {
      const created = await apiCreateCatch(fd)
      navigate(`/catches/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log catch')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Log a Catch</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Species — required */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            The Fish
          </h2>
          <div>
            <label className={labelCls}>
              Species <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Largemouth Bass"
              value={form.species}
              onChange={(e) => set('species', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Weight (lbs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="3.5"
                value={form.weight_lbs}
                onChange={(e) => set('weight_lbs', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Length (inches)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="18"
                value={form.length_inches}
                onChange={(e) => set('length_inches', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.kept}
              onChange={(e) => set('kept', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Fish was kept</span>
          </label>
        </div>

        {/* Location & time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Where & When
          </h2>
          <div>
            <label className={labelCls}>Water body</label>
            <input
              type="text"
              placeholder="e.g. Lake Ontario"
              value={form.water_body}
              onChange={(e) => set('water_body', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Date & time caught</label>
            <input
              type="datetime-local"
              value={form.caught_at}
              onChange={(e) => set('caught_at', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Method & conditions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Method & Conditions
          </h2>
          <div>
            <label className={labelCls}>Bait / Lure</label>
            <input
              type="text"
              placeholder="e.g. Chartreuse spinnerbait"
              value={form.bait_lure}
              onChange={(e) => set('bait_lure', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Technique</label>
            <select
              value={form.technique}
              onChange={(e) => set('technique', e.target.value)}
              className={inputCls}
            >
              <option value="">— Select —</option>
              {TECHNIQUE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Weather</label>
              <select
                value={form.weather}
                onChange={(e) => set('weather', e.target.value)}
                className={inputCls}
              >
                <option value="">— Select —</option>
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Water temp (°F)</label>
              <input
                type="number"
                step="0.1"
                placeholder="68"
                value={form.water_temp_f}
                onChange={(e) => set('water_temp_f', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Notes & photo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Notes & Photo
          </h2>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={3}
              placeholder="Any extra details…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={inputCls + ' resize-none'}
            />
          </div>

          <div>
            <label className={labelCls}>Photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhoto}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null)
                    setPreview(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-700 rounded-full w-7 h-7 flex items-center justify-center shadow text-xs font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg h-28 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm"
              >
                <span className="text-2xl">📷</span>
                Click to upload a photo
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? 'Saving…' : 'Save Catch'}
          </button>
        </div>
      </form>
    </div>
  )
}
