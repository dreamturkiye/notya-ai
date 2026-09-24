'use client'

/**
 * DERM-EXCEPTIONAL-01 — Fototerapi ünitesi v2 (hemşire dostu defter).
 * MED kaydı, seans başına doz adımı, eritem yanıtı, yanık protokolü kontrol listesi,
 * cihaz başına kümülatif J/cm², ara verme uyarısı ve yıllık TBSE hatırlatma ipucu.
 * Solaryum cihaz listesinde yoktur (2018 yasağı). **Doz ve artış oranı hekim protokolünden girilir.**
 */
import { useState } from 'react'
import type { PhotoSession, PhotoDevice, MedKaydi, EritemYaniti } from '../engines/phototherapy-log'
import {
  DOZ_ADIMI_KILIDI,
  ERITEM_ADI,
  ERITEM_YANITI,
  MED_BIRIMI,
  PHOTO_DEVICES,
  SOLARIUM_FORBIDDEN,
  YANIK_PROTOKOLU,
  araVermeUyarisi,
  cihazBasinaKumulatif,
  cumulativeJ,
  dozAdimiOzeti,
  medEksikCihazlar,
  sonMed,
  tbseHatirlatmaIpucu,
  yanikBildirimiGerekli,
  yanikProtokoluEksikler,
} from '../engines/phototherapy-log'
import { btn, giris, etiketS, kutu } from './clinic-styles'
import { DERM_PHOTO_DEVICE, dermLabel } from './labels'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function FototerapiDefteri({
  sessions,
  medler = [],
  lastTbseIso = null,
  todayIso,
  onEkle,
  onMedEkle,
}: {
  sessions: PhotoSession[]
  medler?: MedKaydi[]
  lastTbseIso?: string | null
  todayIso?: string
  onEkle?: (s: PhotoSession) => void
  onMedEkle?: (m: MedKaydi) => void
}) {
  const bugun = todayIso || new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({
    date: bugun,
    device: 'nb-uvb-311' as PhotoDevice,
    j: '',
    seansNo: '',
    dozAdimi: '',
    eritem: 'yok' as EritemYaniti,
    kacirilanGun: '',
    med: false,
    burn: false,
    not: '',
  })
  const [protokol, setProtokol] = useState<Record<string, boolean>>({})
  const [medForm, setMedForm] = useState({ date: bugun, device: 'nb-uvb-311' as PhotoDevice, deger: '', not: '' })
  const [medAcik, setMedAcik] = useState(false)
  const [hata, setHata] = useState('')

  const cihazlar = cihazBasinaKumulatif(sessions)
  const medEksik = medEksikCihazlar(sessions, medler)
  const ara = araVermeUyarisi(sessions, bugun)
  const tbse = tbseHatirlatmaIpucu({ lastTbseIso, todayIso: bugun, sessions })
  const aktifMed = sonMed(medler, f.device)
  const yanikGerekli = yanikBildirimiGerekli({ date: f.date, device: f.device, j_cm2: 0, burn: f.burn, eritem: f.eritem })

  const gonder = () => {
    if (!onEkle) return
    const s: PhotoSession = {
      date: f.date,
      device: f.device,
      j_cm2: Number(f.j) || 0,
      med_test: f.med,
      burn: f.burn,
      eritem: f.eritem,
      ...(f.seansNo !== '' ? { seans_no: Number(f.seansNo) } : {}),
      ...(f.dozAdimi !== '' ? { doz_adimi_pct: Number(f.dozAdimi) } : {}),
      ...(f.kacirilanGun !== '' ? { kacirilan_gun: Number(f.kacirilanGun) } : {}),
      ...(yanikGerekli ? { yanik_protokolu: protokol } : {}),
      ...(f.not ? { not: f.not.slice(0, 500) } : {}),
    }
    const eksik = yanikProtokoluEksikler(s)
    if (eksik.length) {
      setHata(`Yanık protokolü tamamlanmalı: ${eksik.join(' · ')}`)
      return
    }
    setHata('')
    onEkle(s)
    setF((p) => ({ ...p, j: '', dozAdimi: '', kacirilanGun: '', med: false, burn: false, eritem: 'yok', not: '' }))
    setProtokol({})
  }

  return (
    <section style={kutu} data-tab="FototerapiDefteri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Fototerapi defteri</h2>
      <p style={{ fontSize: 13, margin: '4px 0' }}>
        Toplam kümülatif {cumulativeJ(sessions)} J/cm² · {sessions.length} seans
        {SOLARIUM_FORBIDDEN ? ' · solaryum yok' : ''}
      </p>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        SUT: endikasyon raporu + MED + J/cm² defteri. Solaryum 2018 yasağı — cihaz listesinde yok. {DOZ_ADIMI_KILIDI}
      </p>

      {/* Cihaz başına kümülatif */}
      {cihazlar.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4, margin: '8px 0' }} data-derm="ft-cihaz-kumulatif">
          {cihazlar.map((c) => {
            const m = sonMed(medler, c.device)
            return (
              <li key={c.device} style={{ fontSize: 12.5, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <b>{dermLabel(DERM_PHOTO_DEVICE, c.device)}</b>
                <span>{c.seans} seans</span>
                <span>kümülatif {c.kumulatifJ} J/cm²</span>
                {c.sonSeans && <span>son {c.sonSeans}</span>}
                <span style={{ color: m ? '#86EFAC' : '#7A5B1E' }}>
                  {m ? `MED ${m.deger} ${m.birim} (${m.date})` : 'MED kaydı yok'}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {medEksik.length > 0 && (
        <p style={{ fontSize: 12, color: '#7A5B1E' }} data-derm="ft-med-eksik">
          MED kaydı eksik cihaz: {medEksik.map((d) => dermLabel(DERM_PHOTO_DEVICE, d)).join(', ')} — SUT defteri için girilmeli.
        </p>
      )}
      {ara && <p style={{ fontSize: 12, color: '#7A5B1E' }} data-derm="ft-ara-verme">{ara}</p>}
      {tbse && (
        <p style={{ fontSize: 12, color: tbse.gerekli ? '#7A5B1E' : CHROME_RENK.muted }} data-derm="ft-tbse">
          TBSE · {tbse.metin}
        </p>
      )}
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>{dozAdimiOzeti(sessions, f.device)}</p>

      {sessions.length === 0 && <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Seans kaydı yok.</p>}
      {sessions.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 6 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520, fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: CHROME_RENK.muted, fontSize: 11.5, textAlign: 'left' }}>
                <th style={{ padding: 4 }}>Tarih</th>
                <th style={{ padding: 4 }}>Cihaz</th>
                <th style={{ padding: 4 }}>Seans</th>
                <th style={{ padding: 4 }}>J/cm²</th>
                <th style={{ padding: 4 }}>Adım</th>
                <th style={{ padding: 4 }}>Eritem</th>
                <th style={{ padding: 4 }}>Not</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={`${s.date}-${s.device}-${s.j_cm2}-${i}`} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td style={{ padding: 4 }}>{s.date}</td>
                  <td style={{ padding: 4 }}>{dermLabel(DERM_PHOTO_DEVICE, s.device)}</td>
                  <td style={{ padding: 4 }}>{s.seans_no ?? '—'}</td>
                  <td style={{ padding: 4 }}>{s.j_cm2}</td>
                  <td style={{ padding: 4 }}>{s.doz_adimi_pct != null ? `%${s.doz_adimi_pct}` : '—'}</td>
                  <td style={{ padding: 4, color: s.burn || s.eritem === 'agrili' || s.eritem === 'bullu' ? CHROME_RENK.warn : undefined }}>
                    {s.eritem ? ERITEM_ADI[s.eritem] : s.burn ? 'Yanık' : '—'}
                  </td>
                  <td style={{ padding: 4 }}>{[s.med_test ? 'MED' : '', s.kacirilan_gun ? `${s.kacirilan_gun} gün ara` : '', s.not || ''].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MED kaydı */}
      {onMedEkle && (
        <div style={{ marginTop: 10 }}>
          <button type="button" style={btn()} onClick={() => setMedAcik((v) => !v)} data-derm="ft-med-ac">
            {medAcik ? 'MED formunu kapat' : 'MED / MPD kaydı ekle'}
          </button>
          {medAcik && (
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                <label><span style={etiketS}>Test tarihi</span>
                  <input type="date" style={giris} value={medForm.date} onChange={(e) => setMedForm((p) => ({ ...p, date: e.target.value }))} />
                </label>
                <label><span style={etiketS}>Cihaz</span>
                  <select style={giris} value={medForm.device} onChange={(e) => setMedForm((p) => ({ ...p, device: e.target.value as PhotoDevice }))}>
                    {PHOTO_DEVICES.map((d) => <option key={d} value={d} style={{ color: '#000' }}>{dermLabel(DERM_PHOTO_DEVICE, d)}</option>)}
                  </select>
                </label>
                <label><span style={etiketS}>MED / MPD ({MED_BIRIMI[medForm.device]})</span>
                  <input style={giris} inputMode="decimal" value={medForm.deger} onChange={(e) => setMedForm((p) => ({ ...p, deger: e.target.value }))} />
                </label>
                <label style={{ gridColumn: '1 / -1' }}><span style={etiketS}>Not (test alanı, okuma saati)</span>
                  <input style={giris} value={medForm.not} onChange={(e) => setMedForm((p) => ({ ...p, not: e.target.value }))} />
                </label>
              </div>
              <button
                type="button"
                style={{ ...btn(true), marginTop: 8 }}
                onClick={() => {
                  const deger = Number(medForm.deger)
                  if (!Number.isFinite(deger) || deger <= 0) { setHata('MED değeri girilmeli.'); return }
                  setHata('')
                  onMedEkle({ date: medForm.date, device: medForm.device, deger, birim: MED_BIRIMI[medForm.device], ...(medForm.not ? { not: medForm.not } : {}) })
                  setMedForm((p) => ({ ...p, deger: '', not: '' }))
                  setMedAcik(false)
                }}
              >
                MED kaydet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seans formu */}
      {onEkle && (
        <div style={{ marginTop: 12 }} data-derm="ft-seans-formu">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <label><span style={etiketS}>Tarih</span>
              <input type="date" style={giris} value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} required />
            </label>
            <label><span style={etiketS}>Cihaz</span>
              <select style={giris} value={f.device} onChange={(e) => setF((p) => ({ ...p, device: e.target.value as PhotoDevice }))}>
                {PHOTO_DEVICES.map((d) => <option key={d} value={d} style={{ color: '#000' }}>{dermLabel(DERM_PHOTO_DEVICE, d)}</option>)}
              </select>
            </label>
            <label><span style={etiketS}>Seans no</span>
              <input style={giris} inputMode="numeric" value={f.seansNo} onChange={(e) => setF((p) => ({ ...p, seansNo: e.target.value }))} />
            </label>
            <label><span style={etiketS}>Doz (J/cm²)</span>
              <input style={giris} inputMode="decimal" value={f.j} onChange={(e) => setF((p) => ({ ...p, j: e.target.value }))} />
            </label>
            <label><span style={etiketS}>Doz adımı (%)</span>
              <input style={giris} inputMode="numeric" value={f.dozAdimi} onChange={(e) => setF((p) => ({ ...p, dozAdimi: e.target.value }))} placeholder="protokolden" />
            </label>
            <label><span style={etiketS}>Eritem yanıtı</span>
              <select style={giris} value={f.eritem} onChange={(e) => setF((p) => ({ ...p, eritem: e.target.value as EritemYaniti }))}>
                {ERITEM_YANITI.map((x) => <option key={x} value={x} style={{ color: '#000' }}>{ERITEM_ADI[x]}</option>)}
              </select>
            </label>
            <label><span style={etiketS}>Kaçırılan gün</span>
              <input style={giris} inputMode="numeric" value={f.kacirilanGun} onChange={(e) => setF((p) => ({ ...p, kacirilanGun: e.target.value }))} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}><span style={etiketS}>Hemşire notu</span>
              <input style={giris} value={f.not} onChange={(e) => setF((p) => ({ ...p, not: e.target.value }))} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={f.med} onChange={(e) => setF((p) => ({ ...p, med: e.target.checked }))} /> Bu seans MED testi
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={f.burn} onChange={(e) => setF((p) => ({ ...p, burn: e.target.checked }))} /> Yanık gelişti
            </label>
          </div>
          {aktifMed && (
            <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 4 }}>
              Bu cihaz için son MED: {aktifMed.deger} {aktifMed.birim} ({aktifMed.date}). Başlangıç dozu ve artış oranı hekim protokolünden.
            </p>
          )}

          {yanikGerekli && (
            <div style={{ border: '1px solid rgba(252,165,165,0.4)', borderRadius: 8, padding: 8, marginTop: 8 }} data-derm="ft-yanik-protokolu">
              <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.warn }}>Yanık protokolü — tüm maddeler işaretlenmeli</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4, marginTop: 6 }}>
                {YANIK_PROTOKOLU.map((m) => (
                  <li key={m.kod}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12.5 }}>
                      <input
                        type="checkbox"
                        checked={!!protokol[m.kod]}
                        onChange={(e) => setProtokol((p) => ({ ...p, [m.kod]: e.target.checked }))}
                        style={{ marginTop: 3 }}
                      />
                      <span>{m.ad}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hata && <p style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>{hata}</p>}
          <button type="button" style={{ ...btn(true), marginTop: 8 }} onClick={gonder} data-derm="ft-seans-ekle">Seans ekle</button>
        </div>
      )}
    </section>
  )
}

export default FototerapiDefteri
