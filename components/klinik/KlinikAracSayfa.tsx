'use client'
import { Suspense, useEffect, useState } from 'react'
import KlinikAracKabugu from './KlinikAracKabugu'
import KlinikBolumHome from './KlinikBolumHome'
import KlinikKohortPanel from './KlinikKohortPanel'
import KlinikHastaPortaliPaneli from './KlinikHastaPortaliPaneli'
import EnabizMasa from '@/components/doktor/EnabizMasa'
import type { AracVurgu } from '@/lib/doktor/aracUi'
import { klinikMevzuat, klinikMevzuatOzet, KLINIK_ORTAK_KANUNLAR, KLINIK_ORTAK_KAYIT } from '@/lib/klinik/klinikMevzuat'
import { KLINIK_ETIKET } from '@/lib/specialties/klinikDikey'

const V: Record<string, AracVurgu> = {
  sac: { ana: '#2563EB', anaMetin: '#EFF6FF', yumusak: '#2563EB', baslik: '#2563EB' },
  est: { ana: '#9333EA', anaMetin: '#FAF5FF', yumusak: '#7E22CE', baslik: '#7E22CE' },
  cer: { ana: '#E91E8C', anaMetin: '#FDF2F8', yumusak: '#BE185D', baslik: '#BE185D' },
  derm: { ana: '#F59E0B', anaMetin: '#FFFBEB', yumusak: '#B45309', baslik: '#B45309' },
  long: { ana: '#059669', anaMetin: '#ECFDF5', yumusak: '#047857', baslik: '#047857' },
  fiz: { ana: '#0EA5E9', anaMetin: '#F0F9FF', yumusak: '#0369A1', baslik: '#0369A1' },
  psi: { ana: '#6366F1', anaMetin: '#EEF2FF', yumusak: '#4F46E5', baslik: '#4F46E5' },
  diy: { ana: '#10B981', anaMetin: '#ECFDF5', yumusak: '#047857', baslik: '#047857' },
  erg: { ana: '#8B5CF6', anaMetin: '#F5F3FF', yumusak: '#6D28D9', baslik: '#6D28D9' },
  ody: { ana: '#F97316', anaMetin: '#FFF7ED', yumusak: '#C2410C', baslik: '#C2410C' },
}

const META: Record<string, { slug: string; etiket: string; baslik: string; aciklama: string; vurgu: AracVurgu }> = {
  '/ozel-branslar/hasta-portali': { slug: 'sac-ekimi', etiket: 'Özel Branşlar', baslik: 'Hasta Portalı', aciklama: 'Aynı Sağlığım kabuğu — PIN + link. TUS bölümü yok.', vurgu: V.sac },
  '/ozel-branslar/kayit-kvkk': { slug: 'sac-ekimi', etiket: 'Özel Branşlar', baslik: 'Kayıt · rıza · KVKK', aciklama: 'SB / Hasta Hakları / KVKK — dalınıza göre zorunlu evrak.', vurgu: V.sac },
  '/ozel-branslar/enabiz': { slug: 'sac-ekimi', etiket: 'Özel Branşlar', baslik: 'e-Nabız', aciklama: 'e-Nabız’a siz girersiniz; Notya alanları kopyalamaya hazırlar.', vurgu: V.sac },
  '/ozel-branslar/sac-greft': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Donör greft bandı', aciklama: 'Karar desteği. Nihai greft hekimindir.', vurgu: V.sac },
  '/ozel-branslar/sac-takvim': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Yıkama takvimi', aciklama: '1 / 3 / 10 / 14. gün vadeleri.', vurgu: V.sac },
  '/ozel-branslar/sac-kohort': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Saç ekimi kohort', aciklama: 'Yıkama ve kontrol vadeleri. Tek dokunuşla hatırlatma.', vurgu: V.sac },
  '/ozel-branslar/cerrahi-onam': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Elektif onam / soğuma', aciklama: 'Kesi ve implant yok.', vurgu: V.cer },
  '/ozel-branslar/cerrahi-takvim': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Ameliyat sonrası takvim', aciklama: '1 / 7 / 14 / 42. gün.', vurgu: V.cer },
  '/ozel-branslar/cerrahi-kohort': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Estetik cerrahi kohort', aciklama: 'Soğuma ve geç izlem.', vurgu: V.cer },
  '/ozel-branslar/estetik-soguma': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Onam / soğuma', aciklama: 'Ayakta Teşhis kaydı. Doz yok.', vurgu: V.est },
  '/ozel-branslar/estetik-takvim': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'İşlem bakım takvimi', aciklama: '1 / 14 / 28. gün.', vurgu: V.est },
  '/ozel-branslar/estetik-kohort': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Estetik kohort', aciklama: 'Soğuma ve kontrol vadeleri.', vurgu: V.est },
  '/ozel-branslar/derm-lazer': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Lazer seans vadesi', aciklama: 'Fluence ve tanı yok.', vurgu: V.derm },
  '/ozel-branslar/derm-takvim': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Akne bakım takvimi', aciklama: '2 / 6 / 12. hafta.', vurgu: V.derm },
  '/ozel-branslar/derm-kohort': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Klinik dermatoloji kohort', aciklama: 'Seans vadesi ve 112.', vurgu: V.derm },
  '/ozel-branslar/long-vade': { slug: 'longevity', etiket: 'Longevity', baslik: 'Sonraki seans vadesi', aciklama: 'Karışım ve doz yazılmaz.', vurgu: V.long },
  '/ozel-branslar/long-guvenlik': { slug: 'longevity', etiket: 'Longevity', baslik: 'IV güvenlik kaydı', aciklama: 'Lot / alerji / 112 — karışım yok.', vurgu: V.long },
  '/ozel-branslar/long-kohort': { slug: 'longevity', etiket: 'Longevity', baslik: 'Longevity kohort', aciklama: 'Seans vadesi ve 112 bayrağı.', vurgu: V.long },
  '/ozel-branslar/fizyo-icf': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'ICF seans özeti', aciklama: 'Hekim tanısı zorunlu.', vurgu: V.fiz },
  '/ozel-branslar/fizyo-seans': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Seans vadesi', aciklama: 'SGK hak iddiası yok.', vurgu: V.fiz },
  '/ozel-branslar/fizyo-kohort': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Fizyoterapi kohort', aciklama: 'Geciken seans ve tanı referansı.', vurgu: V.fiz },
  '/ozel-branslar/psikolog-seans': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Seans çerçevesi', aciklama: 'Tıbbi tanı ve reçete yok.', vurgu: V.psi },
  '/ozel-branslar/psikolog-vade': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Seans vadesi', aciklama: 'Skor yorumu yok.', vurgu: V.psi },
  '/ozel-branslar/psikolog-kohort': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Klinik psikoloji kohort', aciklama: 'Seans ve kriz bayrağı.', vurgu: V.psi },
  '/ozel-branslar/diyet-makro': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Makro bandı', aciklama: 'Takviye dozu yok.', vurgu: V.diy },
  '/ozel-branslar/diyet-takvim': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Kontrol takvimi', aciklama: '2 / 4 / 8. hafta.', vurgu: V.diy },
  '/ozel-branslar/diyet-kohort': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Diyetisyen kohort', aciklama: 'Kontrol vadesi ve tanı referansı.', vurgu: V.diy },
  '/ozel-branslar/ergo-gya': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'GYA özeti', aciklama: 'Neyzi / tanı yok.', vurgu: V.erg },
  '/ozel-branslar/ergo-seans': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'GYA seans vadesi', aciklama: 'Motor skor yok.', vurgu: V.erg },
  '/ozel-branslar/ergo-kohort': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'Ergoterapi kohort', aciklama: 'Seans ve GYA odak.', vurgu: V.erg },
  '/ozel-branslar/odyo-esik': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Eşik kaydı', aciklama: 'İşitme kaybı tanısı değil.', vurgu: V.ody },
  '/ozel-branslar/odyo-oda': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Sessiz oda kaydı', aciklama: 'md.11 ≥3 m².', vurgu: V.ody },
  '/ozel-branslar/odyo-kohort': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Odyoloji kohort', aciklama: 'Eşik, cihaz ve ani işitme.', vurgu: V.ody },
}

const PANEL: Record<string, string> = {
  '/ozel-branslar/sac-greft': 'sac',
  '/ozel-branslar/sac-takvim': 'sac',
  '/ozel-branslar/cerrahi-onam': 'cerrahi',
  '/ozel-branslar/cerrahi-takvim': 'cerrahi',
  '/ozel-branslar/estetik-soguma': 'estetik',
  '/ozel-branslar/estetik-takvim': 'estetik',
  '/ozel-branslar/derm-lazer': 'derm',
  '/ozel-branslar/derm-takvim': 'derm',
  '/ozel-branslar/long-vade': 'long',
  '/ozel-branslar/long-guvenlik': 'long-guvenlik',
  '/ozel-branslar/fizyo-icf': 'fizyo',
  '/ozel-branslar/fizyo-seans': 'fizyo',
  '/ozel-branslar/psikolog-seans': 'psik',
  '/ozel-branslar/psikolog-vade': 'psik-vade',
  '/ozel-branslar/diyet-makro': 'diyet',
  '/ozel-branslar/diyet-takvim': 'diyet-takvim',
  '/ozel-branslar/ergo-gya': 'ergo',
  '/ozel-branslar/ergo-seans': 'ergo-seans',
  '/ozel-branslar/odyo-esik': 'odyo',
  '/ozel-branslar/odyo-oda': 'odyo-oda',
}

function KayitKvkkPanel() {
  const [slug, setSlug] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      try {
        const raw = localStorage.getItem('auth-token')
        const t = raw ? (JSON.parse(raw).access_token || '') : ''
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        setSlug(String(j?.data?.specialty || ''))
      } catch {
        setSlug('')
      }
    })()
  }, [])
  const m = klinikMevzuat(slug)
  return (
    <div style={{ fontSize: 13, color: '#3b2e24', lineHeight: 1.5 }}>
      <p style={{ color: '#8b7d70', marginTop: 0 }}>{klinikMevzuatOzet(slug) || 'Dal çözülmedi — ortak KVKK / kayıt omurgası.'}</p>
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>Ortak kanunlar</h2>
      <ul>{KLINIK_ORTAK_KANUNLAR.map((k) => <li key={k}>{k}</li>)}</ul>
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>Ortak kayıt</h2>
      <ul>{KLINIK_ORTAK_KAYIT.map((k) => <li key={k}>{k}</li>)}</ul>
      {m && (
        <>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>{KLINIK_ETIKET[m.slug]} — rıza</h2>
          <ul>{m.riza.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>Kayıt</h2>
          <ul>{m.kayit.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>KVKK</h2>
          <ul>{m.kvkk.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>Yasak</h2>
          <ul>{m.yasak.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, margin: '16px 0 8px' }}>Hizmet kalitesi</h2>
          <ul>{m.qos.map((k) => <li key={k}>{k}</li>)}</ul>
        </>
      )}
    </div>
  )
}

export default function KlinikAracSayfa({ route }: { route: string }) {
  const m = META[route]
  if (!m) return null
  return (
    <KlinikAracKabugu route={route} baslik={m.baslik} aciklama={m.aciklama} etiket={m.etiket} vurgu={m.vurgu}>
      {route === '/ozel-branslar/hasta-portali' ? <KlinikHastaPortaliPaneli /> : route === '/ozel-branslar/enabiz' ? <Suspense fallback={null}><EnabizMasa gizliBaslik /></Suspense> : route === '/ozel-branslar/kayit-kvkk' ? <KayitKvkkPanel /> : route.endsWith('-kohort') ? <KlinikKohortPanel /> : <KlinikBolumHome slug={m.slug} panel={PANEL[route]} />}
    </KlinikAracKabugu>
  )
}
