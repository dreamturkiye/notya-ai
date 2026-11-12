'use client'
/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro (WhatsApp)" on Ayarlar › İletişim, beside the WhatsApp card.
 *
 *   • the three booking modes (Kapalı — default / Onayımla / Otomatik)
 *   • the answers switch (default off) and the "Muayenehane bilgileri" sheet Ayşe answers from
 *   • a plain statement of what Ayşe does and does not do (never medical advice)
 *   • a test box: type a patient message, see what Ayşe would reply — nothing is sent
 *
 * The secretary sees the sheet read-only (the server refuses a secretary's save). Before the feature is switched on for
 * the installation (migration 195) the card says so and nothing can be saved. Same chrome as the other cards of the page.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { waIstek } from '@/lib/iletisim/whatsapp/istemci'
import { ALAN_SINIRI, SSS_SINIRI, SSS_SORU_SINIRI, VARSAYILAN_ON_BURO, type MuayenehaneBilgisi, type OnBuroAyari, type RandevuModu } from '@/lib/iletisim/onburo/ayar'

const kart: React.CSSProperties = {
  background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '18px 20px', color: CHROME_RENK.ink,
  fontFamily: CHROME_FONT.sans, boxSizing: 'border-box', width: '100%',
}
const birincilDugme: React.CSSProperties = {
  minHeight: 44, padding: '10px 20px', borderRadius: 12, border: 'none', background: CHROME_RENK.pine, color: CHROME_RENK.cream, fontSize: 15, fontWeight: 600,
  fontFamily: CHROME_FONT.sans, cursor: 'pointer',
}
const ikincilDugme: React.CSSProperties = {
  minHeight: 44, padding: '8px 14px', borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, background: '#fff', color: CHROME_RENK.ink, fontSize: 14, fontWeight: 600,
  fontFamily: CHROME_FONT.sans, cursor: 'pointer',
}
const girdi: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, fontFamily: CHROME_FONT.sans,
  color: CHROME_RENK.ink, background: '#fff',
}
const baslik: React.CSSProperties = { margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 560, fontSize: 19 }
const altBaslik: React.CSSProperties = { margin: '18px 0 6px', fontSize: 15, fontWeight: 650 }
const kucuk: React.CSSProperties = { display: 'block', fontSize: 13, color: CHROME_RENK.muted, marginTop: 2, lineHeight: 1.45 }

const MODLAR: { mod: RandevuModu; ad: string; aciklama: string }[] = [
  { mod: 'kapali', ad: 'Kapalı', aciklama: 'Ayşe WhatsApp’tan randevu önermez. Randevu isteyen mesajlar bugünkü gibi Gelen Yanıtlar’a düşer.' },
  { mod: 'onay', ad: 'Onayımla', aciklama: 'Ayşe boş saatlerinizden en çok üçünü önerir. Hastanın seçtiği saat talep olarak tutulur; siz ya da sekreteriniz tek dokunuşla onaylar. Hastaya onay beklendiği, sonra da onaylandığı bildirilir.' },
  { mod: 'otomatik', ad: 'Otomatik', aciklama: 'Hastanın seçtiği saat hemen randevu olur (portal randevusuyla aynı yol: hatırlatmalar, takvim eşitlemesi, kayıt). Ön büroya tek dokunuşla geri alınabilen bir kart düşer.' },
]

const ALANLAR: { alan: Exclude<keyof MuayenehaneBilgisi, 'hazirlik' | 'sss'>; ad: string; ipucu: string; satir?: number }[] = [
  { alan: 'adres', ad: 'Adres', ipucu: 'Bina, kat, daire; kolay bulunması için kısa bir tarif.', satir: 2 },
  { alan: 'harita', ad: 'Harita bağlantısı', ipucu: 'https:// ile başlayan konum bağlantısı.' },
  { alan: 'calismaSaatleri', ad: 'Çalışma saatleri', ipucu: 'Boş bırakırsanız randevu ayarlarınızdaki çalışma planı kullanılır.', satir: 2 },
  { alan: 'telefon', ad: 'Telefon', ipucu: 'Hastaların arayabileceği numara.' },
  { alan: 'otopark', ad: 'Otopark', ipucu: 'Otopark var mı, nerede, ücretli mi?', satir: 2 },
  { alan: 'ulasim', ad: 'Ulaşım', ipucu: 'En yakın durak, metro, toplu taşıma.', satir: 2 },
  { alan: 'ucretler', ad: 'Ücretler', ipucu: 'Yalnızca paylaşmak istediğiniz ücretleri yazın. Boşsa Ayşe ücret sorularını yanıtlamaz, size iletir.', satir: 3 },
  { alan: 'odeme', ad: 'Ödeme yöntemleri', ipucu: 'Nakit, kart, havale…', satir: 2 },
  { alan: 'sigorta', ad: 'Sigorta / SGK', ipucu: 'Anlaşmalı kurumlar, SGK ve özel sigorta durumu.', satir: 2 },
  { alan: 'getirilecekler', ad: 'Gelirken getirilecekler', ipucu: 'Kimlik, eski tetkikler, kullandığı ilaçların listesi…', satir: 2 },
  { alan: 'iptalPolitikasi', ad: 'İptal koşulları', ipucu: 'Kaç saat önce haber verilmeli?', satir: 2 },
]
const HAZIRLIK: { tur: keyof MuayenehaneBilgisi['hazirlik']; ad: string }[] = [
  { tur: 'ilk_muayene', ad: 'İlk muayene öncesi hazırlık' }, { tur: 'muayene', ad: 'Muayene öncesi hazırlık' }, { tur: 'kontrol', ad: 'Kontrol öncesi hazırlık' },
]

type Onizleme = { tur: string; yanit: string | null; alanlar: string[]; kaynak: 'kural' | 'model' | null }
const ONIZLEME_BASLIGI: Record<string, string> = {
  yanit: 'Ayşe, muayenehane bilgilerinizden şunu yanıtlar:',
  randevu: 'Ayşe boş saatlerinizi önerir:',
  acil: 'Acil ifade: Ayşe yalnızca şu sabit cümleyi gönderir ve size acil kart düşer:',
  tibbi: 'Tıbbi soru: Ayşe yanıt vermez, yalnızca şu sabit cümleyi gönderir ve soru size kart olarak iletilir:',
  bekleme: 'Bilgi sayfanızda yanıtı yok: Ayşe şu cümleyi gönderir ve soru size kart olarak düşer:',
  mevcut_akis: 'Bu mesajı Ayşe ön büro değil, mevcut akış karşılar (onay, iptal, erteleme ya da mesaj izni).',
  sessiz: 'Ayşe bu mesaja kendiliğinden yanıt vermez; mesaj Gelen Yanıtlar’da görünür.',
}

/** Presentational part (kept separate so it can be rendered without a session). */
export function OnBuroKartiGorunumu(props: {
  ayar: OnBuroAyari
  hazir: boolean
  duzenleyebilir: boolean
  turetilmisSaatler?: string
  acilNumara?: string
  mesgul?: boolean
  mesaj?: string | null
  onDegis?: (a: OnBuroAyari) => void
  onKaydet?: () => void
  testMetni?: string
  onTestMetni?: (s: string) => void
  onTest?: () => void
  onizleme?: Onizleme | null
  etiketler?: Record<string, string>
}) {
  const { ayar, hazir, duzenleyebilir, mesgul } = props
  const kilitli = !duzenleyebilir || !hazir || !!mesgul
  const bilgi = ayar.bilgi
  const degis = (parca: Partial<OnBuroAyari>) => props.onDegis?.({ ...ayar, ...parca })
  const bilgiDegis = (parca: Partial<MuayenehaneBilgisi>) => degis({ bilgi: { ...bilgi, ...parca } })
  const [acik, setAcik] = useState(false)
  const acil = props.acilNumara || '112'

  return (
    <div data-on-buro-karti={hazir ? 'hazir' : 'bekliyor'} style={kart}>
      <h3 style={baslik}>Ayşe ön büro (WhatsApp)</h3>
      <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5 }}>
        Bağlı WhatsApp numaranıza yazan hastalara Ayşe iki konuda kendiliğinden yardımcı olabilir: <strong>randevu vermek</strong> ve
        {' '}<strong>muayenehanenizle ilgili soruları</strong> (adres, saatler, otopark…) sizin yazdığınız bilgilerden yanıtlamak. İkisi de varsayılan olarak kapalıdır.
      </p>
      {!hazir && (
        <p role="status" style={{ margin: '10px 0 0', fontSize: 14, color: CHROME_RENK.muted }}>Bu özellik hesabınızda henüz kullanıma açılmadı. Açıldığında ayarları buradan yapabileceksiniz.</p>
      )}
      {!duzenleyebilir && hazir && (
        <p role="status" style={{ margin: '10px 0 0', fontSize: 14, color: CHROME_RENK.muted }}>Bu ayarları yalnızca hekim değiştirebilir. Muayenehane bilgilerini aşağıda görebilirsiniz.</p>
      )}

      <h4 style={altBaslik}>Ayşe ne yapar, ne yapmaz?</h4>
      <ul data-on-buro-aciklama style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }}>
        <li>Yalnızca boş saatlerinizi önerir; çalışma planınıza, tatillere, takviminizdeki dolu saatlere ve portal randevusundaki sınırlara uyar.</li>
        <li>Sorulara yalnızca aşağıdaki “Muayenehane bilgileri”nden yanıt verir. Orada olmayan bir şeyi uydurmaz; “sorunuzu ilettik” der ve soruyu size kart olarak bırakır.</li>
        <li><strong>Tıbbi tavsiye vermez.</strong> Belirti, ilaç, doz, tahlil sonucu gibi sorulara yanıt yazmaz; hastaya sorusunun hekime iletildiğini söyler ve soruyu size işaretli kart olarak gösterir.</li>
        <li>Acil ifade içeren mesajlarda (göğüs ağrısı, nefes alamama, kanama…) yalnızca “{acil}’yi arayın” cümlesini gönderir ve size acil kart düşer.</li>
        <li>Tanımadığı bir numara için kendiliğinden hasta kaydı açmaz; ad soyad ister ve talebi ön büronun onayına bırakır.</li>
        <li>Hasta “DUR” yazarsa hiçbir otomatik mesaj gitmez. Ayşe’nin verdiği her yanıt Gelen Yanıtlar’da “Ayşe yanıtladı” diye görünür.</li>
        <li>Tıbbi ve acil ifadeleri kelime listeleriyle tanır; liste her ifadeyi yakalayamayabilir. Gelen Yanıtlar’ı düzenli kontrol edin.</li>
      </ul>

      <h4 style={altBaslik}>WhatsApp’tan randevu</h4>
      <div role="radiogroup" aria-label="WhatsApp’tan randevu" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MODLAR.map((m) => (
          <label key={m.mod} data-on-buro-mod={m.mod} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, cursor: kilitli ? 'default' : 'pointer' }}>
            <input type="radio" name="on-buro-mod" checked={ayar.randevuModu === m.mod} disabled={kilitli} onChange={() => degis({ randevuModu: m.mod })} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
            <span><strong>{m.ad}</strong><span style={kucuk}>{m.aciklama}</span></span>
          </label>
        ))}
      </div>

      <h4 style={altBaslik}>Sorulara yanıt</h4>
      <label data-on-buro-yanit style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, cursor: kilitli ? 'default' : 'pointer' }}>
        <input type="checkbox" checked={ayar.yanitAcik} disabled={kilitli} onChange={(e) => degis({ yanitAcik: e.target.checked })} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
        <span>
          Tıbbi olmayan soruları Ayşe yanıtlasın
          <span style={kucuk}>Varsayılan kapalı. Açıkken Ayşe yalnızca aşağıdaki bilgilerden yanıt verir; yanıtı yoksa soruyu size iletir.</span>
        </span>
      </label>

      <button type="button" aria-expanded={acik} onClick={() => setAcik(!acik)} style={{ ...ikincilDugme, width: '100%', textAlign: 'left', marginTop: 14 }}>
        Muayenehane bilgileri
      </button>
      {acik && (
        <div data-on-buro-bilgi style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ALANLAR.map((a) => (
            <label key={a.alan} style={{ fontSize: 14, fontWeight: 600 }}>
              {a.ad}
              <span style={{ ...kucuk, fontWeight: 400 }}>{a.alan === 'calismaSaatleri' && props.turetilmisSaatler ? `${a.ipucu} Şu an: ${props.turetilmisSaatler}` : a.ipucu}</span>
              {a.satir ? (
                <textarea value={bilgi[a.alan]} maxLength={ALAN_SINIRI} rows={a.satir} disabled={kilitli} onChange={(e) => bilgiDegis({ [a.alan]: e.target.value })} style={{ ...girdi, marginTop: 6, resize: 'vertical' }} />
              ) : (
                <input value={bilgi[a.alan]} maxLength={ALAN_SINIRI} disabled={kilitli} onChange={(e) => bilgiDegis({ [a.alan]: e.target.value })} style={{ ...girdi, marginTop: 6 }} />
              )}
            </label>
          ))}
          {HAZIRLIK.map((h) => (
            <label key={h.tur} style={{ fontSize: 14, fontWeight: 600 }}>
              {h.ad}
              <span style={{ ...kucuk, fontWeight: 400 }}>Hastaya iletilecek hazırlık talimatını siz yazın (ör. aç gelinmeli, eski raporlar getirilmeli). Ayşe metni olduğu gibi kullanır.</span>
              <textarea value={bilgi.hazirlik[h.tur]} maxLength={ALAN_SINIRI} rows={2} disabled={kilitli} onChange={(e) => bilgiDegis({ hazirlik: { ...bilgi.hazirlik, [h.tur]: e.target.value } })} style={{ ...girdi, marginTop: 6, resize: 'vertical' }} />
            </label>
          ))}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sık sorulanlar</div>
            <span style={kucuk}>Hastaların sık sorduğu, tıbbi olmayan sorular ve sizin yanıtınız. En çok {SSS_SINIRI} satır.</span>
            {bilgi.sss.map((s, i) => (
              <div key={i} data-on-buro-sss={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${CHROME_RENK.border}` }}>
                <input aria-label={`Soru ${i + 1}`} placeholder="Soru" value={s.soru} maxLength={SSS_SORU_SINIRI} disabled={kilitli} onChange={(e) => bilgiDegis({ sss: bilgi.sss.map((x, j) => (j === i ? { ...x, soru: e.target.value } : x)) })} style={girdi} />
                <textarea aria-label={`Yanıt ${i + 1}`} placeholder="Yanıt" value={s.yanit} maxLength={ALAN_SINIRI} rows={2} disabled={kilitli} onChange={(e) => bilgiDegis({ sss: bilgi.sss.map((x, j) => (j === i ? { ...x, yanit: e.target.value } : x)) })} style={{ ...girdi, resize: 'vertical' }} />
                {!kilitli && <button type="button" onClick={() => bilgiDegis({ sss: bilgi.sss.filter((_, j) => j !== i) })} style={{ ...ikincilDugme, alignSelf: 'flex-start', fontWeight: 400, color: CHROME_RENK.muted }}>Satırı sil</button>}
              </div>
            ))}
            {!kilitli && bilgi.sss.length < SSS_SINIRI && (
              <button type="button" onClick={() => bilgiDegis({ sss: [...bilgi.sss, { soru: '', yanit: '' }] })} style={{ ...ikincilDugme, marginTop: 8 }}>Soru ekle</button>
            )}
          </div>
        </div>
      )}

      {duzenleyebilir && hazir && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={props.onKaydet} disabled={mesgul} style={{ ...birincilDugme, opacity: mesgul ? 0.55 : 1 }}>{mesgul ? 'Kaydediliyor…' : 'Kaydet'}</button>
          {props.mesaj && <span role="status" style={{ fontSize: 14, color: CHROME_RENK.pine }}>{props.mesaj}</span>}
        </div>
      )}

      {duzenleyebilir && hazir && (
        <div data-on-buro-test style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${CHROME_RENK.border}` }}>
          <h4 style={{ ...altBaslik, marginTop: 0 }}>Deneyin</h4>
          <span style={kucuk}>Bir hasta mesajı yazın; Ayşe’nin ne yanıt vereceğini görün. Hiçbir mesaj gönderilmez. Kaydetmediğiniz değişiklikler de denenir.</span>
          <form onSubmit={(e) => { e.preventDefault(); props.onTest?.() }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={props.testMetni || ''} onChange={(e) => props.onTestMetni?.(e.target.value)} maxLength={600} aria-label="Hasta mesajı" placeholder="ör. Otoparkınız var mı?" style={{ ...girdi, flex: 1, minWidth: 0 }} />
            <button type="submit" disabled={mesgul || !(props.testMetni || '').trim()} style={ikincilDugme}>Dene</button>
          </form>
          {props.onizleme && (
            <div data-on-buro-onizleme={props.onizleme.tur} style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ color: CHROME_RENK.muted }}>{ONIZLEME_BASLIGI[props.onizleme.tur] || ''}</div>
              {props.onizleme.yanit && <p style={{ margin: '6px 0 0', padding: '10px 12px', borderRadius: 10, background: CHROME_RENK.cream, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{props.onizleme.yanit}</p>}
              {props.onizleme.alanlar.length > 0 && (
                <div style={{ ...kucuk, marginTop: 6 }}>Kaynak: {props.onizleme.alanlar.map((a) => (a.startsWith('sss.') ? 'Sık sorulanlar' : props.etiketler?.[a] || a)).join(', ')}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OnBuroKarti() {
  const [ayar, setAyar] = useState<OnBuroAyari>(VARSAYILAN_ON_BURO)
  const [durum, setDurum] = useState<{ yuklendi: boolean; hazir: boolean; duzenleyebilir: boolean; saatler: string; acil: string }>({ yuklendi: false, hazir: false, duzenleyebilir: false, saatler: '', acil: '112' })
  const [mesgul, setMesgul] = useState(false)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [testMetni, setTestMetni] = useState('')
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null)
  const [etiketler, setEtiketler] = useState<Record<string, string>>({})

  const yukle = useCallback(async () => {
    try {
      const r = await waIstek('/api/doktor/iletisim/on-buro')
      const j = r?.ok ? await r.json().catch(() => null) : null
      if (!j) return
      setAyar(j.ayar || VARSAYILAN_ON_BURO)
      setDurum({ yuklendi: true, hazir: !!j.hazir, duzenleyebilir: !!j.duzenleyebilir, saatler: String(j.turetilmisSaatler || ''), acil: String(j.acilNumara || '112') })
    } catch { /* the card simply stays hidden */ }
  }, [])
  useEffect(() => { void yukle() }, [yukle])

  const kaydet = async () => {
    setMesgul(true)
    setMesaj(null)
    try {
      const r = await waIstek('/api/doktor/iletisim/on-buro', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ayar) })
      const j = r ? await r.json().catch(() => ({})) : {}
      if (r?.ok && j.ayar) { setAyar(j.ayar); setMesaj('Kaydedildi.') } else setMesaj(String(j.error || 'Ayar şu an kaydedilemedi.'))
    } catch { setMesaj('Ayar şu an kaydedilemedi.') }
    setMesgul(false)
  }

  const dene = async () => {
    setMesgul(true)
    try {
      const r = await waIstek('/api/doktor/iletisim/on-buro/onizleme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metin: testMetni, ayar }) })
      const j = r ? await r.json().catch(() => null) : null
      if (r?.ok && j?.onizleme) { setOnizleme(j.onizleme); setEtiketler(j.etiketler || {}) } else setOnizleme({ tur: 'sessiz', yanit: String(j?.error || 'Şu an denenemedi.'), alanlar: [], kaynak: null })
    } catch { setOnizleme({ tur: 'sessiz', yanit: 'Şu an denenemedi.', alanlar: [], kaynak: null }) }
    setMesgul(false)
  }

  if (!durum.yuklendi) return null
  return (
    <OnBuroKartiGorunumu
      ayar={ayar} hazir={durum.hazir} duzenleyebilir={durum.duzenleyebilir} turetilmisSaatler={durum.saatler} acilNumara={durum.acil}
      mesgul={mesgul} mesaj={mesaj} onDegis={(a) => { setAyar(a); setMesaj(null) }} onKaydet={() => void kaydet()}
      testMetni={testMetni} onTestMetni={setTestMetni} onTest={() => void dene()} onizleme={onizleme} etiketler={etiketler}
    />
  )
}
