'use client'

/**
 * Evrensel çek listesi kutusu. Maddeler çağıranın verdiği branş listesidir.
 * Dar ekranda accordion: kayıt kartı üstte kalır, liste başlığa sıkışır.
 */
import { useState, type CSSProperties } from 'react'
import {
  CEK_LISTE_BASLIK,
  cekGrupEtiket,
  type CekDogrulamaSatir,
  type CekGrup,
  type CekMadde,
} from '@/lib/doktor/muayeneCekListesi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

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
  const [acik, setAcik] = useState(!!dogrulama)
  // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): both branches now converge on the same cream/pine
  // tokens -- acikRenk's dark branch was still #0D1C33 + white-based fills (the redesign never
  // reached it), and even its "light" branch used an off-palette blue-gray (#F8FAFC/#E5E7EB/
  // #0A1628) instead of the established warm tokens. Kept the acikRenk prop itself (callers still
  // pass it) rather than removing it, since that's a bigger change than this pass calls for.
  const yazi = CHROME_RENK.ink
  const soluk = CHROME_RENK.muted
  const kutu: CSSProperties = { background: acikRenk ? '#F8FAFC' : '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 16 }

  if (!maddeler.length) {
    return (
      <div style={kutu} data-muayene-cek="1">
        <div style={{ fontSize: 14, fontWeight: 800, color: yazi }}>{CEK_LISTE_BASLIK}</div>
        <div style={{ fontSize: 12, color: soluk, marginTop: 8 }}>Bu branş için henüz önerilen madde yok.</div>
      </div>
    )
  }

  const yapilan = maddeler.filter((m) => isaretler[m.id]).length

  return (
    <div style={kutu} className="notya-cek-kutu" data-muayene-cek="1" data-cek-acik={acik ? '1' : '0'}>
      <button
        type="button"
        data-cek-toggle="1"
        aria-expanded={acik}
        onClick={() => setAcik((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: yazi,
        }}
      >
        <span>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: yazi }}>{CEK_LISTE_BASLIK}</span>
          <span style={{ display: 'block', fontSize: 12, color: soluk, marginTop: 4 }}>
            {yapilan}/{maddeler.length} işaretlendi · tanı değildir
          </span>
        </span>
        <span data-cek-ok="1" aria-hidden style={{ fontSize: 18, fontWeight: 700, color: soluk, lineHeight: 1, paddingTop: 4, minWidth: 20, textAlign: 'right' }}>
          {acik ? '▴' : '▾'}
        </span>
      </button>
      <div data-cek-govde="1" style={{ marginTop: 12 }}>
        {GRUP_SIRA.map((g) => {
          const alt = maddeler.filter((m) => m.grup === g)
          if (!alt.length) return null
          return (
            <div key={g} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: acikRenk ? '#2563EB' : '#0F9B8E', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
                {cekGrupEtiket(g)}
              </div>
              {alt.map((m) => {
                const on = !!isaretler[m.id]
                const dog = dogrulama?.find((s) => s.id === m.id)
                return (
                  <label key={m.id} data-cek-satir="1" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6, cursor: 'pointer', fontSize: 13, color: yazi }}>
                    <input type="checkbox" checked={on} onChange={() => onToggle(m.id)} style={{ marginTop: 2, width: 18, height: 18, flex: '0 0 18px' }} />
                    <span>
                      {m.etiket}
                      {dog && dog.durum === 'eksik' && !on && (
                        <span style={{ display: 'block', fontSize: 11, color: '#B45309' }}>notta yok</span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
