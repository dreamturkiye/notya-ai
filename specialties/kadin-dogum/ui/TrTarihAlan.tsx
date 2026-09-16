'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { giris, etiketS } from './clinic-styles'
import { isoToTr, trTarihOku } from '../engines/jine-ofis-vizit'

/**
 * TR date field: visible gg.aa.yyyy, stores ISO yyyy-mm-dd.
 * Avoids native type=date which paints mm/dd/yyyy on en-US browsers.
 */
export function TrTarihAlan({
  value,
  onChange,
  label,
  style,
  name,
}: {
  value: string
  onChange: (iso: string) => void
  label?: string
  style?: CSSProperties
  name?: string
}) {
  const [yazi, setYazi] = useState(isoToTr(value) || '')
  useEffect(() => { setYazi(isoToTr(value) || '') }, [value])
  return (
    <label style={{ display: 'block' }}>
      {label ? (
        <span style={etiketS}>
          {label} <span style={{ fontWeight: 400, opacity: 0.75 }}>gg.aa.yyyy</span>
        </span>
      ) : null}
      <input
        type="text"
        inputMode="numeric"
        name={name}
        lang="tr"
        autoComplete="off"
        placeholder="gg.aa.yyyy"
        title="Tarih: gg.aa.yyyy"
        value={yazi}
        onChange={(e) => {
          const v = e.target.value
          setYazi(v)
          if (!v.trim()) onChange('')
          else {
            const iso = trTarihOku(v)
            if (iso) onChange(iso)
          }
        }}
        onBlur={() => {
          if (!yazi.trim()) { onChange(''); return }
          const iso = trTarihOku(yazi)
          if (iso) { setYazi(isoToTr(iso)); onChange(iso) }
        }}
        style={{ ...giris, ...style }}
      />
    </label>
  )
}

export default TrTarihAlan
