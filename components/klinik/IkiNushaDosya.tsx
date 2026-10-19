'use client'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { NUSHA_ROLLERI, type NushaRol } from '@/lib/klinik/ikiNusha'

type Nusha = { id: string; rol: NushaRol; iso: string }

export function IkiNushaDosya({ patientId, baslangic, yenile = 0 }: { patientId: string; baslangic?: Nusha[]; yenile?: number }) {
  const [liste, setListe] = useState<Nusha[]>(baslangic || [])
  const [mesaj, setMesaj] = useState('')
  const ekAnahtar = (baslangic || []).map((n) => `${n.rol}:${n.id}:${n.iso}`).join(',')

  useEffect(() => {
    if (!patientId) {
      setListe(baslangic || [])
      return
    }
    if (baslangic?.length) setListe(baslangic)
    let iptal = false
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) {
        if (!iptal && baslangic?.length) setListe(baslangic)
        return
      }
      const r = await fetch(`/api/ozel-brans/nusha?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json().catch(() => null)
      if (iptal || !r.ok) return
      const gelen = (j?.nushalar || []) as Nusha[]
      const ek = baslangic || []
      const ids = new Set(ek.map((n) => n.id))
      setListe([...ek, ...gelen.filter((n) => !ids.has(n.id))])
    })()
    return () => { iptal = true }
    // ekAnahtar is the stable identity of baslangic; the array object itself is not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, yenile, ekAnahtar])

  async function indir(id: string, ad: string) {
    const t = await ensureDoctorAccessToken()
    if (!t) { setMesaj('Oturum yok.'); return }
    const r = await fetch(`/api/doktor/documents/${id}/download`, { headers: { Authorization: `Bearer ${t}` } })
    if (!r.ok) { setMesaj('Nüsha açılamadı.'); return }
    const url = URL.createObjectURL(await r.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = ad
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section data-iki-nusha="ozel-brans" style={kutu}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#2f4334' }}>İKİ NÜSHA</div>
      <p style={{ margin: 0, fontSize: 13 }}>Hasta Hakları m.26. Biri dosyada kalır, biri hastaya verilir. E-imza iddia edilmez.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {NUSHA_ROLLERI.map((rol) => {
          const dosya = liste.find((n) => n.rol === rol.id)
          return (
            <div key={rol.id} data-nusha={rol.id} style={kart}>
              <b>{rol.ad}</b>
              <span style={{ fontSize: 12, color: '#8b7d70' }}>{rol.aciklama}</span>
              <span style={{ fontSize: 12, color: dosya ? '#065F46' : '#a45b3e' }}>{dosya ? `Dosyada · ${dosya.iso}` : 'Dosya yok'}</span>
              {dosya && <button type="button" onClick={() => indir(dosya.id, `${rol.ad}.pdf`)} style={btn}>İndir</button>}
            </div>
          )
        })}
      </div>
      {mesaj && <p style={{ margin: 0, fontSize: 13 }}>{mesaj}</p>}
    </section>
  )
}

const kutu: CSSProperties = { background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: 14, padding: 14, display: 'grid', gap: 8, marginTop: 12 }
const kart: CSSProperties = { background: '#fff', borderRadius: 10, padding: 10, display: 'grid', gap: 4, fontSize: 13 }
const btn: CSSProperties = { justifySelf: 'start', padding: '6px 10px', borderRadius: 8, border: '1px solid #2f4334', background: '#fff', color: '#2f4334', fontWeight: 700, cursor: 'pointer' }
