'use client'

/**
 * MBYS-YARDIMCI-01 — Gün sonu MBYS kuyruğu (e-Nabız aracı içinde).
 * The day's closed visits that still need MBYS entry, the pre-send checks with a fix for each, and the hand-over to
 * the browser helper ("MBYS'ye aktar") with a clipboard copy as the fallback. Notya never calls a Ministry address.
 */
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { toolsCard, toolsInput, toolsLabel, toolsPrimaryBtn } from '@/lib/doktor/toolsUi'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import {
  MBYS_DURUM_AD,
  MBYS_KAYIT_TURU_AD,
  MBYS_MUAYENE_TURU_ONERI,
  MBYS_VAKA_TURU_ONERI,
  type MbysAyar,
  type MbysDurum,
  type MbysEksik,
  type MbysKayit,
  type MbysKayitTuru,
} from '@/lib/enabiz/mbys/kontrol'
import { MBYS_ADRES, yardimciKuruluMu, yardimciyaGonder } from '@/lib/enabiz/mbys/yardimci'
import MbysYardimciKurulum from '@/components/doktor/MbysYardimciKurulum'

type KimlikOzet = { kayitTuru: MbysKayitTuru | ''; ad: string; soyad: string; cinsiyet: string; dogumTarihi: string; uyruk: string }
type Satir = { notId: string; hastaId: string; hastaAd: string; saat: string; durum: MbysDurum; eksikler: MbysEksik[]; kimlik: KimlikOzet }
type KimlikForm = KimlikOzet & { tcKimlikNo: string; pasaportNo: string; sahisNo: string }

const API = '/api/doktor/araclar/enabiz/mbys'

const DURUM_RENK: Record<MbysDurum, { zemin: string; yazi: string }> = {
  hazir: { zemin: '#E4F3F1', yazi: CHROME_RENK.pine },
  eksik: { zemin: '#FFF6E5', yazi: '#7A5B1E' },
  aktarildi: { zemin: '#EAF0FA', yazi: '#2D4A7A' },
  kaydedildi: { zemin: '#EEF5EF', yazi: '#2E6E4E' },
}

function trBugun(): string {
  return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
}
function gunKaydir(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function gunAdi(gun: string): string {
  const d = new Date(`${gun}T12:00:00Z`)
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

async function yetkili(yol: string, init?: RequestInit) {
  const t = await ensureDoctorAccessToken()
  if (!t) throw new Error('Oturum bulunamadı.')
  const r = await fetch(yol, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(String(j.error || 'İşlem yapılamadı.'))
  return j
}

const ikincilBtn: CSSProperties = { ...toolsPrimaryBtn(false), width: 'auto', padding: '8px 12px', background: '#fff', color: CHROME_RENK.pine, border: `1px solid ${CHROME_RENK.pine}` }
const linkBtn: CSSProperties = { background: 'none', border: 'none', padding: 0, color: CHROME_RENK.pine, fontWeight: 700, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }

export default function MbysKuyrugu() {
  const [gun, setGun] = useState(trBugun())
  const [satirlar, setSatirlar] = useState<Satir[]>([])
  const [ayar, setAyar] = useState<MbysAyar | null>(null)
  const [rol, setRol] = useState<'doktor' | 'sekreter'>('doktor')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [bilgi, setBilgi] = useState<{ notId: string; metin: string } | null>(null)
  const [yardimci, setYardimci] = useState<boolean | null>(null)
  const [ayarAcik, setAyarAcik] = useState(false)
  const [ayarTaslak, setAyarTaslak] = useState<MbysAyar>({ muayeneTuru: '', vakaTuru: '' })
  const [kimlikAcik, setKimlikAcik] = useState<string>('')
  const [kimlikTaslak, setKimlikTaslak] = useState<KimlikForm | null>(null)
  const [mesgul, setMesgul] = useState('')

  const yukle = useCallback(async (g: string) => {
    setYukleniyor(true)
    setHata('')
    try {
      const j = await yetkili(`${API}?gun=${encodeURIComponent(g)}`)
      setSatirlar(Array.isArray(j.satirlar) ? j.satirlar : [])
      setAyar(j.ayar || null)
      setRol(j.rol === 'sekreter' ? 'sekreter' : 'doktor')
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kuyruk yüklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { void yukle(gun) }, [gun, yukle])
  useEffect(() => { void yardimciKuruluMu().then(setYardimci) }, [])

  const aktar = async (s: Satir) => {
    setMesgul(s.notId)
    setBilgi(null)
    setHata('')
    try {
      const j = await yetkili(`${API}?notId=${encodeURIComponent(s.notId)}`)
      const kayit = j.kayit as MbysKayit | null
      if (!kayit) throw new Error('Bu hasta için MBYS kaydı hazırlanmaz.')
      let panoda = false
      try { await navigator.clipboard.writeText(String(j.metin || '')); panoda = true } catch { panoda = false }
      const yardimciAldi = await yardimciyaGonder(kayit)
      if (!yardimciAldi && !panoda) throw new Error('Kayıt aktarılamadı: yardımcı bulunamadı ve panoya kopyalanamadı.')
      await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'durum', notId: s.notId, durum: 'aktarildi' }) })
      setSatirlar((l) => l.map((x) => (x.notId === s.notId ? { ...x, durum: 'aktarildi' } : x)))
      setBilgi({
        notId: s.notId,
        metin: yardimciAldi
          ? `Kayıt yardımcıya aktarıldı (10 dakika geçerli). MBYS sekmesinde “Notya'dan doldur”a basın.${panoda ? ' Metin ayrıca panoya kopyalandı.' : ''}`
          : 'Yardımcı bulunamadı — kayıt metni panoya kopyalandı. MBYS formuna yapıştırabilirsiniz.',
      })
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Aktarılamadı.')
    } finally {
      setMesgul('')
    }
  }

  const kaydettim = async (s: Satir) => {
    setMesgul(s.notId)
    try {
      await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'durum', notId: s.notId, durum: 'kaydedildi' }) })
      setSatirlar((l) => l.map((x) => (x.notId === s.notId ? { ...x, durum: 'kaydedildi' } : x)))
      if (bilgi?.notId === s.notId) setBilgi(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi.')
    } finally {
      setMesgul('')
    }
  }

  const kimlikAc = async (s: Satir) => {
    if (kimlikAcik === s.notId) { setKimlikAcik(''); return }
    setKimlikAcik(s.notId)
    const taslak: KimlikForm = { ...s.kimlik, tcKimlikNo: '', pasaportNo: '', sahisNo: '' }
    setKimlikTaslak(taslak)
    try {
      const j = await yetkili(`${API}?notId=${encodeURIComponent(s.notId)}`)
      const k = (j.kayit as MbysKayit | null)?.kimlik
      if (k) setKimlikTaslak({ ...taslak, tcKimlikNo: k.tcKimlikNo, pasaportNo: k.pasaportNo, sahisNo: k.sahisNo })
    } catch { /* boş alanlarla açılır */ }
  }

  const kimlikKaydet = async (s: Satir) => {
    if (!kimlikTaslak) return
    setMesgul(s.notId)
    try {
      await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'kimlik', hastaId: s.hastaId, kimlik: kimlikTaslak }) })
      setKimlikAcik('')
      await yukle(gun)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi.')
    } finally {
      setMesgul('')
    }
  }

  const ayarKaydet = async () => {
    try {
      const j = await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'ayar', ...ayarTaslak }) })
      setAyar(j.ayar)
      setAyarAcik(false)
      await yukle(gun)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Ayar kaydedilemedi.')
    }
  }

  const duzelt = (s: Satir, e: MbysEksik) => {
    if (e.duzelt === 'kimlik') return <button type="button" style={linkBtn} onClick={() => void kimlikAc(s)}>Düzelt</button>
    if (e.duzelt === 'not') return <a href={`/dashboard/doktor/notlar/${s.notId}`} style={linkBtn}>Notu aç</a>
    if (e.duzelt === 'ayar' && rol === 'doktor') {
      return <button type="button" style={linkBtn} onClick={() => { setAyarTaslak(ayar || { muayeneTuru: '', vakaTuru: '' }); setAyarAcik(true) }}>Ayarlar</button>
    }
    return null
  }

  const bekleyen = satirlar.filter((s) => s.durum !== 'kaydedildi').length
  const kt = kimlikTaslak?.kayitTuru || ''

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
        <a href="/doktor-tools/enabiz" style={{ color: 'inherit', textDecoration: 'none' }}>Araçlar · e-Nabız</a>
      </div>
      <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, color: '#2e251d', lineHeight: 1.2 }}>Gün sonu MBYS kuyruğu</h1>
      <p style={{ marginTop: 8, color: CHROME_RENK.muted, fontSize: 14, lineHeight: 1.5 }}>
        Günün kapanmış vizitleri. “MBYS'ye aktar” kaydı tarayıcınızdaki MBYS Yardımcısı'na verir; MBYS'de alanları o doldurur.
        Sorgula, Kaydet ve diğer bütün MBYS düğmelerine yalnız siz basarsınız.
      </p>

      <div style={{ ...toolsCard, marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>
          {yardimci === null ? 'MBYS Yardımcısı denetleniyor…' : yardimci
            ? <><b style={{ color: CHROME_RENK.pine }}>MBYS Yardımcısı kurulu.</b> Aktardığınız kayıt 10 dakika tutulur.</>
            : <><b>MBYS Yardımcısı bu tarayıcıda yok.</b> “MBYS'ye aktar” kaydı panoya metin olarak kopyalar.</>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {rol === 'doktor' && (
            <button type="button" style={ikincilBtn} onClick={() => { setAyarTaslak(ayar || { muayeneTuru: '', vakaTuru: '' }); setAyarAcik((v) => !v) }}>Ayarlar</button>
          )}
          <a href={MBYS_ADRES} target="_blank" rel="noreferrer" style={{ ...ikincilBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>MBYS'yi aç</a>
        </div>
      </div>

      {/* MBYS-YARDIMCI-02: download + install guide + form-map capture, doctors only (the route checks it too). */}
      {rol === 'doktor' && yardimci !== null && <MbysYardimciKurulum acikBaslat={!yardimci} />}

      {ayarAcik && rol === 'doktor' && (
        <div style={{ ...toolsCard, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 10 }}>Varsayılanlar (her vizit için)</div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label>
              <span style={toolsLabel}>Muayene türü</span>
              <input list="mbys-muayene-turu" value={ayarTaslak.muayeneTuru} onChange={(e) => setAyarTaslak((a) => ({ ...a, muayeneTuru: e.target.value }))} style={toolsInput} />
              <datalist id="mbys-muayene-turu">{MBYS_MUAYENE_TURU_ONERI.map((o) => <option key={o} value={o} />)}</datalist>
            </label>
            <label>
              <span style={toolsLabel}>Vaka türü</span>
              <input list="mbys-vaka-turu" value={ayarTaslak.vakaTuru} onChange={(e) => setAyarTaslak((a) => ({ ...a, vakaTuru: e.target.value }))} style={toolsInput} />
              <datalist id="mbys-vaka-turu">{MBYS_VAKA_TURU_ONERI.map((o) => <option key={o} value={o} />)}</datalist>
            </label>
          </div>
          <p style={{ fontSize: 12, color: CHROME_RENK.muted, margin: '8px 0 10px' }}>MBYS'deki seçenek adıyla aynı yazın; yardımcı bu metni listede arar.</p>
          <button type="button" onClick={() => void ayarKaydet()} style={{ ...toolsPrimaryBtn(false), width: 'auto' }}>Kaydet</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" style={ikincilBtn} onClick={() => setGun((g) => gunKaydir(g, -1))} aria-label="Önceki gün">‹</button>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, minWidth: 220, textAlign: 'center' }}>{gunAdi(gun)}</div>
        <button type="button" style={ikincilBtn} onClick={() => setGun((g) => gunKaydir(g, 1))} disabled={gun >= trBugun()} aria-label="Sonraki gün">›</button>
        {gun !== trBugun() && <button type="button" style={linkBtn} onClick={() => setGun(trBugun())}>Bugün</button>}
        {!yukleniyor && satirlar.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 13, color: CHROME_RENK.muted }}>{bekleyen} vizit MBYS bekliyor</span>}
      </div>

      {hata && <p style={{ color: '#8C2F2F', fontSize: 13 }}>{hata}</p>}
      {yukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</p>}

      {!yukleniyor && !hata && satirlar.length === 0 && (
        <div style={{ ...toolsCard, marginTop: 12, textAlign: 'center', color: CHROME_RENK.muted, fontSize: 14 }}>
          Bu gün için MBYS'ye girilecek kapanmış vizit yok. Onayladığınız muayene notları burada sıralanır.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {satirlar.map((s) => {
          const r = DURUM_RENK[s.durum]
          return (
            <div key={s.notId} style={toolsCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: CHROME_RENK.ink }}>{s.hastaAd || 'Hasta'}</div>
                  <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{s.saat ? `Vizit ${s.saat}` : 'Vizit'}{s.kimlik.kayitTuru ? ` · ${MBYS_KAYIT_TURU_AD[s.kimlik.kayitTuru]}` : ''}</div>
                </div>
                <span style={{ background: r.zemin, color: r.yazi, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>{MBYS_DURUM_AD[s.durum]}</span>
                {s.durum !== 'kaydedildi' && (
                  <button
                    type="button"
                    disabled={s.durum === 'eksik' || mesgul === s.notId}
                    title={s.durum === 'eksik' ? 'Önce eksikleri tamamlayın' : undefined}
                    onClick={() => void aktar(s)}
                    style={{ ...toolsPrimaryBtn(s.durum === 'eksik' || mesgul === s.notId), width: 'auto', padding: '9px 14px' }}
                  >
                    {mesgul === s.notId ? 'Aktarılıyor…' : s.durum === 'aktarildi' ? 'Yeniden aktar' : "MBYS'ye aktar"}
                  </button>
                )}
                {s.durum === 'aktarildi' && (
                  <button type="button" disabled={mesgul === s.notId} onClick={() => void kaydettim(s)} style={ikincilBtn}>Kaydettim</button>
                )}
              </div>

              {bilgi?.notId === s.notId && (
                <div style={{ marginTop: 10, background: '#E4F3F1', color: CHROME_RENK.pine, borderRadius: 10, padding: '8px 10px', fontSize: 13 }}>
                  {bilgi.metin} MBYS'de kaydettikten sonra “Kaydettim”e dokunun.
                </div>
              )}

              {s.eksikler.length > 0 && s.durum !== 'kaydedildi' && (
                <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                  {s.eksikler.map((e, i) => (
                    <li key={`${e.alan}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#7A5B1E', background: '#FFF6E5', borderRadius: 8, padding: '6px 10px' }}>
                      <span style={{ flex: 1 }}>{e.mesaj}</span>
                      {duzelt(s, e)}
                    </li>
                  ))}
                </ul>
              )}

              {kimlikAcik === s.notId && kimlikTaslak && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 8 }}>MBYS kimlik bilgileri</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {(Object.keys(MBYS_KAYIT_TURU_AD) as MbysKayitTuru[]).map((t) => (
                      <button key={t} type="button" onClick={() => setKimlikTaslak((k) => (k ? { ...k, kayitTuru: t, uyruk: t === 'vatandas' ? 'TR' : k.uyruk === 'TR' ? '' : k.uyruk } : k))}
                        style={{ borderRadius: 999, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${kt === t ? CHROME_RENK.pine : CHROME_RENK.border}`, background: kt === t ? CHROME_RENK.pine : '#fff', color: kt === t ? '#FAF8F4' : CHROME_RENK.ink }}>
                        {MBYS_KAYIT_TURU_AD[t]}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    {kt === 'vatandas' && <Alan etiket="T.C. kimlik no" deger={kimlikTaslak.tcKimlikNo} inputMode="numeric" maxLength={11} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, tcKimlikNo: v.replace(/\D/g, '') } : k))} />}
                    {kt === 'yabanci' && <Alan etiket="Pasaport no" deger={kimlikTaslak.pasaportNo} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, pasaportNo: v } : k))} />}
                    {kt === 'vatansiz' && <Alan etiket="Şahıs numarası" deger={kimlikTaslak.sahisNo} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, sahisNo: v } : k))} />}
                    <Alan etiket="Ad" deger={kimlikTaslak.ad} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, ad: v } : k))} />
                    <Alan etiket="Soyad" deger={kimlikTaslak.soyad} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, soyad: v } : k))} />
                    <label>
                      <span style={toolsLabel}>Cinsiyet</span>
                      <select value={kimlikTaslak.cinsiyet} onChange={(e) => setKimlikTaslak((k) => (k ? { ...k, cinsiyet: e.target.value } : k))} style={toolsInput}>
                        <option value="">Seçin</option>
                        <option value="K">Kadın</option>
                        <option value="E">Erkek</option>
                      </select>
                    </label>
                    <Alan etiket="Doğum tarihi" tip="date" deger={kimlikTaslak.dogumTarihi} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, dogumTarihi: v } : k))} />
                    {kt !== 'vatandas' && <Alan etiket="Uyruk (ülke)" deger={kimlikTaslak.uyruk} degis={(v) => setKimlikTaslak((k) => (k ? { ...k, uyruk: v } : k))} />}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="button" disabled={mesgul === s.notId} onClick={() => void kimlikKaydet(s)} style={{ ...toolsPrimaryBtn(mesgul === s.notId), width: 'auto' }}>Kaydet</button>
                    <button type="button" onClick={() => setKimlikAcik('')} style={ikincilBtn}>Vazgeç</button>
                  </div>
                  <p style={{ fontSize: 12, color: CHROME_RENK.muted, margin: '8px 0 0' }}>Bu bilgiler yalnız MBYS aktarımı için şifreli saklanır; hasta kaydınızı değiştirmez.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Alan({ etiket, deger, degis, tip, inputMode, maxLength }: {
  etiket: string
  deger: string
  degis: (v: string) => void
  tip?: string
  inputMode?: 'numeric' | 'text'
  maxLength?: number
}) {
  return (
    <label>
      <span style={toolsLabel}>{etiket}</span>
      <input type={tip || 'text'} value={deger} inputMode={inputMode} maxLength={maxLength} onChange={(e) => degis(e.target.value)} style={toolsInput} autoComplete="off" />
    </label>
  )
}
