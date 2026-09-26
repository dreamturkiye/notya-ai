'use client'

import { kutu, btn, giris, etiketS } from './clinic-styles'
import type { BehcetCard, BullousWorkup } from '../schema'
import { evaluateAesthetics } from '../protocols/aesthetics-legal'
import { TDD_SUT_CODES } from '../protocols/procedures-sut'
import { draftDermPediatriHandoff } from '../../../bridges/derm-pediatri'
import { draftDermKdHandoff } from '../../../bridges/derm-kadin-dogum'
import { draftDermRomatolojiHandoff } from '../../../bridges/derm-romatoloji'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'
import type { ClinicUnit } from '../types'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

function copyJson(obj: unknown) {
  const text = JSON.stringify(obj, null, 2)
  if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

export function UnitePanelleri({
  unit,
  patientId,
  fitzpatrick,
  pediatric,
  behcet,
  bullous,
  bzbhKind,
  onBehcet,
  onBullous,
  onBzbh,
  onAcitretin,
  acitretinBan,
}: {
  unit: ClinicUnit
  patientId: string
  fitzpatrick?: string
  pediatric?: boolean
  behcet: BehcetCard | null
  bullous: BullousWorkup | null
  bzbhKind: string | null
  onBehcet?: (c: BehcetCard) => void
  onBullous?: (w: BullousWorkup) => void
  onBzbh?: (k: string | null) => void
  onAcitretin?: (v: boolean) => void
  acitretinBan?: boolean
}) {
  const aes = evaluateAesthetics({ modality: 'physician_laser', fitzpatrick: fitzpatrick || '—' })
  const pedHandoff = draftDermPediatriHandoff({
    kind: 'infantile_hemangioma',
    child_patient_id: patientId,
    photoCoreImageIds: [],
    pediatric_consent: false,
    notes: 'Pediatri dosyasına foto devri (hemangiom / bebek egzaması).',
  })
  const kdHandoff = draftDermKdHandoff({
    kind: acitretinBan ? 'acitretin_ban' : 'gop_isotretinoin',
    mother_patient_id: patientId,
    notes: acitretinBan ? 'Asitretin 3 yıl gebelik yasağı.' : 'GÖP izotretinoin elden teslim.',
  })
  const romHandoff = draftDermRomatolojiHandoff({
    kind: unit === 'behcet-bagdokusu' ? 'behcet' : 'psa',
    patient_id: patientId,
    notes: unit === 'behcet-bagdokusu' ? 'Behçet konsültasyon taslağı.' : 'PsA / bağ dokusu deri tutulumu.',
  })

  return (
    <div style={{ display: 'grid', gap: 12 }} data-derm="unit-panels">
      {(unit === 'psoriasis' || unit === 'genel') && (
        <section style={kutu} data-derm="psoriasis-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>Psoriazis ünitesi</h2>
          <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>PASI / DLQI / eklem. Biyolojik doz uydurulmaz — SUT basamak kartına bakın.</p>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={!!acitretinBan} onChange={(e) => onAcitretin?.(e.target.checked)} />
            Asitretin 3 yıl gebelik yasağı işaretli
          </label>
        </section>
      )}

      {(unit === 'pediatrik' || pediatric) && (
        <section style={kutu} data-derm="ped-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>Pediatrik dermatoloji</h2>
          <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>18 yaş altı görüntü onamı zorunlu. Pediatri ağacı değiştirilmez — elden teslim CTA.</p>
          <button type="button" style={btn()} onClick={() => copyJson(pedHandoff)} data-derm="cta-ped-handoff">
            Pediatri dosyasına foto devri
          </button>
        </section>
      )}

      {unit === 'kozmetik' && (
        <section style={kutu} data-derm="kozmetik-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>Kozmetik — Ayakta Teşhis</h2>
          <p style={{ fontSize: 13 }}>{aes.next[0]}</p>
          <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>Hekim lazeri ve salon IPL ayrı sütunlarda (karar kartı). Test spot ve lot no zorunlu.</p>
        </section>
      )}

      {unit === 'behcet-bagdokusu' && (
        <section style={kutu} data-derm="behcet-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>Behçet kartı (Alpsoy)</h2>
          {(['oral', 'genital', 'eye', 'pathergy', 'isgCriteriaMet'] as const).map((k) => {
            const etiket: Record<typeof k, string> = {
              oral: 'Oral aft',
              genital: 'Genital ülser',
              eye: 'Göz',
              pathergy: 'Paterji',
              isgCriteriaMet: 'ISG ölçütü',
            }
            const cur: BehcetCard = behcet || { oral: false, genital: false, eye: false, pathergy: false, isgCriteriaMet: false }
            return (
              <label key={k} style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={cur[k]}
                  onChange={(e) => onBehcet?.({ ...cur, [k]: e.target.checked })}
                />
                {etiket[k]}
              </label>
            )
          })}
          <button type="button" style={{ ...btn(), marginTop: 8 }} onClick={() => copyJson(romHandoff)} data-derm="cta-romatoloji">
            Romatoloji konsültasyon taslağı
          </button>
        </section>
      )}

      {unit === 'bullu' && (
        <section style={{ ...kutu, borderColor: bullous?.dif ? 'rgba(255,255,255,0.09)' : 'rgba(248,113,113,0.45)' }} data-derm="bullu-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>Büllü hastalık — DIF kapısı</h2>
          <p style={{ fontSize: 13, color: bullous?.dif ? '#86EFAC' : CHROME_RENK.warn }}>
            {bullous?.dif ? 'DIF yapılmış.' : 'Biyopsi + DIF zorunlu. DIF olmadan tanı kilitlenmez.'}
          </p>
          <label style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={!!bullous?.dif}
              onChange={(e) => onBullous?.({
                nikolsky: bullous?.nikolsky ?? false,
                dif: e.target.checked,
                iif: bullous?.iif ?? false,
                dsg1: bullous?.dsg1 ?? null,
                dsg3: bullous?.dsg3 ?? null,
                bp180: bullous?.bp180 ?? null,
                pdai: bullous?.pdai ?? null,
              })}
            />
            DIF yapıldı
          </label>
        </section>
      )}

      {(unit === 'genel' || unit === 'cerrahi') && (
        <section style={kutu} data-derm="bzbh-panel">
          <h2 style={{ margin: 0, fontSize: 16 }}>BZBH Form 014</h2>
          <span style={etiketS}>Bildirim türü</span>
          <select
            value={bzbhKind || ''}
            onChange={(e) => onBzbh?.(e.target.value || null)}
            style={giris}
          >
            <option value="">—</option>
            <option value="sifiliz">Sifiliz</option>
            <option value="gonore">Gonore</option>
            <option value="hiv">HIV</option>
            <option value="sark_cibani">Şark çıbanı</option>
            <option value="lepra">Lepra</option>
          </select>
          {bzbhKind && (
            <a
              href="https://hsgm.saglik.gov.tr"
              target="_blank"
              rel="noreferrer"
              style={{ ...btn(true), display: 'inline-block', marginTop: 8, textDecoration: 'none' }}
              data-derm="cta-form014"
            >
              Form 014 / TSİM bildirimi
            </a>
          )}
        </section>
      )}

      {unit === 'cerrahi' && (
        <section style={kutu} data-derm="sut-chips">
          <h2 style={{ margin: 0, fontSize: 16 }}>SUT işlem</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {TDD_SUT_CODES.filter((c) => c.code === '700.100' || c.code === '530.070').map((c) => (
              <span key={c.code} style={{ background: 'rgba(15,155,142,0.2)', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
                {c.code} · {c.label}
              </span>
            ))}
          </div>
        </section>
      )}

      <section style={kutu} data-derm="handoff-cta">
        <h2 style={{ margin: 0, fontSize: 16 }}>Branş köprüleri</h2>
        <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>{KADIN_HASTALIKLARI_DOGUM_ETIKETI} / pediatri ağaçları değiştirilmez. Elden teslim JSON panoya kopyalanır.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=gebelik`} style={{ ...btn(), textDecoration: 'none' }} data-derm="cta-kd-handoff">
            Kadın sağlığı — GÖP / gebelik
          </a>
          <button type="button" style={btn()} onClick={() => copyJson(kdHandoff)}>GÖP elden teslim kopyala</button>
          <button type="button" style={btn()} onClick={() => copyJson(romHandoff)}>Romatoloji taslağı</button>
        </div>
      </section>
    </div>
  )
}

export default UnitePanelleri
