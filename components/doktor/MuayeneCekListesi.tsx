'use client'

/**
 * Evrensel çek listesi kutusu. Maddeler çağıranın verdiği branş listesidir.
 */
import type { CSSProperties } from 'react'
import {
  CEK_LISTE_BASLIK,
  cekGrupEtiket,
  type CekDogrulamaSatir,
  type CekGrup,
  type CekMadde,
} from '@/lib/doktor/muayeneCekListesi'

const GRUP_SIRA: CekGrup[] = ['anamnez', 'olcum', 'fizik', 'kapanis']

export default function MuayeneCekListesi({
  maddeler,
  isaretler,
  onToggle,
  dogrulama,
  acikRenk = false,
}: {
  maddeler: CekMadde[]
  isaretler: Record<string, boolean>
  onToggle: (id: string) => void
  dogrulama?: CekDogrulamaSatir[] | null
  /** Seans beyaz kartında koyu metin. */
  acikRenk?: boolean
}) {
  const yazi = acikRenk ? '#0A1628' : '#EDF1F7'
  const soluk = acikRenk ? '#64748B' : '#8FA0B5'
  const kutu: CSSProperties = acikRenk
    ? { background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16 }
    : { background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }

  if (!maddeler.length) {
    return (
      <div style={kutu}>
        <div style={{ fontSize: 14, fontWeight: 800, color: yazi }}>{CEK_LISTE_BASLIK}</div>
        <div style={{ fontSize: 12, color: soluk, marginTop: 8 }}>Bu branş için henüz önerilen madde yok.</div>
      </div>
    )
  }

  const yapilan = maddeler.filter((m) => isaretler[m.id]).length

  return (
    <div style={kutu} data-muayene-cek="1">
      <div style={{ fontSize: 14, fontWeight: 800, color: yazi }}>{CEK_LISTE_BASLIK}</div>
      <div style={{ fontSize: 12, color: soluk, margin: '4px 0 12px' }}>
        {yapilan}/{maddeler.length} işaretlendi · tanı değildir
      </div>
      {GRUP_SIRA.map((g) => {
        const alt = maddeler.filter((m) => m.grup === g)
        if (!alt.length) return null
        return (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: acikRenk ? '#2563EB' : '#2DD4BF', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
              {cekGrupEtiket(g)}
            </div>
            {alt.map((m) => {
              const on = !!isaretler[m.id]
              const dog = dogrulama?.find((s) => s.id === m.id)
              return (
                <label key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13, color: yazi }}>
                  <input type="checkbox" checked={on} onChange={() => onToggle(m.id)} style={{ marginTop: 2 }} />
                  <span>
                    {m.etiket}
                    {dog && dog.durum === 'eksik' && !on && (
                      <span style={{ display: 'block', fontSize: 11, color: acikRenk ? '#B45309' : '#FBBF24' }}>notta yok</span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
