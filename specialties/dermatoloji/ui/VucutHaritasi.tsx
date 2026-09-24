'use client'

/**
 * DERM-EXCEPTIONAL-01 — TBSE / vücut haritası. Artık **tıklanabilir bölge şeması**: ön / arka yüz,
 * bölgeye tıklayınca nodeId işaretlenir (model değişmedi — `total_body_map.nodeIds`).
 * Lezyon kayıtlarının bölgesi otomatik eşlenmeye çalışılır; kasık / genital bölge ek onam ister.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Lesion, TotalBodyMap } from '../schema'
import { DERM_TBM_DEVICE, dermLabel } from './labels'
import { euromelanomaMonth, KETEM_IS_NOT_SKIN_CANCER } from '../engines/screening-reminders'
import { btn, giris, etiketS, kutu } from './clinic-styles'
import {
  BODY_BOLGELERI,
  bolgeAdi,
  bolgeKoduTahmin,
  ekOnamGerekliBolge,
  nodeToggle,
  pasiBolgeDagilimi,
  yuzBolgeleri,
  type BodyYuz,
} from '../engines/body-map'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const semaKutu: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 260,
  aspectRatio: '1 / 2',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
}

function bolgeStili(secili: boolean, onam: boolean): CSSProperties {
  return {
    position: 'absolute',
    border: `1px solid ${secili ? 'rgba(45,212,191,0.9)' : 'rgba(255,255,255,0.18)'}`,
    background: secili ? 'rgba(15,155,142,0.45)' : 'rgba(255,255,255,0.04)',
    color: CHROME_RENK.ink,
    borderRadius: 6,
    fontSize: 8.5,
    lineHeight: 1.1,
    padding: 1,
    cursor: 'pointer',
    overflow: 'hidden',
    textAlign: 'center',
    outlineOffset: 2,
    ...(onam ? { borderStyle: 'dashed' as const } : {}),
  }
}

function Sema({
  yuz,
  secili,
  onToggle,
}: {
  yuz: BodyYuz
  secili: string[]
  onToggle: (kod: string) => void
}) {
  return (
    <div style={semaKutu} data-derm={`vucut-sema-${yuz}`} role="group" aria-label={yuz === 'on' ? 'Ön yüz bölgeleri' : 'Arka yüz bölgeleri'}>
      {yuzBolgeleri(yuz).map((b) => (
        <button
          key={b.kod}
          type="button"
          title={`${b.ad}${ekOnamGerekliBolge(b.kod) ? ' — ek onam gerekir' : ''}`}
          aria-pressed={secili.includes(b.kod)}
          onClick={() => onToggle(b.kod)}
          style={{
            ...bolgeStili(secili.includes(b.kod), ekOnamGerekliBolge(b.kod)),
            left: `${b.kutu.x}%`,
            top: `${b.kutu.y}%`,
            width: `${b.kutu.w}%`,
            height: `${b.kutu.h}%`,
          }}
        >
          {b.ad}
        </button>
      ))}
    </div>
  )
}

export function VucutHaritasi({
  map,
  lesions = [],
  emptyAction,
  lastTbseIso,
  todayIso,
  onKaydet,
}: {
  map: TotalBodyMap | null
  /** bölge metnini şema koduna eşlemek için */
  lesions?: Lesion[]
  emptyAction?: ReactNode
  lastTbseIso?: string | null
  todayIso?: string
  onKaydet?: (m: { deviceHint: TotalBodyMap['deviceHint']; followUpMonths: number; last_tbse_iso: string; nodeIds: string[] }) => void
}) {
  const month = todayIso ? Number(todayIso.slice(5, 7)) : (new Date().getUTCMonth() + 1)
  const [f, setF] = useState({
    deviceHint: (map?.deviceHint || 'manual') as TotalBodyMap['deviceHint'],
    followUpMonths: String(map?.followUpMonths || 6),
    last: lastTbseIso || '',
  })
  const [nodeIds, setNodeIds] = useState<string[]>(map?.nodeIds || [])
  const [yuz, setYuz] = useState<BodyYuz>('on')

  const lezyonEslesmeleri = useMemo(
    () =>
      lesions
        .map((l) => ({ lezyon: l, kod: l.body_map_node || bolgeKoduTahmin(l.region) }))
        .filter((x): x is { lezyon: Lesion; kod: string } => !!x.kod),
    [lesions],
  )
  const eslenmemis = lesions.filter((l) => !l.body_map_node && !bolgeKoduTahmin(l.region))
  const dagilim = pasiBolgeDagilimi(nodeIds)
  const onamGereken = nodeIds.filter(ekOnamGerekliBolge)

  const toggle = (kod: string) => setNodeIds((p) => nodeToggle(p, kod))

  return (
    <section style={kutu} data-tab="VucutHaritasi">
      <h2 style={{ margin: 0, fontSize: 16 }}>TBSE / vücut haritası</h2>
      {month === euromelanomaMonth() && (
        <p style={{ fontSize: 12, color: '#7A5B1E' }}>Euromelanoma Mayıs ayı — deri tarama vurgusu. KETEM deri kanseri programı değildir.</p>
      )}
      {KETEM_IS_NOT_SKIN_CANCER && (
        <p style={{ fontSize: 11, color: CHROME_RENK.muted }}>KETEM ipuçları yalnız meme / serviks / kolon — deri kanseri değil.</p>
      )}

      {map && (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
          {dermLabel(DERM_TBM_DEVICE, map.deviceHint)} · takip {map.followUpMonths} ay
          {lastTbseIso ? ` · son TBSE ${lastTbseIso}` : ' · TBSE henüz yok'}
        </p>
      )}
      {!map && (
        <div>
          <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Harita yok — şemadan bölge seçerek başlayın; lezyon kayıtları da eşlenir.</p>
          {emptyAction}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button type="button" style={{ ...btn(yuz === 'on'), padding: '5px 10px', fontSize: 12 }} onClick={() => setYuz('on')}>Ön</button>
        <button type="button" style={{ ...btn(yuz === 'arka'), padding: '5px 10px', fontSize: 12 }} onClick={() => setYuz('arka')}>Arka</button>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
        <Sema yuz={yuz} secili={nodeIds} onToggle={toggle} />
        <div style={{ flex: '1 1 240px', minWidth: 220 }}>
          <div style={etiketS}>İşaretli bölgeler ({nodeIds.length})</div>
          {nodeIds.length === 0 && <p style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>Şemadan bölge seçin.</p>}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 3 }} data-derm="vucut-secili">
            {nodeIds.map((id) => (
              <li key={id} style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <button type="button" style={{ ...btn(), padding: '2px 7px', fontSize: 11 }} onClick={() => toggle(id)} aria-label={`${bolgeAdi(id)} kaldır`}>×</button>
                <span>{bolgeAdi(id)}</span>
                {lezyonEslesmeleri.filter((x) => x.kod === id).length > 0 && (
                  <span style={{ color: CHROME_RENK.muted }}>· {lezyonEslesmeleri.filter((x) => x.kod === id).length} lezyon</span>
                )}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 6 }}>
            Bölge dağılımı — baş/boyun {dagilim.head} · üst ekstremite {dagilim.upper} · gövde {dagilim.trunk} · alt ekstremite {dagilim.lower}
          </p>
          {onamGereken.length > 0 && (
            <p style={{ fontSize: 11.5, color: '#7A5B1E' }}>
              {onamGereken.map(bolgeAdi).join(', ')} — fotoğraf için ek onam gerekir.
            </p>
          )}
          {lezyonEslesmeleri.length > 0 && (
            <button
              type="button"
              style={{ ...btn(), marginTop: 6, fontSize: 12 }}
              onClick={() => setNodeIds((p) => [...new Set([...p, ...lezyonEslesmeleri.map((x) => x.kod)])])}
              data-derm="vucut-lezyondan-ekle"
            >
              Lezyon bölgelerini ekle ({lezyonEslesmeleri.length})
            </button>
          )}
          {eslenmemis.length > 0 && (
            <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 4 }}>
              Şemaya eşlenemeyen lezyon bölgesi: {eslenmemis.map((l) => l.region).join(', ')} — elle işaretleyin.
            </p>
          )}
        </div>
      </div>

      {onKaydet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 12 }}>
          <label>
            <span style={etiketS}>Cihaz ipucu</span>
            <select style={giris} value={f.deviceHint} onChange={(e) => setF((p) => ({ ...p, deviceHint: e.target.value as TotalBodyMap['deviceHint'] }))}>
              <option value="manual" style={{ color: '#000' }}>Elle işaretli</option>
              <option value="molemax" style={{ color: '#000' }}>MoleMax</option>
              <option value="fotofinder" style={{ color: '#000' }}>FotoFinder</option>
            </select>
          </label>
          <label><span style={etiketS}>Takip (ay)</span>
            <input style={giris} value={f.followUpMonths} onChange={(e) => setF((p) => ({ ...p, followUpMonths: e.target.value }))} />
          </label>
          <label><span style={etiketS}>Son TBSE</span>
            <input type="date" style={giris} value={f.last} onChange={(e) => setF((p) => ({ ...p, last: e.target.value }))} />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button
              type="button"
              style={btn(true)}
              onClick={() =>
                onKaydet({
                  deviceHint: f.deviceHint,
                  followUpMonths: Math.min(12, Math.max(1, Number(f.followUpMonths) || 6)),
                  last_tbse_iso: f.last,
                  nodeIds,
                })
              }
              data-derm="vucut-kaydet"
            >
              Harita kaydet
            </button>
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>
        Şema işaretleme ızgarasıdır; alan yüzdesi PASI / EASI alan skorunda hekim tarafından girilir.
        ({BODY_BOLGELERI.length} bölge)
      </p>
    </section>
  )
}

export default VucutHaritasi
