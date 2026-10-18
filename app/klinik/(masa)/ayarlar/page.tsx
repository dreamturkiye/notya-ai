'use client'

import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { NOTYA_KLINIK_AD } from '@/lib/specialties/klinikDikey'
import { MasaSahne } from '@/components/klinik/katman/KlinikKabuk'
import { Button } from '@/components/doktor-landing/button'
import { varsayilanHafta, varsayilanRezervasyon } from '@/lib/klinik/katman/kurulum'
import { KLINIK_MODULLERI, KLINIK_ROLLERI, varsayilanYetkiler, type YetkiSatiri } from '@/lib/klinik/katman/yetki'

type Klinik = {
  id: string
  ad: string
  telefon: string
  adres: string
  vergiNo: string
  sehir: string
  logo: string
  koltuk: number
  kullanilan: number
  calisma: ReturnType<typeof varsayilanHafta>
  rezervasyon: ReturnType<typeof varsayilanRezervasyon>
  widget: { acik: boolean; baslik: string }
  mesaj: { hatirlatma: boolean }
  resepsiyonAcik: boolean
}

type Kurulum = {
  klinik: Klinik | null
  yonetici?: boolean
  odalar?: { id: string; ad: string; tur: string }[]
  yetkiler?: YetkiSatiri[]
  paketler?: { id: string; ad: string; seans: number; ucret_kurus: number }[]
  planlar?: { id: string; ad: string; taksit: number; pesinat_kurus: number }[]
  uyeler?: { userId: string; rol: string; ad: string; eposta: string }[]
  davetler?: { id: string; email: string }[]
}

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MODUL_AD: Record<string, string> = { takvim: 'Takvim', hasta: 'Hasta', paket: 'Paket', odeme: 'Ödeme', mesaj: 'Mesaj', kurulum: 'Kurulum' }
const ROL_AD: Record<string, string> = { sekreter: 'Sekreter', asistan: 'Asistan', hasta_danismani: 'Hasta danışmanı' }

async function iste(yol: string, method: string, govde?: unknown) {
  const token = await ensureDoctorAccessToken()
  const res = await fetch(yol, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: govde ? JSON.stringify(govde) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Kaydedilemedi.')
  return json
}

function Kart(props: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line bg-paper py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="font-display text-3xl font-medium tracking-tight">{props.baslik}</h2>
        <div className="mt-6 max-w-3xl font-outfit text-sm leading-relaxed text-ink-2">{props.children}</div>
      </div>
    </section>
  )
}

const alan = 'mt-1.5 block w-full rounded-xl border border-line bg-cream px-3 py-2 font-outfit text-sm text-ink'

export default function KlinikAyarlar() {
  const [oturum, setOturum] = useState<'bak' | 'yok' | 'var'>('bak')
  const [veri, setVeri] = useState<Kurulum | null>(null)
  const [hata, setHata] = useState('')
  const [yeniAd, setYeniAd] = useState('')
  const [oda, setOda] = useState('')
  const [eposta, setEposta] = useState('')
  const [baglanti, setBaglanti] = useState('')
  const [paketAd, setPaketAd] = useState('')
  const [paketSeans, setPaketSeans] = useState('6')

  async function yukle() {
    const token = await ensureDoctorAccessToken()
    if (!token) { setOturum('yok'); return }
    setOturum('var')
    const res = await fetch('/api/klinik/kurulum', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) { setHata(json.error || 'Okunamadı.'); return }
    if (json.klinik && !json.klinik.calisma) json.klinik.calisma = varsayilanHafta()
    if (json.klinik && !json.yetkiler?.length) json.yetkiler = varsayilanYetkiler()
    setVeri(json)
  }

  useEffect(() => { yukle().catch((e) => setHata(String(e.message || e))) }, [])

  if (oturum === 'bak') {
    return <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Kurulum" italik="açılıyor." govde="Notya Klinik masası hazırlanıyor." />
  }
  if (oturum === 'yok') {
    return (
      <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Klinik kurulumu" italik="hekim oturumu ister." govde="Bu masa hekim oturumu ister. Doktor ekranları aynı yerinde durur.">
        <Button href="/giris/doktor" variant="pine" size="lg">Hekim girişi</Button>
      </MasaSahne>
    )
  }
  if (!veri?.klinik) {
    return (
      <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Notya Klinik" italik="açın." govde="Ad, adres ve vergi numarası kliniğin kendi kaydıdır. Hekimin muayene ekranı değişmez.">
        <label className="block font-outfit text-sm text-ink-2">Klinik adı
          <input className={alan} value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} />
        </label>
        {hata && <p className="mt-3 font-outfit text-sm text-warn">{hata}</p>}
        <button type="button" className="mt-4 inline-flex h-12 items-center rounded-full bg-pine px-6 font-outfit text-sm font-medium text-cream" onClick={() => iste('/api/klinik/kurulum', 'POST', { ad: yeniAd }).then(yukle).catch((e) => setHata(e.message))}>Notya Klinik’i oluştur</button>
      </MasaSahne>
    )
  }

  const k = veri.klinik
  const salt = !veri.yonetici
  const yetkiler = (veri.yetkiler && veri.yetkiler.length ? veri.yetkiler : varsayilanYetkiler())
  function yetkiDegistir(rol: string, modul: string, eylem: 'oku' | 'yaz' | 'sil', deger: boolean) {
    setVeri({
      ...veri!,
      yetkiler: yetkiler.map((s) => s.rol === rol && s.modul === modul ? { ...s, [eylem]: deger } : s),
    })
  }

  return (
    <div>
      <MasaSahne kas={NOTYA_KLINIK_AD} baslik={k.ad || NOTYA_KLINIK_AD} italik="kurulumu." govde="Odalar, yetkiler, randevu kuralı ve koltuklar bu masada durur. Hekim muayene ekranı aynı kalır." />
      {salt && <p className="mx-auto max-w-7xl px-5 font-outfit text-sm text-ink-muted sm:px-8">Bu Notya Klinik kaydını görüntülüyorsunuz. Ayarları yalnız sahip veya yönetici değiştirir.</p>}
      {hata && <p className="font-outfit text-sm text-warn">{hata}</p>}
      <Kart baslik="Klinik kimliği">
        <label>Ad<input className={alan} disabled={salt} value={k.ad} onChange={(e) => setVeri({ ...veri, klinik: { ...k, ad: e.target.value } })} /></label>
        <label>Telefon<input className={alan} disabled={salt} value={k.telefon} onChange={(e) => setVeri({ ...veri, klinik: { ...k, telefon: e.target.value } })} /></label>
        <label>Adres<input className={alan} disabled={salt} value={k.adres} onChange={(e) => setVeri({ ...veri, klinik: { ...k, adres: e.target.value } })} /></label>
        <label>Vergi no<input className={alan} disabled={salt} value={k.vergiNo} onChange={(e) => setVeri({ ...veri, klinik: { ...k, vergiNo: e.target.value } })} /></label>
        <label>Logo bağlantısı<input className={alan} disabled={salt} value={k.logo} onChange={(e) => setVeri({ ...veri, klinik: { ...k, logo: e.target.value } })} /></label>
      </Kart>
      <Kart baslik="Çalışma saatleri">
        {GUNLER.map((ad, i) => {
          const g = k.calisma[String(i)] || { acik: false, baslangic: '09:00', bitis: '18:00' }
          return (
            <div key={ad} style={{ display: 'grid', gridTemplateColumns: '140px 80px 1fr 1fr', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span>{ad}</span>
              <input type="checkbox" disabled={salt} checked={g.acik} onChange={(e) => setVeri({ ...veri, klinik: { ...k, calisma: { ...k.calisma, [i]: { ...g, acik: e.target.checked } } } })} />
              <input className={alan} disabled={salt || !g.acik} value={g.baslangic} onChange={(e) => setVeri({ ...veri, klinik: { ...k, calisma: { ...k.calisma, [i]: { ...g, baslangic: e.target.value } } } })} />
              <input className={alan} disabled={salt || !g.acik} value={g.bitis} onChange={(e) => setVeri({ ...veri, klinik: { ...k, calisma: { ...k.calisma, [i]: { ...g, bitis: e.target.value } } } })} />
            </div>
          )
        })}
      </Kart>
      <Kart baslik="Odalar">
        <ul>{(veri.odalar || []).map((o) => <li key={o.id}>{o.ad} · {o.tur} {!salt && <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste(`/api/klinik/odalar?id=${o.id}`, 'DELETE').then(yukle).catch((e) => setHata(e.message))}>Kaldır</button>}</li>)}</ul>
        {!salt && (
          <div>
            <input className={alan} value={oda} placeholder="Oda adı" onChange={(e) => setOda(e.target.value)} />
            <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/odalar', 'POST', { ad: oda, tur: 'muayene' }).then(() => { setOda(''); return yukle() }).catch((e) => setHata(e.message))}>Oda ekle</button>
          </div>
        )}
      </Kart>
      <Kart baslik="Personel yetkisi">
        <p className="text-ink-muted">Sekreter, asistan ve hasta danışmanı için okuma, yazma ve silme. Bu tablo doktor uygulamasındaki mevcut yetkilerin yerine geçmez.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th></th>{KLINIK_ROLLERI.map((r) => <th key={r}>{ROL_AD[r]}</th>)}</tr></thead>
          <tbody>
            {KLINIK_MODULLERI.map((m) => (
              <tr key={m}>
                <td>{MODUL_AD[m]}</td>
                {KLINIK_ROLLERI.map((r) => {
                  const s = yetkiler.find((x) => x.rol === r && x.modul === m)
                  return (
                    <td key={r}>
                      {(['oku', 'yaz', 'sil'] as const).map((eylem) => (
                        <label key={eylem} style={{ marginRight: 8 }}>
                          <input type="checkbox" disabled={salt || m === 'kurulum'} checked={Boolean(s?.[eylem])} onChange={(e) => yetkiDegistir(r, m, eylem, e.target.checked)} />
                          {eylem === 'oku' ? 'Oku' : eylem === 'yaz' ? 'Yaz' : 'Sil'}
                        </label>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!salt && <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/yetkiler', 'PUT', { satirlar: yetkiler }).then(yukle).catch((e) => setHata(e.message))}>Yetkiyi kaydet</button>}
      </Kart>
      <Kart baslik="Randevu kuralı ve widget">
        <label>Slot dakika<input className={alan} type="number" disabled={salt} value={k.rezervasyon.slotDakika} onChange={(e) => setVeri({ ...veri, klinik: { ...k, rezervasyon: { ...k.rezervasyon, slotDakika: Number(e.target.value) } } })} /></label>
        <label>Tampon<input className={alan} type="number" disabled={salt} value={k.rezervasyon.tamponDk} onChange={(e) => setVeri({ ...veri, klinik: { ...k, rezervasyon: { ...k.rezervasyon, tamponDk: Number(e.target.value) } } })} /></label>
        <label>Widget başlığı<input className={alan} disabled={salt} value={k.widget.baslik} onChange={(e) => setVeri({ ...veri, klinik: { ...k, widget: { ...k.widget, baslik: e.target.value } } })} /></label>
        <label><input type="checkbox" disabled={salt} checked={k.widget.acik} onChange={(e) => setVeri({ ...veri, klinik: { ...k, widget: { ...k.widget, acik: e.target.checked } } })} /> Çevrimiçi widget açık</label>
      </Kart>
      <Kart baslik="Mesaj ve AI Resepsiyon">
        <label><input type="checkbox" disabled={salt} checked={k.mesaj.hatirlatma} onChange={(e) => setVeri({ ...veri, klinik: { ...k, mesaj: { hatirlatma: e.target.checked } } })} /> Klinik hatırlatması açık</label>
        <p className="text-ink-muted">AI Resepsiyon ayrı bir eklentidir. Kapalıyken hiç çağrılmaz. Hekimin Luna kullanımı burada değişmez.</p>
        <label><input type="checkbox" disabled={salt} checked={k.resepsiyonAcik} onChange={(e) => setVeri({ ...veri, klinik: { ...k, resepsiyonAcik: e.target.checked } })} /> AI Resepsiyon eklentisine izin ver</label>
      </Kart>
      <Kart baslik="Paket ve ödeme planı">
        <ul>{(veri.paketler || []).map((p) => <li key={p.id}>{p.ad} · {p.seans} seans · {(p.ucret_kurus / 100).toFixed(0)} TL</li>)}</ul>
        <ul>{(veri.planlar || []).map((p) => <li key={p.id}>{p.ad} · {p.taksit} taksit</li>)}</ul>
        {!salt && (
          <div>
            <input className={alan} value={paketAd} placeholder="Paket adı" onChange={(e) => setPaketAd(e.target.value)} />
            <input className={alan} type="number" value={paketSeans} onChange={(e) => setPaketSeans(e.target.value)} />
            <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/paketler', 'POST', { ad: paketAd, seans: Number(paketSeans), ucretKurus: 0 }).then(() => { setPaketAd(''); return yukle() }).catch((e) => setHata(e.message))}>Paket ekle</button>
            <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/paketler', 'POST', { tur: 'plan', ad: paketAd || 'Peşin', taksit: 1, pesinatKurus: 0 }).then(() => { setPaketAd(''); return yukle() }).catch((e) => setHata(e.message))}>Ödeme planı ekle</button>
          </div>
        )}
      </Kart>
      <Kart baslik="Koltuklar">
        <p>{k.kullanilan} / {k.koltuk} koltuk dolu.</p>
        <ul>{(veri.uyeler || []).map((u) => <li key={u.userId}>{u.ad || u.eposta} · {u.rol}</li>)}</ul>
        <ul>{(veri.davetler || []).map((d) => <li key={d.id}>{d.email} · davet açık</li>)}</ul>
        {!salt && (
          <div>
            <input className={alan} value={eposta} placeholder="hekim@ornek.com" onChange={(e) => setEposta(e.target.value)} />
            <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/koltuklar', 'POST', { email: eposta }).then((j) => { setBaglanti(j.baglanti); setEposta(''); return yukle() }).catch((e) => setHata(e.message))}>Hekim davet et</button>
            {baglanti && <p>Davet bağlantısı bir kez gösterilir: {baglanti}</p>}
          </div>
        )}
      </Kart>
      {!salt && <button className="mt-3 mr-2 inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => iste('/api/klinik/kurulum', 'PUT', k).catch((e) => setHata(e.message))}>Kurulumu kaydet</button>}
    </div>
  )
}
