'use client'
/**
 * Görüntü / ses — bu muayeneye bağlı (vault visit_id).
 * İnceleme (onay öncesi) ve hasta Belgeler aynı bileşen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { VAULT_MAX_BYTES } from '@/lib/vault/types'

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

  const ekle = async (dosya: File | null) => {
    if (!dosya || !hastaId) return
    if (dosya.size > VAULT_MAX_BYTES) { setHata('Dosya 4 MB sınırını aşıyor.'); return }
    setYukleniyor(true); setHata(''); setMesaj('')
    try {
      const token = await getAccessTokenAsync()
      if (!token) throw new Error('Oturum bulunamadı.')
      const fd = new FormData()
      fd.append('file', dosya)
      fd.append('patientId', hastaId)
      if (visitId) fd.append('visitId', visitId)
      const audio = dosya.type.startsWith('audio/')
      fd.append('category', audio ? 'Muayene ses kaydı' : 'Muayene görüntüsü')
      const r = await fetch('/api/doktor/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Yüklenemedi')
      setMesaj(`${dosya.name} bu muayeneye eklendi.`)
      await yukleListe()
      onYuklendi?.()
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
          {yukleniyor ? 'Yükleniyor…' : 'Foto / ses ekle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,audio/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => void ekle(e.target.files?.[0] || null)}
        />
        {!visitId && <span style={{ fontSize: 11, color: '#94A3B8' }}>Muayene kaydı yok — belge hasta dosyasına gider.</span>}
      </div>
      {ekler.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: '#CBD5E1' }}>
          {ekler.map((e) => (
            <li key={e.id}>{e.fileName}{e.category ? ` · ${e.category}` : ''}</li>
          ))}
        </ul>
      )}
      {mesaj && <div style={{ fontSize: 11, color: '#0F9B8E', marginTop: 4 }}>{mesaj}</div>}
      {hata && <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{hata}</div>}
    </div>
  )
}
