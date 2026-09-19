'use client'
/**
 * KONSULTASYON-01 — Kasa (belge yükleme) › "Bu bir konsültasyon yanıtı mı?" (İSTEĞE BAĞLI).
 *
 * Hekim konsültan raporunu kasaya yüklerken hastanın açık konsültasyonlarından birini seçer; yükleme başarılı olunca
 * belgenin id'si o konsültasyonun `belge_id`'sine bağlanır (KANIT). Hekim yanıt özetini (kendi cümlesi) burada da
 * yazabilir — yazarsa konsültasyon "yanıtlandı" olur; yazmazsa rapor bağlanır, özet hasta dosyasında beklenir.
 * Bağlama mevcut uçla yapılır: PATCH /api/doktor/konsultasyon (belge + konsültasyon + hasta sahipliği sunucuda).
 */
import React, { useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsInput, toolsLabel } from '@/lib/doktor/toolsUi'
import { durumGrubu, hedefEtiketi, trGun, KONSULTASYON_SINIRLARI, type KonsultasyonSatiri } from '@/lib/doktor/konsultasyon'

export type KasaKonsultasyonSecimi = { acik: boolean; id: string; ozet: string }
export const BOS_KONSULTASYON_SECIMI: KasaKonsultasyonSecimi = { acik: false, id: '', ozet: '' }

/** Yükleme sonrası: seçili konsültasyona belgeyi bağla (özet varsa yanıtla). Hata metni ya da null döner. */
export async function konsultasyonaBagla(secim: KasaKonsultasyonSecimi, belgeId: string): Promise<{ hata: string | null; yanitlandi: boolean }> {
  if (!secim.acik || !secim.id || !belgeId) return { hata: null, yanitlandi: false }
  const ozet = secim.ozet.trim()
  const t = await getAccessTokenAsync()
  const r = await fetch('/api/doktor/konsultasyon', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ozet ? { id: secim.id, islem: 'yanit', belgeId, yanitOzeti: ozet } : { id: secim.id, islem: 'belge_bagla', belgeId }),
  })
  const j = (await r.json().catch(() => ({}))) as { error?: string }
  return r.ok ? { hata: null, yanitlandi: !!ozet } : { hata: j.error || 'Belge konsültasyona bağlanamadı.', yanitlandi: false }
}

export default function KasaKonsultasyonBaglantisi({ hastaId, secim, setSecim }: {
  hastaId: string
  secim: KasaKonsultasyonSecimi
  setSecim: (s: KasaKonsultasyonSecimi) => void
}) {
  const [liste, setListe] = useState<Array<KonsultasyonSatiri & { hedefEtiketi?: string }> | null>(null)

  useEffect(() => {
    setListe(null)
    if (!hastaId) return
    let iptal = false
    ;(async () => {
      try {
        const t = await getAccessTokenAsync()
        const r = await fetch(`/api/doktor/konsultasyon?patientId=${encodeURIComponent(hastaId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        const j = (await r.json().catch(() => ({}))) as { konsultasyonlar?: KonsultasyonSatiri[] }
        // Rapor bekleyenler: yanıt bekleyen ya da yanıtsız kapatılmış (geç rapor) ya da raporu henüz bağlanmamış yanıtlı kayıt
        const uygun = (j.konsultasyonlar || []).filter((k) => durumGrubu(k.durum) !== 'yanitlandi' || !k.belge_id)
        if (!iptal) setListe(uygun)
      } catch { if (!iptal) setListe([]) }
    })()
    return () => { iptal = true }
  }, [hastaId])

  // ?konsultasyon=<id> derin bağlantısı (hasta dosyası › Konsültasyonlar › "kasaya yükleyin")
  useEffect(() => {
    if (!liste?.length || secim.id) return
    try {
      const q = new URLSearchParams(window.location.search).get('konsultasyon')
      if (q && liste.some((k) => k.id === q)) setSecim({ ...secim, acik: true, id: q })
    } catch { /* yok say */ }
  }, [liste]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hastaId || !liste || !liste.length) return null

  return (
    <div style={{ marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px' }}>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 44, cursor: 'pointer', color: '#E2E8F0', fontSize: 14 }}>
        <input type="checkbox" checked={secim.acik} onChange={(e) => setSecim({ ...secim, acik: e.target.checked })} style={{ width: 20, height: 20, flex: 'none' }} />
        <span>Bu bir konsültasyon yanıtı mı? <span style={{ color: '#94A3B8', fontSize: 12 }}>(isteğe bağlı)</span></span>
      </label>
      {secim.acik && (
        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          <div>
            <label style={toolsLabel} htmlFor="belge-konsultasyon">Hangi konsültasyon?</label>
            <select id="belge-konsultasyon" value={secim.id} onChange={(e) => setSecim({ ...secim, id: e.target.value })} style={{ ...toolsInput, width: '100%', boxSizing: 'border-box' }}>
              <option value="" style={{ background: '#0A1628', color: '#fff' }}>Konsültasyon seçin</option>
              {liste.map((k) => (
                <option key={k.id} value={k.id} style={{ background: '#0A1628', color: '#fff' }}>
                  {(k.hedefEtiketi || hedefEtiketi(k))} · {trGun(k.istem_tarihi || k.created_at)} · {String(k.klinik_soru || k.not_metni || '').slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={toolsLabel} htmlFor="belge-konsultasyon-ozet">Yanıt özeti — kendi cümleniz (isteğe bağlı)</label>
            <textarea id="belge-konsultasyon-ozet" value={secim.ozet} onChange={(e) => setSecim({ ...secim, ozet: e.target.value })} maxLength={KONSULTASYON_SINIRLARI.yanitOzeti} rows={2}
              placeholder="Ör. İşitme kaybı saptanmadı." style={{ ...toolsInput, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>Yazarsanız konsültasyon “yanıtlandı” olur. Boş bırakırsanız rapor bağlanır; özeti hasta dosyası › Konsültasyonlar'dan yazarsınız. Notya tanı iddia etmez.</div>
          </div>
        </div>
      )}
    </div>
  )
}
