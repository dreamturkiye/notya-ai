'use client'
/**
 * HASTA-PORTALI-GUNLUK — Türkiye host of the daily health home. One provider per portal session (mounted by HastaShell),
 * loading lazily on the first page that asks for it, so portal pages that don't use it cost nothing.
 *  - canlı: GET/POST /api/portal/hasta/[token]/gunluk* (PIN cookie); a dose tap is optimistic.
 *  - örnek: the doctor's preview (/portal/onizleme) and the internal demo (/portal/demo) — the same views on synthetic
 *    data (lib/saglikEvi/demo.ts), recomputed locally by the same pure functions; nothing is sent anywhere.
 * Also applies the accessibility preferences (büyük yazı, yüksek kontrast) to the whole portal.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GunlukDurum, HamGunluk } from '@/lib/saglikEvi/ozet'
import { gunlukOzeti } from '@/lib/saglikEvi/ozet'
import { demoDurumuUygula, gunlukDemoHam } from '@/lib/saglikEvi/demo'
import { olcumDogrula } from '@/lib/saglikEvi/olcumler'
import { gurultuSuz, olcumKurallari } from '@/lib/saglikEvi/kurallar'
import { hastaModulleri, hastaTercihiDegistir } from '@/lib/saglikEvi/moduller'
import { etkinEsikler } from '@/lib/saglikEvi/hedefler'
import { ERTELE_DK } from '@/lib/saglikEvi/dozPlani'
import type { GunlukEylemleri, PushDurumu } from '@/components/doktor/portal/saglikEvi/eylemler'
import { portalFetch } from '@/lib/portal/portalFetch'
import { usePortalLive } from '../PortalLiveProvider'

type Deger = { durum: GunlukDurum | null; yukleniyor: boolean; hata: string | null; eylemler: GunlukEylemleri; ornek: boolean; yukle: () => void; gorunum: Gorunum; gorunumAyarla: (g: Gorunum) => void }
export type Gorunum = { buyuk: boolean; kontrast: boolean }
const Ctx = createContext<Deger | null>(null)

const GORUNUM_ANAHTARI = 'sg-gorunum'

function base64Uint8(s: string): Uint8Array {
  const p = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(p)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function resimKucult(dosya: File): Promise<{ base64: string; mime: string }> {
  const url = URL.createObjectURL(dosya)
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = url })
    const olcek = Math.min(1, 1280 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * olcek); c.height = Math.round(img.height * olcek)
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
    return { base64: c.toDataURL('image/jpeg', 0.85).split(',')[1], mime: 'image/jpeg' }
  } finally { URL.revokeObjectURL(url) }
}

export function GunlukProvider({ children }: { children: ReactNode }) {
  const { token, basePath, data } = usePortalLive()
  const ornek = token === 'onizleme' || basePath.startsWith('/portal/demo')
  const api = `/api/portal/hasta/${encodeURIComponent(token)}/gunluk`
  const [durum, setDurum] = useState<GunlukDurum | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const istendi = useRef(false)
  const sonYukleme = useRef(0)
  const ham = useRef<HamGunluk | null>(null)
  const [pushDurum, setPushDurum] = useState<PushDurumu>('yukleniyor')
  const [gorunum, setGorunum] = useState<Gorunum>({ buyuk: false, kontrast: false })

  useEffect(() => {
    try { const g = JSON.parse(localStorage.getItem(GORUNUM_ANAHTARI) || '{}'); setGorunum({ buyuk: !!g.buyuk, kontrast: !!g.kontrast }) } catch { /* yok */ }
  }, [])
  useEffect(() => {
    const kok = document.querySelector('.sagligim-root')
    kok?.classList.toggle('sg-buyuk', gorunum.buyuk)
    kok?.classList.toggle('sg-kontrast', gorunum.kontrast)
  }, [gorunum])
  const gorunumAyarla = useCallback((g: Gorunum) => { setGorunum(g); try { localStorage.setItem(GORUNUM_ANAHTARI, JSON.stringify(g)) } catch { /* yok */ } }, [])

  const yenidenHesapla = useCallback(() => { if (ham.current) setDurum(gunlukOzeti({ ...ham.current, simdi: new Date().toISOString() })) }, [])

  const yukle = useCallback(async () => {
    istendi.current = true
    sonYukleme.current = Date.now()
    if (ornek) {
      // internal demo only: ?durum=ilk|az|ilacsiz|onaysiz|tamam previews the designed states (BUGUN-V2)
      const durumOnizleme = basePath.startsWith('/portal/demo') ? new URLSearchParams(window.location.search).get('durum') : null
      if (!ham.current) ham.current = demoDurumuUygula(gunlukDemoHam(new Date().toISOString(), data.hekim?.brans || 'dahiliye'), durumOnizleme)
      yenidenHesapla()
      return
    }
    setYukleniyor(true)
    try {
      const r = await portalFetch(api, { credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Günlük bilgileriniz yüklenemedi.')
      setDurum(j as GunlukDurum); setHata(null)
    } catch (e) { setHata(e instanceof Error ? e.message : 'Günlük bilgileriniz yüklenemedi.') } finally { setYukleniyor(false) }
  }, [ornek, api, basePath, data.hekim?.brans, yenidenHesapla])

  const gonder = useCallback(async (govde: Record<string, unknown>, yol = api, method = 'POST') => {
    const r = await portalFetch(yol, { method, credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) })
    const j = await r.json().catch(() => ({}))
    return r.ok ? { ok: true as const, ...j } : { ok: false as const, hata: String(j?.error || 'İşlem tamamlanamadı.') }
  }, [api])

  // ── push (this browser) ──
  useEffect(() => {
    if (ornek) { setPushDurum('yok'); return }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setPushDurum('desteklenmiyor'); return }
    if (Notification.permission === 'denied') { setPushDurum('reddedildi'); return }
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        setPushDurum(sub ? 'acik' : 'kapali')
        reg?.active?.postMessage({ tur: 'sg-portal-yol', yol: basePath })
      } catch { setPushDurum('kapali') }
    })()
  }, [ornek, basePath])

  const eylemler = useMemo<GunlukEylemleri>(() => ({
    olcumEkle: async (g) => {
      if (ornek && ham.current) {
        const v = olcumDogrula(g)
        if (!v.ok) return { ok: false, hata: v.hata }
        const o = { id: `ornek-${Date.now()}`, tip: v.tip, deger: v.deger, deger2: v.deger2, baglam: v.baglam, olcumAt: g.olcumAt || new Date().toISOString(), kaynak: (g.foto ? 'portal_foto' : 'portal') as 'portal' }
        const h = ham.current
        const esik = etkinEsikler(h.profil, h.hekimAyar)
        const mod = hastaModulleri({ bransAnahtar: h.bransAnahtar, ayar: h.ayar, hekim: h.hekimAyar, klinik: h.klinik, hasta: h.tercihler.moduller })
        const b = { yasAy: null, kiloHekimeBildir: mod.kiloHekimeBildir }
        const liste = [...h.olcumler, o]
        const yeni = gurultuSuz(olcumKurallari(o, liste, esik, Date.now(), b, mod.olcumler.includes(o.tip)), h.uyarilar.map((u) => ({ anahtar: u.anahtar, duzey: u.duzey, olusturmaAt: u.olusturmaAt })), Date.now())
        ham.current = { ...h, olcumler: liste, toplamOlcum: h.toplamOlcum + 1, uyarilar: [...yeni.map((r, i) => ({ id: `ornek-u${Date.now()}${i}`, kural: r.kural, anahtar: r.anahtar, duzey: r.duzey, metrik: r.metrik, hastaMetni: r.hastaMetni, hekimMetni: r.hekimMetni, olusturmaAt: new Date().toISOString(), hastaGorduAt: null, hekimGorduAt: null })), ...h.uyarilar] }
        yenidenHesapla()
        return { ok: true, uyarilar: yeni.map((r) => ({ duzey: r.duzey, metrik: r.metrik, hastaMetni: r.hastaMetni })) }
      }
      const r = await gonder({ islem: 'olcum', ...g })
      if (r.ok) void yukle()
      return r.ok ? { ok: true, uyarilar: (r as { uyarilar?: [] }).uyarilar || [] } : r
    },
    olcumSil: async (id) => {
      if (ornek && ham.current) { ham.current = { ...ham.current, olcumler: ham.current.olcumler.filter((o) => o.id !== id) }; yenidenHesapla(); return { ok: true } }
      const r = await gonder({ islem: 'olcum-sil', id }); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
    doz: async (planIds, planlananAt, d) => {
      const simdi = new Date().toISOString()
      const yerelUygula = (h: HamGunluk): HamGunluk => {
        const at = planlananAt ?? simdi
        const kalan = h.kayitlar.filter((k) => !(planIds.includes(k.planId) && new Date(k.planlananAt).toISOString() === new Date(at).toISOString()))
        if (d === 'geri') return { ...h, kayitlar: kalan }
        return { ...h, kayitlar: [...kalan, ...planIds.map((p, i) => ({ id: `yerel-${Date.now()}-${i}`, planId: p, planlananAt: new Date(at).toISOString(), durum: d, kayitAt: simdi, erteleUntil: d === 'ertelendi' ? new Date(Date.now() + ERTELE_DK * 60_000).toISOString() : null }))] }
      }
      if (ornek && ham.current) { ham.current = yerelUygula(ham.current); yenidenHesapla(); return { ok: true } }
      // optimistic: mark the slots in the current state right away
      setDurum((s) => s && { ...s, bugunDozlar: s.bugunDozlar.map((x) => (planIds.includes(x.planId) && planlananAt && x.at === new Date(planlananAt).toISOString() ? { ...x, durum: d === 'geri' ? 'zamani' : d } : x)) })
      const r = await gonder({ islem: 'doz', planIds, planlananAt, durum: d })
      void yukle()
      return r.ok ? { ok: true } : r
    },
    plan: async (g) => {
      if (ornek && ham.current) {
        const h = ham.current
        if (g.tur === 'ekle') ham.current = { ...h, planlar: [...h.planlar, { id: `ornek-p${Date.now()}`, ilacId: null, ad: g.ad || 'İlaç', doz: g.doz || null, saatler: g.gerektikce ? [] : g.saatler || [], gerektikce: !!g.gerektikce, haftaGunu: null, kaynak: 'hasta', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null }] }
        if (g.tur === 'saat') ham.current = { ...h, planlar: h.planlar.map((p) => (p.id === g.planId ? { ...p, saatler: g.saatler || p.saatler } : p)) }
        if (g.tur === 'kaldir') ham.current = { ...h, planlar: h.planlar.map((p) => (p.id === g.planId && p.kaynak === 'hasta' ? { ...p, aktif: false } : p)) }
        yenidenHesapla(); return { ok: true }
      }
      const r = await gonder({ islem: 'plan', ...g }); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
    tercih: async (g) => {
      if (ornek && ham.current) {
        const t = ham.current.tercihler
        const { modul, ...geri } = g
        const moduller = modul ? hastaTercihiDegistir(t.moduller, modul.anahtar, modul.acik) ?? t.moduller : t.moduller
        ham.current = { ...ham.current, tercihler: { ...t, ...geri, moduller, onayAt: g.paylasimOnayi ? new Date().toISOString() : t.onayAt } }
        yenidenHesapla(); return { ok: true }
      }
      const r = await gonder({ islem: 'tercih', ...g }); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
    soru: async (metin) => {
      if (ornek && ham.current) { ham.current = { ...ham.current, sorular: [{ id: `ornek-s${Date.now()}`, metin, createdAt: new Date().toISOString() }, ...ham.current.sorular] }; yenidenHesapla(); return { ok: true } }
      const r = await gonder({ islem: 'soru', metin }); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
    soruSil: async (id) => {
      if (ornek && ham.current) { ham.current = { ...ham.current, sorular: ham.current.sorular.filter((s) => s.id !== id) }; yenidenHesapla(); return { ok: true } }
      const r = await gonder({ islem: 'soru-sil', id }); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
    rozetGoruldu: async () => {
      if (ornek && ham.current) { const simdi = new Date().toISOString(); ham.current = { ...ham.current, kazanilanRozetler: [...ham.current.kazanilanRozetler.map((r) => ({ ...r, hastaGorduAt: r.hastaGorduAt || simdi })), ...(durum?.yeniKazanilan || []).map((r) => ({ rozet: r, kazanildiAt: simdi, hastaGorduAt: simdi }))] }; yenidenHesapla(); return }
      setDurum((s) => s && { ...s, rozetler: s.rozetler.map((r) => ({ ...r, yeni: false })) })
      await gonder({ islem: 'rozet-goruldu' })
    },
    uyariGoruldu: async (idler) => {
      const simdi = new Date().toISOString()
      if (ornek && ham.current) { ham.current = { ...ham.current, uyarilar: ham.current.uyarilar.map((u) => (idler.includes(u.id) ? { ...u, hastaGorduAt: simdi } : u)) }; yenidenHesapla(); return }
      setDurum((s) => s && { ...s, uyarilar: s.uyarilar.map((u) => (idler.includes(u.id) ? { ...u, hastaGorduAt: simdi } : u)) })
      await gonder({ islem: 'uyari-goruldu', idler })
    },
    fotoOku: async (dosya) => {
      if (ornek) return { ok: true, oneriler: [{ tip: 'kb', deger: 132, deger2: 84 }, { tip: 'nabiz', deger: 72, deger2: null }], okunamadi: false }
      try {
        const k = await resimKucult(dosya)
        const r = await gonder(k, `${api}/foto`)
        return r.ok ? { ok: true, oneriler: (r as { oneriler?: [] }).oneriler || [], okunamadi: !!(r as { okunamadi?: boolean }).okunamadi } : r
      } catch { return { ok: false, hata: 'Fotoğraf hazırlanamadı. Değeri elle girebilirsiniz.' } }
    },
    push: {
      durum: pushDurum,
      ac: async () => {
        if (ornek) return { ok: false, hata: 'Örnek görünümde bildirim açılmaz.' }
        try {
          const kr = await portalFetch(`${api}/push`, { credentials: 'include' })
          const { acik } = (await kr.json().catch(() => ({}))) as { acik?: string | null }
          if (!acik) { setPushDurum('yok'); return { ok: false, hata: 'Bildirimler henüz hazır değil.' } }
          const izin = await Notification.requestPermission()
          if (izin !== 'granted') { setPushDurum(izin === 'denied' ? 'reddedildi' : 'kapali'); return { ok: false, hata: 'Bildirim izni verilmedi.' } }
          const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'))
          await navigator.serviceWorker.ready
          const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64Uint8(acik) as unknown as BufferSource }))
          const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
          const r = await gonder({ endpoint: j.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth }, `${api}/push`)
          if (!r.ok) return r
          reg.active?.postMessage({ tur: 'sg-portal-yol', yol: basePath })
          setPushDurum('acik')
          return { ok: true }
        } catch { return { ok: false, hata: 'Bildirim açılamadı. Tarayıcı ayarlarını kontrol edin.' } }
      },
      kapat: async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          const sub = await reg?.pushManager.getSubscription()
          if (sub) { await gonder({ endpoint: sub.endpoint }, `${api}/push`, 'DELETE'); await sub.unsubscribe() }
        } finally { setPushDurum('kapali') }
      },
    },
    indirJson: ornek ? null : `${api}/veri`,
    indirCsv: ornek ? null : `${api}/veri?bicim=csv`,
    veriSil: async () => {
      if (ornek) return { ok: false, hata: 'Örnek görünümde veri silinmez.' }
      const r = await gonder({ onay: 'SIL' }, `${api}/veri`, 'DELETE'); if (r.ok) void yukle(); return r.ok ? { ok: true } : r
    },
  }), [ornek, api, basePath, gonder, yukle, yenidenHesapla, pushDurum, durum?.yeniKazanilan])

  const deger = useMemo<Deger>(() => ({ durum, yukleniyor, hata, eylemler, ornek, yukle: () => { if (!istendi.current || (!ornek && Date.now() - sonYukleme.current > 30_000)) void yukle() }, gorunum, gorunumAyarla }), [durum, yukleniyor, hata, eylemler, ornek, yukle, gorunum, gorunumAyarla])
  return <Ctx.Provider value={deger}>{children}</Ctx.Provider>
}

/** Pages call this; it starts the first load. Outside a provider (doctor's preview pages) the page wraps itself in one. */
export function useGunluk() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useGunluk must be used under GunlukProvider')
  const { yukle } = v
  useEffect(() => { yukle() }, [yukle])
  return v
}

export function GunlukKapsayici({ children }: { children: ReactNode }) {
  return useContext(Ctx) ? <>{children}</> : <GunlukProvider>{children}</GunlukProvider>
}
