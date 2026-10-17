'use client'
/**
 * NOTYA-HASTA-ILETISIMI-01 — Ayarlar › İletişim, "SMS (Hasta İletişimi)" card. Doctor-only
 * (backend: sadeceDoktor). NOT Twilio — see lib/iletisim/sms/README.md. Two channels (NETGSM-01):
 *  - Android phone: the doctor installs android-sms-gateway (free, open source) and pastes the address/login.
 *  - NetGSM: for iPhone doctors (an iPhone cannot be a gateway) — the doctor's OWN NetGSM account; the doctor
 *    pays NetGSM, Notya pays nothing. Turkey-only (Turkish provider, Turkish copy); country builds are forks
 *    and do not carry this card (docs/OPEN-COMMITMENTS.md NETGSM-02).
 */
import React, { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK
const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const etiket: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: R.ink, marginBottom: 6 }
const giris: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${R.border}`, color: R.ink, borderRadius: 10, padding: '11px 12px', fontSize: 15, fontFamily: CHROME_FONT.sans }

type Saglayici = 'android_sms_gateway' | 'netgsm'

export default function SmsAyarKarti() {
  const [gorunur, setGorunur] = useState(false)
  const [saglayici, setSaglayici] = useState<Saglayici>('android_sms_gateway')
  const [ngKod, setNgKod] = useState('')
  const [ngSifre, setNgSifre] = useState('')
  const [ngSifreVar, setNgSifreVar] = useState(false)
  const [ngBaslik, setNgBaslik] = useState('')
  const [uyari, setUyari] = useState('')
  const [tabanUrl, setTabanUrl] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreVar, setSifreVar] = useState(false)
  const [aktif, setAktif] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSirri, setWebhookSirri] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')

  const baslik = () => {
    const t = getDoctorAccessToken()
    return t ? { Authorization: `Bearer ${t}` } : undefined
  }

  useEffect(() => {
    void (async () => {
      const h = baslik()
      if (!h) return
      try {
        const r = await fetch('/api/doktor/iletisim/toplu/sms-ayarlari', { headers: h })
        if (r.status === 403) return // sekreter — bu kart hekim-only
        setGorunur(true)
        const d = await r.json()
        if (d?.ayar) {
          setTabanUrl(d.ayar.tabanUrl || ''); setKullaniciAdi(d.ayar.kullaniciAdi || '')
          setAktif(!!d.ayar.aktif); setSifreVar(!!d.ayar.sifreVar)
          setSaglayici(d.ayar.saglayici === 'netgsm' ? 'netgsm' : 'android_sms_gateway')
          setNgKod(d.ayar.netgsm?.kullaniciKodu || ''); setNgBaslik(d.ayar.netgsm?.baslik || ''); setNgSifreVar(!!d.ayar.netgsm?.sifreVar)
        }
      } catch { /* fail soft */ }
    })()
  }, [])

  const kaydet = async (test: boolean) => {
    const h = baslik()
    if (!h) return
    setKaydediliyor(true); setHata(''); setMesaj(''); setUyari('')
    try {
      const r = await fetch('/api/doktor/iletisim/toplu/sms-ayarlari', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ saglayici, tabanUrl, kullaniciAdi, sifre: sifre || null, aktif, test, netgsmKullaniciKodu: ngKod, netgsmSifre: ngSifre || null, netgsmBaslik: ngBaslik }),
      })
      const d = await r.json()
      if (!r.ok) { setHata(d?.error || 'Kaydedilemedi.'); return }
      if (saglayici === 'netgsm') { setNgSifre(''); setNgSifreVar(true) } else { setSifre(''); setSifreVar(true) }
      if (d.webhookUrl) setWebhookUrl(d.webhookUrl)
      if (d.webhookSirriYeni) setWebhookSirri(d.webhookSirriYeni)
      const bt = d.baglantiTest
      if (saglayici === 'netgsm' && test && bt?.ok) {
        const kredi = typeof bt.kredi === 'number' ? ` Kalan krediniz: ${String(bt.kredi).replace('.', ',')}.` : ''
        setMesaj(`Kaydedildi — NetGSM hesabınıza bağlanıldı.${kredi} (Test sırasında SMS gönderilmedi.)`)
        if (bt.uyari) setUyari(bt.uyari)
      } else {
        setMesaj(test ? (bt?.ok ? 'Kaydedildi — bağlantı başarılı.' : `Kaydedildi — bağlantı testi: ${bt?.hata || 'başarısız'}`) : 'Kaydedildi.')
      }
    } catch {
      setHata('Bağlantı hatası.')
    } finally {
      setKaydediliyor(false)
    }
  }

  if (!gorunur) return null

  const secenek = (deger: Saglayici, baslik: string) => {
    const secili = saglayici === deger
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${secili ? R.pine : R.border}`, background: secili ? R.cream : '#FFFFFF', cursor: 'pointer', fontSize: 15, fontWeight: secili ? 700 : 500 }}>
        <input type="radio" name="sms-saglayici" checked={secili} onChange={() => { setSaglayici(deger); setMesaj(''); setHata(''); setUyari('') }} />
        {baslik}
      </label>
    )
  }
  const adim: React.CSSProperties = { marginBottom: 4 }

  return (
    <div style={kutu}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>SMS (Hasta İletişimi — toplu mesaj)</div>
      <div style={{ fontSize: 13.5, color: R.muted, lineHeight: 1.5, marginBottom: 14 }}>
        Toplu SMS’in hangi hattan gideceğini seçin. Hiçbirini bağlamazsanız, toplu gönderimde Notya size SMS listesini
        kopyalayıp telefonunuzdan elle göndermeniz için hazırlar (bu otomatik gönderim değildir).
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {secenek('android_sms_gateway', 'Android telefonum (ücretsiz, kendi hattımdan)')}
        {secenek('netgsm', 'NetGSM hesabım (iPhone kullananlar için)')}
      </div>

      {saglayici === 'android_sms_gateway' ? (
        <>
          <div style={{ fontSize: 13.5, color: R.muted, lineHeight: 1.5, marginBottom: 14 }}>
            SMS, ücretli bir servisten değil, <b>kendi telefon numaranızdan</b> gider. Android telefonunuza ücretsiz, açık kaynak
            <b> android-sms-gateway</b> uygulamasını kurun; uygulamanın gösterdiği adresi, kullanıcı adını ve şifreyi buraya yazın.
          </div>
          <label style={etiket} htmlFor="sms-url">Gateway adresi</label>
          <input id="sms-url" style={giris} placeholder="http://192.168.1.5:8080" value={tabanUrl} onChange={(e) => setTabanUrl(e.target.value)} />
          <div style={{ height: 10 }} />
          <label style={etiket} htmlFor="sms-kullanici">Kullanıcı adı</label>
          <input id="sms-kullanici" style={giris} value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)} />
          <div style={{ height: 10 }} />
          <label style={etiket} htmlFor="sms-sifre">Şifre {sifreVar && <span style={{ color: R.muted, fontWeight: 400 }}>(kayıtlı — değiştirmek için yazın)</span>}</label>
          <input id="sms-sifre" style={giris} type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} />
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: R.ink, lineHeight: 1.55, background: R.cream, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <b>iPhone kullanıyorsanız:</b> iPhone, dışarıdan gelen bir uygulamanın kendi hattınızdan otomatik SMS göndermesine izin vermez.
            Bu yüzden toplu SMS’i iPhone ile gönderemeyiz. <b>Çözüm:</b> bir SMS firmasında (NetGSM) kendi hesabınızı açarsınız; mesajlar bu hesaptan gider.
            SMS ücretini NetGSM’e siz ödersiniz, Notya bir ücret almaz. Notya’nın hesabınıza erişimi yalnızca mesaj göndermek ve kalan kredinizi göstermek içindir.
          </div>
          <div style={{ fontSize: 13.5, color: R.ink, lineHeight: 1.55, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Adım adım</div>
            <div style={adim}>1. NetGSM’de (netgsm.com.tr) kendi hesabınızı açın.</div>
            <div style={adim}>2. Hesabınıza kredi veya SMS paketi yükleyin.</div>
            <div style={adim}>3. Mesaj başlığınızı (gönderici adı) NetGSM’de onaylatın.</div>
            <div style={adim}>4. NetGSM kullanıcı kodunuzu, API şifrenizi ve onaylı başlığınızı aşağıya yapıştırın.</div>
            <div style={adim}>5. “Bağlantıyı test et” düğmesine basın.</div>
          </div>
          <div style={{ fontSize: 13, color: R.muted, lineHeight: 1.5, marginBottom: 14 }}>
            <b>Başlık onayı:</b> gönderici adının NetGSM tarafından onaylanması gerekir ve zaman alabilir; onaylanana kadar mesaj gitmez.
            Hesabınızda API erişiminin açık olması da gerekir (kapalıysa NetGSM müşteri hizmetlerinden isteyin).
            Android telefonunuz varsa yukarıdaki ücretsiz seçeneği de kullanabilirsiniz. İkisini de bağlamazsanız bu ekran yine SMS listesini kopyalamanız için hazırlar.
          </div>

          <label style={etiket} htmlFor="ng-kod">NetGSM kullanıcı kodu</label>
          <input id="ng-kod" style={giris} autoComplete="off" value={ngKod} onChange={(e) => setNgKod(e.target.value)} />
          <div style={{ height: 10 }} />
          <label style={etiket} htmlFor="ng-sifre">NetGSM API şifresi {ngSifreVar && <span style={{ color: R.muted, fontWeight: 400 }}>(kayıtlı — değiştirmek için yazın)</span>}</label>
          <input id="ng-sifre" style={giris} type="password" autoComplete="new-password" value={ngSifre} onChange={(e) => setNgSifre(e.target.value)} />
          <div style={{ height: 10 }} />
          <label style={etiket} htmlFor="ng-baslik">Mesaj başlığı (gönderici adı) — NetGSM’de onaylı olanı aynen yazın</label>
          <input id="ng-baslik" style={giris} autoComplete="off" value={ngBaslik} onChange={(e) => setNgBaslik(e.target.value)} />

          <div style={{ marginTop: 14, fontSize: 13, color: R.ink, background: '#FFF6E5', border: '1px solid #E8C77A', borderRadius: 10, padding: 12, lineHeight: 1.5 }}>
            <b>STOP yanıtları:</b> NetGSM ile giden mesajlarda hastanın “STOP” yanıtı otomatik işlenmez. Bu yüzden mesajın sonuna
            “Bu mesajları almak istemiyorsanız muayenehanemizi arayarak bildirebilirsiniz.” satırı eklenir. Bir hasta bildirirse, hastanın SMS iznini siz kapatın; kapatılan hastalara bir daha SMS gitmez.
            <div style={{ marginTop: 6 }}>
              <b>Yalnızca bilgilendirme:</b> bu ekrandan randevu/aşı hatırlatması gibi bilgilendirme mesajları gönderin. Reklam veya kampanya içerikli mesajlar için ayrıca İYS onayı gerekir; bunları buradan göndermeyin.
            </div>
          </div>
        </>
      )}

      <div style={{ height: 12 }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Etkin
      </label>

      {saglayici === 'android_sms_gateway' && webhookUrl && (
        <div style={{ marginTop: 14, fontSize: 13, color: R.ink, background: R.cream, borderRadius: 10, padding: 12 }}>
          DUR/STOP yanıtlarını işlemek için gateway uygulamasına bu webhook adresini ve gizli anahtarı (header: <code>X-Notya-Webhook-Secret</code>) ekleyin — bir kere gösterilir:
          <div style={{ marginTop: 6, wordBreak: 'break-all' }}><b>URL:</b> {webhookUrl}</div>
          <div style={{ wordBreak: 'break-all' }}><b>Gizli anahtar:</b> {webhookSirri}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {saglayici === 'android_sms_gateway' ? (
          <>
            <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(false)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: 'none', background: R.pine, color: R.paper, fontWeight: 700, cursor: 'pointer' }}>
              {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(true)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: `1.5px solid ${R.pine}`, background: '#FFFFFF', color: R.pine, fontWeight: 700, cursor: 'pointer' }}>
              Kaydet ve bağlantıyı test et
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(false)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: 'none', background: R.pine, color: R.paper, fontWeight: 700, cursor: 'pointer' }}>
              {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" disabled={kaydediliyor} onClick={() => void kaydet(true)} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: `1.5px solid ${R.pine}`, background: '#FFFFFF', color: R.pine, fontWeight: 700, cursor: 'pointer' }}>
              Bağlantıyı test et
            </button>
          </>
        )}
      </div>
      {saglayici === 'netgsm' && <div style={{ fontSize: 12.5, color: R.muted, marginTop: 6 }}>“Bağlantıyı test et” önce bilgileri kaydeder, sonra hesabınızı ve başlığı kontrol eder. Test sırasında hiçbir SMS gönderilmez.</div>}
      {mesaj && <div style={{ color: R.pine, fontSize: 14, marginTop: 10, fontWeight: 600 }}>{mesaj}</div>}
      {uyari && <div style={{ color: R.warn, fontSize: 14, marginTop: 8 }}>{uyari}</div>}
      {hata && <div style={{ color: R.warn, fontSize: 14, marginTop: 10 }}>{hata}</div>}
    </div>
  )
}
