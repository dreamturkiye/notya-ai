'use client'
export const dynamic = "force-dynamic"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// sb initialized per-call

type Musteri = { id:string; sirket_adi:string; vergi_no:string; yetkili_kisi:string; telefon:string; email:string; faaliyet_alani:string; sirket_turu:string; notlar:string; is_active:boolean }

export default function MusteriYonetimi() {
  const router = useRouter()
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ sirket_adi:'', vergi_no:'', yetkili_kisi:'', telefon:'', email:'', faaliyet_alani:'', sirket_turu:'limited', notlar:'' })

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/giris/mali'); return }
      setToken(session.access_token)
      load(session.access_token)
    })
  }, [])

  async function load(tok: string) {
    setLoading(true)
    const res = await fetch('/api/mali/musteriler', { headers: { Authorization: 'Bearer ' + tok } })
    const data = await res.json()
    if (data.success) setMusteriler(data.data || [])
    setLoading(false)
  }

  function startEdit(m: Musteri) {
    setEditId(m.id)
    setForm({ sirket_adi:m.sirket_adi, vergi_no:m.vergi_no, yetkili_kisi:m.yetkili_kisi, telefon:m.telefon, email:m.email, faaliyet_alani:m.faaliyet_alani, sirket_turu:m.sirket_turu, notlar:m.notlar })
    setShowForm(true)
  }

  function resetForm() { setShowForm(false); setEditId(null); setError(''); setForm({ sirket_adi:'', vergi_no:'', yetkili_kisi:'', telefon:'', email:'', faaliyet_alani:'', sirket_turu:'limited', notlar:'' }) }

  async function save() {
    if (!form.sirket_adi.trim()) { setError('Sirket adi gereklidir'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/mali/musteriler', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(editId ? { ...form, id: editId } : form)
    })
    const data = await res.json()
    if (data.success) { resetForm(); load(token) }
    else setError(data.error || 'Hata')
    setSaving(false)
  }

  async function sil(id: string) {
    if (!confirm('Bu musteri silinsin mi?')) return
    await fetch('/api/mali/musteriler?id=' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    load(token)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid #E2E8F0', borderRadius:7, fontSize:14, outline:'none', background:'#fff', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', fontFamily:'system-ui,sans-serif', padding:'24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <button onClick={() => router.push('/dashboard/mali')} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:14, marginBottom:4 }}>Ana Sayfa</button>
            <div style={{ fontSize:22, fontWeight:700, color:'#1E293B' }}>Musteri Yonetimi</div>
            <div style={{ fontSize:13, color:'#64748B' }}>{musteriler.length} musteri kayitli</div>
          </div>
          <button onClick={() => router.push('/dashboard/mali/musteri-ekle')} style={{ background:'#10B981', border:'none', color:'#fff', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:14 }}>+ Yeni Musteri</button>
        </div>

        {showForm && (
          <div style={{ background:'#fff', borderRadius:12, padding:24, marginBottom:24, border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16, color:'#1E293B' }}>{editId ? 'Musteri Duzenle' : 'Yeni Musteri Ekle'}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Sirket Adi *</label><input value={form.sirket_adi} onChange={e=>setForm(f=>({...f,sirket_adi:e.target.value}))} placeholder='ABC Ltd. Sti.' style={inp} /></div>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Vergi No</label><input value={form.vergi_no} onChange={e=>setForm(f=>({...f,vergi_no:e.target.value}))} placeholder='1234567890' style={inp} /></div>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Yetkili Kisi</label><input value={form.yetkili_kisi} onChange={e=>setForm(f=>({...f,yetkili_kisi:e.target.value}))} placeholder='Ahmet Yilmaz' style={inp} /></div>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Telefon</label><input value={form.telefon} onChange={e=>setForm(f=>({...f,telefon:e.target.value}))} placeholder='0532 000 0000' style={inp} /></div>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>E-posta</label><input type='text' value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder='info@sirket.com' style={inp} /></div>
              <div><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Sirket Turu</label><select value={form.sirket_turu} onChange={e=>setForm(f=>({...f,sirket_turu:e.target.value}))} style={{...inp,cursor:'pointer'}}><option value='limited'>Limited Sirketi</option><option value='anonim'>Anonim Sirketi</option><option value='sahis'>Sahis Isletmesi</option><option value='koop'>Kooperatif</option></select></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Faaliyet Alani</label><input value={form.faaliyet_alani} onChange={e=>setForm(f=>({...f,faaliyet_alani:e.target.value}))} placeholder='Ticaret, insaat, hizmet...' style={inp} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ fontSize:12, color:'#64748B', display:'block', marginBottom:4 }}>Notlar</label><textarea value={form.notlar} onChange={e=>setForm(f=>({...f,notlar:e.target.value}))} rows={3} placeholder='Ek notlar...' style={{...inp,resize:'vertical'}} /></div>
            </div>
            {error && <div style={{ color:'#DC2626', fontSize:13, marginBottom:10 }}>{error}</div>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={save} disabled={saving} style={{ background:'#10B981', border:'none', color:'#fff', padding:'10px 24px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:14 }}>{saving?'Kaydediliyor...':'Kaydet'}</button>
              <button onClick={resetForm} style={{ background:'#F1F5F9', border:'none', color:'#64748B', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontSize:14 }}>Iptal</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#64748B' }}>Yukleniyor...</div>
        ) : musteriler.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:12, border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>?</div>
            <div style={{ fontWeight:600, fontSize:16, color:'#1E293B', marginBottom:8 }}>Henuz musteri eklenmedi</div>
            <div style={{ color:'#64748B', fontSize:14 }}>Yukardaki butona tiklayarak ilk musteriinizi ekleyin</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {musteriler.map(m => (
              <div key={m.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:15, color:'#1E293B' }}>{m.sirket_adi}</div>
                  <div style={{ fontSize:13, color:'#64748B', marginTop:2 }}>{m.yetkili_kisi} {m.telefon ? '| ' + m.telefon : ''} {m.vergi_no ? '| VN: ' + m.vergi_no : ''}</div>
                  {m.faaliyet_alani && <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>{m.faaliyet_alani}</div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ background:m.sirket_turu==='limited'?'#DBEAFE':m.sirket_turu==='anonim'?'#FEF3C7':'#F0FDF4', color:m.sirket_turu==='limited'?'#1D4ED8':m.sirket_turu==='anonim'?'#D97706':'#15803D', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{m.sirket_turu.toUpperCase()}</span>
                  <button onClick={() => startEdit(m)} style={{ background:'#F1F5F9', border:'none', color:'#374151', padding:'6px 14px', borderRadius:7, cursor:'pointer', fontSize:12 }}>Duzenle</button>
                  <button onClick={() => sil(m.id)} style={{ background:'#FEF2F2', border:'none', color:'#DC2626', padding:'6px 14px', borderRadius:7, cursor:'pointer', fontSize:12 }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}