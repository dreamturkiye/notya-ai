'use client'
import { useEffect, useState } from 'react'
import KlinikAracKabugu from './KlinikAracKabugu'
import KlinikBolumHome from './KlinikBolumHome'
import KlinikKohortPanel from './KlinikKohortPanel'
import KlinikHastaPortaliPaneli from './KlinikHastaPortaliPaneli'
import type { AracVurgu } from '@/lib/doktor/aracUi'
import { klinikMevzuat, klinikMevzuatOzet, KLINIK_ORTAK_KANUNLAR, KLINIK_ORTAK_KAYIT } from '@/lib/klinik/klinikMevzuat'

const V: Record<string, AracVurgu> = {
  sac: { ana: '#2563EB', anaMetin: '#EFF6FF', yumusak: '#93C5FD', baslik: '#93C5FD' },
  est: { ana: '#9333EA', anaMetin: '#FAF5FF', yumusak: '#D8B4FE', baslik: '#D8B4FE' },
  cer: { ana: '#E91E8C', anaMetin: '#FDF2F8', yumusak: '#F9A8D4', baslik: '#F9A8D4' },
  derm: { ana: '#F59E0B', anaMetin: '#FFFBEB', yumusak: '#FCD34D', baslik: '#FCD34D' },
  long: { ana: '#059669', anaMetin: '#ECFDF5', yumusak: '#6EE7B7', baslik: '#6EE7B7' },
  fiz: { ana: '#0EA5E9', anaMetin: '#F0F9FF', yumusak: '#7DD3FC', baslik: '#7DD3FC' },
  psi: { ana: '#6366F1', anaMetin: '#EEF2FF', yumusak: '#A5B4FC', baslik: '#A5B4FC' },
  diy: { ana: '#10B981', anaMetin: '#ECFDF5', yumusak: '#6EE7B7', baslik: '#6EE7B7' },
  erg: { ana: '#8B5CF6', anaMetin: '#F5F3FF', yumusak: '#C4B5FD', baslik: '#C4B5FD' },
  ody: { ana: '#F97316', anaMetin: '#FFF7ED', yumusak: '#FDBA74', baslik: '#FDBA74' },
}

const META: Record<string, { slug: string; etiket: string; baslik: string; aciklama: string; vurgu: AracVurgu }> = {
  '/klinik-tools/hasta-portali': { slug: 'sac-ekimi', etiket: 'Klinik', baslik: 'Hasta Portalı', aciklama: 'Aynı Sağlığım kabuğu — PIN + link. TUS chapter yok.', vurgu: V.sac },
  '/klinik-tools/kayit-kvkk': { slug: 'sac-ekimi', etiket: 'Klinik', baslik: 'Kayıt · rıza · KVKK', aciklama: 'SB / Hasta Hakları / KVKK — dalınıza göre zorunlu evrak.', vurgu: V.sac },
  '/klinik-tools/sac-greft': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Donör greft bandı', aciklama: 'Karar desteği. Nihai greft hekimindir.', vurgu: V.sac },
  '/klinik-tools/sac-takvim': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Yıkama takvimi', aciklama: '1 / 3 / 10 / 14. gün vadeleri.', vurgu: V.sac },
  '/klinik-tools/sac-kohort': { slug: 'sac-ekimi', etiket: 'Saç Ekimi', baslik: 'Saç ekimi kohort', aciklama: 'Yıkama ve kontrol vadeleri. 1-tap hatırlatma.', vurgu: V.sac },
  '/klinik-tools/cerrahi-onam': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Elektif onam / soğuma', aciklama: 'Kesi ve implant yok.', vurgu: V.cer },
  '/klinik-tools/cerrahi-takvim': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Ameliyat sonrası takvim', aciklama: '1 / 7 / 14 / 42. gün.', vurgu: V.cer },
  '/klinik-tools/cerrahi-kohort': { slug: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', baslik: 'Estetik cerrahi kohort', aciklama: 'Soğuma ve geç izlem.', vurgu: V.cer },
  '/klinik-tools/estetik-soguma': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Onam / soğuma', aciklama: 'Ayakta Teşhis kaydı. Doz yok.', vurgu: V.est },
  '/klinik-tools/estetik-takvim': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'İşlem bakım takvimi', aciklama: '1 / 14 / 28. gün.', vurgu: V.est },
  '/klinik-tools/estetik-kohort': { slug: 'medikal-estetik', etiket: 'Medikal Estetik', baslik: 'Estetik kohort', aciklama: 'Soğuma ve kontrol vadeleri.', vurgu: V.est },
  '/klinik-tools/derm-lazer': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Lazer seans vadesi', aciklama: 'Fluence ve tanı yok.', vurgu: V.derm },
  '/klinik-tools/derm-takvim': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Akne bakım takvimi', aciklama: '2 / 6 / 12. hafta.', vurgu: V.derm },
  '/klinik-tools/derm-kohort': { slug: 'klinik-dermatoloji', etiket: 'Dermatoloji (Klinik)', baslik: 'Klinik dermatoloji kohort', aciklama: 'Seans vadesi ve 112.', vurgu: V.derm },
  '/klinik-tools/long-vade': { slug: 'longevity', etiket: 'Longevity', baslik: 'Sonraki seans vadesi', aciklama: 'Karışım ve doz yazılmaz.', vurgu: V.long },
  '/klinik-tools/long-guvenlik': { slug: 'longevity', etiket: 'Longevity', baslik: 'IV güvenlik kaydı', aciklama: 'Lot / alerji / 112 — karışım yok.', vurgu: V.long },
  '/klinik-tools/long-kohort': { slug: 'longevity', etiket: 'Longevity', baslik: 'Longevity kohort', aciklama: 'Seans vadesi ve 112 bayrağı.', vurgu: V.long },
  '/klinik-tools/fizyo-icf': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'ICF seans özeti', aciklama: 'Hekim tanısı zorunlu.', vurgu: V.fiz },
  '/klinik-tools/fizyo-seans': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Seans vadesi', aciklama: 'SGK hak iddiası yok.', vurgu: V.fiz },
  '/klinik-tools/fizyo-kohort': { slug: 'fizyoterapi', etiket: 'Fizyoterapi', baslik: 'Fizyoterapi kohort', aciklama: 'Geciken seans ve tanı referansı.', vurgu: V.fiz },
  '/klinik-tools/psikolog-seans': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Seans çerçevesi', aciklama: 'Tıbbi tanı ve reçete yok.', vurgu: V.psi },
  '/klinik-tools/psikolog-vade': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Seans vadesi', aciklama: 'Skor yorumu yok.', vurgu: V.psi },
  '/klinik-tools/psikolog-kohort': { slug: 'klinik-psikolog', etiket: 'Klinik Psikoloji', baslik: 'Klinik psikoloji kohort', aciklama: 'Seans ve kriz bayrağı.', vurgu: V.psi },
  '/klinik-tools/diyet-makro': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Makro bandı', aciklama: 'Takviye dozu yok.', vurgu: V.diy },
  '/klinik-tools/diyet-takvim': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Kontrol takvimi', aciklama: '2 / 4 / 8. hafta.', vurgu: V.diy },
  '/klinik-tools/diyet-kohort': { slug: 'diyetisyen', etiket: 'Diyetisyen', baslik: 'Diyetisyen kohort', aciklama: 'Kontrol vadesi ve tanı referansı.', vurgu: V.diy },
  '/klinik-tools/ergo-gya': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'GYA özeti', aciklama: 'Neyzi / tanı yok.', vurgu: V.erg },
  '/klinik-tools/ergo-seans': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'GYA seans vadesi', aciklama: 'Motor skor yok.', vurgu: V.erg },
  '/klinik-tools/ergo-kohort': { slug: 'ergoterapi', etiket: 'Ergoterapi', baslik: 'Ergoterapi kohort', aciklama: 'Seans ve GYA odak.', vurgu: V.erg },
  '/klinik-tools/odyo-esik': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Eşik kaydı', aciklama: 'İşitme kaybı tanısı değil.', vurgu: V.ody },
  '/klinik-tools/odyo-oda': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Sessiz oda kaydı', aciklama: 'md.11 ≥3 m².', vurgu: V.ody },
  '/klinik-tools/odyo-kohort': { slug: 'odyoloji', etiket: 'Odyoloji', baslik: 'Odyoloji kohort', aciklama: 'Eşik, cihaz ve ani işitme.', vurgu: V.ody },
}

const PANEL: Record<string, string> = {
  '/klinik-tools/sac-greft': 'sac',
  '/klinik-tools/sac-takvim': 'sac',
  '/klinik-tools/cerrahi-onam': 'cerrahi',
  '/klinik-tools/cerrahi-takvim': 'cerrahi',
  '/klinik-tools/estetik-soguma': 'estetik',
  '/klinik-tools/estetik-takvim': 'estetik',
  '/klinik-tools/derm-lazer': 'derm',
  '/klinik-tools/derm-takvim': 'derm',
  '/klinik-tools/long-vade': 'long',
  '/klinik-tools/long-guvenlik': 'long-guvenlik',
  '/klinik-tools/fizyo-icf': 'fizyo',
  '/klinik-tools/fizyo-seans': 'fizyo',
  '/klinik-tools/psikolog-seans': 'psik',
  '/klinik-tools/psikolog-vade': 'psik-vade',
  '/klinik-tools/diyet-makro': 'diyet',
  '/klinik-tools/diyet-takvim': 'diyet-takvim',
  '/klinik-tools/ergo-gya': 'ergo',
  '/klinik-tools/ergo-seans': 'ergo-seans',
  '/klinik-tools/odyo-esik': 'odyo',
  '/klinik-tools/odyo-oda': 'odyo-oda',
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
    <div style={{ fontSize: 13, color: '#0A1628', lineHeight: 1.5 }}>
      <p style={{ color: 'rgba(10,22,40,0.6)', marginTop: 0 }}>{klinikMevzuatOzet(slug) || 'Dal çözülmedi — ortak KVKK / kayıt omurgası.'}</p>
      <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Ortak kanunlar</h2>
      <ul>{KLINIK_ORTAK_KANUNLAR.map((k) => <li key={k}>{k}</li>)}</ul>
      <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Ortak kayıt</h2>
      <ul>{KLINIK_ORTAK_KAYIT.map((k) => <li key={k}>{k}</li>)}</ul>
      {m && (
        <>
          <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{m.slug} — rıza</h2>
          <ul>{m.riza.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Kayıt</h2>
          <ul>{m.kayit.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>KVKK</h2>
          <ul>{m.kvkk.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Yasak</h2>
          <ul>{m.yasak.map((k) => <li key={k}>{k}</li>)}</ul>
          <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Hizmet kalitesi</h2>
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
      {route === '/klinik-tools/hasta-portali' ? <KlinikHastaPortaliPaneli /> : route === '/klinik-tools/kayit-kvkk' ? <KayitKvkkPanel /> : route.endsWith('-kohort') ? <KlinikKohortPanel /> : <KlinikBolumHome slug={m.slug} panel={PANEL[route]} />}
    </KlinikAracKabugu>
  )
}
