import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCreateCatch } from '../api/client'
import SpeciesInput from '../components/SpeciesInput'
import FISH_LIST from '../data/fishList'

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
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!FISH_LIST.includes(form.species)) {
      setError('Please select a valid species from the list.')
      setLoading(false)
      return
    }

    if (!photo) {
      setError('A photo is required.')
      setLoading(false)
      return
    }

    const fd = new FormData()
    fd.append('species', form.species)
    if (form.weight_lbs) fd.append('weight_lbs', form.weight_lbs)
    if (form.length_inches) fd.append('length_inches', form.length_inches)
    if (form.water_body) fd.append('water_body', form.water_body)
    if (form.bait_lure) fd.append('bait_lure', form.bait_lure)
    if (form.technique) fd.append('technique', form.technique)
    if (form.weather) fd.append('weather', form.weather)
    if (form.water_temp_f) fd.append('water_temp_f', form.water_temp_f)
    fd.append('kept', form.kept ? 'true' : 'false')
    if (form.notes) fd.append('notes', form.notes)
    fd.append('photo', photo)

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
    'w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'
  const sectionCls = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4'
  const sectionHeadCls = 'font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Log a Catch</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* The Fish */}
        <div className={sectionCls}>
          <h2 className={sectionHeadCls}>The Fish</h2>
          <div>
            <label className={labelCls}>
              Species <span className="text-red-500">*</span>
            </label>
            <SpeciesInput
              value={form.species}
              onChange={(v) => set('species', v)}
              inputClassName={inputCls}
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
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Fish was kept</span>
          </label>
        </div>

        {/* Where */}
        <div className={sectionCls}>
          <h2 className={sectionHeadCls}>Where</h2>
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
        </div>

        {/* Method & conditions */}
        <div className={sectionCls}>
          <h2 className={sectionHeadCls}>Method & Conditions</h2>
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
                <option key={t} value={t}>{t}</option>
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
                  <option key={w} value={w}>{w}</option>
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
        <div className={sectionCls}>
          <h2 className={sectionHeadCls}>Notes & Photo</h2>
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
            <label className={labelCls}>
              Photo <span className="text-red-500">*</span>
            </label>
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
                  className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null)
                    setPreview(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full w-7 h-7 flex items-center justify-center shadow text-xs font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-red-300 dark:border-red-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg h-28 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                <span className="text-2xl">📷</span>
                Click to upload a photo (required)
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
