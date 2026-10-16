'use client'

/**
 * NOTYA-HASTA-ILETISIMI-01 — Hasta İletişimi: audience → template/compose → preview → send.
 * UNIVERSAL (every branş + Klinik), doktor AND sekreter get the same full access — see
 * lib/iletisim/toplu/README.md. Advanced filters are optional; the default path (no filters →
 * everyone, pick a template, preview, send) takes well under a minute.
 *
 * Query params (set by "Bekleyen ailelere bildir" on Aşı Stok): asiAdi, lotId, sablon.
 */
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const R = CHROME_RENK
const BORDER = R.border
const INK = R.ink
const MUTED = R.muted
const TEAL = R.pine

const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginBottom: 16 }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: CHROME_FONT.sans, color: INK }
const btn = (bg: string, fg: string): React.CSSProperties => ({ background: bg, color: fg, border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: CHROME_FONT.sans })

// Aynı sabitler lib/iletisim/toplu/sablonlar.ts'de — kampanya.ts gönderirken tam bunları ekler.
// Burada yerel kopya tutuluyor ki bu istemci bileşeni o dosyanın (ve onun asiHatirlatma zincirinin)
// tamamını tarayıcıya taşımasın; metin aynı kalmalı, biri değişirse diğeri de güncellenmeli.
const ACIL_SATIRI = 'Bu mesaj kanalı acil durumlar için değildir; acil bir durumda 112’yi arayın ya da en yakın acil servise başvurun.'
const SMS_VAZGEC_SATIRI = 'Bu mesajları almak istemiyorsanız STOP yazıp gönderin.'

const SABLONLAR: { anahtar: string; etiket: string; metin: string }[] = [
  { anahtar: 'asi_stok_geldi', etiket: 'Aşı stoğa geldi', metin: 'Merhaba, beklediğiniz aşı stoğumuza geldi. Randevu almak için bizi arayabilir ya da WhatsApp\'tan yazabilirsiniz.' },
  { anahtar: 'randevu_genel', etiket: 'Randevu hatırlatma', metin: 'Merhaba, kontrol randevusu almanızı hatırlatmak isteriz. Uygun bir zaman için bize ulaşabilirsiniz.' },
  { anahtar: 'genel_bilgi', etiket: 'Genel bilgilendirme', metin: 'Merhaba, muayenehanemizden bir bilgilendirme mesajıdır.' },
  { anahtar: 'serbest', etiket: 'Serbest metin', metin: '' },
]

type Onizleme = { hedefSayisi: number; smsHazirSayisi: number; epostaHazirSayisi: number; ornekler: { id: string; ad: string }[] }
type GecmisSatiri = { id: string; konu: string | null; govde: string; hedef_sayisi: number; durum: string; created_at: string; olusturan_rol: string; sayilar: { gonderildi: number; basarisiz: number; atlandi: number } }

function HastaIletisimiIcerik() {
  const params = useSearchParams()
  const asiAdi = params.get('asiAdi')
  const lotId = params.get('lotId')

  const [kanal, setKanal] = useState<'sms' | 'eposta' | 'ikisi'>('ikisi')
  const [sablonAnahtari, setSablonAnahtari] = useState('genel_bilgi')
  const [konu, setKonu] = useState('Bilgilendirme')
  const [govde, setGovde] = useState(SABLONLAR[2].metin)

  // Basit filtreler — hiçbiri zorunlu değil.
  const [brans, setBrans] = useState('')
  const [yasMin, setYasMin] = useState('')
  const [yasMax, setYasMax] = useState('')
  const [sonZiyaretGunIci, setSonZiyaretGunIci] = useState('')
  const [etiketlerMetin, setEtiketlerMetin] = useState('')
  const [asiBekleyenleriAc, setAsiBekleyenleriAc] = useState(!!asiAdi)

  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [onizleniyor, setOnizleniyor] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [onayAsamasi, setOnayAsamasi] = useState(false)
  const [sonuc, setSonuc] = useState<{ hedefSayisi: number; gonderildi: number; basarisiz: number; atlandi: number; vazgecYok: number; kalan: number; smsManuelListesi?: { ad: string; telefon: string }[] } | null>(null)
  const [hata, setHata] = useState('')
  const [gecmis, setGecmis] = useState<GecmisSatiri[]>([])
  // Stable across retries of the SAME send (so a double-click or network retry is deduped by the
  // server's idempotency key, never sends twice) but regenerated after every successful send
  // (below) — otherwise a second, genuinely different campaign composed later in the same page
  // session would reuse this key and the server would silently treat it as a retry of the FIRST
  // campaign, returning that old campaign's already-"tamamlandı" result instead of sending the new one.
  const [idemKey, setIdemKey] = useState(() => `k_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
  const yeniIdemKeyUret = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  useEffect(() => {
    if (asiAdi) {
      setSablonAnahtari('asi_stok_geldi')
      setKonu('Aşınız geldi')
      setGovde(SABLONLAR[0].metin)
      setAsiBekleyenleriAc(true)
    }
  }, [asiAdi])

  const token = () => getDoctorAccessToken()
  const basliklar = () => { const t = token(); return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : null }

  const filtre = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (brans.trim()) f.brans = brans.trim()
    if (yasMin.trim()) f.yasMin = Number(yasMin)
    if (yasMax.trim()) f.yasMax = Number(yasMax)
    if (sonZiyaretGunIci.trim()) f.sonZiyaretGunIci = Number(sonZiyaretGunIci)
    const etiketler = etiketlerMetin.split(',').map((s) => s.trim()).filter(Boolean)
    if (etiketler.length > 0) f.etiketler = etiketler
    if (asiBekleyenleriAc) f.asiBekleyenleri = { asiAdi: asiAdi || null }
    return f
  }, [brans, yasMin, yasMax, sonZiyaretGunIci, etiketlerMetin, asiBekleyenleriAc, asiAdi])

  const sablonSec = (a: string) => {
    const s = SABLONLAR.find((x) => x.anahtar === a)
    setSablonAnahtari(a)
    if (s) { setGovde(s.metin); setKonu(s.anahtar === 'asi_stok_geldi' ? 'Aşınız geldi' : s.anahtar === 'randevu_genel' ? 'Randevu hatırlatması' : 'Bilgilendirme') }
  }

  const onizle = async () => {
    const h = basliklar(); if (!h) return
    setOnizleniyor(true); setHata(''); setOnayAsamasi(false); setSonuc(null)
    try {
      const r = await fetch('/api/doktor/iletisim/toplu/onizleme', { method: 'POST', headers: h, body: JSON.stringify({ filtre }) })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Önizleme alınamadı.'); return }
      setOnizleme(d)
      setOnayAsamasi(true)
    } catch { setHata('Bağlantı hatası.') } finally { setOnizleniyor(false) }
  }

  const gonder = async () => {
    const h = basliklar(); if (!h) return
    setGonderiliyor(true); setHata('')
    try {
      const r = await fetch('/api/doktor/iletisim/toplu/gonder', {
        method: 'POST', headers: h,
        body: JSON.stringify({
          filtre, kanal, konu, govde, sablonAnahtari, idempotencyKey: idemKey,
          tetikleyici: asiAdi ? 'asi_stok' : 'manuel', asiStokLotId: lotId || null, onay: true,
          onizlemeHedefSayisi: onizleme?.hedefSayisi ?? null,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Gönderilemedi.'); return }
      const say = (f: (s: any) => boolean) => (d.sonuclar || []).filter(f).length
      const devam = d.durum === 'devam'
      // A 'devam' answer covers only part of the campaign; the same key is resent to continue, so totals accumulate.
      setSonuc((onceki) => {
        const t = onceki?.kalan ? onceki : null
        return {
          hedefSayisi: d.hedefSayisi,
          gonderildi: (t?.gonderildi || 0) + say((s) => s.durum === 'gonderildi'),
          basarisiz: (t?.basarisiz || 0) + say((s) => s.durum === 'basarisiz'),
          atlandi: (t?.atlandi || 0) + say((s) => s.durum === 'atlandi' && s.sebep !== 'vazgec_baglantisi_yok'),
          vazgecYok: (t?.vazgecYok || 0) + say((s) => s.sebep === 'vazgec_baglantisi_yok'),
          kalan: devam ? Number(d.kalan || 0) : 0,
          smsManuelListesi: d.smsManuelListesi,
        }
      })
      if (devam) { void gecmisiYukle(); return } // keep the same idemKey + confirm step: pressing the button again continues
      setOnayAsamasi(false)
      setIdemKey(yeniIdemKeyUret()) // ready for a NEXT, distinct campaign in this same page session
      void gecmisiYukle()
    } catch { setHata('Bağlantı hatası.') } finally { setGonderiliyor(false) }
  }

  const gecmisiYukle = async () => {
    const h = basliklar(); if (!h) return
    try {
      const r = await fetch('/api/doktor/iletisim/toplu/gecmis', { headers: h })
      const d = await r.json()
      if (r.ok) setGecmis(d.kampanyalar || [])
    } catch { /* fail soft */ }
  }
  useEffect(() => { void gecmisiYukle() }, [])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 80px', fontFamily: CHROME_FONT.sans, color: INK }}>
      <Link href="/doktor-tools" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>← Araçlar</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '10px 0 4px' }}>Hasta İletişimi</h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>
        Birden çok hastaya SMS ve/veya e-posta ile tek seferde mesaj gönderin. Gönderimden önce her zaman bir onay adımı vardır.
      </p>

      {asiAdi && (
        <div style={{ ...kutu, background: '#F3F8F0', border: `1px solid #3F7D4A` }}>
          <b>{asiAdi}</b> için "Bekleyen ailelere bildir" akışındasınız — aşı bekleme listesi filtresi otomatik açıldı.
        </div>
      )}

      <section style={kutu}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>1 — Kime gönderilsin?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input style={inp} placeholder="Branş (opsiyonel, örn: pediatri)" value={brans} onChange={(e) => setBrans(e.target.value)} />
          <input style={inp} placeholder="Etiketler, virgülle (opsiyonel)" value={etiketlerMetin} onChange={(e) => setEtiketlerMetin(e.target.value)} />
          <input style={inp} type="number" placeholder="Yaş min (opsiyonel)" value={yasMin} onChange={(e) => setYasMin(e.target.value)} />
          <input style={inp} type="number" placeholder="Yaş max (opsiyonel)" value={yasMax} onChange={(e) => setYasMax(e.target.value)} />
          <input style={inp} type="number" placeholder="Son ziyaret ≤ gün (opsiyonel)" value={sonZiyaretGunIci} onChange={(e) => setSonZiyaretGunIci(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={asiBekleyenleriAc} onChange={(e) => setAsiBekleyenleriAc(e.target.checked)} /> Aşı bekleme listesi{asiAdi ? ` (${asiAdi})` : ''}
          </label>
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>Hiçbir filtre seçmezseniz tüm aktif hastalarınıza gönderilir.</div>
      </section>

      <section style={kutu}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>2 — Şablon / Mesaj</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SABLONLAR.map((s) => (
            <button key={s.anahtar} type="button" onClick={() => sablonSec(s.anahtar)}
              style={{ ...btn(sablonAnahtari === s.anahtar ? TEAL : '#FFFFFF', sablonAnahtari === s.anahtar ? '#fff' : INK), border: `1.5px solid ${sablonAnahtari === s.anahtar ? TEAL : BORDER}`, padding: '8px 14px', fontSize: 13.5 }}>
              {s.etiket}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {(['sms', 'eposta', 'ikisi'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKanal(k)}
              style={{ ...btn(kanal === k ? TEAL : '#FFFFFF', kanal === k ? '#fff' : INK), border: `1.5px solid ${kanal === k ? TEAL : BORDER}`, padding: '8px 14px', fontSize: 13.5 }}>
              {k === 'sms' ? 'SMS' : k === 'eposta' ? 'E-posta' : 'SMS + E-posta'}
            </button>
          ))}
        </div>
        {kanal !== 'sms' && <input style={{ ...inp, marginBottom: 10 }} placeholder="E-posta konusu" value={konu} onChange={(e) => setKonu(e.target.value)} />}
        <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={govde} onChange={(e) => { setGovde(e.target.value); setOnayAsamasi(false) }} placeholder="Mesaj metni — tüm alıcılara aynen bu metin gider (112 bilgi satırı ve vazgeçme bağlantısı/STOP bilgisi otomatik eklenir, aşağıda önizlemede görünür)." />
      </section>

      <section style={kutu}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>3 — Önizleme ve gönderim</div>
        <button type="button" disabled={onizleniyor || !govde.trim()} onClick={() => void onizle()} style={{ ...btn(TEAL, '#fff'), width: '100%' }}>
          {onizleniyor ? 'Önizleniyor…' : 'Önizle'}
        </button>

        {onayAsamasi && onizleme && (
          <div style={{ marginTop: 14, padding: 14, background: '#FBF7EE', borderRadius: 12, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}><b>{onizleme.hedefSayisi}</b> hastaya gönderilecek — SMS için hazır: <b>{onizleme.smsHazirSayisi}</b>, e-posta için hazır: <b>{onizleme.epostaHazirSayisi}</b>.</div>
            {(kanal === 'sms' || kanal === 'ikisi') && (
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
                SMS olarak gidecek tam metin: <i>"{govde} {ACIL_SATIRI} {SMS_VAZGEC_SATIRI}"</i>
              </div>
            )}
            {(kanal === 'eposta' || kanal === 'ikisi') && (
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>
                E-posta olarak gidecek tam metin: <i>"{govde} {ACIL_SATIRI}"</i> + her alıcıya özel, kişiye özgü bir abonelikten çıkma bağlantısı (altbilgi olarak, burada gösterilemez çünkü her hasta için farklıdır).
              </div>
            )}
            <button type="button" disabled={gonderiliyor} onClick={() => void gonder()} style={{ ...btn('#B3261E', '#fff'), width: '100%' }}>
              {gonderiliyor ? 'Gönderiliyor…' : (sonuc && sonuc.kalan > 0) ? 'Devam et' : `Onaylıyorum, ${onizleme.hedefSayisi} hastaya gönder`}
            </button>
          </div>
        )}

        {sonuc && (
          <div style={{ marginTop: 14, padding: 14, background: '#F3F8F0', borderRadius: 12, border: '1px solid #3F7D4A' }}>
            Gönderildi: <b>{sonuc.gonderildi}</b> · Başarısız: <b>{sonuc.basarisiz}</b> · Atlandı (izin/adres yok): <b>{sonuc.atlandi}</b>
            {sonuc.vazgecYok > 0 && (<div style={{ marginTop: 6, fontSize: 13, color: '#B3261E' }}>{sonuc.vazgecYok} e-posta GÖNDERİLMEDİ: abonelikten çıkma bağlantısı oluşturulamadı (sunucu yapılandırması). Lütfen yöneticiye bildirin.</div>)}
            {sonuc.kalan > 0 && (<div style={{ marginTop: 6, fontSize: 13 }}>Gönderim henüz tamamlanmadı — {sonuc.kalan} alıcı kaldı. Devam etmek için onay düğmesine tekrar basın; daha önce gönderilenlere ikinci kez gönderilmez.</div>)}
            {sonuc.smsManuelListesi && sonuc.smsManuelListesi.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                SMS gateway bağlı değil — aşağıdaki listeyi kendi telefonunuzdan gönderin:
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, background: '#fff', padding: 10, borderRadius: 8, marginTop: 6 }}>
                  {sonuc.smsManuelListesi.map((x) => `${x.ad} — ${x.telefon}: ${govde} ${ACIL_SATIRI} ${SMS_VAZGEC_SATIRI}`).join('\n')}
                </pre>
              </div>
            )}
          </div>
        )}
        {hata && <div style={{ color: '#B3261E', fontSize: 14, marginTop: 10 }}>{hata}</div>}
      </section>

      <section style={kutu}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Geçmiş</div>
        {gecmis.length === 0 && <div style={{ fontSize: 13.5, color: MUTED }}>Henüz toplu mesaj gönderilmedi.</div>}
        {gecmis.map((k) => (
          <div key={k.id} style={{ padding: '10px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 13.5 }}>
            <div>{new Date(k.created_at).toLocaleString('tr-TR')} — {k.konu || 'Mesaj'} — {k.hedef_sayisi} hedef</div>
            <div style={{ color: MUTED }}>Gönderildi: {k.sayilar.gonderildi} · Başarısız: {k.sayilar.basarisiz} · Atlandı: {k.sayilar.atlandi} · {k.olusturan_rol}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary or the static prerender fails the build.
export default function HastaIletisimiSayfasi() {
  return (
    <Suspense fallback={null}>
      <HastaIletisimiIcerik />
    </Suspense>
  )
}
