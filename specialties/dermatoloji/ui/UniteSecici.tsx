'use client'

import { btn } from './clinic-styles'
import { CLINIC_UNIT_PROFILES } from '../protocols/clinic-units'
import type { ClinicUnit } from '../types'

export function UniteSecici({
  unit,
  onChange,
}: {
  unit: ClinicUnit
  onChange: (u: ClinicUnit) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} data-derm="unit-switcher">
      {CLINIC_UNIT_PROFILES.map((p) => (
        <button
          key={p.id}
          type="button"
          style={btn(unit === p.id)}
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

export default UniteSecici
