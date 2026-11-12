'use client'
/**
 * GERI-CAGIRMA-01 — Araçlar › Geri çağırma. CORE: the same screen for all 40 branches, doktor AND sekreter
 * (lib/geriCagirma/README.md). One list of patients who are due or overdue — from the doctor's own branş's
 * existing kohort tool and from the doctor's own follow-up dates — grouped by reason; one tap sends a GENERIC
 * reminder to the selection through the practice's own connected channels after one confirmation.
 *
 * Query: ?kaynak=<tool key> (set by a kohort panel's "Bu listeyi geri çağır") narrows the list to that panel.
 * The reason is never in a message; it is shown here to the practice only.
 */
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { GONDERICI_YOK_ETIKETI, IZIN_YOK_ETIKETI, KANAL_ADI, SAYIM_KURALI } from '@/lib/geriCagirma/metin'
import type { GeriCagirmaAdayi, GeriCagirmaKanali } from '@/lib/geriCagirma/tipler'

const R = CHROME_RENK
const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }
const dugme = (dolu: boolean, kapali = false): React.CSSProperties => ({ minHeight: 44, padding: '10px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: kapali ? 'not-allowed' : 'pointer', opacity: kapali ? 0.5 : 1, border: dolu ? 'none' : `1px solid ${R.border}`, background: dolu ? R.pine : '#FFFFFF', color: dolu ? '#FFFFFF' : R.ink, fontFamily: CHROME_FONT.sans })
const cip = (secili: boolean): React.CSSProperties => ({ minHeight: 36, padding: '6px 12px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${secili ? R.pine : R.border}`, background: secili ? R.pine : '#FFFFFF', color: secili ? '#FFFFFF' : R.ink, fontFamily: CHROME_FONT.sans })
const kucuk: React.CSSProperties = { fontSize: 13, color: R.muted, lineHeight: 1.5 }

type Grup = { anahtar: string; etiket: string; kaynak: string; sayi: number }
type Sablon = { anahtar: string; etiket: string; baglantili: string; baglantisiz: string }
type Liste = {
  kurulu: boolean; toplam: number; sayfa: number; boyut: number; adaylar: GeriCagirmaAdayi[]; gruplar: Grup[]
  disarida: { randevusuVar: number; beklemede: number; pasif: number }; beklemeGun: number
  kanalSayilari?: Record<GeriCagirmaKanali | 'gonderici_yok' | 'izin_yok', number>; baglantiSayisi?: number
  sablonlar?: Sablon[]; whatsapp?: { limit: number; son24Saat: number; birimUsd: number } | null; whatsappMetni?: string | null; atifPenceresiGun?: number
}
type Sonuc = { durum: 'tamamlandi' | 'devam'; gonderilen: number; basarisiz: number; atlanan: number; zatenIslenen: number; kanal: Record<GeriCagirmaKanali, number>; kalan: number; hatalar: string[] }

const BOYUT = 200
const tarih = (iso: string | null) => (iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)) : '—')
const yeniAnahtar = () => `gc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

async function istek<T>(yol: string, init?: RequestInit): Promise<T> {
  const t = await ensureDoctorAccessToken()
  const r = await fetch(yol, { ...init, cache: 'no-store', headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j as { error?: string }).error || 'İşlem yapılamadı.')
  return j as T
}

function Ekran() {
  const kaynak = useSearchParams().get('kaynak') || ''
  const [liste, setListe] = useState<Liste | null>(null)
  const [adaylar, setAdaylar] = useState<GeriCagirmaAdayi[]>([])
  const [hata, setHata] = useState('')
  const [secili, setSecili] = useState<Set<string>>(new Set())
  const [neden, setNeden] = useState('')
  const [enAzGun, setEnAzGun] = useState(0)
  const [yalnizGonderilebilir, setYalnizGonderilebilir] = useState(false)
  const [sablon, setSablon] = useState('kontrol')
  const [onay, setOnay] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const [sonuc, setSonuc] = useState<Sonuc | null>(null)
  const [anahtar, setAnahtar] = useState(yeniAnahtar)
  const [kural, setKural] = useState(false)
  const [bekleme, setBekleme] = useState('')
  const [beklemeNotu, setBeklemeNotu] = useState('')

  const yukle = useCallback(async (taze = false) => {
    setHata('')
    try {
      const j = await istek<Liste>(`/api/doktor/geri-cagirma?boyut=${BOYUT}${kaynak ? `&kaynak=${encodeURIComponent(kaynak)}` : ''}${taze ? '&yenile=1' : ''}`)
      setListe(j); setAdaylar(j.adaylar || []); setBekleme(String(j.beklemeGun)); setSecili(new Set())
    } catch (e) { setHata((e as Error).message); setListe({ kurulu: true, toplam: 0, sayfa: 1, boyut: BOYUT, adaylar: [], gruplar: [], disarida: { randevusuVar: 0, beklemede: 0, pasif: 0 }, beklemeGun: 30 }) }
  }, [kaynak])
  useEffect(() => { void yukle() }, [yukle])

  const dahaFazla = async () => {
    if (!liste) return
    try {
      const j = await istek<Liste>(`/api/doktor/geri-cagirma?boyut=${BOYUT}&sayfa=${Math.floor(adaylar.length / BOYUT) + 1}${kaynak ? `&kaynak=${encodeURIComponent(kaynak)}` : ''}`)
      setAdaylar((p) => [...p, ...(j.adaylar || []).filter((a) => !p.some((x) => x.patientId === a.patientId))])
    } catch (e) { setHata((e as Error).message) }
  }

  const gorunen = useMemo(() => adaylar.filter((a) =>
    (!neden || a.nedenler.some((n) => n.anahtar === neden))
    && (!enAzGun || (a.gunGecikme ?? 0) >= enAzGun)
    && (!yalnizGonderilebilir || !!a.kanal)), [adaylar, neden, enAzGun, yalnizGonderilebilir])

  // Each patient appears once, under their first reason; the group header carries the group's own count.
  const gruplu = useMemo(() => {
    const m = new Map<string, { etiket: string; hastalar: GeriCagirmaAdayi[] }>()
    for (const a of gorunen) {
      const n = (neden && a.nedenler.find((x) => x.anahtar === neden)) || a.nedenler[0]
      if (!n) continue
      const g = m.get(n.anahtar) || { etiket: n.etiket, hastalar: [] }
      g.hastalar.push(a)
      m.set(n.anahtar, g)
    }
    return [...m.entries()]
  }, [gorunen, neden])

  const seciliAdaylar = useMemo(() => adaylar.filter((a) => secili.has(a.patientId) && a.kanal), [adaylar, secili])
  const dagilim = useMemo(() => {
    const d: Record<GeriCagirmaKanali, number> = { whatsapp: 0, sms: 0, eposta: 0 }
    let baglanti = 0
    for (const a of seciliAdaylar) { d[a.kanal!]++; if (a.baglanti && a.kanal !== 'whatsapp') baglanti++ }
    return { d, baglanti }
  }, [seciliAdaylar])

  const sec = (idler: string[], ac: boolean) => setSecili((p) => { const y = new Set(p); for (const id of idler) { if (ac) y.add(id); else y.delete(id) } return y })
  const gonderilebilirIdler = (l: GeriCagirmaAdayi[]) => l.filter((a) => a.kanal).map((a) => a.patientId)

  const gonder = async () => {
    setMesgul(true); setHata(''); setSonuc(null)
    try {
      const toplam: Sonuc = { durum: 'tamamlandi', gonderilen: 0, basarisiz: 0, atlanan: 0, zatenIslenen: 0, kanal: { whatsapp: 0, sms: 0, eposta: 0 }, kalan: 0, hatalar: [] }
      // 'devam' = the per-request cap: the SAME key continues; nobody is messaged twice.
      for (let tur = 0; tur < 8; tur++) {
        const j = await istek<Sonuc>('/api/doktor/geri-cagirma/gonder', { method: 'POST', body: JSON.stringify({ patientIds: seciliAdaylar.map((a) => a.patientId), sablon, istekAnahtari: anahtar, onay: true }) })
        toplam.gonderilen += j.gonderilen; toplam.basarisiz += j.basarisiz; toplam.atlanan = j.atlanan
        for (const k of ['whatsapp', 'sms', 'eposta'] as GeriCagirmaKanali[]) toplam.kanal[k] += j.kanal[k]
        for (const h of j.hatalar) if (!toplam.hatalar.includes(h)) toplam.hatalar.push(h)
        toplam.durum = j.durum; toplam.kalan = j.kalan
        if (j.durum !== 'devam') break
      }
      setSonuc(toplam); setOnay(false); setAnahtar(yeniAnahtar())
      await yukle(true)
    } catch (e) { setHata((e as Error).message) } finally { setMesgul(false) }
  }

  const arandi = async (id: string) => {
    try {
      await istek('/api/doktor/geri-cagirma/arandi', { method: 'POST', body: JSON.stringify({ patientId: id }) })
      setAdaylar((p) => p.filter((a) => a.patientId !== id)); sec([id], false)
    } catch (e) { setHata((e as Error).message) }
  }

  const beklemeKaydet = async () => {
    setBeklemeNotu('')
    try {
      await istek('/api/doktor/geri-cagirma/ayar', { method: 'PUT', body: JSON.stringify({ beklemeGun: Number(bekleme) }) })
      setBeklemeNotu('Kaydedildi.'); await yukle(true)
    } catch (e) { setBeklemeNotu((e as Error).message) }
  }

  const s = liste?.sablonlar?.find((x) => x.anahtar === sablon) || liste?.sablonlar?.[0]
  const wa = liste?.whatsapp
  const waKalan = wa ? Math.max(0, wa.limit - wa.son24Saat) : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px', fontFamily: CHROME_FONT.sans, color: R.ink }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0 }}>Geri çağırma</h1>
        <button type="button" onClick={() => setKural((v) => !v)} aria-expanded={kural} style={{ ...cip(false), minHeight: 30, padding: '2px 10px', fontSize: 13 }}>Nasıl sayılıyor?</button>
        <Link href="/doktor-tools" style={{ marginLeft: 'auto', fontSize: 14, color: R.pine, fontWeight: 600, textDecoration: 'none' }}>← Araçlar</Link>
      </div>
      <p style={{ ...kucuk, fontSize: 15, margin: '6px 0 14px' }}>Kontrol ya da takip zamanı gelmiş hastalarınız. Seçtiklerinize tek dokunuşla genel bir hatırlatma gider; mesajda neden, tetkik ya da tanı yazmaz.</p>
      {kural && <div style={{ ...kutu, ...kucuk }}>{SAYIM_KURALI}</div>}
      {hata && <div role="alert" style={{ ...kutu, borderColor: '#D9A28C', background: '#FBEAE3', color: '#7A3D28' }}>{hata}</div>}

      {liste && !liste.kurulu && <div style={kutu}>Geri çağırma bu hesapta henüz etkin değil. Etkinleştirildiğinde hastalarınız burada listelenir.</div>}
      {!liste && <div style={kutu}>Yükleniyor…</div>}

      {sonuc && (
        <div data-alan="gonderim-sonucu" style={{ ...kutu, borderColor: R.pine }}>
          <strong>{sonuc.gonderilen} hastaya hatırlatma gönderildi.</strong>
          <div style={kucuk}>
            {(['whatsapp', 'sms', 'eposta'] as GeriCagirmaKanali[]).filter((k) => sonuc.kanal[k] > 0).map((k) => `${KANAL_ADI[k]}: ${sonuc.kanal[k]}`).join(' · ')}
            {sonuc.basarisiz > 0 && ` · ${sonuc.basarisiz} gönderilemedi`}{sonuc.atlanan > 0 && ` · ${sonuc.atlanan} atlandı (artık listede değil ya da izin yok)`}
            {sonuc.durum === 'devam' && ` · ${sonuc.kalan} hasta kaldı; yeniden “Çağır” ile sürdürebilirsiniz`}
          </div>
          {sonuc.hatalar.length > 0 && <div style={{ ...kucuk, marginTop: 4 }}>{sonuc.hatalar.join(' · ')}</div>}
        </div>
      )}

      {liste?.kurulu && (
        <>
          <div style={kutu}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" style={cip(!neden)} onClick={() => setNeden('')}>Tümü ({liste.toplam})</button>
              {liste.gruplar.map((g) => <button key={g.anahtar} type="button" style={cip(neden === g.anahtar)} onClick={() => setNeden(g.anahtar)}>{g.etiket} ({g.sayi})</button>)}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <label style={{ fontSize: 14 }}>Gecikme{' '}
                <select value={enAzGun} onChange={(e) => setEnAzGun(Number(e.target.value))} style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${R.border}`, padding: '4px 8px', fontSize: 14 }}>
                  <option value={0}>hepsi</option><option value={30}>30 gün ve üzeri</option><option value={90}>90 gün ve üzeri</option><option value={180}>180 gün ve üzeri</option>
                </select>
              </label>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={yalnizGonderilebilir} onChange={(e) => setYalnizGonderilebilir(e.target.checked)} /> Yalnız mesaj gönderilebilenler</label>
              <button type="button" style={{ ...cip(false), marginLeft: 'auto' }} onClick={() => void yukle(true)}>Yenile</button>
            </div>
            {kaynak && <p style={{ ...kucuk, margin: '10px 0 0' }}>Kohort panelinden gelen liste gösteriliyor. <Link href="/doktor-tools/geri-cagirma" style={{ color: R.pine, fontWeight: 600 }}>Tüm nedenleri göster</Link></p>}
            <p style={{ ...kucuk, margin: '10px 0 0' }}>
              Listede olmayanlar: yaklaşan randevusu olan {liste.disarida.randevusuVar} hasta · son {liste.beklemeGun} günde aynı nedenle çağrılmış {liste.disarida.beklemede} hasta · pasif kayıt {liste.disarida.pasif}.
              {liste.toplam >= 600 && ' Liste en fazla 600 hasta gösterir.'}
            </p>
          </div>

          {gruplu.length === 0 && <div style={kutu}>Şu an geri çağrılacak hasta yok.</div>}
          {gruplu.map(([anahtarG, g]) => {
            const idler = gonderilebilirIdler(g.hastalar)
            const hepsi = idler.length > 0 && idler.every((id) => secili.has(id))
            return (
              <section key={anahtarG} style={kutu} data-neden={anahtarG}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{g.etiket} <span style={{ color: R.muted, fontWeight: 600 }}>· {g.hastalar.length}</span></h2>
                  {idler.length > 0 && <button type="button" style={{ ...cip(hepsi), marginLeft: 'auto' }} onClick={() => sec(idler, !hepsi)}>{hepsi ? 'Seçimi kaldır' : `Bu grubu seç (${idler.length})`}</button>}
                </div>
                {g.hastalar.map((a) => (
                  <div key={a.patientId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: `1px solid ${R.border}` }}>
                    <input type="checkbox" aria-label={`${a.ad} seç`} disabled={!a.kanal} checked={secili.has(a.patientId)} onChange={(e) => sec([a.patientId], e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/dashboard/doktor/hastalar/${a.patientId}`} style={{ color: R.ink, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{a.ad}</Link>
                      <div style={kucuk}>
                        {a.nedenler.map((n) => n.etiket).join(' · ')}
                        {a.gunGecikme != null && a.gunGecikme > 0 && ` · ${a.gunGecikme} gün gecikmiş`}
                        {a.vade && ` · vade ${tarih(a.vade)}`}
                      </div>
                      <div style={kucuk}>
                        Son vizit: {tarih(a.sonVizit)} · {a.kanal ? `${KANAL_ADI[a.kanal]}${a.baglanti && a.kanal !== 'whatsapp' ? ' · randevu bağlantılı' : ''}` : <strong style={{ color: '#7A3D28' }}>{a.izin === 'gonderici_yok' ? GONDERICI_YOK_ETIKETI : IZIN_YOK_ETIKETI}</strong>}
                        {a.sonCagri && ` · son çağrı ${tarih(a.sonCagri)}`}
                      </div>
                    </div>
                    <button type="button" title="Hastayı telefonla aradıysanız işaretleyin; mesaj gönderilmez" style={{ ...cip(false), whiteSpace: 'nowrap' }} onClick={() => void arandi(a.patientId)}>Arandı</button>
                  </div>
                ))}
              </section>
            )
          })}
          {adaylar.length < (liste.toplam || 0) && <button type="button" style={{ ...dugme(false), marginBottom: 16 }} onClick={() => void dahaFazla()}>Daha fazla göster ({liste.toplam - adaylar.length})</button>}

          {(liste.toplam || 0) > 0 && (
            <div style={kutu}>
              <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>Mesaj</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {(liste.sablonlar || []).map((x) => <button key={x.anahtar} type="button" style={cip(sablon === x.anahtar)} onClick={() => setSablon(x.anahtar)}>{x.etiket}</button>)}
              </div>
              {s && (
                <div data-alan="mesaj-onizleme">
                  <div style={kucuk}>SMS ve e-posta ile giden metin (randevu bağlantısı olan hastalar):</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans, fontSize: 15, background: '#FAF7F2', border: `1px solid ${R.border}`, borderRadius: 10, padding: 12, margin: '4px 0 8px' }}>{s.baglantili}</pre>
                  <div style={kucuk}>Hasta portalı randevusu kapalıysa ya da hastanın portal girişi yoksa:</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans, fontSize: 15, background: '#FAF7F2', border: `1px solid ${R.border}`, borderRadius: 10, padding: 12, margin: '4px 0 8px' }}>{s.baglantisiz}</pre>
                  {liste.whatsappMetni && (<>
                    <div style={kucuk}>WhatsApp ile giden metin (Meta onaylı genel şablon; serbest metin ve bağlantı gönderilmez):</div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans, fontSize: 15, background: '#FAF7F2', border: `1px solid ${R.border}`, borderRadius: 10, padding: 12, margin: '4px 0 8px' }}>{liste.whatsappMetni}</pre>
                  </>)}
                  <div style={kucuk}>SMS ve e-postanın sonuna acil durum satırı ile mesaj almayı bırakma bilgisi (SMS) ya da abonelikten çıkma bağlantısı (e-posta) eklenir.</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
                <button type="button" style={dugme(false)} onClick={() => sec(gonderilebilirIdler(gorunen), true)}>Görünenlerin tümünü seç ({gonderilebilirIdler(gorunen).length})</button>
                <button type="button" data-alan="cagir" style={dugme(true, seciliAdaylar.length === 0 || mesgul)} disabled={seciliAdaylar.length === 0 || mesgul} onClick={() => setOnay(true)}>Çağır ({seciliAdaylar.length})</button>
              </div>
              {onay && (
                <div data-alan="cagir-onay" role="dialog" aria-label="Geri çağırma onayı" style={{ marginTop: 14, padding: 14, borderRadius: 12, border: `2px solid ${R.pine}`, background: '#FFFFFF' }}>
                  <strong style={{ fontSize: 16 }}>{seciliAdaylar.length} hastaya hatırlatma gönderilecek</strong>
                  <div style={{ ...kucuk, fontSize: 14, marginTop: 6 }}>
                    {(['whatsapp', 'sms', 'eposta'] as GeriCagirmaKanali[]).filter((k) => dagilim.d[k] > 0).map((k) => `${KANAL_ADI[k]}: ${dagilim.d[k]}`).join(' · ')}
                    {` · kişiye özel randevu bağlantısı: ${dagilim.baglanti}`}
                  </div>
                  {dagilim.d.whatsapp > 0 && wa && (
                    <div style={{ ...kucuk, marginTop: 6 }}>
                      WhatsApp: son 24 saatte {wa.son24Saat} / {wa.limit} mesaj kullanıldı{waKalan != null && dagilim.d.whatsapp > waKalan ? ` — yalnız ${waKalan} mesajlık yer var; sığmayanlar izin varsa SMS ya da e-postayla gider, yoksa gönderilmez` : ''}.
                      {` Meta’nın bu şablon türü için yaklaşık ücreti mesaj başına ${wa.birimUsd} USD (bu gönderim ≈ ${(wa.birimUsd * dagilim.d.whatsapp).toFixed(2)} USD); ücreti Meta sizin hesabınızdan alır.`}
                    </div>
                  )}
                  {dagilim.d.sms > 0 && <div style={{ ...kucuk, marginTop: 6 }}>SMS’ler kendi hattınızdan ya da kendi NetGSM hesabınızdan gider; ücreti operatörünüzün ya da NetGSM’in tarifesine göredir.</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" data-alan="cagir-onayla" style={dugme(true, mesgul)} disabled={mesgul} onClick={() => void gonder()}>{mesgul ? 'Gönderiliyor…' : 'Onayla ve gönder'}</button>
                    <button type="button" style={dugme(false, mesgul)} disabled={mesgul} onClick={() => setOnay(false)}>Vazgeç</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={kutu}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Bekleme süresi</h2>
            <p style={{ ...kucuk, margin: '0 0 8px' }}>Aynı hasta, aynı neden için bu kadar gün geçmeden listeye yeniden girmez. Yalnız doktor değiştirebilir.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="number" min={7} max={365} value={bekleme} onChange={(e) => setBekleme(e.target.value)} aria-label="Bekleme süresi (gün)" style={{ width: 90, minHeight: 40, borderRadius: 10, border: `1px solid ${R.border}`, padding: '6px 10px', fontSize: 15 }} />
              <span style={{ fontSize: 14 }}>gün</span>
              <button type="button" style={dugme(false)} onClick={() => void beklemeKaydet()}>Kaydet</button>
              {beklemeNotu && <span style={kucuk}>{beklemeNotu}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function GeriCagirmaSayfasi() {
  return <Suspense fallback={null}><Ekran /></Suspense>
}
