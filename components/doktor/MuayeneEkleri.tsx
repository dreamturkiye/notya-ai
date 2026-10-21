'use client'
/**
 * Görüntü / ses — bu muayeneye bağlı (vault visit_id).
 * İnceleme (onay öncesi) ve hasta Belgeler aynı bileşen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { VAULT_MAX_BYTES } from '@/lib/vault/types'
import { belgeleriOtomatikIsle } from '@/core/belgeler/otoIstemci'
import { sinirliHavuz, type BelgeAsama } from '@/core/belgeler/otoBatch'
import { deIdMetin } from '@/core/belgeler/deidMetin'

type Ek = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  createdAt: string
}

const btn: React.CSSProperties = {
  background: 'rgba(15,155,142,0.14)',
  border: '1px solid rgba(15,155,142,0.45)',
  color: '#0F9B8E',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

export default function MuayeneEkleri({
  hastaId,
  visitId,
  kompakt = false,
  onYuklendi,
}: {
  hastaId: string | null
  visitId: string | null
  kompakt?: boolean
  onYuklendi?: () => void
}) {
  const [ekler, setEkler] = useState<Ek[]>([])
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const yukleListe = useCallback(async () => {
    if (!hastaId) { setEkler([]); return }
    const token = await getAccessTokenAsync()
    if (!token) return
    const q = visitId
      ? `patientId=${encodeURIComponent(hastaId)}&visitId=${encodeURIComponent(visitId)}`
      : `patientId=${encodeURIComponent(hastaId)}`
    const r = await fetch(`/api/doktor/documents?${q}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return
    const j = await r.json()
    const docs = (j.documents || []) as Ek[]
    setEkler(visitId ? docs.filter((d) => true) : docs)
  }, [hastaId, visitId])

  useEffect(() => { void yukleListe() }, [yukleListe])

  // NOTYA-BELGE-OTO-01: batch-first. N files -> upload (3 at a time) -> mask (outbound copy only) -> evaluate -> ONE note write.
  const [satirlar, setSatirlar] = useState<{ id: string; ad: string; asama: BelgeAsama | 'yuklendi'; not?: string }[]>([])
  const deMetin = deIdMetin(process.env.NOTYA_COUNTRY)
  const ASAMA_ETIKET: Record<string, string> = { bekliyor: 'Sırada', yukleniyor: 'Yükleniyor', yuklendi: 'Yüklendi', maskeleniyor: 'Kimlik taranıyor', degerlendiriliyor: 'Değerlendiriliyor', nota_eklendi: 'Nota eklendi', atlandi: 'Otomatik değerlendirilmedi', hata: 'Hata' }

  const ekle = async (dosyalar: File[]) => {
    const liste = dosyalar.filter(Boolean).slice(0, 12)
    if (!liste.length || !hastaId) return
    const buyuk = liste.filter((d) => d.size > VAULT_MAX_BYTES)
    if (buyuk.length) setHata(`${buyuk.length} dosya 4 MB sınırını aşıyor.`); else setHata('')
    const uygun = liste.filter((d) => d.size <= VAULT_MAX_BYTES)
    setYukleniyor(true); setMesaj('')
    const yuklenen: { belgeId: string; ad: string; dosya: Blob }[] = []
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı.')
      const satirGuncelle = (id: string, asama: BelgeAsama | 'yuklendi', not?: string) => setSatirlar((l) => l.map((x) => (x.id === id ? { ...x, asama, not } : x)))
      const gecici = uygun.map((d, i) => ({ id: `t${Date.now()}_${i}`, ad: d.name, asama: 'bekliyor' as const }))
      setSatirlar(gecici)
      await sinirliHavuz(uygun.map((dosya, i) => async () => {
        const gid = gecici[i].id
        satirGuncelle(gid, 'yukleniyor')
        try {
          const fd = new FormData()
          fd.append('file', dosya); fd.append('patientId', hastaId)
          if (visitId) fd.append('visitId', visitId)
          fd.append('category', dosya.type.startsWith('audio/') ? 'Muayene ses kaydı' : 'Muayene görüntüsü')
          const r = await fetch('/api/doktor/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
          const j = await r.json().catch(() => ({}))
          if (!r.ok || !j?.document?.id) { satirGuncelle(gid, 'hata', j?.error || 'Yüklenemedi'); return }
          yuklenen.push({ belgeId: String(j.document.id), ad: dosya.name, dosya })
          setSatirlar((l) => l.map((x) => (x.id === gid ? { ...x, id: String(j.document.id), asama: 'yuklendi' } : x)))
        } catch { satirGuncelle(gid, 'hata', 'Yüklenemedi') }
      }), 3)
      await yukleListe()
      onYuklendi?.()
      const gorseller = yuklenen.filter((y) => y.dosya.type.startsWith('image/'))
      if (visitId && gorseller.length) {
        const sonuc = await belgeleriOtomatikIsle(gorseller, { token, onDurum: satirGuncelle })
        const g = sonuc.genel
        setMesaj(`${g.eklenen}/${g.toplam} belge muayene notuna eklendi${g.atlanan ? `; ${g.atlanan} belge: ${deMetin.atlandi}` : ''}${g.hatali ? `; ${g.hatali} hata` : ''}.`)
      } else {
        setMesaj(`${yuklenen.length} belge bu muayeneye eklendi.`)
      }
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally {
      setYukleniyor(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!hastaId) return null

  return (
    <div style={{ marginTop: kompakt ? 6 : 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E' }}>
          Bu muayenenin görüntü / sesi
        </span>
        <button type="button" style={btn} disabled={!visitId || yukleniyor} onClick={() => inputRef.current?.click()}>
          {yukleniyor ? 'İşleniyor…' : 'Belge / foto / ses ekle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => void ekle(Array.from(e.target.files || []))}
        />
        {!visitId && <span style={{ fontSize: 11, color: '#8b7d70' }}>Muayene kaydı yok — belge hasta dosyasına gider.</span>}
      </div>
      {satirlar.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: '#8b7d70' }}>
          {satirlar.map((x) => (<li key={x.id}>{x.ad} — {ASAMA_ETIKET[x.asama] || x.asama}{x.not ? ` (${x.not})` : ''}</li>))}
        </ul>
      )}
      {ekler.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: '#8b7d70' }}>
          {ekler.map((e) => (
            <li key={e.id}>{e.fileName}{e.category ? ` · ${e.category}` : ''}</li>
          ))}
        </ul>
      )}
      {mesaj && <div style={{ fontSize: 11, color: '#0F9B8E', marginTop: 4 }}>{mesaj}</div>}
      {hata && <div style={{ fontSize: 11, color: '#B42318', marginTop: 4 }}>{hata}</div>}
    </div>
  )
}
