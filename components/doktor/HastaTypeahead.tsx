'use client'

/**
 * Searchable patient picker for doktor tools.
 * Loads the doctor's roster with ensureDoctorAccessToken (NOTYA-AUTH-01),
 * then filters by first/last name prefix or substring (Turkish-aware).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import {
  normalizeHastalar,
  toolsInput,
  type HastaOption,
} from '@/lib/doktor/toolsUi'

function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Match query against full label or any name-part prefix (ad / soyad initials). */
export function hastaMatchesQuery(hasta: HastaOption, query: string): boolean {
  const q = normalizeTr(query.trim())
  if (!q) return true
  const label = normalizeTr(hasta.label)
  if (label.includes(q)) return true
  const parts = [hasta.ad, hasta.soyad, ...hasta.label.split(/\s+/)]
    .map((p) => normalizeTr(p || ''))
    .filter(Boolean)
  return parts.some((p) => p.startsWith(q))
}

type Props = {
  value: string
  onChange: (hastaId: string, hasta?: HastaOption | null) => void
  onLoadError?: (message: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  /** Max rows shown in the open list (search still filters the full roster). */
  listLimit?: number
}

export default function HastaTypeahead({
  value,
  onChange,
  onLoadError,
  disabled,
  placeholder = 'Ad veya soyad yazın…',
  id = 'hasta-typeahead',
  listLimit = 80,
}: Props) {
  const [hastalar, setHastalar] = useState<HastaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const token = await ensureDoctorAccessToken()
        if (!token) {
          if (!cancelled) {
            setHastalar([])
            onLoadError?.('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
          }
          return
        }
        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.status === 401) {
          setHastalar([])
          onLoadError?.('Oturum geçersiz. Lütfen tekrar giriş yapın.')
          return
        }
        if (!res.ok) {
          setHastalar([])
          onLoadError?.(String((data as { error?: string }).error || 'Hasta listesi alınamadı.'))
          return
        }
        setHastalar(normalizeHastalar(data))
      } catch {
        if (!cancelled) {
          setHastalar([])
          onLoadError?.('Hasta listesi alınamadı. Bağlantınızı kontrol edin.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the input label in sync when parent sets value externally.
  useEffect(() => {
    if (!value) return
    const selected = hastalar.find((h) => h.id === value)
    if (selected && query !== selected.label) {
      setQuery(selected.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hastalar])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const hits = hastalar.filter((h) => hastaMatchesQuery(h, query))
    return hits.slice(0, listLimit)
  }, [hastalar, query, listLimit])

  const selected = hastalar.find((h) => h.id === value) || null

  const pick = (h: HastaOption) => {
    setQuery(h.label)
    setOpen(false)
    onChange(h.id, h)
  }

  const clear = () => {
    setQuery('')
    onChange('', null)
    setOpen(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && filtered[activeIdx]) {
      e.preventDefault()
      pick(filtered[activeIdx])
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          type="search"
          autoComplete="off"
          inputMode="search"
          disabled={disabled || loading}
          placeholder={
            loading
              ? 'Hastalar yükleniyor…'
              : hastalar.length === 0
                ? 'Hasta bulunamadı'
                : placeholder
          }
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            setOpen(true)
            setActiveIdx(0)
            // Typing clears a prior selection unless the text still matches it.
            if (selected && next !== selected.label) {
              onChange('', null)
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          style={{
            ...toolsInput,
            paddingRight: value || query ? 72 : 14,
          }}
        />
        {(value || query) && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Seçimi temizle"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 6px',
            }}
          >
            Temizle
          </button>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
          {hastalar.length === 0
            ? 'Kayıtlı hasta yok — önce Hasta Ekle ile ekleyin.'
            : `${hastalar.length} hasta · ad veya soyad baş harfleriyle daraltın`}
        </div>
      )}

      {open && !loading && hastalar.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 40,
            left: 0,
            right: 0,
            top: '100%',
            margin: '6px 0 0',
            padding: 6,
            listStyle: 'none',
            maxHeight: 280,
            overflowY: 'auto',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background: '#0B1524',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '12px 10px', color: '#94A3B8', fontSize: 13 }}>
              Eşleşen hasta yok.
            </li>
          )}
          {filtered.map((h, idx) => {
            const active = idx === activeIdx || h.id === value
            return (
              <li key={h.id} role="option" aria-selected={h.id === value}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => pick(h)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: active ? 'rgba(15,155,142,0.22)' : 'transparent',
                    color: '#F8FAFC',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {h.label}
                </button>
              </li>
            )
          })}
          {hastalar.filter((h) => hastaMatchesQuery(h, query)).length > listLimit && (
            <li style={{ padding: '8px 10px', color: '#64748B', fontSize: 11 }}>
              Daha fazla sonuç için yazmaya devam edin…
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
