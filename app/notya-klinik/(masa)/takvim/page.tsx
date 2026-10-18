'use client'

import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { NOTYA_KLINIK_AD } from '@/lib/specialties/klinikDikey'
import { MasaSahne } from '@/components/klinik/katman/KlinikKabuk'
import { Button } from '@/components/doktor-landing/button'
import { dakikaSaat, istanbulAn } from '@/lib/randevu/v2/zaman'

type Satir = { id: string; doktorId: string; doktorAd: string; odaId: string | null; bas: string; son: string; tur: string; durum: string; hasta: string }
type Kart = { sonZiyaretler: { doktorId: string; tarih: string; ozet: string }[]; acikTakipler: { sahip: string; metin: string }[]; paket: { ad: string; kalanSeans: number } | null; gelmediRiski: string }

export default function KlinikTakvim() {
  const [gun, setGun] = useState(() => istanbulAn(Date.now()).gun)
  const [hata, setHata] = useState('')
  const [oturumYok, setOturumYok] = useState(false)
  const [randevular, setRandevular] = useState<Satir[]>([])
  const [akis, setAkis] = useState<{ odada: string[]; siradaki: string | null; geciken: string[] }>({ odada: [], siradaki: null, geciken: [] })
  const [odalar, setOdalar] = useState<{ id: string; ad: string }[]>([])
  const [secili, setSecili] = useState<string | null>(null)
  const [kart, setKart] = useState<Kart | null>(null)
  const [yonetici, setYonetici] = useState(false)
  const [ben, setBen] = useState('')

  async function yukle(g = gun) {
    const token = await ensureDoctorAccessToken()
    if (!token) { setOturumYok(true); return }
    const res = await fetch(`/api/klinik/takvim?gun=${g}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) { setHata(json.error || 'Takvim okunamadı.'); return }
    setRandevular(json.randevular || [])
    setAkis(json.akis || { odada: [], siradaki: null, geciken: [] })
    setOdalar(json.odalar || [])
    setYonetici(Boolean(json.yonetici))
    setBen(json.ben || '')
  }

  useEffect(() => { yukle().catch((e) => setHata(String(e.message || e))) }, [])

  async function hafiza(id: string) {
    setSecili(id)
    const token = await ensureDoctorAccessToken()
    const res = await fetch(`/api/klinik/hafiza?randevuId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) { setHata(json.error || 'Kart okunamadı.'); return }
    setKart(json.kart)
  }

  async function kapat(geldi: boolean) {
    if (!secili) return
    const token = await ensureDoctorAccessToken()
    const res = await fetch('/api/klinik/kapanis', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ randevuId: secili, geldi, paketDus: false, takipNotu: '' }),
    })
    const json = await res.json()
    if (!res.ok) setHata(json.error || 'Kapanış yazılamadı.')
    else hafiza(secili)
  }

  if (oturumYok) {
    return (
      <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Ortak takvim" italik="hekim oturumu ister." govde="Notya Klinik takvimi hekim oturumu ister. Doktorun kendi randevu ekranı aynı yerinde durur.">
        <Button href="/giris/doktor" variant="pine" size="lg">Hekim girişi</Button>
      </MasaSahne>
    )
  }

  const hekimler = Array.from(new Map(randevular.map((r) => [r.doktorId, r.doktorAd])))

  return (
    <div>
      <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Ortak takvim" italik="hekim ve oda." govde={`Odada ${akis.odada.length} · sıradaki ${akis.siradaki ? 'var' : 'yok'} · geciken ${akis.geciken.length}`}>
        <label className="font-outfit text-sm text-ink-2">Gün
          <input className="mt-1.5 block rounded-xl border border-line bg-cream px-3 py-2 font-outfit text-sm" type="date" value={gun} onChange={(e) => { setGun(e.target.value); yukle(e.target.value) }} />
        </label>
      </MasaSahne>
      <section className="border-t border-line bg-paper py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {hata && <p className="mb-4 font-outfit text-sm text-warn">{hata}</p>}
          {randevular.length === 0 && <p className="font-outfit text-ink-2">Bu günde Notya Klinik hekimlerinin randevusu yok.</p>}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(hekimler.length, 1)}, minmax(180px, 1fr))` }}>
            {hekimler.map(([id, ad]) => (
              <section key={id} className="rounded-xl bg-cream p-4">
                <h2 className="font-display text-xl italic">{ad}</h2>
                {randevular.filter((r) => r.doktorId === id).map((r) => (
                  <button key={r.id} onClick={() => { if (yonetici || r.doktorId === ben) hafiza(r.id) }} className={`mt-2 block w-full rounded-xl border bg-paper p-3 text-left font-outfit text-sm ${secili === r.id ? 'border-pine' : 'border-line'}`}>
                    <strong>{dakikaSaat(istanbulAn(r.bas).dakika)}–{dakikaSaat(istanbulAn(r.son).dakika)}</strong>
                    <div>{r.hasta}</div>
                    <div className="text-ink-muted">{r.tur}{r.odaId ? ` · ${odalar.find((o) => o.id === r.odaId)?.ad || 'oda'}` : ''}</div>
                  </button>
                ))}
              </section>
            ))}
          </div>
          {kart && (
            <aside className="mt-8 max-w-xl rounded-xl bg-cream p-6">
              <h2 className="font-display text-2xl italic">Notya Klinik hafızası</h2>
              <p className="mt-3 font-outfit text-sm">Gelmedi riski: {kart.gelmediRiski}</p>
              <ul className="mt-3 font-outfit text-sm">{kart.sonZiyaretler.map((z, i) => <li key={i}>{z.tarih} · {z.ozet}</li>)}</ul>
              {kart.acikTakipler.map((t, i) => <p key={i} className="mt-2 font-outfit text-sm">Takip · {t.sahip}: {t.metin}</p>)}
              {!kart.paket && <p className="mt-3 font-outfit text-sm text-ink-muted">Bu kart seans bakiyesi tutmaz. Paket tanımı kurulumdadır.</p>}
              {yonetici && (
                <div className="mt-4 flex gap-2">
                  <button className="inline-flex h-10 items-center rounded-full bg-pine px-4 font-outfit text-sm text-cream" onClick={() => kapat(true)}>Ziyareti geldi olarak kapat</button>
                  <button className="inline-flex h-10 items-center rounded-full bg-paper px-4 font-outfit text-sm ring-1 ring-line" onClick={() => kapat(false)}>Gelmedi olarak kapat</button>
                </div>
              )}
              <p className="mt-3 font-outfit text-sm text-ink-muted">Kapanış hekimin notuna yazılmaz.</p>
            </aside>
          )}
        </div>
      </section>
    </div>
  )
}
