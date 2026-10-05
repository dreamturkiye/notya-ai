'use client'
/**
 * KONSULTASYONLAR-01/02 — hekimin güvendiği konsültan defteri.
 * Ofis + cep telefonu, genel notlar (hekim ve sekreter görür). Ekle · Düzenle · Sil.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAracStil } from '@/lib/doktor/aracUi'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { konsultasyonApi } from '@/lib/doktor/konsultasyonIstemci'
import { DEFTER_SINIRLARI } from '@/lib/doktor/konsultasyonDefter'

export type DefterKayit = {
  id: string
  adSoyad: string
  brans: string
  bransAnahtar: string
  telefon: string | null
  ofisTelefon: string | null
  adres: string | null
  eposta: string | null
  whatsapp: string | null
  kurumIci: boolean
  not: string | null
}

type Form = {
  adSoyad: string
  brans: string
  ofisTelefon: string
  telefon: string
  adres: string
  eposta: string
  whatsapp: string
  kurumIci: boolean
  not: string
}

type MetinAlani = 'adSoyad' | 'ofisTelefon' | 'telefon' | 'whatsapp' | 'eposta' | 'adres'

const bos = (): Form => ({
  adSoyad: '',
  brans: 'kulak-burun-bogaz',
  ofisTelefon: '',
  telefon: '',
  adres: '',
  eposta: '',
  whatsapp: '',
  kurumIci: false,
  not: '',
})

function kayittanForm(k: DefterKayit): Form {
  return {
    adSoyad: k.adSoyad || '',
    brans: k.bransAnahtar || k.brans || 'kulak-burun-bogaz',
    ofisTelefon: k.ofisTelefon || '',
    telefon: k.telefon || '',
    adres: k.adres || '',
    eposta: k.eposta || '',
    whatsapp: k.whatsapp || '',
    kurumIci: !!k.kurumIci,
    not: k.not || '',
  }
}

/** Kart sunumu — SSR testleri için ayrı. */
export function DefterKayitKarti({
  k,
  duzenleniyor = false,
  onDuzenle,
  onSil,
}: {
  k: DefterKayit
  duzenleniyor?: boolean
  onDuzenle?: () => void
  onSil?: () => void
}) {
  const stil = useAracStil()
  return (
    <div
      style={{
        ...stil.kutu,
        marginBottom: 10,
        ...(duzenleniyor ? { borderColor: 'rgba(47,67,52,0.45)', boxShadow: '0 0 0 1px rgba(47,67,52,0.2)' } : {}),
      }}
      data-defter-kayit={k.id}
      data-duzenleniyor={duzenleniyor ? '1' : undefined}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontWeight: 700, color: CHROME_RENK.ink }}>{k.adSoyad}</span>
        <span style={stil.kucuk}>{k.brans}</span>
        {k.kurumIci ? <span style={stil.kucuk}>· kurum içi</span> : <span style={stil.kucuk}>· dışarı</span>}
        {duzenleniyor ? <span style={{ ...stil.kucuk, color: CHROME_RENK.pine, fontWeight: 600 }}>· düzenleniyor</span> : null}
      </div>
      <div style={{ ...stil.kucuk, marginTop: 6, lineHeight: 1.5 }}>
        {[
          k.ofisTelefon && `Ofis: ${k.ofisTelefon}`,
          k.telefon && `Cep: ${k.telefon}`,
          k.whatsapp && `WA: ${k.whatsapp}`,
          k.eposta,
          k.adres,
        ].filter(Boolean).join(' · ') || 'İletişim bilgisi yok'}
      </div>
      {k.not ? (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(47,67,52,0.06)',
            fontSize: 13.5,
            lineHeight: 1.45,
            color: CHROME_RENK.ink,
            whiteSpace: 'pre-wrap',
          }}
        >
          {k.not}
        </div>
      ) : null}
      <div style={{ ...stil.satir, marginTop: 8 }}>
        <button type="button" onClick={onDuzenle} disabled={!onDuzenle || duzenleniyor} style={stil.ghost}>
          Düzenle
        </button>
        <button
          type="button"
          onClick={onSil}
          disabled={!onSil}
          style={{ ...stil.ghost, color: 'var(--warn, #7a4a22)', borderColor: 'rgba(122,74,34,0.35)' }}
        >
          Sil
        </button>
      </div>
    </div>
  )
}

export default function KonsultasyonDefter() {
  const stil = useAracStil()
  const [liste, setListe] = useState<DefterKayit[] | null>(null)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<Form>(bos())
  const [duzenleId, setDuzenleId] = useState<string | null>(null)
  const [alanHata, setAlanHata] = useState<Record<string, string>>({})
  const [kaydediyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  const yukle = useCallback(() => {
    konsultasyonApi('/api/doktor/konsultasyon/defter').then(({ ok, j }) => {
      if (!ok) { setHata(j.error || 'Defter yüklenemedi.'); return }
      setListe(Array.isArray(j.defter) ? j.defter : [])
      if (j.tabloHazir === false) setHata('Defter henüz hazır değil — kısa süre içinde açılacak.')
    }).catch(() => setHata('Defter yüklenemedi — bağlantıyı kontrol edin.'))
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const duzenlemeyiIptal = () => {
    setDuzenleId(null)
    setForm(bos())
    setAlanHata({})
    setMesaj('')
  }

  const duzenleBaslat = (k: DefterKayit) => {
    setDuzenleId(k.id)
    setForm(kayittanForm(k))
    setAlanHata({})
    setMesaj('')
    formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const kaydet = async () => {
    if (kaydediyor) return
    setAlanHata({})
    setMesaj('')
    setKaydediliyor(true)
    const { ok, j } = await konsultasyonApi('/api/doktor/konsultasyon/defter', {
      method: duzenleId ? 'PATCH' : 'POST',
      govde: duzenleId ? { id: duzenleId, ...form } : form,
    })
    setKaydediliyor(false)
    if (!ok) {
      const m = j.error || 'Kaydedilemedi.'
      if (/ad/i.test(m)) setAlanHata({ adSoyad: m })
      else if (/branş|brans/i.test(m)) setAlanHata({ brans: m })
      else if (/e-posta|eposta/i.test(m)) setAlanHata({ eposta: m })
      else setMesaj(m)
      return
    }
    const kayit = j.kayit as DefterKayit | undefined
    if (duzenleId) {
      setMesaj('Konsültan güncellendi.')
      if (kayit) {
        setListe((l) => (l
          ? l.map((x) => (x.id === duzenleId ? kayit : x)).sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr'))
          : l))
      } else yukle()
      setDuzenleId(null)
      setForm(bos())
    } else {
      setForm(bos())
      setMesaj('Konsültan deftere eklendi.')
      if (kayit) setListe((l) => [...(l || []), kayit].sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr')))
      else yukle()
    }
  }

  const sil = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Bu konsültan defterden silinsin mi?')) return
    const { ok, j } = await konsultasyonApi(`/api/doktor/konsultasyon/defter?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!ok) { setMesaj(j.error || 'Silinemedi.'); return }
    if (duzenleId === id) duzenlemeyiIptal()
    setListe((l) => (l ? l.filter((x) => x.id !== id) : l))
    setMesaj('Konsültan silindi.')
  }

  const alan = (key: MetinAlani, label: string, opts?: { type?: string; max?: number; placeholder?: string }) => {
    const hataMetni = alanHata[key]
    return (
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ ...stil.kucuk, display: 'block', marginBottom: 4 }}>{label}</span>
        <input
          type={opts?.type || 'text'}
          value={form[key]}
          maxLength={opts?.max}
          placeholder={opts?.placeholder}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          style={stil.input}
          aria-label={label}
        />
        {hataMetni ? <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 4 }}>{hataMetni}</div> : null}
      </label>
    )
  }


  return (
    <div data-konsultasyon-defter="">
      <p style={{ ...stil.metin, marginBottom: 14, color: CHROME_RENK.muted }}>
        Güvendiğiniz konsültanlar — bu pratiğin defteri. İletişim bilgilerini ekleyin, düzenleyin veya silin; hekim ve sekreter aynı listeyi görür.
      </p>

      <div ref={formRef} style={{ ...stil.kutu, marginBottom: 16, scrollMarginTop: 72 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 560, color: CHROME_RENK.ink, marginBottom: 12 }}>
          {duzenleId ? 'Konsültanı düzenle' : 'Konsültan ekle'}
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
        {alan('ofisTelefon', 'Ofis telefonu', { max: DEFTER_SINIRLARI.ofisTelefon, placeholder: '0216 123 45 67' })}
        {alan('telefon', 'Cep telefonu', { max: DEFTER_SINIRLARI.telefon, placeholder: '0532 123 45 67' })}
        {alan('whatsapp', 'WhatsApp', { max: DEFTER_SINIRLARI.whatsapp, placeholder: '0532 123 45 67' })}
        {alan('eposta', 'E-posta', { type: 'email', max: DEFTER_SINIRLARI.eposta, placeholder: 'ad@ornek.com' })}
        {alan('adres', 'Adres', { max: DEFTER_SINIRLARI.adres })}

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ ...stil.kucuk, display: 'block', marginBottom: 4 }}>Genel notlar</span>
          <div style={{ fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.45, marginBottom: 6 }}>
            Hekim ve sekreter görür — ör. Cumartesi çalışmaz; hafta içi ofis 09:00–16:00.
          </div>
          <textarea
            value={form.not}
            maxLength={DEFTER_SINIRLARI.not}
            rows={5}
            placeholder={'Cumartesi çalışmaz.\nHafta içi ofis 09:00–16:00.\nRapor için önceki gün arayın.'}
            onChange={(e) => setForm((f) => ({ ...f, not: e.target.value }))}
            style={{ ...stil.input, resize: 'vertical', minHeight: 110, lineHeight: 1.45, fontFamily: CHROME_FONT.sans }}
            aria-label="Genel notlar"
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, color: CHROME_RENK.ink }}>
          <input type="checkbox" checked={form.kurumIci} onChange={(e) => setForm((f) => ({ ...f, kurumIci: e.target.checked }))} />
          Kurum içi
        </label>
        <div style={stil.satir}>
          <button type="button" onClick={kaydet} disabled={kaydediyor} style={stil.btn}>
            {kaydediyor ? 'Kaydediliyor…' : (duzenleId ? 'Değişiklikleri kaydet' : 'Deftere ekle')}
          </button>
          {duzenleId && (
            <button type="button" onClick={duzenlemeyiIptal} disabled={kaydediyor} style={stil.ghost}>
              Vazgeç
            </button>
          )}
        </div>
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
        <DefterKayitKarti
          key={k.id}
          k={k}
          duzenleniyor={duzenleId === k.id}
          onDuzenle={() => duzenleBaslat(k)}
          onSil={() => void sil(k.id)}
        />
      ))}
    </div>
  )
}
