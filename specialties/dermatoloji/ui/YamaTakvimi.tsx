'use client'

/**
 * DERM-EXCEPTIONAL-01 — Yama takvimi v2: Avrupa baz serisi alerjen ızgarası (grup grup),
 * ICDRG okuma dereceleri, D2 / D4 fotoğraf türü ipuçları ve çok kürlü takvim.
 * Konsantrasyon / vehikül yazılmaz — ünite kendi hazır bandını kullanır, test maddesi kararı hekimin.
 */
import { useState } from 'react'
import {
  GEC_OKUMA_IPUCU_ALERJENLERI,
  ICDRG_DERECELERI,
  OKUMA_FOTO_IPUCU,
  PATCH_SERILERI,
  alerjenAdi,
  gruplanmisAlerjenler,
  kurTakvimi,
  patchStatus,
  plannedReads,
  yeniKurIpucu,
  type PatchCourseKaydi,
  type PatchSeriesId,
} from '../engines/patch-calendar'
import { DERM_PATCH_STATUS, DERM_PHOTO_KIND, dermLabel } from './labels'
import { btn, giris, etiketS, kutu } from './clinic-styles'
import { goruntulemeCaptureHref } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function YamaTakvimi({
  course,
  courses,
  today,
  patientId,
  onKaydet,
}: {
  course: PatchCourseKaydi | null
  /** çok kürlü takvim — verilmezse yalnız aktif kür gösterilir */
  courses?: PatchCourseKaydi[]
  today: string
  patientId?: string
  onKaydet?: (c: {
    id?: string
    appliedAt: string
    readD2: string | null
    readD4: string | null
    positives: string
    series?: string
    d2Dereceler?: Record<string, string>
    d4Dereceler?: Record<string, string>
  }) => void
}) {
  const liste = courses && courses.length ? courses : course ? [course] : []
  const status = course ? patchStatus(course, today) : null
  const plan = course ? plannedReads(course.appliedAt) : null
  const takvim = kurTakvimi(liste, today)
  const ipucu = yeniKurIpucu(liste, today)

  const [seri, setSeri] = useState<PatchSeriesId>((course?.series as PatchSeriesId) || 'european_baseline')
  const [f, setF] = useState({
    appliedAt: course?.appliedAt || today,
    readD2: course?.readD2 || '',
    readD4: course?.readD4 || '',
  })
  const [d2, setD2] = useState<Record<string, string>>(course?.d2Dereceler || {})
  const [d4, setD4] = useState<Record<string, string>>(course?.d4Dereceler || {})
  const [izgaraAcik, setIzgaraAcik] = useState(false)
  const [ekMadde, setEkMadde] = useState('')

  const pozitifler = [...new Set([
    ...Object.entries(d4).filter(([, v]) => v && v !== 'neg' && v !== 'ir' && v !== 'soru').map(([k]) => k),
    ...Object.entries(d2).filter(([, v]) => v && v !== 'neg' && v !== 'ir' && v !== 'soru').map(([k]) => k),
  ])]

  const gruplar = gruplanmisAlerjenler(seri)

  return (
    <section style={kutu} data-tab="YamaTakvimi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Yama takvimi</h2>
      {!course && <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Aktif yama serisi yok.</p>}
      {course && (
        <>
          <p style={{ fontSize: 13 }}>Durum: {status ? dermLabel(DERM_PATCH_STATUS, status) : '—'}</p>
          <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
            Uygulama {course.appliedAt} · D2 {plan?.d2} · D4 {plan?.d4}
          </p>
          <p style={{ fontSize: 12 }}>
            Okunan D2 {course.readD2 ?? '—'} · D4 {course.readD4 ?? '—'} · pozitif{' '}
            {course.positives.length ? course.positives.map((p) => alerjenAdi(p)).join(', ') : 'yok'}
          </p>
        </>
      )}

      {takvim.length > 1 && (
        <div style={{ marginTop: 8 }} data-derm="yama-kur-takvimi">
          <div style={etiketS}>Kür geçmişi</div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4 }}>
            {takvim.map((t, i) => (
              <li key={t.id || `${t.appliedAt}-${i}`} style={{ fontSize: 12.5, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <b>{t.appliedAt}</b>
                <span>{PATCH_SERILERI.find((s) => s.id === t.seri)?.ad || t.seri}</span>
                <span>D2 {t.readD2 || t.d2} · D4 {t.readD4 || t.d4}</span>
                <span>{dermLabel(DERM_PATCH_STATUS, t.durum)}</span>
                <span>{t.pozitifSayisi} pozitif</span>
                {t.aktif && <span style={{ color: '#0F9B8E' }}>aktif</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ipucu && <p style={{ fontSize: 12, color: '#7A5B1E', marginTop: 6 }} data-derm="yama-ipucu">{ipucu}</p>}

      {patientId && (
        <div style={{ display: 'grid', gap: 3, marginTop: 8 }} data-derm="yama-foto-ipucu">
          {OKUMA_FOTO_IPUCU.map((o) => (
            <a key={o.kind} href={goruntulemeCaptureHref(patientId, 'derm')} style={{ fontSize: 12, color: '#0F9B8E' }}>
              {dermLabel(DERM_PHOTO_KIND, o.kind)} ekle — {o.ipucu}
            </a>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 4 }}>
        Geç okuma (D7) gerekebilecek maddeler: {GEC_OKUMA_IPUCU_ALERJENLERI.join(', ')} — karar hekimin.
      </p>

      {onKaydet && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <label><span style={etiketS}>Seri</span>
              <select style={giris} value={seri} onChange={(e) => setSeri(e.target.value as PatchSeriesId)}>
                {PATCH_SERILERI.map((s) => <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.ad}</option>)}
              </select>
            </label>
            <label><span style={etiketS}>D0 uygulama</span>
              <input type="date" style={giris} value={f.appliedAt} onChange={(e) => setF((p) => ({ ...p, appliedAt: e.target.value }))} />
            </label>
            <label><span style={etiketS}>D2 okuma</span>
              <input type="date" style={giris} value={f.readD2} onChange={(e) => setF((p) => ({ ...p, readD2: e.target.value }))} />
            </label>
            <label><span style={etiketS}>D4 okuma</span>
              <input type="date" style={giris} value={f.readD4} onChange={(e) => setF((p) => ({ ...p, readD4: e.target.value }))} />
            </label>
          </div>
          <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 4 }}>
            {PATCH_SERILERI.find((s) => s.id === seri)?.aciklama}
          </p>

          <button type="button" style={{ ...btn(), marginTop: 8 }} onClick={() => setIzgaraAcik((v) => !v)} data-derm="yama-izgara-ac">
            {izgaraAcik ? 'Alerjen ızgarasını kapat' : `Alerjen ızgarası (${gruplar.reduce((s, g) => s + g.alerjenler.length, 0)} madde)`}
          </button>

          {izgaraAcik && (
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginTop: 8 }} data-derm="yama-alerjen-izgarasi">
              <p style={{ fontSize: 11.5, color: CHROME_RENK.muted, margin: '0 0 6px' }}>
                Her madde için D2 ve D4 okuma derecesi (ICDRG). Konsantrasyon ve vehikül ünitenin hazır bandındadır.
              </p>
              {gruplar.map((g) => (
                <div key={g.grup} style={{ marginBottom: 10 }}>
                  <div style={{ ...etiketS, color: CHROME_RENK.ink, fontWeight: 700 }}>{g.ad}</div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {g.alerjenler.map((a) => (
                      <div key={a.kod} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5 }}>
                        <span style={{ flex: '1 1 200px' }}>{a.ad}</span>
                        <label style={{ fontSize: 11 }}>D2{' '}
                          <select
                            aria-label={`${a.ad} D2`}
                            style={{ ...giris, width: 'auto', padding: '4px 6px' }}
                            value={d2[a.kod] || 'neg'}
                            onChange={(e) => setD2((p) => ({ ...p, [a.kod]: e.target.value }))}
                          >
                            {ICDRG_DERECELERI.map((x) => <option key={x.kod} value={x.kod} style={{ color: '#000' }}>{x.ad}</option>)}
                          </select>
                        </label>
                        <label style={{ fontSize: 11 }}>D4{' '}
                          <select
                            aria-label={`${a.ad} D4`}
                            style={{ ...giris, width: 'auto', padding: '4px 6px' }}
                            value={d4[a.kod] || 'neg'}
                            onChange={(e) => setD4((p) => ({ ...p, [a.kod]: e.target.value }))}
                          >
                            {ICDRG_DERECELERI.map((x) => <option key={x.kod} value={x.kod} style={{ color: '#000' }}>{x.ad}</option>)}
                          </select>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {seri === 'ek_hekim' && (
                <label style={{ display: 'block' }}><span style={etiketS}>Hekimin eklediği maddeler (virgülle)</span>
                  <input style={giris} value={ekMadde} onChange={(e) => setEkMadde(e.target.value)} placeholder="hastanın getirdiği ürün, vb." />
                </label>
              )}
              <p style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>
                Derece anlamları: {ICDRG_DERECELERI.map((x) => `${x.ad} ${x.aciklama}`).join(' · ')}
              </p>
            </div>
          )}

          <p style={{ fontSize: 12.5, marginTop: 8 }}>
            Pozitif ({pozitifler.length}): {pozitifler.length ? pozitifler.map((p) => alerjenAdi(p)).join(', ') : '—'}
          </p>
          <button
            type="button"
            style={{ ...btn(true), marginTop: 6 }}
            onClick={() =>
              onKaydet({
                id: course?.id ? String(course.id) : undefined,
                appliedAt: f.appliedAt,
                readD2: f.readD2 || null,
                readD4: f.readD4 || null,
                positives: [...pozitifler, ...ekMadde.split(',').map((s) => s.trim()).filter(Boolean)].join(', '),
                series: seri,
                d2Dereceler: d2,
                d4Dereceler: d4,
              })
            }
            data-derm="yama-kaydet"
          >
            {course ? 'Yama güncelle' : 'Yama başlat'}
          </button>
        </div>
      )}
    </section>
  )
}

export default YamaTakvimi
