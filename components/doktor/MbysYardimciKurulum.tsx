'use client'
/**
 * MBYS-YARDIMCI-02 — on the MBYS queue page, for doctors only: download the helper ("Yardımcıyı indir"), a short Chrome
 * install guide, the "field map is still being verified" note, and the first-run form-map capture with
 * "Haritayı kopyala" (lib/enabiz/mbys/haritaMesaji.ts).
 *
 * The app shows no Notya support address, so the copied map is sent through whatever channel the doctor already uses
 * with the Notya team (the device share sheet is offered when the browser has one). No contact is invented here.
 */
import { useState, type CSSProperties } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { toolsCard, toolsInput, toolsLabel, toolsPrimaryBtn } from '@/lib/doktor/toolsUi'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { HARITA_EKRANLARI, haritaMesaji, type HaritaEkrani } from '@/lib/enabiz/mbys/haritaMesaji'
import manifest from '@/extensions/mbys-yardimci/manifest.json'

const INDIR = '/api/doktor/araclar/enabiz/mbys/yardimci'
const SURUM = String((manifest as { version?: string }).version || '')

const ikincilBtn: CSSProperties = { ...toolsPrimaryBtn(false), width: 'auto', padding: '8px 12px', background: '#fff', color: CHROME_RENK.pine, border: `1px solid ${CHROME_RENK.pine}` }
const kod: CSSProperties = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, background: CHROME_RENK.cream, borderRadius: 6, padding: '1px 5px' }
const liste: CSSProperties = { margin: '6px 0 0', paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: CHROME_RENK.ink }

async function panoyaYaz(metin: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(metin); return true } catch {
    try {
      const t = document.createElement('textarea')
      t.value = metin
      document.body.append(t)
      t.select()
      const ok = document.execCommand('copy')
      t.remove()
      return ok
    } catch { return false }
  }
}

export default function MbysYardimciKurulum({ acikBaslat }: { acikBaslat: boolean }) {
  const [acik, setAcik] = useState(acikBaslat)
  const [indiriliyor, setIndiriliyor] = useState(false)
  const [indirmeHata, setIndirmeHata] = useState('')
  const [harita, setHarita] = useState<Record<HaritaEkrani, string>>({ hastaKayit: '', muayene: '' })
  const [haritaDurum, setHaritaDurum] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)
  const [hazirMetin, setHazirMetin] = useState('')

  const indir = async () => {
    if (indiriliyor) return
    setIndiriliyor(true); setIndirmeHata('')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch(INDIR, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      if (!r.ok) {
        const j = await r.json().catch(() => null) as { error?: string } | null
        throw new Error(j?.error || 'Yardımcı indirilemedi.')
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notya-mbys-yardimci${SURUM ? `-${SURUM}` : ''}.zip`
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      setIndirmeHata(e instanceof Error ? e.message : 'Yardımcı indirilemedi.')
    } finally {
      setIndiriliyor(false)
    }
  }

  const haritayiKopyala = async () => {
    const s = haritaMesaji(harita, { yardimciSurumu: SURUM })
    if (!s.ok) { setHazirMetin(''); setHaritaDurum({ tur: 'hata', metin: s.hata }); return }
    setHazirMetin(s.metin)
    const ok = await panoyaYaz(s.metin)
    setHaritaDurum(ok
      ? { tur: 'ok', metin: `Harita panoya kopyalandı${s.eksik.length ? ' (bir ekran eksik; diğerini de ekleyip yeniden kopyalayabilirsiniz)' : ''}. Notya ekibine, bizimle yazıştığınız e-posta ya da WhatsApp üzerinden yapıştırıp gönderin.` }
      : { tur: 'hata', metin: 'Panoya kopyalanamadı. Sayfaya bir kez tıklayıp yeniden deneyin.' })
  }

  const paylasilabilir = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const paylas = async () => {
    if (!hazirMetin) return
    try { await navigator.share({ title: 'Notya MBYS form haritası', text: hazirMetin }) } catch { /* the doctor closed the sheet */ }
  }

  return (
    <div style={{ ...toolsCard, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.pine }}>MBYS Yardımcısı kurulumu{SURUM ? <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}> · sürüm {SURUM}</span> : null}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{ ...toolsPrimaryBtn(indiriliyor), width: 'auto', padding: '8px 14px' }} disabled={indiriliyor} onClick={() => void indir()}>
            {indiriliyor ? 'İndiriliyor…' : 'Yardımcıyı indir'}
          </button>
          <button type="button" style={ikincilBtn} onClick={() => setAcik((v) => !v)}>{acik ? 'Kurulumu gizle' : 'Nasıl kurulur?'}</button>
        </div>
      </div>
      {indirmeHata && <div style={{ marginTop: 8, fontSize: 13, color: CHROME_RENK.warn }}>{indirmeHata}</div>}

      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: CHROME_RENK.ink, background: CHROME_RENK.cream, borderRadius: 10, padding: '10px 12px' }}>
        <b>Alan eşlemesi henüz doğrulanıyor.</b> Yardımcı MBYS ekranlarındaki alanları etiketlerinden bulur; bu eşleme gerçek
        ekranlarda henüz tamamlanmadı. Bulamadığı alanı boş bırakır ve size söyler. Doldurduğu her alanı kaydetmeden önce kontrol edin.
      </div>

      {acik && (
        <>
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink }}>Chrome'a kurulum (bir kez, yaklaşık 2 dakika)</div>
          <ol style={liste}>
            <li><b>Yardımcıyı indir</b>'e basın. İnen zip dosyasını açın; içinden <span style={kod}>mbys-yardimci</span> klasörü çıkar. Klasörü kalıcı bir yere (ör. Belgeler) taşıyın.</li>
            <li>Chrome'un adres çubuğuna <span style={kod}>chrome://extensions</span> yazıp açın.</li>
            <li>Sağ üstteki <b>Geliştirici modu</b> anahtarını açın.</li>
            <li><b>Paketlenmemiş öğe yükle</b>'ye basın ve <span style={kod}>mbys-yardimci</span> klasörünü seçin.</li>
            <li>Bu sayfayı yenileyin. Üstte “MBYS Yardımcısı kurulu.” yazmalı.</li>
          </ol>
          <div style={{ marginTop: 6, fontSize: 12, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
            Klasörü silmeyin; Chrome yardımcıyı oradan çalıştırır. Yeni sürümde: zip'i aynı klasörün üzerine açın ve
            <span style={kod}>chrome://extensions</span> sayfasında yardımcının yenile simgesine basın. Yardımcı MBYS giriş sayfasında hiçbir şey yapmaz;
            MBYS'ye kendiniz giriş yaparsınız.
          </div>

          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink }}>İlk kullanımda: form haritasını gönderin</div>
          <div style={{ marginTop: 4, fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.5 }}>
            Eşlemeyi tamamlamamız için iki MBYS ekranının yapısına ihtiyacımız var. Harita yalnız alan adlarını ve etiketleri içerir;
            yazdığınız hiçbir değer, hasta adı ya da kimlik numarası yoktur.
          </div>
          <ol style={liste}>
            <li>MBYS'de <b>Hasta Kayıt</b> ekranını açın. Hasta yazmadan önce sayfadaki Notya panelinde <b>Form haritasını kopyala</b>'ya basın ve aşağıdaki ilk kutuya yapıştırın.</li>
            <li>Bir hastayı işleme alıp <b>Muayene</b> ekranına geçin. Alanlara bir şey yazmadan yine <b>Form haritasını kopyala</b>'ya basın ve ikinci kutuya yapıştırın.</li>
            <li><b>Haritayı kopyala</b>'ya basın: iki ekran tek mesajda panoya alınır. Metni Notya ekibine, bizimle yazıştığınız e-posta ya da WhatsApp üzerinden gönderin.</li>
          </ol>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 10 }}>
            {HARITA_EKRANLARI.map((e) => (
              <label key={e.anahtar}>
                <span style={toolsLabel}>{e.ad}</span>
                <textarea
                  value={harita[e.anahtar]}
                  onChange={(ev) => { const v = ev.target.value; setHarita((h) => ({ ...h, [e.anahtar]: v })); setHaritaDurum(null); setHazirMetin('') }}
                  placeholder="Form haritasını buraya yapıştırın"
                  rows={4}
                  spellCheck={false}
                  style={{ ...toolsInput, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, resize: 'vertical' }}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
            <button type="button" style={{ ...toolsPrimaryBtn(false), width: 'auto', padding: '8px 14px' }} onClick={() => void haritayiKopyala()}>Haritayı kopyala</button>
            {hazirMetin && paylasilabilir && <button type="button" style={ikincilBtn} onClick={() => void paylas()}>Paylaş</button>}
          </div>
          {haritaDurum && (
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: haritaDurum.tur === 'ok' ? CHROME_RENK.pine : CHROME_RENK.warn }}>{haritaDurum.metin}</div>
          )}
        </>
      )}
    </div>
  )
}
