'use client'
/**
 * KONSULTASYONLAR-01 — hekimin güvendiği konsültan defteri.
 * Branş, ad soyad, telefon, adres, e-posta, WhatsApp, kurum içi/dışı. Hekime özel.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { useAracStil } from '@/lib/doktor/aracUi'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { konsultasyonApi } from '@/lib/doktor/konsultasyonIstemci'
import { DEFTER_SINIRLARI } from '@/lib/doktor/konsultasyonDefter'

type Kayit = {
  id: string
  adSoyad: string
  brans: string
  bransAnahtar: string
  telefon: string | null
  adres: string | null
  eposta: string | null
  whatsapp: string | null
  kurumIci: boolean
  not: string | null
}

const bos = () => ({
  adSoyad: '',
  brans: 'kulak-burun-bogaz',
  telefon: '',
  adres: '',
  eposta: '',
  whatsapp: '',
  kurumIci: false,
  not: '',
})

export default function KonsultasyonDefter() {
  const stil = useAracStil()
  const [liste, setListe] = useState<Kayit[] | null>(null)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState(bos())
  const [alanHata, setAlanHata] = useState<Record<string, string>>({})
  const [kaydediyor, setKaydediyor] = useState(false)
  const [mesaj, setMesaj] = useState('')

  const yukle = useCallback(() => {
    konsultasyonApi('/api/doktor/konsultasyon/defter').then(({ ok, j }) => {
      if (!ok) { setHata(j.error || 'Defter yüklenemedi.'); return }
      setListe(Array.isArray(j.defter) ? j.defter : [])
      if (j.tabloHazir === false) setHata('Defter henüz hazır değil — kısa süre içinde açılacak.')
    }).catch(() => setHata('Defter yüklenemedi — bağlantıyı kontrol edin.'))
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const kaydet = async () => {
    if (kaydediyor) return
    setAlanHata({})
    setMesaj('')
    setKaydediyor(true)
    const { ok, j } = await konsultasyonApi('/api/doktor/konsultasyon/defter', {
      method: 'POST',
      govde: form,
    })
    setKaydediyor(false)
    if (!ok) {
      const m = j.error || 'Kaydedilemedi.'
      if (/ad/i.test(m)) setAlanHata({ adSoyad: m })
      else if (/branş|brans/i.test(m)) setAlanHata({ brans: m })
      else if (/e-posta|eposta/i.test(m)) setAlanHata({ eposta: m })
      else setMesaj(m)
      return
    }
    setForm(bos())
    setMesaj('Konsültan deftere eklendi.')
    if (j.kayit) setListe((l) => [...(l || []), j.kayit as Kayit].sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr')))
    else yukle()
  }

  const sil = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Bu konsültan defterden silinsin mi?')) return
    const { ok, j } = await konsultasyonApi(`/api/doktor/konsultasyon/defter?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!ok) { setMesaj(j.error || 'Silinemedi.'); return }
    setListe((l) => (l ? l.filter((x) => x.id !== id) : l))
  }

  const alan = (key: keyof ReturnType<typeof bos>, label: string, opts?: { type?: string; max?: number; placeholder?: string }) => (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ ...stil.kucuk, display: 'block', marginBottom: 4 }}>{label}</span>
      <input
        type={opts?.type || 'text'}
        value={form[key] as string}
        maxLength={opts?.max}
        placeholder={opts?.placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        style={stil.input}
        aria-label={label}
      />
      {alanHata[key] && <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 4 }}>{alanHata[key]}</div>}
    </label>
  )

  return (
    <div data-konsultasyon-defter="">
      <p style={{ ...stil.metin, marginBottom: 14, color: CHROME_RENK.muted }}>
        Güvendiğiniz konsültanlar — yalnız sizin defteriniz. Başka hekim görmez.
      </p>

      <div style={{ ...stil.kutu, marginBottom: 16 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 560, color: CHROME_RENK.ink, marginBottom: 12 }}>
          Konsültan ekle
        </div>
        {alan('adSoyad', 'Ad soyad', { max: DEFTER_SINIRLARI.adSoyad, placeholder: 'Ör. Dr. Ayşe Yılmaz' })}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ ...stil.kucuk, display: 'block', marginBottom: 4 }}>Branş</span>
          <select
            value={form.brans}
            onChange={(e) => setForm((f) => ({ ...f, brans: e.target.value }))}
            style={stil.input}
            aria-label="Branş"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          {alanHata.brans && <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 4 }}>{alanHata.brans}</div>}
        </label>
        {alan('telefon', 'Telefon', { max: DEFTER_SINIRLARI.telefon, placeholder: '05xx…' })}
        {alan('whatsapp', 'WhatsApp', { max: DEFTER_SINIRLARI.whatsapp })}
        {alan('eposta', 'E-posta', { type: 'email', max: DEFTER_SINIRLARI.eposta, placeholder: 'ad@ornek.com' })}
        {alan('adres', 'Adres', { max: DEFTER_SINIRLARI.adres })}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, color: CHROME_RENK.ink }}>
          <input type="checkbox" checked={form.kurumIci} onChange={(e) => setForm((f) => ({ ...f, kurumIci: e.target.checked }))} />
          Kurum içi
        </label>
        <button type="button" onClick={kaydet} disabled={kaydediyor} style={stil.btn}>
          {kaydediyor ? 'Kaydediliyor…' : 'Deftere ekle'}
        </button>
        {mesaj && <div style={{ fontSize: 13, marginTop: 10, color: CHROME_RENK.pine }} aria-live="polite">{mesaj}</div>}
      </div>

      {hata && <div style={{ ...stil.kutu, ...stil.hata }}>{hata}</div>}
      {liste == null && !hata && <div style={stil.kucuk}>Yükleniyor…</div>}
      {liste && !liste.length && !hata && (
        <div style={{ ...stil.kutu, color: CHROME_RENK.muted, fontSize: 14 }}>
          Defteriniz boş. Örneğin bir KBB hekimi ekleyerek başlayın — istemde hedef olarak seçersiniz.
        </div>
      )}
      {liste && liste.map((k) => (
        <div key={k.id} style={{ ...stil.kutu, marginBottom: 10 }} data-defter-kayit={k.id}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{k.adSoyad}</span>
            <span style={stil.kucuk}>{k.brans}</span>
            {k.kurumIci ? <span style={stil.kucuk}>· kurum içi</span> : <span style={stil.kucuk}>· dışarı</span>}
          </div>
          <div style={{ ...stil.kucuk, marginTop: 6, lineHeight: 1.5 }}>
            {[k.telefon && `Tel: ${k.telefon}`, k.whatsapp && `WA: ${k.whatsapp}`, k.eposta, k.adres].filter(Boolean).join(' · ')}
          </div>
          <button type="button" onClick={() => sil(k.id)} style={{ ...stil.ghost, marginTop: 8 }}>Sil</button>
        </div>
      ))}
    </div>
  )
}
