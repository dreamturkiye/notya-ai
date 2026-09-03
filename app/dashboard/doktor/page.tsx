"use client"

export const dynamic = 'force-dynamic'

/**
 * NOTYA-KOKPIT-02 — Ana sayfa: ORİJİNAL içerik ve yapı (tek doktor odaklı; karşılama,
 * Bugün/Bu Hafta randevu şeridi, 4 KPI kartı, Hızlı Erişim, Son Notlar, Hafta Özeti),
 * birinci sınıf görsel işçilikle. Grafik yok — Kaan'ın net tercihi (2026-09-02).
 *
 * Görsel dil takvim sayfasıyla aynı: iki tonlu lacivert paneller (#0D1C33), ince
 * rgba hatlar, teal vurgu, tabular rakamlar. Hızlı Erişim'deki emoji çipleri, elle
 * çizilmiş 26px stroke SVG ikonlu büyük dokunuş karolarına dönüştü — hazır ikon seti yok.
 * Veri katmanı öncekiyle birebir aynı.
 */

import DoktorNav from '@/components/doktor/DoktorNav'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'

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

interface NoteItem {
  id: string
  specialty: string
  date: string
  content_subjektif: string
  approved_at?: string
}

const specialtyColors: { [key: string]: string } = {
  pediatri: '#0F9B8E',
  kardiyoloji: '#3B82F6',
  noroloji: '#8B5CF6',
  dahiliye: '#059669',
  psikiyatri: '#7C3AED',
  dermatoloji: '#F59E0B',
  default: '#64748B'
}

const DURUM_RENK: { [key: string]: { label: string; color: string; bg: string } } = {
  planlandi: { label: 'Planlandı', color: '#0F9B8E', bg: 'rgba(15,155,142,0.15)' },
  onaylandi: { label: 'Onaylandı', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  tamamlandi: { label: 'Tamamlandı', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  iptal: { label: 'İptal', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  gelmedi: { label: 'Gelmedi', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
}

function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

/** NOTYA-TRT-01: randevu anları Türkiye gününe göre — takvimle aynı kural. */
function trtGunAnahtari(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

function trtSaatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}

function buHaftaninGunleri(): Date[] {
  const bugun = new Date()
  const haftaIcindekiIndex = (bugun.getDay() + 6) % 7
  const pazartesi = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - haftaIcindekiIndex)
  return Array.from({ length: 7 }, (_, i) => new Date(pazartesi.getFullYear(), pazartesi.getMonth(), pazartesi.getDate() + i))
}

/** Elle çizilmiş stroke ikonlar — hazır set yerine tek elden, tutarlı 1.8 kalınlık. */
function Ikon({ ad, boyut = 26 }: { ad: string; boyut?: number }) {
  const ortak = { width: boyut, height: boyut, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (ad) {
    case 'takvim':
      return <svg {...ortak}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" /></svg>
    case 'asistan':
      return <svg {...ortak}><rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9 20.5h6" /></svg>
    case 'hastaEkle':
      return <svg {...ortak}><circle cx="10" cy="8.5" r="3.5" /><path d="M4 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" /><path d="M18.5 8v5M16 10.5h5" /></svg>
    case 'belge':
      return <svg {...ortak}><path d="M7 3.5h7l4 4V19a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 19V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4.5" /><path d="M12 17v-5M9.7 14.2 12 12l2.3 2.2" /></svg>
    case 'inceleme':
      return <svg {...ortak}><rect x="4.5" y="4.5" width="15" height="16" rx="2.5" /><path d="M9 3.2h6v3H9z" /><path d="m8.6 13.6 2.2 2.2 4.6-4.8" /></svg>
    case 'araclar':
      return <svg {...ortak}><path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" /><circle cx="15" cy="7.5" r="2.2" /><circle cx="9" cy="16.5" r="2.2" /></svg>
    case 'raporlar':
      return <svg {...ortak}><path d="M4.5 20V4.5M4.5 20H20" /><path d="M8.5 16.5v-5M12.5 16.5V8M16.5 16.5v-8.5" /></svg>
    default:
      return null
  }
}

export default function DoktorDashboard() {
  const router = useRouter()
  const [doktorAdi, setDoktorAdi] = useState(() => { try { const c = localStorage.getItem('notya_doktor_name'); return c || 'Doktor' } catch { return 'Doktor' } })
  const [kpi, setKpi] = useState<KpiData>({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([])
  const [haftalikRandevular, setHaftalikRandevular] = useState<RandevuOzet[]>([])
  const [randevuGorunumu, setRandevuGorunumu] = useState<'bugun' | 'hafta'>('bugun')
  const [randevuYukleniyor, setRandevuYukleniyor] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const initDashboard = async () => {
      // NOTYA-AUTH-01: ensureDoctorAccessToken her depolama şeklini bilir ve süresi geçen
      // oturumu yeniler.
      const token = await ensureDoctorAccessToken()
      if (!token) {
        router.push(DOKTOR_GIRIS)
        return
      }

      try {
        const meRes = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        if (meRes.status === 401) { router.push(DOKTOR_GIRIS); return }
        if (meRes.ok) {
          const meData = await meRes.json()
          const ham = meData.data?.full_name || meData.data?.email?.split('@')[0] || 'Doktor'
          const name = ham.replace(/^\s*(?:(?:Prof|Doç|Uzm|Op|Dr|Dt)\.?\s+)+/i, '').trim() || ham
          setDoktorAdi(name); try { localStorage.setItem('notya_doktor_name', name) } catch {}
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

      // NOTYA-RANDEVU-03: bugün + bu hafta TEK istekte; aralıklar TRT.
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
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: notesData } = await supabase
          .from('notes')
          .select('id, specialty, created_at, content_subjektif, approved_at')
          .order('created_at', { ascending: false })
          .limit(5)
        if (notesData) {
          setRecentNotes(notesData.map((n: { id: string; specialty: string; created_at: string; content_subjektif: string; approved_at?: string }) => ({
            id: n.id,
            specialty: n.specialty || 'genel',
            date: new Date(n.created_at).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }),
            content_subjektif: n.content_subjektif || '',
            approved_at: n.approved_at,
          })))
        }
      } catch {
        setRecentNotes([])
      }

      setLoading(false)
    }
    initDashboard()
  }, [router])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })

  const bugunkuRandevular = useMemo(
    () => haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === trtGunAnahtari(new Date())),
    [haftalikRandevular]
  )

  const getSpecialtyColor = (spec: string) => specialtyColors[spec.toLowerCase()] || specialtyColors.default

  const panel: React.CSSProperties = {
    background: '#0D1C33',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
  }

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', color: '#EDF1F7' }}>
      <style>{`
        @keyframes girisim { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes nabiz { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .ev-karo:hover { background: rgba(15,155,142,0.1) !important; border-color: rgba(15,155,142,0.4) !important; }
        .ev-karo:hover .ev-ikon { background: rgba(15,155,142,0.22) !important; color: #2DD4BF !important; }
        .ev-rv:hover { background: rgba(255,255,255,0.08) !important; }
        .ev-satir:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      <DoktorNav />

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '20px 20px 40px', animation: mounted ? 'girisim 300ms ease-out' : 'none' }}>

        {/* Karşılama */}
        <div style={{ ...panel, background: 'linear-gradient(135deg, #10223D 0%, #0C1830 100%)', padding: '22px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: '#5F7189', textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.4, marginTop: 4 }}>Hoş geldiniz, Dr. {doktorAdi}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#14B8A6', paddingBottom: 4 }}>
            <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', animation: 'nabiz 1.6s infinite' }} />
            Sistem aktif · TRT
          </div>
        </div>

        {/* Randevular — Bugün / Bu Hafta */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 3 }}>
              {([['bugun', 'Bugün'], ['hafta', 'Bu Hafta']] as const).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRandevuGorunumu(k)}
                  style={{ background: randevuGorunumu === k ? '#0F9B8E' : 'transparent', boxShadow: randevuGorunumu === k ? '0 1px 5px rgba(0,0,0,0.3)' : 'none', border: 'none', color: 'white', fontWeight: randevuGorunumu === k ? 700 : 500, borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer', transition: 'background .15s ease' }}
                >{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Randevu ekle</button>
              <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Takvimi aç</button>
            </div>
          </div>

          <div style={{ ...panel, padding: '6px 18px' }}>
            {randevuYukleniyor ? (
              <div style={{ padding: '14px 0' }}>
                {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 8, animation: 'nabiz 1.5s infinite' }} />)}
              </div>
            ) : randevuGorunumu === 'bugun' ? (
              bugunkuRandevular.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '14px 0', WebkitOverflowScrolling: 'touch' }}>
                  {bugunkuRandevular.map((rv) => {
                    const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                    const gecmis = new Date(rv.baslangic).getTime() < Date.now()
                    return (
                      <div
                        key={rv.id}
                        className="ev-rv"
                        onClick={() => router.push('/dashboard/doktor/randevular')}
                        style={{ flex: '0 0 auto', minWidth: 158, background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${durumBilgi.color}`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', opacity: gecmis && rv.durum === 'tamamlandi' ? 0.6 : 1, transition: 'background .15s ease' }}
                      >
                        <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{trtSaatStr(rv.baslangic)}</div>
                        <div style={{ fontSize: 13, color: '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, maxWidth: 160 }}>{rv.hastaAdi}</div>
                        <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, marginTop: 6 }}>{durumBilgi.label}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px 0', fontSize: 14, color: '#5F7189' }}>Bugün için randevu yok</div>
              )
            ) : haftalikRandevular.length === 0 ? (
              <div style={{ padding: '16px 0', fontSize: 14, color: '#5F7189' }}>Bu hafta için randevu yok</div>
            ) : (
              <div style={{ padding: '10px 0' }}>
                {buHaftaninGunleri().map((gunTarihi) => {
                  const anahtar = yerelGunAnahtari(gunTarihi)
                  const guninRandevulari = haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === anahtar)
                  if (guninRandevulari.length === 0) return null
                  const bugunMu = anahtar === trtGunAnahtari(new Date())
                  const gunEtiketi = gunTarihi.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
                  return (
                    <div key={anahtar} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 12, color: bugunMu ? '#0F9B8E' : '#5F7189', fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>
                        {bugunMu ? `Bugün · ${gunEtiketi}` : gunEtiketi}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {guninRandevulari.map((rv) => {
                          const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                          return (
                            <div key={rv.id} className="ev-satir" onClick={() => router.push('/dashboard/doktor/randevular')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '5px 6px', borderRadius: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 46 }}>{trtSaatStr(rv.baslangic)}</span>
                              <span style={{ fontSize: 13, color: '#C9D4E3', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rv.hastaAdi}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
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

        {/* KPI kartları */}
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {[
            { label: 'Bugünkü muayene', value: kpi.bugunkuMuayene, color: '#0F9B8E', sub: 'hasta bugün' },
            { label: 'Bekleyen onay', value: kpi.bekleyenOnay, color: '#F59E0B', sub: 'not onayı bekliyor', git: '/dashboard/doktor/inceleme' },
            { label: 'Bu ay toplam', value: kpi.buAyToplam, color: '#3B82F6', sub: 'muayene bu ay' },
            { label: 'Aktif hasta', value: kpi.aktifHasta, color: '#14B8A6', sub: 'kayıtlı aktif hasta', git: '/dashboard/doktor/hastalar' },
          ].map((card, i) => (
            <div
              key={i}
              onClick={card.git ? () => router.push(card.git!) : undefined}
              style={{ ...panel, padding: '20px 22px', position: 'relative', overflow: 'hidden', cursor: card.git ? 'pointer' : 'default' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 22, right: 22, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
              <div style={{ fontSize: 13, color: '#8FA0B5' }}>{card.label}</div>
              {loading ? (
                <div style={{ height: 44, width: 64, background: 'rgba(255,255,255,0.06)', borderRadius: 8, margin: '10px 0 6px', animation: 'nabiz 1.5s infinite' }} />
              ) : (
                <div style={{ fontSize: 44, fontWeight: 800, color: card.color, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', margin: '4px 0 2px' }}>{card.value}</div>
              )}
              <div style={{ fontSize: 12, color: '#5F7189' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Hızlı Erişim — büyük ikon karoları */}
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hızlı erişim</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10 }}>
            {[
              { ikon: 'takvim', text: 'Randevular', path: '/dashboard/doktor/randevular', renk: '#0F9B8E' },
              { ikon: 'asistan', text: 'Asistanı Aç', path: '/asistan', renk: '#7C8CF8' },
              { ikon: 'hastaEkle', text: 'Hasta Ekle', path: '/dashboard/doktor/hasta-ekle', renk: '#14B8A6' },
              { ikon: 'belge', text: 'Belge Yükle', path: '/dashboard/doktor/belgeler', renk: '#38BDF8' },
              { ikon: 'inceleme', text: 'İnceleme', path: '/dashboard/doktor/inceleme', renk: '#F59E0B' },
              { ikon: 'araclar', text: 'Araçlar', path: '/doktor-tools', renk: '#A78BFA' },
              { ikon: 'raporlar', text: 'Raporlar', path: '/dashboard/doktor/raporlar', renk: '#8FA0B5' },
            ].map((karo) => (
              <button
                key={karo.text}
                type="button"
                className="ev-karo"
                onClick={() => router.push(karo.path)}
                style={{ ...panel, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: '16px 16px 14px', cursor: 'pointer', color: 'white', textAlign: 'left', transition: 'background .15s ease, border-color .15s ease' }}
              >
                <span className="ev-ikon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: `${karo.renk}1F`, color: karo.renk, transition: 'background .15s ease, color .15s ease' }}>
                  <Ikon ad={karo.ikon} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{karo.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Son Notlar + Bu Hafta Özeti */}
        <div style={{ marginTop: 26, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.6, minWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Son notlar</div>
              <span onClick={() => router.push('/dashboard/doktor/inceleme')} style={{ fontSize: 13, color: '#14B8A6', cursor: 'pointer' }}>Tümünü gör ›</span>
            </div>
            <div style={{ ...panel, padding: '8px 18px' }}>
              {loading ? (
                <div style={{ padding: '12px 0' }}>
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 42, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8, animation: 'nabiz 1.5s infinite' }} />)}
                </div>
              ) : recentNotes.length > 0 ? (
                recentNotes.map((note, idx) => (
                  <div key={note.id} className="ev-satir" onClick={() => router.push('/dashboard/doktor/inceleme')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: idx < recentNotes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', borderRadius: 8 }}>
                    <span style={{ background: `${getSpecialtyColor(note.specialty)}26`, color: getSpecialtyColor(note.specialty), fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, textTransform: 'capitalize', flexShrink: 0 }}>{note.specialty}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 11, color: '#5F7189' }}>{note.date}</span>
                      <span style={{ display: 'block', fontSize: 13, color: '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.content_subjektif.slice(0, 70) || 'Not'}</span>
                    </span>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: note.approved_at ? '#22C55E' : '#F59E0B' }} title={note.approved_at ? 'Onaylı' : 'Onay bekliyor'} />
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 14, color: '#5F7189', marginBottom: 14 }}>Henüz not yok — ilk muayeneyle birlikte burada görünecek.</div>
                  <button type="button" onClick={() => router.push('/asistan')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Asistanı başlat</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bu hafta özeti</div>
            <div style={{ ...panel, padding: '8px 18px 16px' }}>
              {[
                { dot: '#0F9B8E', label: 'Bu hafta seans', val: kpi.buAyToplam },
                { dot: '#22C55E', label: 'Onaylanan not', val: Math.max(0, kpi.buAyToplam - kpi.bekleyenOnay) },
                { dot: '#F59E0B', label: 'Bekleyen', val: kpi.bekleyenOnay },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ width: 8, height: 8, background: row.dot, borderRadius: '50%' }} />
                  <span style={{ flex: 1, fontSize: 14, color: '#C9D4E3' }}>{row.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{row.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700 }}>Hızlı araçlar</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span onClick={() => router.push('/doktor-tools/epikriz')} style={{ color: '#14B8A6', fontSize: 13, cursor: 'pointer' }}>Epikriz üret ›</span>
                <span onClick={() => router.push('/doktor-tools/icd10')} style={{ color: '#14B8A6', fontSize: 13, cursor: 'pointer' }}>ICD-10 kodla ›</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        Notya AI 2026 • KVKK uyumlu • Saat dilimi: Türkiye (TRT)
      </div>
    </div>
  )
}
