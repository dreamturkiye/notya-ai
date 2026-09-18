'use client'

/**
 * DERM-EXCEPTIONAL-01 — Skor paneli v2. PASI ve EASI artık **bölge çalışma sayfası** ile girilir
 * (4 bölge × E/I/D + alan); toplam ve bant `engines/score-calculator` ile hesaplanır, serbest sayı
 * girişi yok. SCORAD, DLQI, UAS7, SALT ve akne IGA yapılandırılmış alanlardır.
 * Döküm `ek` alanında (jsonb) saklanır; skorlar `derm_skor_anlari` satırında kalır.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { btn, giris, etiketS, kutu } from './clinic-styles'
import {
  AKNE_IGA,
  DLQI_SORU_SAYISI,
  EASI_ALAN_SKALASI,
  EASI_SIDDET_ALANLARI,
  PASI_ALAN_SKALASI,
  PASI_BOLGELERI,
  PASI_SIDDET_ALANLARI,
  SALT_BOLGELERI,
  SCORAD_SIDDET_ALANLARI,
  bosBolgeGirdisi,
  dlqi as dlqiTopla,
  dlqiBant,
  easiDokumu,
  pasiDokumu,
  saltBolgelerden,
  scoradHesap,
  uas7Bant,
  uas7Gunlerden,
  type BolgeAnahtari,
  type BolgeGirdisi,
  type SkorDokumu,
} from '../engines/score-calculator'

export type SkorKayit = {
  pasi?: number
  easi?: number
  dlqi?: number
  uas7?: number
  salt?: number
  scorad?: number
  iga?: number
  bsa_pct?: number
  /** bölge dökümü + alt puanlar (jsonb) */
  ek?: Record<string, unknown>
}

type Sayfa = 'pasi' | 'easi' | 'scorad' | 'dlqi' | 'uas7' | 'salt' | 'iga'

const sekme = (aktif: boolean): CSSProperties => ({
  ...btn(aktif),
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: aktif ? 700 : 500,
})

const hucre: CSSProperties = { padding: '4px 6px', fontSize: 12.5, textAlign: 'left' }

function SayiSecici({
  deger,
  max,
  onChange,
  ad,
  skala,
}: {
  deger: number
  max: number
  onChange: (v: number) => void
  ad: string
  skala?: Array<{ skor: number; ad: string }>
}) {
  return (
    <select
      aria-label={ad}
      style={{ ...giris, padding: '5px 6px', width: skala ? 128 : 64 }}
      value={String(deger)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {Array.from({ length: max + 1 }, (_, i) => (
        <option key={i} value={i} style={{ color: '#000' }}>
          {skala ? `${i} · ${skala.find((s) => s.skor === i)?.ad ?? ''}` : i}
        </option>
      ))}
    </select>
  )
}

function BolgeSayfasi({
  skor,
  girdi,
  setGirdi,
  dokum,
}: {
  skor: 'pasi' | 'easi'
  girdi: BolgeGirdisi
  setGirdi: (g: BolgeGirdisi) => void
  dokum: SkorDokumu
}) {
  const alanlar = skor === 'pasi' ? PASI_SIDDET_ALANLARI : EASI_SIDDET_ALANLARI
  const alanSkala = skor === 'pasi' ? PASI_ALAN_SKALASI : EASI_ALAN_SKALASI
  const set = (b: BolgeAnahtari, k: 'e' | 'i' | 'd' | 'a', v: number) =>
    setGirdi({ ...girdi, [b]: { ...girdi[b], [k]: v } })

  return (
    <div data-derm={`skor-bolge-${skor}`}>
      <p style={{ fontSize: 12, color: '#8FA0B5', margin: '4px 0 8px' }}>
        Bölge bölge girilir; toplam otomatik hesaplanır. Yetişkin bölge katsayıları kullanılır — çocukta katsayı
        farkı hekim teyidiyle değerlendirilir.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
          <thead>
            <tr style={{ color: '#8FA0B5', fontSize: 11.5 }}>
              <th style={hucre}>Bölge</th>
              {alanlar.map((a) => <th key={a.id} style={hucre}>{a.ad} (0–{a.max})</th>)}
              <th style={hucre}>Alan (0–6)</th>
              <th style={hucre}>Katkı</th>
            </tr>
          </thead>
          <tbody>
            {PASI_BOLGELERI.map((b) => {
              const satir = dokum.bolgeler.find((x) => x.id === b.id)
              return (
                <tr key={b.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td style={hucre}>
                    <div style={{ fontWeight: 600 }}>{b.ad}</div>
                    <div style={{ fontSize: 10.5, color: '#8FA0B5' }}>×{b.agirlik} · {b.ipucu}</div>
                  </td>
                  {alanlar.map((a) => (
                    <td key={a.id} style={hucre}>
                      <SayiSecici
                        ad={`${b.ad} ${a.ad}`}
                        deger={girdi[b.id][a.id]}
                        max={a.max}
                        onChange={(v) => set(b.id, a.id, v)}
                      />
                    </td>
                  ))}
                  <td style={hucre}>
                    <SayiSecici ad={`${b.ad} alan`} deger={girdi[b.id].a} max={6} skala={alanSkala} onChange={(v) => set(b.id, 'a', v)} />
                  </td>
                  <td style={{ ...hucre, fontVariantNumeric: 'tabular-nums' }}>{satir?.katki ?? 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, marginTop: 8 }} data-derm={`skor-toplam-${skor}`}>
        <b>{skor === 'pasi' ? 'PASI' : 'EASI'} {dokum.toplam}</b> — {dokum.bant}
      </p>
      {dokum.eksikBolgeler.length > 0 && (
        <p style={{ fontSize: 11.5, color: '#FDE68A' }}>
          Girilmemiş bölge: {dokum.eksikBolgeler.join(', ')} (tutulum yoksa 0 bırakmak geçerlidir)
        </p>
      )}
    </div>
  )
}

export function SkorPaneli({
  pasi,
  easi,
  dlqi,
  uas7,
  salt,
  scorad,
  iga,
  showUas7,
  showSalt,
  showIga,
  showScorad,
  emptyAction,
  onKaydet,
}: {
  pasi?: number
  easi?: number
  dlqi?: number
  uas7?: number
  salt?: number
  scorad?: number
  iga?: number
  showUas7?: boolean
  showSalt?: boolean
  showIga?: boolean
  showScorad?: boolean
  emptyAction?: ReactNode
  onKaydet?: (s: SkorKayit) => void
}) {
  const empty = pasi == null && easi == null && dlqi == null && uas7 == null && salt == null && scorad == null && iga == null
  const [sayfa, setSayfa] = useState<Sayfa>('pasi')
  const [pasiGirdi, setPasiGirdi] = useState<BolgeGirdisi>(bosBolgeGirdisi)
  const [easiGirdi, setEasiGirdi] = useState<BolgeGirdisi>(bosBolgeGirdisi)
  const [dlqiCevap, setDlqiCevap] = useState<number[]>(Array.from({ length: DLQI_SORU_SAYISI }, () => 0))
  const [uasGun, setUasGun] = useState(Array.from({ length: 7 }, () => ({ kabarti: 0, kasinti: 0 })))
  const [saltGirdi, setSaltGirdi] = useState({ vertex: 0, sag: 0, sol: 0, oksiput: 0 })
  const [scoradGirdi, setScoradGirdi] = useState({ yaygınlık: 0, kasinti: 0, uykusuzluk: 0, siddet: {} as Record<string, number> })
  const [igaGirdi, setIgaGirdi] = useState<number>(0)
  const [bsa, setBsa] = useState('')

  const pasiD = useMemo(() => pasiDokumu(pasiGirdi), [pasiGirdi])
  const easiD = useMemo(() => easiDokumu(easiGirdi), [easiGirdi])
  const dlqiToplam = dlqiTopla(dlqiCevap)
  const uasSonuc = uas7Gunlerden(uasGun)
  const saltSonuc = saltBolgelerden(saltGirdi)
  const scoradSonuc = scoradHesap(scoradGirdi)

  const sayfalar: Array<{ id: Sayfa; ad: string; gorunur: boolean }> = [
    { id: 'pasi', ad: 'PASI', gorunur: true },
    { id: 'easi', ad: 'EASI', gorunur: true },
    { id: 'scorad', ad: 'SCORAD', gorunur: showScorad !== false },
    { id: 'dlqi', ad: 'DLQI', gorunur: true },
    { id: 'uas7', ad: 'UAS7', gorunur: !!showUas7 },
    { id: 'salt', ad: 'SALT', gorunur: !!showSalt },
    { id: 'iga', ad: 'Akne IGA', gorunur: !!showIga },
  ]

  const kaydet = () => {
    if (!onKaydet) return
    const s: SkorKayit = {}
    const ek: Record<string, unknown> = {}
    if (sayfa === 'pasi') {
      s.pasi = pasiD.toplam
      ek.pasi = { bolgeler: pasiD.bolgeler, bant: pasiD.bant, girdi: pasiGirdi }
    } else if (sayfa === 'easi') {
      s.easi = easiD.toplam
      ek.easi = { bolgeler: easiD.bolgeler, bant: easiD.bant, girdi: easiGirdi }
    } else if (sayfa === 'scorad') {
      s.scorad = scoradSonuc.toplam
      ek.scorad = { a: scoradSonuc.a, b: scoradSonuc.b, c: scoradSonuc.c, bant: scoradSonuc.bant, girdi: scoradGirdi }
    } else if (sayfa === 'dlqi') {
      s.dlqi = dlqiToplam
      ek.dlqi = { cevaplar: dlqiCevap, bant: dlqiBant(dlqiToplam) }
    } else if (sayfa === 'uas7') {
      s.uas7 = uasSonuc.toplam
      ek.uas7 = { gunler: uasGun, bant: uasSonuc.bant }
    } else if (sayfa === 'salt') {
      s.salt = saltSonuc.toplam
      ek.salt = { bolgeler: saltSonuc.bolgeler, bant: saltSonuc.bant }
    } else if (sayfa === 'iga') {
      s.iga = igaGirdi
      ek.iga = { ad: AKNE_IGA.find((x) => x.skor === igaGirdi)?.ad }
    }
    if (bsa !== '' && Number.isFinite(Number(bsa))) s.bsa_pct = Math.min(100, Math.max(0, Number(bsa)))
    onKaydet({ ...s, ek })
  }

  return (
    <section style={kutu} data-tab="SkorPaneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>Skor paneli</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        PASI / EASI / DLQI bu bölümde tutulur — çekirdek hasta kartına yazılmaz. PASI ve EASI bölge çalışma
        sayfasından hesaplanır; elle toplam girilmez.
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, fontSize: 13, margin: 0 }}>
        <div><dt>PASI</dt><dd>{pasi ?? '—'}</dd></div>
        <div><dt>EASI</dt><dd>{easi ?? '—'}</dd></div>
        <div><dt>DLQI</dt><dd>{dlqi ?? '—'}</dd></div>
        {showScorad !== false && <div><dt>SCORAD</dt><dd>{scorad ?? '—'}</dd></div>}
        {showUas7 && <div><dt>UAS7</dt><dd>{uas7 ?? '—'}</dd></div>}
        {showSalt && <div><dt>SALT</dt><dd>{salt ?? '—'}</dd></div>}
        {showIga && <div><dt>IGA</dt><dd>{iga ?? '—'}</dd></div>}
      </dl>
      {empty && (
        <p style={{ fontSize: 12.5, color: '#8FA0B5', marginBottom: emptyAction || onKaydet ? 8 : 0 }}>
          Henüz skor yok. Çalışma sayfasından PASI / EASI / DLQI hesaplayın.
        </p>
      )}
      {empty && emptyAction}

      {onKaydet && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }} data-derm="skor-sekmeleri">
            {sayfalar.filter((s) => s.gorunur).map((s) => (
              <button key={s.id} type="button" style={sekme(sayfa === s.id)} onClick={() => setSayfa(s.id)}>{s.ad}</button>
            ))}
          </div>

          {sayfa === 'pasi' && <BolgeSayfasi skor="pasi" girdi={pasiGirdi} setGirdi={setPasiGirdi} dokum={pasiD} />}
          {sayfa === 'easi' && <BolgeSayfasi skor="easi" girdi={easiGirdi} setGirdi={setEasiGirdi} dokum={easiD} />}

          {sayfa === 'scorad' && (
            <div data-derm="skor-scorad">
              <label style={{ display: 'block', maxWidth: 220 }}>
                <span style={etiketS}>A — tutulan yüzey alanı (%)</span>
                <input
                  style={giris}
                  inputMode="numeric"
                  value={String(scoradGirdi.yaygınlık)}
                  onChange={(e) => setScoradGirdi((p) => ({ ...p, yaygınlık: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                />
              </label>
              <p style={{ ...etiketS, marginTop: 8 }}>B — şiddet alanları (her biri 0–3)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 6 }}>
                {SCORAD_SIDDET_ALANLARI.map((a) => (
                  <label key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5 }}>
                    <SayiSecici
                      ad={a.ad}
                      deger={scoradGirdi.siddet[a.id] ?? 0}
                      max={3}
                      onChange={(v) => setScoradGirdi((p) => ({ ...p, siddet: { ...p.siddet, [a.id]: v } }))}
                    />
                    {a.ad}
                  </label>
                ))}
              </div>
              <p style={{ ...etiketS, marginTop: 8 }}>C — hasta beyanı (son 3 gün ortalaması, 0–10)</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12.5 }}>
                  <span style={etiketS}>Kaşıntı</span>
                  <SayiSecici ad="Kaşıntı" deger={scoradGirdi.kasinti} max={10} onChange={(v) => setScoradGirdi((p) => ({ ...p, kasinti: v }))} />
                </label>
                <label style={{ fontSize: 12.5 }}>
                  <span style={etiketS}>Uykusuzluk</span>
                  <SayiSecici ad="Uykusuzluk" deger={scoradGirdi.uykusuzluk} max={10} onChange={(v) => setScoradGirdi((p) => ({ ...p, uykusuzluk: v }))} />
                </label>
              </div>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                <b>SCORAD {scoradSonuc.toplam}</b> — {scoradSonuc.bant} (A {scoradSonuc.a} · B {scoradSonuc.b} · C {scoradSonuc.c})
              </p>
              {scoradSonuc.eksikler.length > 0 && (
                <p style={{ fontSize: 11.5, color: '#FDE68A' }}>Eksik: {scoradSonuc.eksikler.join(', ')}</p>
              )}
            </div>
          )}

          {sayfa === 'dlqi' && (
            <div data-derm="skor-dlqi">
              <p style={{ fontSize: 12, color: '#8FA0B5' }}>
                Hastanın doldurduğu DLQI formundaki 10 sorunun puanları girilir (her soru 0–3). Soru metinleri
                Notya'da tutulmaz — hekim kendi formunu kullanır.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
                {dlqiCevap.map((v, i) => (
                  <label key={i} style={{ fontSize: 12.5 }}>
                    <span style={etiketS}>Soru {i + 1}</span>
                    <SayiSecici
                      ad={`DLQI soru ${i + 1}`}
                      deger={v}
                      max={3}
                      onChange={(nv) => setDlqiCevap((p) => p.map((x, j) => (j === i ? nv : x)))}
                    />
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 13, marginTop: 8 }}><b>DLQI {dlqiToplam}</b> — {dlqiBant(dlqiToplam)}</p>
            </div>
          )}

          {sayfa === 'uas7' && showUas7 && (
            <div data-derm="skor-uas7">
              <p style={{ fontSize: 12, color: '#8FA0B5' }}>7 gün × (kabartı 0–3 + kaşıntı 0–3) = 0–42.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6 }}>
                {uasGun.map((g, i) => (
                  <div key={i} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: 6 }}>
                    <div style={{ ...etiketS, marginBottom: 2 }}>{i + 1}. gün</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <label style={{ fontSize: 11.5 }}>Kabartı
                        <SayiSecici ad={`${i + 1}. gün kabartı`} deger={g.kabarti} max={3} onChange={(v) => setUasGun((p) => p.map((x, j) => (j === i ? { ...x, kabarti: v } : x)))} />
                      </label>
                      <label style={{ fontSize: 11.5 }}>Kaşıntı
                        <SayiSecici ad={`${i + 1}. gün kaşıntı`} deger={g.kasinti} max={3} onChange={(v) => setUasGun((p) => p.map((x, j) => (j === i ? { ...x, kasinti: v } : x)))} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, marginTop: 8 }}><b>UAS7 {uasSonuc.toplam}</b> — {uas7Bant(uasSonuc.toplam)}</p>
            </div>
          )}

          {sayfa === 'salt' && showSalt && (
            <div data-derm="skor-salt">
              <p style={{ fontSize: 12, color: '#8FA0B5' }}>Saçlı deri dört bölgesi ağırlıklı toplanır.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                {SALT_BOLGELERI.map((b) => (
                  <label key={b.id} style={{ fontSize: 12.5 }}>
                    <span style={etiketS}>{b.ad} — kayıp % (×{b.agirlik})</span>
                    <input
                      style={giris}
                      inputMode="numeric"
                      value={String(saltGirdi[b.id])}
                      onChange={(e) => setSaltGirdi((p) => ({ ...p, [b.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    />
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 13, marginTop: 8 }}><b>SALT {saltSonuc.toplam}</b> — {saltSonuc.bant}</p>
            </div>
          )}

          {sayfa === 'iga' && showIga && (
            <div data-derm="skor-iga">
              <p style={{ fontSize: 12, color: '#8FA0B5' }}>Akne şiddeti hekim değerlendirmesi (0–4). Tedavi seçimi ve doz hekimindir.</p>
              <div style={{ display: 'grid', gap: 4 }}>
                {AKNE_IGA.map((x) => (
                  <label key={x.skor} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5 }}>
                    <input type="radio" name="derm-iga" checked={igaGirdi === x.skor} onChange={() => setIgaGirdi(x.skor)} style={{ marginTop: 3 }} />
                    <span><b>{x.skor} · {x.ad}</b> — {x.tanim}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 }}>
            <label style={{ maxWidth: 170 }}>
              <span style={etiketS}>BSA — tutulan yüzey (%)</span>
              <input style={giris} inputMode="numeric" value={bsa} onChange={(e) => setBsa(e.target.value)} placeholder="ör. 12" />
            </label>
            <button type="button" style={btn(true)} onClick={kaydet} data-derm="skor-kaydet">Skoru kaydet</button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SkorPaneli
