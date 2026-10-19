'use client'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { durumSozcugu } from '@/lib/klinik/telafi'
import { vadeDurumu } from '@/lib/klinik/isoGun'
import { FOTO_ROLLERI, type FotoRol } from '@/specialties/sac-ekimi/engines/fotoDosya'

type Slot = { id: string; rol: FotoRol; islem: string; cekim: string }
type Durum = {
  bitis: string
  ozet: string
  hatirlatma: { iso: string; ad: string } | null
  slotlar: Array<{ id: string; varMi: boolean }>
}

export function SacFotoDosya({ patientId, islemBaslangic = '' }: { patientId: string; islemBaslangic?: string }) {
  const [islem, setIslem] = useState(islemBaslangic)
  const [cekim, setCekim] = useState('')
  const [riza, setRiza] = useState(false)
  const [dosyalar, setDosyalar] = useState<Slot[]>([])
  const [onizleme, setOnizleme] = useState<Record<string, string>>({})
  const [durum, setDurum] = useState<Durum | null>(null)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => { setIslem(islemBaslangic) }, [islemBaslangic])

  useEffect(() => {
    if (!patientId || !/^\d{4}-\d{2}-\d{2}$/.test(islem)) return
    let iptal = false
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t || iptal) return
      await fetch('/api/ozel-brans/foto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, islem }),
      })
    })()
    return () => { iptal = true }
  }, [patientId, islem])

  useEffect(() => {
    if (!patientId || !islem) return
    let iptal = false
    const acilan: string[] = []
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t || iptal) return
      const r = await fetch(`/api/ozel-brans/foto?patientId=${encodeURIComponent(patientId)}&islem=${encodeURIComponent(islem)}`, { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json().catch(() => null)
      if (iptal || !r.ok) return
      const liste = (j.dosyalar || []) as Slot[]
      setDosyalar(liste)
      setDurum(j.durum || null)
      const urls: Record<string, string> = {}
      for (const d of liste) {
        const g = await fetch(`/api/doktor/documents/${d.id}/download`, { headers: { Authorization: `Bearer ${t}` } })
        if (!g.ok) continue
        const url = URL.createObjectURL(await g.blob())
        acilan.push(url)
        urls[d.rol] = url
      }
      if (iptal) {
        for (const url of acilan) URL.revokeObjectURL(url)
        return
      }
      setOnizleme(urls)
    })()
    return () => { iptal = true }
  }, [patientId, islem, mesaj])

  useEffect(() => () => {
    for (const url of Object.values(onizleme)) URL.revokeObjectURL(url)
  }, [onizleme])

  async function yukle(rol: FotoRol, file: File | null) {
    if (!file || !patientId || !islem || !cekim) { setMesaj('İşlem günü, çekim günü ve dosya gerekli.'); return }
    if (!riza) { setMesaj('Fotoğraf için ayrı KVKK rızası zorunlu.'); return }
    const t = await ensureDoctorAccessToken()
    if (!t) { setMesaj('Oturum yok.'); return }
    const form = new FormData()
    form.set('patientId', patientId)
    form.set('rol', rol)
    form.set('islem', islem)
    form.set('cekim', cekim)
    form.set('riza', '1')
    form.set('file', file)
    const r = await fetch('/api/ozel-brans/foto', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form })
    const j = await r.json().catch(() => ({}))
    setMesaj(r.ok ? 'Dosyaya yazıldı.' : (j.error || 'Fotoğraf yazılamadı.'))
  }

  const soz = durum?.hatirlatma ? durumSozcugu(vadeDurumu(new Date().toISOString().slice(0, 10), durum.hatirlatma.iso) || '') : ''

  return (
    <section data-foto-dosya="sac-ekimi" style={kutu}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#1e3a8a' }}>DONÖR VE ALICI FOTOĞRAFI</div>
      <p style={{ margin: 0, fontSize: 13 }}>İşlem öncesi ve ilk 72 saat. Görüntü bu dosyada durur. Sağlığım yalnız günü görür.</p>
      <label style={etiket}>İşlem günü <input type="date" value={islem} onChange={(e) => setIslem(e.target.value)} /></label>
      <label style={etiket}>Çekim günü <input type="date" value={cekim} onChange={(e) => setCekim(e.target.value)} /></label>
      <label style={etiket}><input type="checkbox" checked={riza} onChange={(e) => setRiza(e.target.checked)} /> Ayrı KVKK rızası var</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {FOTO_ROLLERI.map((rol) => {
          const dosya = dosyalar.find((d) => d.rol === rol.id)
          const varMi = durum?.slotlar.find((s) => s.id === rol.id)?.varMi
          return (
            <div key={rol.id} data-rol={rol.id} style={kart}>
              <b>{rol.ad}</b>
              {onizleme[rol.id] ? <img alt={rol.ad} src={onizleme[rol.id]} style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ height: 96, background: '#eef3ff', borderRadius: 8 }} />}
              <span style={{ fontSize: 12, color: varMi || dosya ? '#065F46' : '#a45b3e' }}>{varMi || dosya ? `Dosyada · ${dosya?.cekim || ''}` : 'Dosya yok'}</span>
              <input aria-label={rol.ad} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => yukle(rol.id, e.target.files?.[0] || null)} />
            </div>
          )
        })}
      </div>
      {durum?.hatirlatma && <p data-hatirlatma style={{ margin: 0, fontWeight: 700 }}>72 saat hatırlatması · {durum.hatirlatma.iso} · {soz}</p>}
      {durum && <p style={{ margin: 0, fontSize: 13 }}>{durum.ozet}</p>}
      {mesaj && <p style={{ margin: 0, fontSize: 13 }}>{mesaj}</p>}
    </section>
  )
}

const kutu: CSSProperties = { background: '#f8fafc', border: '1px solid rgba(30,58,138,0.15)', borderRadius: 14, padding: 14, display: 'grid', gap: 8 }
const kart: CSSProperties = { background: '#fff', borderRadius: 10, padding: 8, display: 'grid', gap: 6, fontSize: 13 }
const etiket: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }
