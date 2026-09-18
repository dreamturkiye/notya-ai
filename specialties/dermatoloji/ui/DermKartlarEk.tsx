'use client'

/**
 * DERM-EXCEPTIONAL-01 — Deri & Lezyon sekmesine eklenen kartlar (göz `GozKartlarEk.tsx` deseni):
 * acil bandı + yazdırılabilir eylem listesi, biyolojik SUT rapor taslağı, psoriasis / atopi basamak
 * kartları, akne IGA, dermoskopi çalışma sayfaları, saç-tırnak, Behçet / büllü / BZBH izlem kartları,
 * kozmetik lot-komplikasyon (ünite kapılı), işlem odası yazdırma, Derim hatırlatmaları.
 *
 * Motor önerir / uyarır; **tanı, basamak kilidi, ilaç ve doz hekimindir**. Hiçbir kartta doz yoktur.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { btn, giris, etiketS, kutu } from './clinic-styles'
import { DERM_FITZ, dermLabel } from './labels'
import { FITZPATRICK } from '../schema'
import type { BehcetCard, BullousWorkup, Lesion } from '../schema'
import {
  DERM_ACIL_EYLEM_LISTESI,
  DERM_ACIL_KODLARI,
  acilBandMetni,
  type DermAcilBayrak,
  type DermAcilKod,
} from '../engines/acil'
import {
  BIYOLOJIK_ENDIKASYON_ADI,
  BIYOLOJIK_SABLONLARI,
  BASAMAK_SONUC_ADI,
  ONCEKI_BASAMAK_ADI,
  biyolojikSutMetni,
  biyolojikSutTaslak,
  type BasamakBeyani,
  type BiyolojikEndikasyon,
  type BiyolojikSablon,
  type OncekiBasamak,
} from '../engines/biyolojikSutRapor'
import {
  ATOPI_BASAMAKLARI,
  PSA_TRIYAJ_MADDELERI,
  PSORIASIS_BASAMAKLARI,
  akneKarar,
  atopiMerdiveni,
  psaTriyaj,
  psoriasisMerdiveni,
} from '../engines/tedaviMerdivenleri'
import { skorTrend } from '../engines/score-calculator'
import {
  CASH_BILESENLERI,
  UC_NOKTA_OLCUTLERI,
  YEDI_NOKTA_OLCUTLERI,
  cashSkor,
  ucNoktaSkor,
  yediNoktaSkor,
  TRIKOSKOPI_ALANLARI,
  type DermoskopiAlgoritma,
} from '../imaging/dermoscopy'
import { TIRNAK_BULGULARI, behcetTakip, bullozTakip, bzbhTakip, sacTirnakTakip, type TakipKarti } from '../engines/takipKartlari'
import {
  AYAKTA_TESHIS_NOTU,
  KOZMETIK_ISLEM_ADI,
  KOZMETIK_KOMPLIKASYONLARI,
  LOT_ZORUNLU,
  kozmetikKontrol,
  type KozmetikIslemTuru,
} from '../protocols/aesthetics-legal'
import { FIKSATIF_SECENEKLERI, form014Taslagi, onamYazdirmaTaslagi, spesimenEtiketleri, taslakMetni, type YazdirmaTaslagi } from '../engines/yazdirma'
import { ISLEM_SABLONLARI, DERM_ONAMLAR, type IslemTuru } from '../engines/derm-spine'
import { dipnotMetni, type Dipnot } from '../protocols/sources'
import type { BzbhKind } from '../protocols/endemic-bzbh'
import { derimHatirlatmaOnerileri, hatirlatmaGecerliMi, type DerimHatirlatma, type HatirlatmaGirdi } from '../engines/derimHatirlatma'

export type Kaydet = (body: Record<string, unknown>, ok?: string) => void

const ic: CSSProperties = { border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginTop: 8 }
const kucuk: CSSProperties = { fontSize: 11.5, color: '#8FA0B5' }
const satirlik: CSSProperties = { fontSize: 12.5 }

function Kutucuk({ c, set, children }: { c: boolean; set: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12.5, minHeight: 26 }}>
      <input type="checkbox" checked={c} onChange={(e) => set(e.target.checked)} style={{ marginTop: 3 }} />
      <span>{children}</span>
    </label>
  )
}

function Dipnotlar({ liste }: { liste: Dipnot[] }) {
  if (!liste.length) return null
  return (
    <ul style={{ ...kucuk, listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'grid', gap: 2 }}>
      {liste.map((d, i) => <li key={`${d.ref}-${i}`}>· {dipnotMetni(d)}</li>)}
    </ul>
  )
}

/**
 * Yazdırma: içerik istemcide kurulur ve gizli iframe'e yazılır — **URL'e PHI konmaz**,
 * sunucuya yeni istek gitmez.
 */
export function yazdirTaslak(t: YazdirmaTaslagi) {
  if (typeof document === 'undefined') return
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) { document.body.removeChild(iframe); return }
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c))
  doc.open()
  doc.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(t.baslik)}</title>
<style>body{font:12pt/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:22mm 18mm}
h1{font-size:15pt;margin:0 0 8pt}h2{font-size:12pt;margin:12pt 0 4pt}
ul{margin:0 0 8pt 16pt;padding:0}li{margin:0 0 3pt}
.ust{font-size:11pt;margin:0 0 10pt}.imza{margin-top:26pt;font-size:11pt}.alt{margin-top:18pt;font-size:9.5pt;color:#444}</style>
</head><body><h1>${esc(t.baslik)}</h1>
<div class="ust">${t.ustBilgi.map((s) => esc(s)).join('<br>')}</div>
${t.bolumler.map((b) => `<h2>${esc(b.baslik)}</h2><ul>${b.satirlar.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`).join('')}
<div class="imza">${t.imzaSatirlari.map((s) => esc(s)).join('<br><br>')}</div>
<div class="alt">${t.altBilgi.map((s) => esc(s)).join('<br>')}</div>
</body></html>`)
  doc.close()
  const w = iframe.contentWindow
  if (w) { w.focus(); w.print() }
  setTimeout(() => { if (iframe.parentNode) document.body.removeChild(iframe) }, 1500)
}

// ────────────────────────────── Acil bandı ──────────────────────────────

/**
 * Kırmızı bayrak bandı — hekim işaretleri + yazdırılabilir eylem listesi.
 * Sticky olan üstteki şerittir (`StickyDermStrip.acilBant`); bu bant onun hemen altında durur:
 * iki ayrı sticky katman mobilde üst üste biner.
 */
export function AcilBandi({
  bayraklar,
  hekimIsaretleri,
  onIsaretle,
  hastaAdi,
  bugun,
  klinikAdi,
}: {
  bayraklar: DermAcilBayrak[]
  hekimIsaretleri: DermAcilKod[]
  onIsaretle?: (kodlar: DermAcilKod[]) => void
  hastaAdi?: string | null
  bugun: string
  klinikAdi?: string | null
}) {
  const [acik, setAcik] = useState(false)
  const [secili, setSecili] = useState<DermAcilKod[]>(hekimIsaretleri)
  const hemen = bayraklar.some((b) => b.oncelik === 'hemen')

  return (
    <div
      style={{
        ...kutu,
        borderColor: bayraklar.length ? (hemen ? 'rgba(239,68,68,0.75)' : 'rgba(245,158,11,0.7)') : 'rgba(255,255,255,0.09)',
        background: bayraklar.length
          ? `linear-gradient(135deg, rgba(11,22,40,0.97), ${hemen ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.18)'})`
          : undefined,
      }}
      data-derm="acil-bandi"
    >
      {bayraklar.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: hemen ? '#FCA5A5' : '#FDE68A' }}>
              {acilBandMetni(bayraklar).join('  ·  ')}
            </div>
            <button type="button" style={btn(true)} onClick={() => setAcik((v) => !v)} data-derm="acil-eylem-ac">
              {acik ? 'Kapat' : 'Eylem listesi'}
            </button>
          </div>
          <ul style={{ display: 'grid', gap: 4, paddingLeft: 18, margin: '6px 0 0', fontSize: 12.5 }}>
            {bayraklar.map((b) => <li key={b.kod}><b>{b.ad}:</b> {b.eylem}</li>)}
          </ul>
          <Dipnotlar liste={bayraklar.map((b) => b.dipnot)} />
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: '#8FA0B5' }}>Acil kırmızı bayrak işareti yok. Hekim elle işaretleyebilir.</div>
      )}

      {acik && (
        <div style={ic}>
          {bayraklar.map((b) => (
            <div key={b.kod} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{b.ad}</div>
              <ul style={{ paddingLeft: 18, margin: '4px 0 0', fontSize: 12.5 }}>
                {DERM_ACIL_EYLEM_LISTESI[b.kod].map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          ))}
          <button
            type="button"
            style={btn()}
            onClick={() =>
              yazdirTaslak({
                baslik: 'Dermatoloji Acil Eylem Listesi',
                ustBilgi: [klinikAdi || '', hastaAdi ? `Hasta: ${hastaAdi}` : 'Hasta: ……………………', `Tarih: ${bugun}`].filter(Boolean),
                bolumler: bayraklar.map((b) => ({ baslik: `${b.ad} (${b.oncelik === 'hemen' ? 'HEMEN' : 'AYNI GÜN'})`, satirlar: [b.eylem, ...DERM_ACIL_EYLEM_LISTESI[b.kod]] })),
                imzaSatirlari: ['Uygulayan (hemşire) adı, imza: ………………………', 'Hekim adı, imza: ………………………'],
                altBilgi: ['Eylem sırası bilgilendirmedir; tedavi, ilaç ve doz kararı hekimindir.'],
              })
            }
            data-derm="acil-yazdir"
          >
            Eylem listesini yazdır
          </button>
        </div>
      )}

      {onIsaretle && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...kucuk, cursor: 'pointer' }}>Hekim işareti (metinde yakalanmadıysa)</summary>
          <div style={{ display: 'grid', gap: 2, marginTop: 6 }}>
            {DERM_ACIL_KODLARI.map((k) => (
              <Kutucuk
                key={k.kod}
                c={secili.includes(k.kod)}
                set={(v) => setSecili((p) => (v ? [...new Set([...p, k.kod])] : p.filter((x) => x !== k.kod)))}
              >
                {k.ad}
              </Kutucuk>
            ))}
            <button type="button" style={{ ...btn(true), marginTop: 6 }} onClick={() => onIsaretle(secili)} data-derm="acil-isaret-kaydet">
              İşaretleri kaydet
            </button>
          </div>
        </details>
      )}
    </div>
  )
}

// ────────────────────────────── Biyolojik / SUT rapor taslağı ──────────────────────────────

export function BiyolojikSutKarti({
  hastaAdi,
  bugun,
  skorlar,
  tbScreen,
  hbvScreen,
  psaTutulumu,
  onKilitle,
}: {
  hastaAdi: string
  bugun: string
  skorlar?: { pasiBaslangic?: number | null; pasiSimdi?: number | null; easiBaslangic?: number | null; easiSimdi?: number | null; dlqiBaslangic?: number | null; dlqiSimdi?: number | null; bsaPct?: number | null }
  tbScreen?: boolean
  hbvScreen?: boolean
  psaTutulumu?: boolean
  onKilitle?: (rapor: { sablon: string; endikasyon: string; metin: string; eksikler: string[] }) => void
}) {
  const [sablon, setSablon] = useState<BiyolojikSablon>('baslangic')
  const [endikasyon, setEndikasyon] = useState<BiyolojikEndikasyon>('psoriasis')
  const [etken, setEtken] = useState('')
  const [anamnez, setAnamnez] = useState('')
  const [basamaklar, setBasamaklar] = useState<Record<OncekiBasamak, BasamakBeyani['sonuc'] | ''>>({
    topikal: '', fototerapi: '', konvansiyonel_sistemik: '', biyolojik: '',
  })
  const [lab, setLab] = useState({ tb: !!tbScreen, grafik: '', hbv: !!hbvScreen, hcv: false, hiv: false })
  const [gebelik, setGebelik] = useState<'yok' | 'gebe' | 'laktasyon' | 'bilinmiyor'>('bilinmiyor')
  const [canliAsi, setCanliAsi] = useState(false)
  const [yanitBeyani, setYanitBeyani] = useState(false)
  const [foto, setFoto] = useState({ baslangic: '', hafta12: '' })

  const sonuc = useMemo(
    () =>
      biyolojikSutTaslak({
        sablon,
        hasta: { adSoyad: hastaAdi },
        endikasyon,
        etkenMadde: etken || null,
        anamnez: anamnez || null,
        pasiBaslangic: skorlar?.pasiBaslangic ?? null,
        pasiSimdi: skorlar?.pasiSimdi ?? null,
        easiBaslangic: skorlar?.easiBaslangic ?? null,
        easiSimdi: skorlar?.easiSimdi ?? null,
        dlqiBaslangic: skorlar?.dlqiBaslangic ?? null,
        dlqiSimdi: skorlar?.dlqiSimdi ?? null,
        bsaPct: skorlar?.bsaPct ?? null,
        tbTarama: lab.tb,
        akcigerGrafisi: lab.grafik || null,
        hbvTarama: lab.hbv,
        hcvTarama: lab.hcv,
        hiv: lab.hiv,
        gebelikDurumu: gebelik,
        canliAsiBilgilendirme: canliAsi,
        basamaklar: (Object.entries(basamaklar) as Array<[OncekiBasamak, BasamakBeyani['sonuc'] | '']>)
          .filter(([, v]) => v !== '')
          .map(([basamak, sonuc]) => ({ basamak, sonuc: sonuc as BasamakBeyani['sonuc'] })),
        psaTutulumu,
        hekimYanitVarBeyani: yanitBeyani,
        fotoBaslangic: foto.baslangic || null,
        fotoHafta12: foto.hafta12 || null,
        bugun,
      }),
    [sablon, endikasyon, etken, anamnez, skorlar, lab, gebelik, canliAsi, basamaklar, psaTutulumu, yanitBeyani, foto, hastaAdi, bugun],
  )

  return (
    <section style={kutu} data-derm="biyolojik-sut">
      <h2 style={{ margin: 0, fontSize: 16 }}>Biyolojik / sistemik tedavi — SUT rapor taslağı</h2>
      <p style={kucuk}>{sonuc.dozKilidi} Medula girişi ve e-imza hekim tarafından yapılır.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
        <label><span style={etiketS}>Şablon</span>
          <select style={giris} value={sablon} onChange={(e) => setSablon(e.target.value as BiyolojikSablon)}>
            {BIYOLOJIK_SABLONLARI.map((s) => <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.ad}</option>)}
          </select>
        </label>
        <label><span style={etiketS}>Endikasyon</span>
          <select style={giris} value={endikasyon} onChange={(e) => setEndikasyon(e.target.value as BiyolojikEndikasyon)}>
            {(Object.keys(BIYOLOJIK_ENDIKASYON_ADI) as BiyolojikEndikasyon[]).map((k) => (
              <option key={k} value={k} style={{ color: '#000' }}>{BIYOLOJIK_ENDIKASYON_ADI[k]}</option>
            ))}
          </select>
        </label>
        <label><span style={etiketS}>Etken madde / sınıf (doz yazma)</span>
          <input style={giris} value={etken} onChange={(e) => setEtken(e.target.value)} placeholder="hekim yazar" />
        </label>
        <label style={{ gridColumn: '1 / -1' }}><span style={etiketS}>Anamnez özeti</span>
          <textarea style={{ ...giris, minHeight: 54 }} value={anamnez} onChange={(e) => setAnamnez(e.target.value)} />
        </label>
      </div>

      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Önceki basamaklar (hekim beyanı)</div>
        {(Object.keys(ONCEKI_BASAMAK_ADI) as OncekiBasamak[]).map((b) => (
          <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, marginTop: 4 }}>
            <span style={{ flex: '1 1 180px' }}>{ONCEKI_BASAMAK_ADI[b]}</span>
            <select
              aria-label={`${ONCEKI_BASAMAK_ADI[b]} sonucu`}
              style={{ ...giris, width: 'auto' }}
              value={basamaklar[b]}
              onChange={(e) => setBasamaklar((p) => ({ ...p, [b]: e.target.value as BasamakBeyani['sonuc'] | '' }))}
            >
              <option value="" style={{ color: '#000' }}>— seçilmedi</option>
              {(Object.keys(BASAMAK_SONUC_ADI) as Array<BasamakBeyani['sonuc']>).map((s) => (
                <option key={s} value={s} style={{ color: '#000' }}>{BASAMAK_SONUC_ADI[s]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Tarama ve güvenlik</div>
        <Kutucuk c={lab.tb} set={(v) => setLab((p) => ({ ...p, tb: v }))}>Tüberküloz taraması (PPD / IGRA) yapıldı</Kutucuk>
        <Kutucuk c={lab.hbv} set={(v) => setLab((p) => ({ ...p, hbv: v }))}>HBV serolojisi var</Kutucuk>
        <Kutucuk c={lab.hcv} set={(v) => setLab((p) => ({ ...p, hcv: v }))}>HCV serolojisi var</Kutucuk>
        <Kutucuk c={lab.hiv} set={(v) => setLab((p) => ({ ...p, hiv: v }))}>HIV serolojisi istendi</Kutucuk>
        <Kutucuk c={canliAsi} set={setCanliAsi}>Canlı virüs aşısı yasağı hastaya anlatıldı</Kutucuk>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 6 }}>
          <label><span style={etiketS}>Akciğer grafisi tarihi</span>
            <input type="date" style={giris} value={lab.grafik} onChange={(e) => setLab((p) => ({ ...p, grafik: e.target.value }))} />
          </label>
          <label><span style={etiketS}>Gebelik / laktasyon</span>
            <select style={giris} value={gebelik} onChange={(e) => setGebelik(e.target.value as typeof gebelik)}>
              <option value="bilinmiyor" style={{ color: '#000' }}>Belirtilmedi</option>
              <option value="yok" style={{ color: '#000' }}>Yok</option>
              <option value="gebe" style={{ color: '#000' }}>Gebe</option>
              <option value="laktasyon" style={{ color: '#000' }}>Laktasyon</option>
            </select>
          </label>
          <label><span style={etiketS}>Başlangıç foto tarihi</span>
            <input type="date" style={giris} value={foto.baslangic} onChange={(e) => setFoto((p) => ({ ...p, baslangic: e.target.value }))} />
          </label>
          {sablon === 'idame' && (
            <label><span style={etiketS}>12. hafta foto tarihi</span>
              <input type="date" style={giris} value={foto.hafta12} onChange={(e) => setFoto((p) => ({ ...p, hafta12: e.target.value }))} />
            </label>
          )}
        </div>
        {sablon === 'idame' && <Kutucuk c={yanitBeyani} set={setYanitBeyani}>Hekim beyanı: hasta tedaviye yanıt vermektedir</Kutucuk>}
      </div>

      <div style={ic} data-derm="biyolojik-sut-kontrol">
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Zorunlu maddeler</div>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 3 }}>
          {sonuc.sutKontrol.map((k, i) => (
            <li key={i} style={satirlik}>
              <span style={{ color: k.tamam === true ? '#86EFAC' : k.tamam === false ? '#FCA5A5' : '#FDE68A' }}>
                {k.tamam === true ? '✓' : k.tamam === false ? '✗' : '•'}
              </span>{' '}
              {k.madde}
            </li>
          ))}
        </ul>
        {sonuc.eksikler.length > 0 && (
          <p style={{ fontSize: 12.5, color: '#FCA5A5', marginTop: 6 }}>
            Eksikler: {sonuc.eksikler.join(' · ')}
          </p>
        )}
        <p style={{ ...satirlik, marginTop: 6 }}>
          <b>{sonuc.draft.raporBasligi}</b> — {sonuc.raporTipi}
        </p>
        <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', margin: '6px 0 0', maxHeight: 180, overflow: 'auto' }}>{biyolojikSutMetni(sonuc)}</pre>
        <Dipnotlar liste={sonuc.dipnotlar} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            type="button"
            style={btn()}
            onClick={() =>
              yazdirTaslak({
                baslik: sonuc.draft.raporBasligi,
                ustBilgi: [`Rapor türü: ${sonuc.raporTipi}`, `Tanı önerisi (hekim doğrular): ${sonuc.draft.tani.icd10} ${sonuc.draft.tani.aciklama}`, `Tarih: ${bugun}`],
                bolumler: [
                  { baslik: 'Klinik durum', satirlar: (sonuc.draft.mevcutDurum || '').split('\n').filter(Boolean) },
                  { baslik: 'Tetkikler', satirlar: sonuc.draft.zorunluTetkikler || [] },
                  { baslik: 'Zorunlu madde kontrolü', satirlar: sonuc.sutKontrol.map((k) => `${k.tamam === true ? '[X]' : k.tamam === false ? '[ ]' : '[·]'} ${k.madde}`) },
                  ...(sonuc.eksikler.length ? [{ baslik: 'Eksikler', satirlar: sonuc.eksikler }] : []),
                  { baslik: 'Hekim değerlendirmesi', satirlar: [sonuc.draft.hekim_degerlendirmesi || ''] },
                ],
                imzaSatirlari: ['Hekim adı, imza: ………………………………'],
                altBilgi: [sonuc.dozKilidi, 'Medula girişi ve e-imza hekim tarafından yapılır.'],
              })
            }
            data-derm="biyolojik-yazdir"
          >
            Taslağı yazdır
          </button>
          {onKilitle && (
            <button
              type="button"
              style={btn(sonuc.kilitlenebilir)}
              disabled={!sonuc.kilitlenebilir}
              onClick={() => onKilitle({ sablon, endikasyon, metin: biyolojikSutMetni(sonuc), eksikler: sonuc.eksikler })}
              data-derm="biyolojik-kilitle"
            >
              {sonuc.kilitlenebilir ? 'Taslağı kilitle (hekim)' : 'Eksikler tamamlanınca kilitlenir'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────── Psoriasis basamak + trend + PsA ──────────────────────────────

export function PsoriasisMerdiveniKarti({
  pasi,
  pasiOnceki,
  dlqi,
  dlqiOnceki,
  bsaPct,
  psaIsaretleri,
  kilitliBasamak,
  onBasamakKilitle,
  onPsaKaydet,
}: {
  pasi?: number | null
  pasiOnceki?: number | null
  dlqi?: number | null
  dlqiOnceki?: number | null
  bsaPct?: number | null
  psaIsaretleri?: Record<string, boolean> | null
  kilitliBasamak?: string | null
  onBasamakKilitle?: (basamakId: string) => void
  onPsaKaydet?: (isaretler: Record<string, boolean>, sevkOnerilir: boolean) => void
}) {
  const [ozelBolge, setOzelBolge] = useState(false)
  const [yanitsiz, setYanitsiz] = useState({ topikal: false, fototerapi: false, konvansiyonel: false })
  const [psa, setPsa] = useState<Record<string, boolean>>(psaIsaretleri || {})

  const triyaj = psaTriyaj(psa)
  const karar = psoriasisMerdiveni({
    pasi, dlqi, bsaPct, ozelBolge,
    psaTutulumu: triyaj.sevkOnerilir,
    topikalYanitsiz: yanitsiz.topikal,
    fototerapiYanitsiz: yanitsiz.fototerapi,
    konvansiyonelYanitsiz: yanitsiz.konvansiyonel,
  })
  const trendPasi = skorTrend('PASI', pasiOnceki, pasi)
  const trendDlqi = skorTrend('DLQI', dlqiOnceki, dlqi)

  return (
    <section style={kutu} data-derm="psoriasis-merdiven">
      <h2 style={{ margin: 0, fontSize: 16 }}>{karar.baslik}</h2>
      <p style={kucuk}>{karar.kilitNotu}</p>

      {(trendPasi || trendDlqi) && (
        <p style={{ ...satirlik, marginTop: 6 }} data-derm="psoriasis-trend">
          Trend:{' '}
          {[trendPasi, trendDlqi].filter(Boolean).map((t) => (
            `${t!.ad} ${t!.ilk} → ${t!.son} (${t!.yon === 'iyilesme' ? 'azalma' : t!.yon === 'kotulesme' ? 'artış' : 'değişmedi'}${t!.yuzde != null ? `, %${Math.abs(t!.yuzde)}` : ''})`
          )).join(' · ')}
        </p>
      )}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        <Kutucuk c={ozelBolge} set={setOzelBolge}>Özel bölge tutulumu (yüz / el-ayak / genital / saçlı deri)</Kutucuk>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Kutucuk c={yanitsiz.topikal} set={(v) => setYanitsiz((p) => ({ ...p, topikal: v }))}>Topikalde hedefe ulaşılmadı</Kutucuk>
        <Kutucuk c={yanitsiz.fototerapi} set={(v) => setYanitsiz((p) => ({ ...p, fototerapi: v }))}>Fototerapide hedefe ulaşılmadı</Kutucuk>
        <Kutucuk c={yanitsiz.konvansiyonel} set={(v) => setYanitsiz((p) => ({ ...p, konvansiyonel: v }))}>Konvansiyonel sistemikte hedefe ulaşılmadı</Kutucuk>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 5, marginTop: 8 }}>
        {PSORIASIS_BASAMAKLARI.map((b) => {
          const onerilen = karar.onerilenBasamakId === b.id
          const kilitli = kilitliBasamak === b.id
          return (
            <li
              key={b.id}
              style={{
                border: `1px solid ${kilitli ? 'rgba(15,155,142,0.8)' : onerilen ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {b.ad}{onerilen && !kilitli ? ' · önerilen' : ''}{kilitli ? ' · hekim kilitledi' : ''}
                  </div>
                  <div style={kucuk}>{b.kapsam}</div>
                </div>
                {onBasamakKilitle && (
                  <button type="button" style={btn(onerilen)} onClick={() => onBasamakKilitle(b.id)} data-derm={`psoriasis-kilit-${b.id}`}>
                    {kilitli ? 'Kilitli' : 'Bu basamağı kilitle'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {karar.gerekce.length > 0 && <p style={{ ...satirlik, marginTop: 6 }}>Gerekçe: {karar.gerekce.join(' · ')}</p>}
      {karar.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Eksik: {karar.eksikler.join(' · ')}</p>}

      <div style={ic} data-derm="psa-triyaj">
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Eklem (PsA) triyajı</div>
        {PSA_TRIYAJ_MADDELERI.map((m) => (
          <Kutucuk key={m.kod} c={!!psa[m.kod]} set={(v) => setPsa((p) => ({ ...p, [m.kod]: v }))}>{m.ad}</Kutucuk>
        ))}
        <p style={{ ...satirlik, color: triyaj.sevkOnerilir ? '#FDE68A' : '#8FA0B5', marginTop: 4 }}>{triyaj.hint}</p>
        {onPsaKaydet && (
          <button type="button" style={{ ...btn(true), marginTop: 6 }} onClick={() => onPsaKaydet(psa, triyaj.sevkOnerilir)} data-derm="psa-kaydet">
            Eklem triyajını kaydet
          </button>
        )}
        <Dipnotlar liste={[triyaj.dipnot]} />
      </div>
      <Dipnotlar liste={karar.dipnotlar} />
    </section>
  )
}

// ────────────────────────────── Atopi basamak kartı ──────────────────────────────

export function AtopiKarti({
  scorad,
  easi,
  pediatrik,
  kilitliBasamak,
  onBasamakKilitle,
}: {
  scorad?: number | null
  easi?: number | null
  pediatrik?: boolean
  kilitliBasamak?: string | null
  onBasamakKilitle?: (basamakId: string) => void
}) {
  const [hassas, setHassas] = useState(false)
  const [uyku, setUyku] = useState(false)
  const [yanitsiz, setYanitsiz] = useState({ temel: false, topikal: false, fototerapi: false })
  const karar = atopiMerdiveni({
    scorad, easi, hassasBolge: hassas, uykuEtkilenmis: uyku, pediatrik,
    temelBakimYanitsiz: yanitsiz.temel, topikalYanitsiz: yanitsiz.topikal, fototerapiYanitsiz: yanitsiz.fototerapi,
  })

  return (
    <section style={kutu} data-derm="atopi-merdiven">
      <h2 style={{ margin: 0, fontSize: 16 }}>{karar.baslik}</h2>
      <p style={kucuk}>{karar.kilitNotu}</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
        <Kutucuk c={hassas} set={setHassas}>Hassas bölge tutulumu (yüz / el / göz kapağı)</Kutucuk>
        <Kutucuk c={uyku} set={setUyku}>Uyku bölünmesi</Kutucuk>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Kutucuk c={yanitsiz.temel} set={(v) => setYanitsiz((p) => ({ ...p, temel: v }))}>Temel bakım yetersiz</Kutucuk>
        <Kutucuk c={yanitsiz.topikal} set={(v) => setYanitsiz((p) => ({ ...p, topikal: v }))}>Topikalde hedefe ulaşılmadı</Kutucuk>
        <Kutucuk c={yanitsiz.fototerapi} set={(v) => setYanitsiz((p) => ({ ...p, fototerapi: v }))}>Fototerapide hedefe ulaşılmadı</Kutucuk>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 5, marginTop: 8 }}>
        {ATOPI_BASAMAKLARI.map((b) => {
          const onerilen = karar.onerilenBasamakId === b.id
          const kilitli = kilitliBasamak === b.id
          return (
            <li key={b.id} style={{ border: `1px solid ${kilitli ? 'rgba(15,155,142,0.8)' : onerilen ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 8, padding: 8 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{b.ad}{onerilen && !kilitli ? ' · önerilen' : ''}{kilitli ? ' · hekim kilitledi' : ''}</div>
                  <div style={kucuk}>{b.kapsam}</div>
                </div>
                {onBasamakKilitle && (
                  <button type="button" style={btn(onerilen)} onClick={() => onBasamakKilitle(b.id)} data-derm={`atopi-kilit-${b.id}`}>
                    {kilitli ? 'Kilitli' : 'Bu basamağı kilitle'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {karar.gerekce.length > 0 && <p style={{ ...satirlik, marginTop: 6 }}>Gerekçe: {karar.gerekce.join(' · ')}</p>}
      {karar.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Eksik: {karar.eksikler.join(' · ')}</p>}
      <Dipnotlar liste={karar.dipnotlar} />
    </section>
  )
}

// ────────────────────────────── Akne IGA kartı ──────────────────────────────

export function AkneKarti({
  iga,
  izotretinoinKuru,
  fotoAy0,
  fotoAy3,
  fotoHref,
}: {
  iga?: number | null
  izotretinoinKuru?: boolean
  fotoAy0?: boolean
  fotoAy3?: boolean
  fotoHref?: string
}) {
  const [skar, setSkar] = useState(false)
  const [govde, setGovde] = useState(false)
  const [psikososyal, setPsikososyal] = useState(false)
  const karar = akneKarar({ iga, skar, govde, psikososyal, izotretinoinKuru, fotoAy0, fotoAy3 })

  return (
    <section style={kutu} data-derm="akne-karti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Akne — IGA ve foto serisi</h2>
      <p style={satirlik}>IGA: <b>{karar.igaAd}</b>{iga != null ? ` (${iga})` : ' — Skor panelinden girilir'} · şiddet {karar.siddet}</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Kutucuk c={skar} set={setSkar}>Skar / nedbe gelişimi</Kutucuk>
        <Kutucuk c={govde} set={setGovde}>Gövde tutulumu</Kutucuk>
        <Kutucuk c={psikososyal} set={setPsikososyal}>Belirgin psikososyal etki</Kutucuk>
      </div>
      {karar.fotoCue.length > 0 && (
        <ul style={{ paddingLeft: 18, margin: '6px 0 0', fontSize: 12.5 }} data-derm="akne-foto-cue">
          {karar.fotoCue.map((c) => <li key={c}>{c}</li>)}
        </ul>
      )}
      {fotoHref && <a href={fotoHref} style={{ fontSize: 12, color: '#2DD4BF' }}>Klinik foto ekle (ay-0 / ay-3 serisi)</a>}
      {karar.gerekce.length > 0 && <p style={{ ...satirlik, marginTop: 6 }}>{karar.gerekce.join(' · ')}</p>}
      {karar.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Eksik: {karar.eksikler.join(' · ')}</p>}
      <p style={kucuk}>{karar.kilitNotu}</p>
      <Dipnotlar liste={karar.dipnotlar} />
    </section>
  )
}

// ────────────────────────────── Dermoskopi çalışma sayfaları ──────────────────────────────

export function DermoskopiSkorKarti({
  lesions,
  fitzpatrick,
  onFitzpatrick,
  onKaydet,
}: {
  lesions: Lesion[]
  fitzpatrick?: string
  onFitzpatrick?: (f: string) => void
  onKaydet?: (r: { lesionId: string | null; algoritma: DermoskopiAlgoritma; toplam: number; esikUstu: boolean; isaretli: string[]; observations: string }) => void
}) {
  const [alg, setAlg] = useState<DermoskopiAlgoritma>('uc_nokta')
  const [lesionId, setLesionId] = useState<string>(lesions[0]?.id || '')
  const [uc, setUc] = useState<Record<string, boolean>>({})
  const [yedi, setYedi] = useState<Record<string, boolean>>({})
  const [cash, setCash] = useState({ color: 0, architecture: 0, symmetry: 0, homogeneity: 0 })

  const sonuc = alg === 'uc_nokta' ? ucNoktaSkor(uc) : alg === 'yedi_nokta' ? yediNoktaSkor(yedi) : cashSkor(cash)

  return (
    <section style={kutu} data-derm="dermoskopi-skor">
      <h2 style={{ margin: 0, fontSize: 16 }}>Dermoskopi çalışma sayfası</h2>
      <p style={kucuk}>{sonuc.disclaimer} Eksizyon / biyopsi kararı hekimindir.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
        <label><span style={etiketS}>Algoritma</span>
          <select style={giris} value={alg} onChange={(e) => setAlg(e.target.value as DermoskopiAlgoritma)}>
            <option value="uc_nokta" style={{ color: '#000' }}>3 nokta</option>
            <option value="yedi_nokta" style={{ color: '#000' }}>7 nokta</option>
            <option value="cash" style={{ color: '#000' }}>CASH</option>
          </select>
        </label>
        <label><span style={etiketS}>Lezyon</span>
          <select style={giris} value={lesionId} onChange={(e) => setLesionId(e.target.value)}>
            <option value="" style={{ color: '#000' }}>— seçilmedi</option>
            {lesions.map((l) => <option key={l.id} value={l.id} style={{ color: '#000' }}>{l.region} · {l.morphology}</option>)}
          </select>
        </label>
        {onFitzpatrick && (
          <label><span style={etiketS}>Fitzpatrick (dermoskopi / lazer kararında)</span>
            <select style={giris} value={fitzpatrick || ''} onChange={(e) => onFitzpatrick(e.target.value)}>
              <option value="" style={{ color: '#000' }}>—</option>
              {FITZPATRICK.map((x) => <option key={x} value={x} style={{ color: '#000' }}>{dermLabel(DERM_FITZ, x)}</option>)}
            </select>
          </label>
        )}
      </div>
      {!fitzpatrick && <p style={{ fontSize: 11.5, color: '#FDE68A' }}>Fitzpatrick girilmedi — dermoskopi ve ışık temelli kararlarda kaydedilmesi önerilir.</p>}

      <div style={ic}>
        {alg === 'uc_nokta' && UC_NOKTA_OLCUTLERI.map((o) => (
          <Kutucuk key={o.kod} c={!!uc[o.kod]} set={(v) => setUc((p) => ({ ...p, [o.kod]: v }))}>
            {o.ad} <span style={kucuk}>({o.puan} puan{o.ipucu ? ` · ${o.ipucu}` : ''})</span>
          </Kutucuk>
        ))}
        {alg === 'yedi_nokta' && YEDI_NOKTA_OLCUTLERI.map((o) => (
          <Kutucuk key={o.kod} c={!!yedi[o.kod]} set={(v) => setYedi((p) => ({ ...p, [o.kod]: v }))}>
            {o.ad} <span style={kucuk}>({o.puan} puan)</span>
          </Kutucuk>
        ))}
        {alg === 'cash' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {CASH_BILESENLERI.map((b) => (
              <label key={b.kod} style={satirlik}>
                <span style={etiketS}>{b.ad} (0–{b.max})</span>
                <select
                  style={giris}
                  value={String(cash[b.kod])}
                  onChange={(e) => setCash((p) => ({ ...p, [b.kod]: Number(e.target.value) }))}
                >
                  {Array.from({ length: b.max + 1 }, (_, i) => <option key={i} value={i} style={{ color: '#000' }}>{i}</option>)}
                </select>
                <span style={kucuk}>{b.ipucu}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p style={{ ...satirlik, marginTop: 6 }} data-derm="dermoskopi-toplam">
        <b>{sonuc.ad}: {sonuc.toplam} / {sonuc.maksimum}</b> — {sonuc.esikMetni}
      </p>
      {onKaydet && (
        <button
          type="button"
          style={{ ...btn(true), marginTop: 6 }}
          onClick={() =>
            onKaydet({
              lesionId: lesionId || null,
              algoritma: sonuc.algoritma,
              toplam: sonuc.toplam,
              esikUstu: sonuc.esikUstu,
              isaretli: sonuc.isaretli,
              observations: `${sonuc.ad} ${sonuc.toplam}/${sonuc.maksimum}${sonuc.isaretli.length ? ` — ${sonuc.isaretli.join(', ')}` : ''}`,
            })
          }
          data-derm="dermoskopi-kaydet"
        >
          Görüntü okumasına taslak olarak yaz
        </button>
      )}
    </section>
  )
}

// ────────────────────────────── Saç / tırnak ──────────────────────────────

export function SacTirnakKarti({
  saltToplam,
  trikoskopiFotoSayisi,
  onKaydet,
}: {
  saltToplam?: number | null
  trikoskopiFotoSayisi?: number
  onKaydet?: (h: { saltScore: number | null; trichogram: string | null; trikoskopi: Record<string, boolean>; tirnak: Record<string, boolean> }) => void
}) {
  const [salt, setSalt] = useState({ vertex: 0, sag: 0, sol: 0, oksiput: 0 })
  const [trik, setTrik] = useState<Record<string, boolean>>({})
  const [tirnak, setTirnak] = useState<Record<string, boolean>>({})
  const [cekme, setCekme] = useState<'pozitif' | 'negatif' | 'yapilmadi'>('yapilmadi')
  const [not, setNot] = useState('')
  const kart = sacTirnakTakip({ salt, saltToplam, trikoskopi: trik, trikoskopiFotoSayisi, cekmeTesti: cekme, tirnak })

  return (
    <section style={kutu} data-derm="sac-tirnak">
      <h2 style={{ margin: 0, fontSize: 16 }}>{kart.baslik}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 6 }}>
        {(['vertex', 'sag', 'sol', 'oksiput'] as const).map((k) => (
          <label key={k} style={satirlik}>
            <span style={etiketS}>{k === 'vertex' ? 'Vertex %' : k === 'sag' ? 'Sağ yan %' : k === 'sol' ? 'Sol yan %' : 'Oksiput %'}</span>
            <input style={giris} inputMode="numeric" value={String(salt[k])} onChange={(e) => setSalt((p) => ({ ...p, [k]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} />
          </label>
        ))}
        <label style={satirlik}>
          <span style={etiketS}>Çekme (pull) testi</span>
          <select style={giris} value={cekme} onChange={(e) => setCekme(e.target.value as typeof cekme)}>
            <option value="yapilmadi" style={{ color: '#000' }}>Yapılmadı</option>
            <option value="negatif" style={{ color: '#000' }}>Negatif</option>
            <option value="pozitif" style={{ color: '#000' }}>Pozitif</option>
          </select>
        </label>
      </div>
      <p style={satirlik}>SALT <b>{kart.saltToplam ?? '—'}</b>{kart.saltBant ? ` — ${kart.saltBant}` : ''}</p>

      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Trikoskopi bulguları</div>
        {TRIKOSKOPI_ALANLARI.map((t) => (
          <Kutucuk key={t.kod} c={!!trik[t.kod]} set={(v) => setTrik((p) => ({ ...p, [t.kod]: v }))}>
            {t.ad} <span style={kucuk}>· {t.ipucu}</span>
          </Kutucuk>
        ))}
        <label style={{ display: 'block', marginTop: 6 }}><span style={etiketS}>Trikoskopi / trikogram notu</span>
          <textarea style={{ ...giris, minHeight: 48 }} value={not} onChange={(e) => setNot(e.target.value)} />
        </label>
      </div>

      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Tırnak bulguları</div>
        {TIRNAK_BULGULARI.map((t) => (
          <Kutucuk key={t.kod} c={!!tirnak[t.kod]} set={(v) => setTirnak((p) => ({ ...p, [t.kod]: v }))}>{t.ad}</Kutucuk>
        ))}
      </div>

      {kart.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Eksik: {kart.eksikler.join(' · ')}</p>}
      <ul style={{ paddingLeft: 18, fontSize: 12.5 }}>{kart.sonrakiAdim.map((s) => <li key={s}>{s}</li>)}</ul>
      {onKaydet && (
        <button
          type="button"
          style={btn(true)}
          onClick={() => onKaydet({ saltScore: kart.saltToplam, trichogram: not || null, trikoskopi: trik, tirnak })}
          data-derm="sac-tirnak-kaydet"
        >
          Saç / tırnak kaydını güncelle
        </button>
      )}
      <Dipnotlar liste={kart.dipnotlar} />
    </section>
  )
}

// ────────────────────────────── İzlem kartı ortak görünümü ──────────────────────────────

function TakipGovdesi({ kart }: { kart: TakipKarti }) {
  const renk = kart.aciliyet === 'acil' ? '#FCA5A5' : kart.aciliyet === 'ivedi' ? '#FDE68A' : '#8FA0B5'
  return (
    <>
      <p style={{ fontSize: 11.5, color: renk, margin: '2px 0 6px' }}>
        {kart.aciliyet === 'acil' ? 'Acil' : kart.aciliyet === 'ivedi' ? 'İvedi' : 'Rutin izlem'}
      </p>
      <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12.5 }}>{kart.bulgular.map((b, i) => <li key={i}>{b}</li>)}</ul>
      {kart.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A', marginTop: 6 }}>Eksik: {kart.eksikler.join(' · ')}</p>}
      {kart.sonrakiAdim.length > 0 && (
        <>
          <div style={{ ...etiketS, marginTop: 6 }}>Sıradaki adım</div>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12.5 }}>{kart.sonrakiAdim.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      )}
      <Dipnotlar liste={kart.dipnotlar} />
    </>
  )
}

export function BehcetTakipKarti({ kart, bugun, onKaydet }: { kart: BehcetCard | null; bugun: string; onKaydet?: (ek: Record<string, unknown>) => void }) {
  const [ek, setEk] = useState<Record<string, boolean>>({})
  const [ulser, setUlser] = useState('')
  const [gozTarih, setGozTarih] = useState('')
  const sonuc = behcetTakip({ kart, ek, oralUlserSayisi: ulser === '' ? null : Number(ulser), sonGozMuayenesi: gozTarih || null, bugun })
  return (
    <section style={kutu} data-derm="behcet-takip">
      <h2 style={{ margin: 0, fontSize: 16 }}>{sonuc.baslik}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        <label style={satirlik}><span style={etiketS}>Son 4 haftada oral ülser</span>
          <input style={giris} inputMode="numeric" value={ulser} onChange={(e) => setUlser(e.target.value)} />
        </label>
        <label style={satirlik}><span style={etiketS}>Son göz muayenesi</span>
          <input type="date" style={giris} value={gozTarih} onChange={(e) => setGozTarih(e.target.value)} />
        </label>
      </div>
      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Organ tutulumu (ISG dışı)</div>
        {(['vaskuler', 'noro', 'eklem', 'gis', 'deri'] as const).map((k) => (
          <Kutucuk key={k} c={!!ek[k]} set={(v) => setEk((p) => ({ ...p, [k]: v }))}>
            {k === 'vaskuler' ? 'Damar tutulumu' : k === 'noro' ? 'Nörolojik tutulum' : k === 'eklem' ? 'Artrit / artralji' : k === 'gis' ? 'Gastrointestinal bulgu' : 'Deri lezyonu'}
          </Kutucuk>
        ))}
      </div>
      <TakipGovdesi kart={sonuc} />
      {onKaydet && (
        <button type="button" style={btn(true)} onClick={() => onKaydet({ ek, oralUlserSayisi: ulser, sonGozMuayenesi: gozTarih })} data-derm="behcet-kaydet">
          İzlem kaydını güncelle
        </button>
      )}
    </section>
  )
}

export function BullozTakipKarti({ workup, onKaydet }: { workup: BullousWorkup | null; onKaydet?: (ek: Record<string, unknown>) => void }) {
  const [bsa, setBsa] = useState('')
  const [mukoza, setMukoza] = useState<Record<string, boolean>>({})
  const [lab, setLab] = useState(false)
  const [eslik, setEslik] = useState(false)
  const sonuc = bullozTakip({ workup, bsaPct: bsa === '' ? null : Number(bsa), mukoza, labIzlem: lab, eslikEdenIzlem: eslik })
  return (
    <section style={kutu} data-derm="bulloz-takip">
      <h2 style={{ margin: 0, fontSize: 16 }}>{sonuc.baslik}</h2>
      <label style={{ ...satirlik, display: 'block', maxWidth: 190 }}><span style={etiketS}>Tutulan yüzey alanı (%)</span>
        <input style={giris} inputMode="numeric" value={bsa} onChange={(e) => setBsa(e.target.value)} />
      </label>
      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Mukoza tutulumu</div>
        {[['oral', 'Ağız mukozası'], ['farenks', 'Farenks / larenks'], ['goz', 'Konjonktiva'], ['genital', 'Genital mukoza'], ['anal', 'Anal mukoza'], ['ozofagus', 'Özofagus']].map(([k, ad]) => (
          <Kutucuk key={k} c={!!mukoza[k]} set={(v) => setMukoza((p) => ({ ...p, [k]: v }))}>{ad}</Kutucuk>
        ))}
        <Kutucuk c={lab} set={setLab}>Sistemik tedavi laboratuvar izlemi yapıldı</Kutucuk>
        <Kutucuk c={eslik} set={setEslik}>Eşlik eden izlem (kemik sağlığı / enfeksiyon) planlandı</Kutucuk>
      </div>
      <TakipGovdesi kart={sonuc} />
      {onKaydet && (
        <button type="button" style={btn(true)} onClick={() => onKaydet({ bsaPct: bsa, mukoza, labIzlem: lab, eslikEdenIzlem: eslik })} data-derm="bulloz-kaydet">
          İzlem kaydını güncelle
        </button>
      )}
    </section>
  )
}

export function BzbhForm014Karti({
  bzbhKind,
  hastaAdi,
  bugun,
  klinikAdi,
  hekimAdi,
  baslangicIso,
  sonZiyaretIso,
}: {
  bzbhKind: BzbhKind
  hastaAdi?: string | null
  bugun: string
  klinikAdi?: string | null
  hekimAdi?: string | null
  baslangicIso?: string | null
  sonZiyaretIso?: string | null
}) {
  const [bildirim, setBildirim] = useState(false)
  const [partner, setPartner] = useState(false)
  const [klinikTani, setKlinikTani] = useState(true)
  const [labTani, setLabTani] = useState(false)
  const [labNot, setLabNot] = useState('')
  const [dogumYili, setDogumYili] = useState('')
  const [ikamet, setIkamet] = useState('')

  const izlem = bzbhTakip({ kind: bzbhKind, baslangicIso, sonZiyaretIso, bugun, bildirimYapildi: bildirim, partnerBilgilendirme: partner })
  const form = form014Taslagi({
    kind: bzbhKind, hastaAdi, dogumYili: dogumYili || null, ikamet: ikamet || null, tarih: bugun,
    klinikTani, laboratuvarTani: labTani, laboratuvarNotu: labNot || null, hekimAdi, klinikAdi,
  })

  return (
    <section style={kutu} data-derm="bzbh-form014">
      <h2 style={{ margin: 0, fontSize: 16 }}>{izlem.baslik}</h2>
      <p style={kucuk}>{form.agNotu}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 6 }}>
        <label style={satirlik}><span style={etiketS}>Doğum yılı</span>
          <input style={giris} inputMode="numeric" value={dogumYili} onChange={(e) => setDogumYili(e.target.value)} />
        </label>
        <label style={satirlik}><span style={etiketS}>İkamet (il / ilçe)</span>
          <input style={giris} value={ikamet} onChange={(e) => setIkamet(e.target.value)} />
        </label>
        <label style={{ ...satirlik, gridColumn: '1 / -1' }}><span style={etiketS}>Laboratuvar sonucu / tarihi</span>
          <input style={giris} value={labNot} onChange={(e) => setLabNot(e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Kutucuk c={klinikTani} set={setKlinikTani}>Klinik tanı</Kutucuk>
        <Kutucuk c={labTani} set={setLabTani}>Laboratuvar ile doğrulanmış</Kutucuk>
        <Kutucuk c={bildirim} set={setBildirim}>Bildirim resmî sisteme yapıldı</Kutucuk>
        <Kutucuk c={partner} set={setPartner}>Partner / temaslı bilgilendirme planlandı</Kutucuk>
      </div>
      <TakipGovdesi kart={izlem} />
      {form.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Form eksikleri: {form.eksikler.join(' · ')}</p>}
      <button type="button" style={btn(true)} onClick={() => yazdirTaslak(form.taslak)} data-derm="form014-yazdir">
        Form 014 taslağını yazdır
      </button>
      <Dipnotlar liste={[form.dipnot]} />
    </section>
  )
}

// ────────────────────────────── Kozmetik (ünite kapılı) ──────────────────────────────

export function EstetikKarti({ fitzpatrick, bugun, onKaydet }: { fitzpatrick?: string; bugun: string; onKaydet?: (k: Record<string, unknown>) => void }) {
  const [tur, setTur] = useState<KozmetikIslemTuru>('botoks')
  const [f, setF] = useState({ bolge: '', urun: '', lot: '', sonKullanma: '', testSpot: false, onam: '' })
  const [komp, setKomp] = useState<Record<string, boolean>>({})
  const [kompNot, setKompNot] = useState('')
  const secili = KOZMETIK_KOMPLIKASYONLARI.filter((k) => komp[k.kod]).map((k) => k.kod)
  const kontrol = kozmetikKontrol({
    tur, tarih: bugun, bolge: f.bolge, urun: f.urun || null, lotNo: f.lot || null, sonKullanma: f.sonKullanma || null,
    testSpot: f.testSpot, fitzpatrick: fitzpatrick || null, komplikasyonlar: secili, komplikasyonNotu: kompNot || null,
    onamKodu: f.onam || null,
  })

  return (
    <section style={kutu} data-derm="estetik-karti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Kozmetik işlem — izlenebilirlik ve komplikasyon</h2>
      <p style={kucuk}>{AYAKTA_TESHIS_NOTU} Doz / birim ve enjeksiyon planı hekimin kendi kaydındadır.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
        <label style={satirlik}><span style={etiketS}>İşlem</span>
          <select style={giris} value={tur} onChange={(e) => setTur(e.target.value as KozmetikIslemTuru)}>
            {(Object.keys(KOZMETIK_ISLEM_ADI) as KozmetikIslemTuru[]).map((k) => (
              <option key={k} value={k} style={{ color: '#000' }}>{KOZMETIK_ISLEM_ADI[k]}</option>
            ))}
          </select>
        </label>
        <label style={satirlik}><span style={etiketS}>Bölge</span>
          <input style={giris} value={f.bolge} onChange={(e) => setF((p) => ({ ...p, bolge: e.target.value }))} />
        </label>
        <label style={satirlik}><span style={etiketS}>Ürün adı{LOT_ZORUNLU[tur] ? ' (zorunlu)' : ''}</span>
          <input style={giris} value={f.urun} onChange={(e) => setF((p) => ({ ...p, urun: e.target.value }))} />
        </label>
        <label style={satirlik}><span style={etiketS}>Lot numarası{LOT_ZORUNLU[tur] ? ' (zorunlu)' : ''}</span>
          <input style={giris} value={f.lot} onChange={(e) => setF((p) => ({ ...p, lot: e.target.value }))} />
        </label>
        <label style={satirlik}><span style={etiketS}>Son kullanma</span>
          <input type="date" style={giris} value={f.sonKullanma} onChange={(e) => setF((p) => ({ ...p, sonKullanma: e.target.value }))} />
        </label>
        <label style={satirlik}><span style={etiketS}>Onam</span>
          <select style={giris} value={f.onam} onChange={(e) => setF((p) => ({ ...p, onam: e.target.value }))}>
            <option value="" style={{ color: '#000' }}>— seçilmedi</option>
            {DERM_ONAMLAR.filter((o) => o.kod.includes('kozmetik')).map((o) => (
              <option key={o.kod} value={o.kod} style={{ color: '#000' }}>{o.ad}</option>
            ))}
          </select>
        </label>
      </div>
      <Kutucuk c={f.testSpot} set={(v) => setF((p) => ({ ...p, testSpot: v }))}>Test spot yapıldı</Kutucuk>

      <div style={ic}>
        <div style={{ ...etiketS, color: '#EDF1F7', fontWeight: 700 }}>Komplikasyon</div>
        {KOZMETIK_KOMPLIKASYONLARI.map((k) => (
          <Kutucuk key={k.kod} c={!!komp[k.kod]} set={(v) => setKomp((p) => ({ ...p, [k.kod]: v }))}>
            {k.ad}{k.acil ? ' ⚠' : ''}
          </Kutucuk>
        ))}
        <label style={{ display: 'block', marginTop: 6 }}><span style={etiketS}>Komplikasyon notu / yapılanlar</span>
          <textarea style={{ ...giris, minHeight: 48 }} value={kompNot} onChange={(e) => setKompNot(e.target.value)} />
        </label>
      </div>

      {kontrol.acilMetni && <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 700 }}>{kontrol.acilMetni}</p>}
      {kontrol.eksikler.length > 0 && <p style={{ fontSize: 12.5, color: '#FDE68A' }}>Eksik: {kontrol.eksikler.join(' · ')}</p>}
      {kontrol.uyarilar.length > 0 && <p style={kucuk}>{kontrol.uyarilar.join(' · ')}</p>}
      <p style={satirlik}>İzlenebilirlik: {kontrol.izlenebilirlikTam ? 'tam' : 'eksik'}</p>
      {onKaydet && (
        <button
          type="button"
          style={btn(kontrol.eksikler.length === 0)}
          disabled={kontrol.eksikler.length > 0}
          onClick={() => onKaydet({ tur, tarih: bugun, ...f, komplikasyonlar: secili, komplikasyonNotu: kompNot, fitzpatrick })}
          data-derm="estetik-kaydet"
        >
          {kontrol.eksikler.length === 0 ? 'Kozmetik işlemi kaydet' : 'Zorunlu alanlar eksik'}
        </button>
      )}
    </section>
  )
}

// ────────────────────────────── İşlem odası yazdırma ──────────────────────────────

export function IslemOdasiYazdir({
  hastaAdi,
  bugun,
  hekimAdi,
  klinikAdi,
  lesions,
}: {
  hastaAdi?: string | null
  bugun: string
  hekimAdi?: string | null
  klinikAdi?: string | null
  lesions?: Lesion[]
}) {
  const [islem, setIslem] = useState<IslemTuru>('punch')
  const [bolge, setBolge] = useState(lesions?.[0]?.region || '')
  const [basHarf, setBasHarf] = useState('')
  const [protokol, setProtokol] = useState('')
  const [kap, setKap] = useState('1')
  const [fiksatif, setFiksatif] = useState<string>(FIKSATIF_SECENEKLERI[0])
  const [yonlendirme, setYonlendirme] = useState('')

  const sablon = ISLEM_SABLONLARI[islem]
  const onam = onamYazdirmaTaslagi({ onamKodu: sablon.onamKodu, hastaAdi, tarih: bugun, hekimAdi, klinikAdi, islem, bolge: bolge || null })
  const etiketler = spesimenEtiketleri({
    hastaBasHarfleri: basHarf, protokolNo: protokol || null, bolge, islem, tarih: bugun,
    kapSayisi: Number(kap) || 1, fiksatif, yonlendirme: yonlendirme || null, hekimAdi, klinikAdi,
  })

  return (
    <section style={kutu} data-derm="islem-odasi-yazdir">
      <h2 style={{ margin: 0, fontSize: 16 }}>İşlem odası — onam ve numune etiketi (yazdırılabilir)</h2>
      <p style={kucuk}>
        Yazdırma içeriği bu ekranda kurulur; hasta bilgisi bağlantı adresine yazılmaz. Etikette tam ad ve T.C. yoktur.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
        <label style={satirlik}><span style={etiketS}>İşlem</span>
          <select style={giris} value={islem} onChange={(e) => setIslem(e.target.value as IslemTuru)}>
            {(Object.keys(ISLEM_SABLONLARI) as IslemTuru[]).map((k) => (
              <option key={k} value={k} style={{ color: '#000' }}>{ISLEM_SABLONLARI[k].ad}</option>
            ))}
          </select>
        </label>
        <label style={satirlik}><span style={etiketS}>Bölge / taraf</span>
          <input style={giris} value={bolge} onChange={(e) => setBolge(e.target.value)} />
        </label>
        <label style={satirlik}><span style={etiketS}>Hasta baş harfleri</span>
          <input style={giris} value={basHarf} onChange={(e) => setBasHarf(e.target.value)} placeholder="A.Y." />
        </label>
        <label style={satirlik}><span style={etiketS}>Protokol / kasa no</span>
          <input style={giris} value={protokol} onChange={(e) => setProtokol(e.target.value)} />
        </label>
        <label style={satirlik}><span style={etiketS}>Kap sayısı</span>
          <input style={giris} inputMode="numeric" value={kap} onChange={(e) => setKap(e.target.value)} />
        </label>
        <label style={satirlik}><span style={etiketS}>Fiksatif</span>
          <select style={giris} value={fiksatif} onChange={(e) => setFiksatif(e.target.value)}>
            {FIKSATIF_SECENEKLERI.map((x) => <option key={x} value={x} style={{ color: '#000' }}>{x}</option>)}
          </select>
        </label>
        {sablon.notAlanlari.includes('yonlendirme_isareti') && (
          <label style={satirlik}><span style={etiketS}>Yönlendirme işareti</span>
            <input style={giris} value={yonlendirme} onChange={(e) => setYonlendirme(e.target.value)} placeholder="ör. 12 hizasına uzun sütür" />
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button type="button" style={btn(true)} disabled={!onam} onClick={() => onam && yazdirTaslak(onam)} data-derm="onam-yazdir">
          Onam formunu yazdır
        </button>
        {sablon.patolojiGerekir && (
          <button
            type="button"
            style={btn()}
            onClick={() =>
              yazdirTaslak({
                baslik: 'Patoloji Numune Etiketi',
                ustBilgi: [klinikAdi || '', `Tarih: ${bugun}`].filter(Boolean),
                bolumler: etiketler.map((e, i) => ({ baslik: `Etiket ${i + 1}`, satirlar: e.satirlar })),
                imzaSatirlari: ['Numuneyi alan / gönderen imza: ………………………'],
                altBilgi: [etiketler[0]?.uyari || ''],
              })
            }
            data-derm="etiket-yazdir"
          >
            Numune etiketini yazdır ({etiketler.length})
          </button>
        )}
      </div>
      {etiketler[0]?.eksikler.length > 0 && (
        <p style={{ fontSize: 12.5, color: '#FDE68A', marginTop: 6 }}>Etiket eksikleri: {etiketler[0].eksikler.join(' · ')}</p>
      )}
      {onam && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...kucuk, cursor: 'pointer' }}>Onam önizleme</summary>
          <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' }}>{taslakMetni(onam)}</pre>
        </details>
      )}
    </section>
  )
}

// ────────────────────────────── Derim hatırlatmaları ──────────────────────────────

export function DerimHatirlatmaKarti({
  girdi,
  onGonder,
}: {
  girdi: HatirlatmaGirdi
  onGonder?: (h: DerimHatirlatma) => void
}) {
  const oneriler = useMemo(() => derimHatirlatmaOnerileri(girdi).filter(hatirlatmaGecerliMi), [girdi])
  if (!oneriler.length) return null
  return (
    <section style={kutu} data-derm="derim-hatirlatma">
      <h2 style={{ margin: 0, fontSize: 16 }}>Hastaya hatırlatma (Derim)</h2>
      <p style={kucuk}>
        Hekim gönderir. Hasta yüzünde tanı, skor, doz veya J/cm² yorumu geçmez — yalnız randevu / işlem hatırlatması.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 6, marginTop: 8 }}>
        {oneriler.map((h) => (
          <li key={h.kod} style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5 }}>
            <span>
              <b>{h.ad}</b>{h.due ? ` · ${h.due}` : ' · tarih hekim tarafından girilir'}
              <span style={{ ...kucuk, display: 'block' }}>{h.gerekce}</span>
            </span>
            {onGonder && (
              <button type="button" style={btn(true)} onClick={() => onGonder(h)} data-derm={`derim-gonder-${h.kod}`}>
                Hastaya hatırlat
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
