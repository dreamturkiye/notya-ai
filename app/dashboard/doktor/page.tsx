"use client"

export const dynamic = 'force-dynamic'

/**
 * NOTYA-YENI-GORUNUM-01 (Kaan, 2026-09-22) — Ana sayfa, new chrome.
 *
 * Every data fetch, every piece of state, every real feature from the previous version is kept
 * verbatim — gün programı with per-randevu briefing, KPI counts, recent notes, weekly summary,
 * BekleyenKonsultasyonOzeti, the avatar/hafıza greeting. Only the visual
 * language changed: warm cream/paper/pine instead of dark navy, Fraunces + Source Sans instead
 * of system-ui, real inline SVG instead of emoji. The header/dock chrome itself now lives in
 * layout.tsx — this page is just its content.
 *
 * New: NotyaFisildiyor — the single most overdue pediatri flag, real data (see that component's
 * own header for how "clears itself by being resolved" works).
 */

import BekleyenKonsultasyonOzeti from '@/components/doktor/BekleyenKonsultasyonOzeti'
import NotyaFisildiyor from '@/components/doktor/NotyaFisildiyor'
import HazirMesajlar from '@/components/doktor/iletisim/HazirMesajlar'
import GelenBelgelerKarti from '@/components/doktor/gelenBelgeler/GelenBelgelerKarti'
import { CHROME_RENK, CHROME_FONT, gunKickerTRT } from '@/lib/doktor/chromeTheme'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy'
import { PERSONAS, varsayilanPersonaId } from '@/lib/asistan/personaEngine'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
import { muayeneFormuYolu } from '@/lib/doktor/muayeneFormuYolu'

interface KpiData {
  bugunkuMuayene: number
  bekleyenOnay: number
  buAyToplam: number
  aktifHasta: number
}

interface RandevuOzet {
  id: string
  baslangic: string
  hastaAdi: string
  tur: string
  durum: string
}

interface ProgramSatiri {
  id: string
  baslangic: string
  tur: string
  durum: string
  hastaAdi: string
  patientId: string | null
  yeniHasta: boolean
  brifing: string
  isaretler: string[]
}
const TUR_ETIKET: Record<string, string> = { ilk_muayene: 'İlk muayene', muayene: 'Muayene', kontrol: 'Kontrol', diger: 'Diğer' }

interface NoteItem {
  id: string
  specialty: string
  date: string
  hastaAdi?: string
  content_subjektif: string
  approved_at?: string
}

interface MesajOzet {
  id: string
  patientId: string
  hastaAdi: string
  ozet: string
  sonMesajAt: string
}

const DURUM_RENK: { [key: string]: { label: string; color: string; bg: string } } = {
  planlandi: { label: 'Planlandı', color: CHROME_RENK.pine, bg: 'rgba(47,67,52,0.1)' },
  onaylandi: { label: 'Onaylandı', color: '#3F7D4A', bg: 'rgba(63,125,74,0.12)' },
  tamamlandi: { label: 'Tamamlandı', color: CHROME_RENK.muted, bg: 'rgba(139,125,112,0.14)' },
  iptal: { label: 'İptal', color: CHROME_RENK.warn, bg: 'rgba(164,91,62,0.12)' },
  gelmedi: { label: 'Gelmedi', color: '#B4832F', bg: 'rgba(180,131,47,0.12)' },
}

function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}
function trtGunAnahtari(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}
function trtSaatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}
function trtGorelZaman(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime()
  const saat = Math.floor(fark / 3600_000)
  if (saat < 1) return 'az önce'
  if (saat < 24) return `${saat} saat önce`
  const gun = Math.floor(saat / 24)
  return gun === 1 ? 'dün' : `${gun} gün önce`
}
function buHaftaninGunleri(): Date[] {
  const bugun = new Date()
  const haftaIcindekiIndex = (bugun.getDay() + 6) % 7
  const pazartesi = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - haftaIcindekiIndex)
  return Array.from({ length: 7 }, (_, i) => new Date(pazartesi.getFullYear(), pazartesi.getMonth(), pazartesi.getDate() + i))
}

/** Real inline stroke icons — no emoji, one hand, consistent 1.7 weight. */
function Ikon({ ad, boyut = 22 }: { ad: string; boyut?: number }) {
  const ortak = { width: boyut, height: boyut, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (ad) {
    case 'takvim': return <svg {...ortak}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
    case 'asistan': return <svg {...ortak}><rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9 20.5h6" /></svg>
    case 'hastaEkle': return <svg {...ortak}><circle cx="10" cy="8.5" r="3.5" /><path d="M4 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" /><path d="M18.5 8v5M16 10.5h5" /></svg>
    case 'belge': return <svg {...ortak}><path d="M7 3.5h7l4 4V19a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 19V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4.5" /></svg>
    case 'inceleme': return <svg {...ortak}><rect x="4.5" y="4.5" width="15" height="16" rx="2.5" /><path d="m8.6 13.6 2.2 2.2 4.6-4.8" /></svg>
    case 'araclar': return <svg {...ortak}><path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" /><circle cx="15" cy="7.5" r="2.2" /><circle cx="9" cy="16.5" r="2.2" /></svg>
    case 'raporlar': return <svg {...ortak}><path d="M4.5 20V4.5M4.5 20H20" /><path d="M8.5 16.5v-5M12.5 16.5V8M16.5 16.5v-8.5" /></svg>
    default: return null
  }
}

export default function DoktorDashboard() {
  const router = useRouter()
  const [doktorAdi, setDoktorAdi] = useState('Doktor')
  const [ayseAcilis, setAyseAcilis] = useState<string>('')
  const [asistanKisaAd, setAsistanKisaAd] = useState('Ayşe')
  const [specialty, setSpecialty] = useState('')
  const [kpi, setKpi] = useState<KpiData>({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([])
  const [haftalikRandevular, setHaftalikRandevular] = useState<RandevuOzet[]>([])
  const [gunProgrami, setGunProgrami] = useState<ProgramSatiri[] | null>(null)
  const [randevuGorunumu, setRandevuGorunumu] = useState<'bugun' | 'hafta'>('bugun')
  const [randevuYukleniyor, setRandevuYukleniyor] = useState(true)
  const [loading, setLoading] = useState(true)
  const [pediatriAraci, setPediatriAraci] = useState(false)
  const [yeniMesajlar, setYeniMesajlar] = useState<MesajOzet[]>([])

  useEffect(() => {
    // Cached name from a previous session -- read after mount only, never during the initial
    // render, so the client's first paint matches the server's (no localStorage there) and
    // hydration never mismatches. The real fetch below still overwrites this with fresh data.
    try { const c = localStorage.getItem('notya_doktor_name'); if (c) setDoktorAdi(c) } catch {}
  }, [])

  useEffect(() => {
    const initDashboard = async () => {
      const token = await ensureDoctorAccessToken()
      if (!token) { router.push(DOKTOR_GIRIS); return }

      try {
        const meRes = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        fetch('/api/doktor/hafiza', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => { if (j?.gun?.metin) setAyseAcilis(String(j.gun.metin)) })
          .catch(() => {})
        if (meRes.status === 401) { router.push(DOKTOR_GIRIS); return }
        if (meRes.ok) {
          const meData = await meRes.json()
          const ham = meData.data?.full_name || meData.data?.email?.split('@')[0] || 'Doktor'
          const name = ham.replace(/^\s*(?:(?:Prof|Doç|Uzm|Op|Dr|Dt)\.?\s+)+/i, '').trim() || ham
          setDoktorAdi(name); try { localStorage.setItem('notya_doktor_name', name) } catch {}
          setSpecialty(String(meData.data?.specialty || ''))
          setPediatriAraci(pediatriHedefBoyBransi(meData.data?.specialty))
          const personaId = varsayilanPersonaId(meData.data?.specialty)
          setAsistanKisaAd(PERSONAS[personaId]?.shortName || 'Ayşe')
        }
      } catch {}

      try {
        const raporRes = await fetch('/api/doktor/raporlar', { headers: { Authorization: `Bearer ${token}` } })
        if (raporRes.ok) {
          const raporData = await raporRes.json()
          const src = raporData?.data && typeof raporData.data === 'object' ? raporData.data : raporData
          setKpi({
            bugunkuMuayene: Number(src.bugunkuMuayene ?? src.buAyMuayene ?? 0) || 0,
            bekleyenOnay: Number(src.bekleyenOnay ?? src.bekleyen ?? 0) || 0,
            buAyToplam: Number(src.buAyToplam ?? src.buAyMuayene ?? src.toplamMuayene ?? 0) || 0,
            aktifHasta: Number(src.aktifHasta ?? 0) || 0,
          })
        } else {
          setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
        }
      } catch {
        setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
      }

      fetch('/api/doktor/gun-programi', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j?.program) setGunProgrami(j.program as ProgramSatiri[]) })
        .catch(() => {})
      try {
        const haftaGunleri = buHaftaninGunleri()
        const baslangic = new Date(yerelGunAnahtari(haftaGunleri[0]) + 'T00:00:00+03:00')
        const bitis = new Date(yerelGunAnahtari(haftaGunleri[6]) + 'T23:59:59+03:00')
        const rRes = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (rRes.ok) {
          const rData = await rRes.json()
          const sirali = (rData.randevular || [])
            .filter((r: RandevuOzet) => r.durum !== 'iptal')
            .sort((a: RandevuOzet, b: RandevuOzet) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime())
          setHaftalikRandevular(sirali)
        }
      } catch {
        setHaftalikRandevular([])
      } finally {
        setRandevuYukleniyor(false)
      }

      try {
        const snRes = await fetch('/api/doktor/son-notlar', { headers: { Authorization: `Bearer ${token}` } })
        if (snRes.ok) {
          const sn = await snRes.json()
          type SnSatir = { id: string; created_at: string; specialty: string; hastaAdi: string; ozet: string; approved_at?: string | null }
          setRecentNotes(((sn.notlar || []) as SnSatir[]).map((n) => ({
            id: n.id,
            specialty: n.specialty || 'genel',
            date: new Date(n.created_at).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }),
            hastaAdi: n.hastaAdi || '',
            content_subjektif: n.ozet || '',
            approved_at: n.approved_at || undefined,
          })))
        }
      } catch {
        setRecentNotes([])
      }

      // NOTYA-FISILTI-MESAJ (Kaan, 2026-09-24): unread patient-portal messages, right on Ana Sayfa --
      // "Bugün" was showing only randevular before; new messages belong in that same at-a-glance zone.
      fetch('/api/doktor/mesajlar?unread=1', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (Array.isArray(j?.threads)) setYeniMesajlar(j.threads.slice(0, 4)) })
        .catch(() => {})

      setLoading(false)
    }
    initDashboard()
  }, [router])

  const todayFull = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })

  const bugunkuRandevular = useMemo(
    () => haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === trtGunAnahtari(new Date())),
    [haftalikRandevular]
  )

  const S = (s: Record<string, unknown>) => s as React.CSSProperties
  const card: React.CSSProperties = { background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 20, boxShadow: '0 16px 34px rgba(58,44,34,0.06)' }

  return (
    <div className="yg-ana" style={S({ display: 'flex', flexDirection: 'column', gap: 22 })}>
      <style>{`@keyframes nabizYg { 0%,100%{opacity:1} 50%{opacity:.4} } .yg-satir:hover, .yg-karo:hover, .yg-rv:hover { background: rgba(47,67,52,0.05) !important; }
        @media (max-width: 899px) {
          .yg-alt, .yg-hafta { display: contents !important; }
          .yg-mesaj, .yg-kpi, .yg-erisim, .yg-notlar, .yg-ozet { order: 1; }
          .yg-fisilti { order: 0; margin-top: 0 !important; }
        }`}</style>

      {/* Kicker + title */}
      <div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, color: '#6d6055', marginBottom: 2 })}>{gunKickerTRT()}, {todayFull}</div>
        <h1 style={S({ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 'clamp(28px, 8vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.05, color: '#2e251d', margin: 0 })}>
          Hoş geldiniz, Dr. {doktorAdi}
        </h1>
        {ayseAcilis && (
          <div style={S({ marginTop: 12, fontSize: 15, color: CHROME_RENK.ink, lineHeight: 1.55, maxWidth: 720 })}>
            <span style={S({ color: CHROME_RENK.pine, fontWeight: 700 })}>{asistanKisaAd}:</span> {ayseAcilis}
          </div>
        )}
      </div>

      {/* Hızlı araçlar — compact links, moved up here (was inside Bu Hafta Özeti); fısıltı now
          sits under Bu Hafta Özeti instead (Kaan, 2026-09-24) */}
      <div style={S({ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '14px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' })}>
        <span style={S({ fontSize: 12, fontWeight: 700, color: '#4A4030', textTransform: 'uppercase', letterSpacing: '0.04em' })}>Hızlı araçlar</span>
        <span onClick={() => router.push('/doktor-tools/epikriz')} style={S({ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, cursor: 'pointer' })}>Epikriz üret ›</span>
        <span onClick={() => router.push('/doktor-tools/icd10')} style={S({ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, cursor: 'pointer' })}>ICD-10 kodla ›</span>
        {pediatriAraci && (
          <span onClick={() => router.push('/doktor-tools/hedef-boy')} style={S({ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, cursor: 'pointer' })}>Hedef boy ›</span>
        )}
      </div>

      {/* NOTYA-ILETISIM-01: prepared patient messages — hidden when there are none */}
      <HazirMesajlar />

      {/* NOTYA-GELEN-BELGELER: "N yeni belge" — hidden when 0 */}
      <GelenBelgelerKarti />

      <BekleyenKonsultasyonOzeti />

      {/* Randevular — Bugün / Bu Hafta */}
      <div className="yg-takvim">
        <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 })}>
          <div style={S({ display: 'flex', background: '#EFE9DC', borderRadius: 11, padding: 4, gap: 2 })}>
            {([['bugun', 'Bugün'], ['hafta', 'Bu Hafta']] as const).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setRandevuGorunumu(k)}
                style={S({ background: randevuGorunumu === k ? CHROME_RENK.pine : 'transparent', border: 'none', color: randevuGorunumu === k ? '#FAF8F4' : '#4A4030', fontWeight: randevuGorunumu === k ? 700 : 600, borderRadius: 8, padding: '9px 18px', fontSize: 13.5, cursor: 'pointer' })}>
                {v}
              </button>
            ))}
          </div>
          <div style={S({ display: 'flex', gap: 8, flexWrap: 'wrap' })}>
            <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={S({ background: 'transparent', border: `1.5px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 999, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' })}>Takvimi aç</button>
            <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={S({ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' })}>+ Randevu ekle</button>
          </div>
        </div>

        <div style={S({ ...card, padding: '6px 20px' })}>
          {randevuYukleniyor ? (
            <div style={S({ padding: '14px 0' })}>
              {Array.from({ length: 2 }).map((_, i) => <div key={i} style={S({ height: 44, background: '#EFE9DC', borderRadius: 10, marginBottom: 8, animation: 'nabizYg 1.5s infinite' })} />)}
            </div>
          ) : randevuGorunumu === 'bugun' ? (
            gunProgrami && gunProgrami.length > 0 ? (
              <div style={S({ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' })}>
                {gunProgrami.map((p) => {
                  const durumBilgi = DURUM_RENK[p.durum] || DURUM_RENK.planlandi
                  const gecti = new Date(p.baslangic).getTime() < Date.now()
                  const hedef = p.patientId ? `/dashboard/doktor/hastalar/${p.patientId}` : '/dashboard/doktor/randevular'
                  return (
                    <div key={p.id} className="yg-rv" onClick={() => router.push(hedef)}
                      style={S({ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'start', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '12px 16px', cursor: 'pointer', opacity: gecti && p.durum === 'tamamlandi' ? 0.55 : 1 })}>
                      <div style={S({ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', paddingTop: 2, color: CHROME_RENK.ink })}>{trtSaatStr(p.baslangic)}</div>
                      <div style={S({ minWidth: 0 })}>
                        <div style={S({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' })}>
                          <span style={S({ fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink })}>{p.hastaAdi}</span>
                          <span style={S({ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, color: p.yeniHasta ? '#B4832F' : '#4A5C8A', background: p.yeniHasta ? 'rgba(180,131,47,0.12)' : 'rgba(74,92,138,0.1)' })}>{p.yeniHasta ? 'Yeni hasta' : TUR_ETIKET[p.tur] || p.tur}</span>
                          <span style={S({ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg })}>{durumBilgi.label}</span>
                        </div>
                        {p.brifing && <div style={S({ fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.5, marginTop: 4 })}>{p.brifing}</div>}
                        {p.isaretler.length > 0 && (
                          <div style={S({ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 })}>
                            {p.isaretler.map((i) => (
                              <span key={i} style={S({ fontSize: 11, color: i.startsWith('alerji') ? CHROME_RENK.warn : CHROME_RENK.muted, background: '#F6F0E4', borderRadius: 6, padding: '2px 8px' })}>{i}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : bugunkuRandevular.length > 0 ? (
              <div style={S({ display: 'flex', gap: 10, overflowX: 'auto', padding: '14px 0', WebkitOverflowScrolling: 'touch' })}>
                {bugunkuRandevular.map((rv) => {
                  const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                  const gecmis = new Date(rv.baslangic).getTime() < Date.now()
                  return (
                    <div key={rv.id} className="yg-rv" onClick={() => router.push('/dashboard/doktor/randevular')}
                      style={S({ flex: '0 0 auto', minWidth: 158, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '12px 16px', cursor: 'pointer', opacity: gecmis && rv.durum === 'tamamlandi' ? 0.6 : 1 })}>
                      <div style={S({ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: CHROME_RENK.ink })}>{trtSaatStr(rv.baslangic)}</div>
                      <div style={S({ fontSize: 13, color: CHROME_RENK.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, maxWidth: 160 })}>{rv.hastaAdi}</div>
                      <div style={S({ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, marginTop: 6 })}>{durumBilgi.label}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={S({ padding: '16px 0', fontSize: 14, color: CHROME_RENK.muted })}>
                {kpi.bugunkuMuayene > 0 ? `Bugün ${kpi.bugunkuMuayene} muayene yapıldı, planlı randevu yok` : 'Bugün için randevu yok'}
              </div>
            )
          ) : haftalikRandevular.length === 0 ? (
            <div style={S({ padding: '16px 0', fontSize: 14, color: CHROME_RENK.muted })}>Bu hafta için randevu yok</div>
          ) : (
            <div style={S({ padding: '10px 0' })}>
              {buHaftaninGunleri().map((gunTarihi) => {
                const anahtar = yerelGunAnahtari(gunTarihi)
                const guninRandevulari = haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === anahtar)
                if (guninRandevulari.length === 0) return null
                const bugunMu = anahtar === trtGunAnahtari(new Date())
                const gunEtiketi = gunTarihi.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
                return (
                  <div key={anahtar} style={S({ padding: '10px 0', borderBottom: `1px solid ${CHROME_RENK.border}` })}>
                    <div style={S({ fontSize: 12, color: bugunMu ? CHROME_RENK.pine : CHROME_RENK.muted, fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' })}>
                      {bugunMu ? `Bugün · ${gunEtiketi}` : gunEtiketi}
                    </div>
                    <div style={S({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                      {guninRandevulari.map((rv) => {
                        const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                        return (
                          <div key={rv.id} className="yg-satir" onClick={() => router.push('/dashboard/doktor/randevular')} style={S({ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 })}>
                            <span style={S({ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 46, color: CHROME_RENK.ink })}>{trtSaatStr(rv.baslangic)}</span>
                            <span style={S({ fontSize: 13, color: CHROME_RENK.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{rv.hastaAdi}</span>
                            <span style={S({ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' })}>{durumBilgi.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Yeni mesajlar — hasta portalından gelen, henüz okunmamış konular; "Bugün" alanının hemen
          altında, sadece randevuların değil (Kaan, 2026-09-24) */}
      {yeniMesajlar.length > 0 && (
        <div className="yg-mesaj">
          <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 })}>
            <div style={S({ fontSize: 14, fontWeight: 700, color: '#4A4030', textTransform: 'uppercase', letterSpacing: '0.04em' })}>Yeni mesajlar</div>
            <span onClick={() => router.push('/dashboard/doktor/mesajlar')} style={S({ fontSize: 13, color: CHROME_RENK.pine, fontWeight: 600, cursor: 'pointer' })}>Tümünü gör ›</span>
          </div>
          <div style={S({ ...card, padding: '6px 20px' })}>
            {yeniMesajlar.map((m, idx) => (
              <div key={m.id} className="yg-satir" onClick={() => router.push(`/dashboard/doktor/mesajlar?konu=${m.id}`)}
                style={S({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: idx < yeniMesajlar.length - 1 ? `1px solid ${CHROME_RENK.border}` : 'none', cursor: 'pointer', borderRadius: 8 })}>
                <span style={S({ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: CHROME_RENK.warn })} />
                <span style={S({ flex: 1, minWidth: 0 })}>
                  <span style={S({ display: 'block', fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink })}>{m.hastaAdi}</span>
                  <span style={S({ display: 'block', fontSize: 13, color: CHROME_RENK.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{m.ozet}</span>
                </span>
                <span style={S({ fontSize: 11, color: CHROME_RENK.muted, flexShrink: 0, whiteSpace: 'nowrap' })}>{trtGorelZaman(m.sonMesajAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI kartları */}
      <div className="yg-kpi" style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 })}>
        {[
          { label: 'Bugünkü muayene', value: kpi.bugunkuMuayene, color: CHROME_RENK.pine, sub: 'hasta bugün' },
          { label: 'Bekleyen onay', value: kpi.bekleyenOnay, color: '#B4832F', sub: 'not onayı bekliyor', git: '/dashboard/doktor/inceleme' },
          { label: 'Bu ay toplam', value: kpi.buAyToplam, color: '#4A5C8A', sub: 'muayene bu ay' },
          { label: 'Aktif hasta', value: kpi.aktifHasta, color: CHROME_RENK.pine, sub: 'kayıtlı aktif hasta', git: '/dashboard/doktor/hastalar' },
        ].map((c, i) => (
          <div key={i} onClick={c.git ? () => router.push(c.git!) : undefined}
            style={S({ ...card, padding: '22px', cursor: c.git ? 'pointer' : 'default' })}>
            <div style={S({ fontSize: 13, color: CHROME_RENK.muted })}>{c.label}</div>
            {loading ? (
              <div style={S({ height: 40, width: 60, background: '#EFE9DC', borderRadius: 8, margin: '10px 0 6px', animation: 'nabizYg 1.5s infinite' })} />
            ) : (
              <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 40, fontWeight: 600, color: c.color, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', margin: '4px 0 2px' })}>{c.value}</div>
            )}
            <div style={S({ fontSize: 12, color: CHROME_RENK.muted })}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Hızlı erişim */}
      <div className="yg-erisim">
        <div style={S({ fontSize: 14, fontWeight: 700, color: '#4A4030', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' })}>Hızlı erişim</div>
        <div style={S({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 })}>
          {[
            { ikon: 'takvim', text: 'Randevular', path: '/dashboard/doktor/randevular' },
            { ikon: 'asistan', text: 'Asistanı Aç', path: '/asistan' },
            { ikon: 'hastaEkle', text: 'Hasta Ekle', path: '/dashboard/doktor/hasta-ekle' },
            pediatriAraci ? { ikon: 'araclar', text: 'Hedef Boy', path: '/doktor-tools/hedef-boy' } : { ikon: 'araclar', text: 'Araçlar', path: '/doktor-tools' },
            { ikon: 'belge', text: 'Belge Yükle', path: '/dashboard/doktor/belgeler' },
            { ikon: 'inceleme', text: 'İnceleme', path: '/dashboard/doktor/inceleme' },
            { ikon: 'raporlar', text: 'Raporlar', path: '/dashboard/doktor/raporlar' },
          ].map((karo) => (
            <button key={karo.text} type="button" className="yg-karo" onClick={() => router.push(karo.path)}
              style={S({ ...card, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '16px', cursor: 'pointer', color: CHROME_RENK.ink, textAlign: 'left' })}>
              <span style={S({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: '#E4F3F1', color: CHROME_RENK.pine })}>
                <Ikon ad={karo.ikon} />
              </span>
              <span style={S({ fontSize: 13.5, fontWeight: 600 })}>{karo.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Onay Bekleyen Muayene Notları + Bu hafta özeti. NOTYA-DASHBOARD-BEKLEYEN-01 (Kaan, 2026-09-24):
          panel "Son notlar" idi ve durumdan bağımsız gösteriyordu -- bir ONAYLI notu tıklayıp jenerik
          İnceleme Kuyruğu'na düşmek (o not zaten kuyrukta olmadığı için "bekleyen not yok" görünmesi)
          kafa karıştırıyordu. API artık yalnız onay bekleyeni döndürür (son-notlar/route.ts); panel de
          hiçbir şey bekleniyorsa hiç görünmez -- boş bir "henüz not yok" kartı yerine. */}
      <div className="yg-alt" style={S({ display: 'flex', gap: 16, flexWrap: 'wrap' })}>
        {(loading || recentNotes.length > 0) && (
        <div className="yg-notlar" style={S({ flex: '1 1 280px', minWidth: 0 })}>
          <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 })}>
            <div style={S({ fontSize: 14, fontWeight: 700, color: '#4A4030', textTransform: 'uppercase', letterSpacing: '0.04em' })}>Onay bekleyen muayene notları</div>
            <span onClick={() => router.push('/dashboard/doktor/inceleme')} style={S({ fontSize: 13, color: CHROME_RENK.pine, fontWeight: 600, cursor: 'pointer' })}>Tümünü gör ›</span>
          </div>
          <div style={S({ ...card, padding: '8px 20px' })}>
            {loading ? (
              <div style={S({ padding: '12px 0' })}>
                {Array.from({ length: 3 }).map((_, i) => <div key={i} style={S({ height: 42, background: '#EFE9DC', borderRadius: 8, marginBottom: 8, animation: 'nabizYg 1.5s infinite' })} />)}
              </div>
            ) : (
              recentNotes.map((note, idx) => (
                <div key={note.id} className="yg-satir" onClick={() => router.push(muayeneFormuYolu(note.id))}
                  style={S({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: idx < recentNotes.length - 1 ? `1px solid ${CHROME_RENK.border}` : 'none', cursor: 'pointer', borderRadius: 8 })}>
                  <span style={S({ background: '#E4F3F1', color: CHROME_RENK.pine, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, flexShrink: 0 })}>{bransEtiketi(note.specialty, { kisa: true })}</span>
                  <span style={S({ flex: 1, minWidth: 0 })}>
                    <span style={S({ display: 'block', fontSize: 11, color: CHROME_RENK.muted })}>{note.date}</span>
                    <span style={S({ display: 'block', fontSize: 13, color: CHROME_RENK.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{note.hastaAdi ? <b>{note.hastaAdi} — </b> : null}{note.content_subjektif.slice(0, 70) || 'Not'}</span>
                  </span>
                  <span style={S({ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: '#B4832F' })} title="Onay bekliyor" />
                </div>
              ))
            )}
          </div>
        </div>
        )}

        <div className="yg-hafta" style={S({ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column' })}>
          <div className="yg-ozet">
          <div style={S({ fontSize: 14, fontWeight: 700, color: '#4A4030', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' })}>&nbsp;</div>
          <div style={S({ ...card, padding: '20px 20px 18px' })}>
            <div style={S({ fontSize: 14, fontWeight: 700, color: '#4A4030', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' })}>Bu hafta özeti</div>
            {[
              { dot: CHROME_RENK.pine, label: 'Bu hafta seans', val: kpi.buAyToplam },
              { dot: '#3F7D4A', label: 'Onaylanan not', val: Math.max(0, kpi.buAyToplam - kpi.bekleyenOnay) },
              { dot: '#B4832F', label: 'Bekleyen', val: kpi.bekleyenOnay },
            ].map((row, i) => (
              <div key={i} style={S({ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? `1px solid ${CHROME_RENK.border}` : 'none' })}>
                <span style={S({ width: 8, height: 8, background: row.dot, borderRadius: '50%' })} />
                <span style={S({ flex: 1, fontSize: 14, color: CHROME_RENK.ink })}>{row.label}</span>
                <span style={S({ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: CHROME_RENK.ink })}>{row.val}</span>
              </div>
            ))}
          </div>
          </div>

          {/* Phone: directly under today's calendar. Desktop: stays under Bu Hafta Özeti. */}
          <div className="yg-fisilti" style={S({ marginTop: 16 })}>
            <NotyaFisildiyor specialty={specialty} />
          </div>
        </div>
      </div>

    </div>
  )
}
