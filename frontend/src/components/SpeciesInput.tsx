import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import FISH_LIST from '../data/fishList'

interface Props {
  value: string
  onChange: (value: string) => void
  inputClassName?: string
}

export default function SpeciesInput({ value, onChange, inputClassName }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isValid = FISH_LIST.includes(value)

  const handleInput = (raw: string) => {
    onChange(raw)
    const trimmed = raw.trim()
    if (trimmed.length === 0) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const lower = trimmed.toLowerCase()
    const matches = FISH_LIST.filter((f) => f.toLowerCase().includes(lower)).slice(0, 8)
    setSuggestions(matches)
    setActiveIndex(-1)
    setOpen(matches.length > 0)
  }

  const select = (fish: string) => {
    onChange(fish)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) select(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const borderColor = value === ''
    ? 'border-slate-300'
    : isValid
      ? 'border-green-400'
      : 'border-red-400'

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required
        placeholder="e.g. Largemouth Bass"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        autoComplete="off"
        className={`${inputClassName ?? ''} ${borderColor}`}
      />

      {value !== '' && !isValid && (
        <p className="text-xs text-red-500 mt-1">
          Select a species from the list.
        </p>
      )}

      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((fish, i) => (
            <li
              key={fish}
              onMouseDown={() => select(fish)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === activeIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {fish}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
