"use client"

export const dynamic = 'force-dynamic'

/**
 * NOTYA-KOKPIT-01 — "Günün Kokpiti": doktorun ana sayfası bir gösterge yığını değil,
 * Ayşe'nin sabah brifingi gibi KONUŞAN bir ekrandır.
 *
 * Tasarım kararları (docs/SIMPLICITY-AUDIT ilkeleriyle uyumlu):
 * - Kahraman öğe: verilerden üretilen doğal dilde günlük brifing cümlesi — sayı kartı değil.
 * - Bugün, 08:00–19:00 TRT şeridinde ORANTILI yerleşen randevu blokları + canlı "şimdi" çizgisi.
 * - "Sırada" kartı: bir sonraki hasta, geri sayım ve tek dokunuş Muayeneyi Başlat.
 * - KPI'lar tek satır düzyazı; ikon ızgarası ve dört özdeş kart bilinçli olarak yok.
 * - Veri katmanı (auth, /api/users/me, /api/doktor/raporlar, haftalık randevu tek isteği,
 *   son notlar) öncekiyle birebir aynı — yalnız sunum değişti.
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
  bitis?: string
  hastaAdi: string
  tur: string
  durum: string
  patientId?: string | null
}

interface NoteItem {
  id: string
  specialty: string
  date: string
  content_subjektif: string
  approved_at?: string
}

const TUR_RENK: Record<string, string> = {
  ilk_muayene: '#8B5CF6',
  muayene: '#0F9B8E',
  kontrol: '#3B82F6',
  diger: '#64748B',
}

function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

/** NOTYA-TRT-01: randevu anları Türkiye gününe/saatine göre — takvimle aynı kural. */
function trtGunAnahtari(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

function trtSaatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}

/** TRT saatinin ondalık hali (14:30 → 14.5) — şeritte orantılı konumlama için. */
function trtSaatOndalik(an: Date): number {
  const parca = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }).format(an).split(':')
  return Number(parca[0]) + Number(parca[1]) / 60
}

function buHaftaninGunleri(): Date[] {
  const bugun = new Date()
  const haftaIcindekiIndex = (bugun.getDay() + 6) % 7
  const pazartesi = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - haftaIcindekiIndex)
  return Array.from({ length: 7 }, (_, i) => new Date(pazartesi.getFullYear(), pazartesi.getMonth(), pazartesi.getDate() + i))
}

const HAFTA_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function DoktorDashboard() {
  const router = useRouter()
  const [doktorAdi, setDoktorAdi] = useState(() => { try { const c = localStorage.getItem('notya_doktor_name'); return c || 'Doktor' } catch { return 'Doktor' } })
  const [kpi, setKpi] = useState<KpiData>({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([])
  const [haftalikRandevular, setHaftalikRandevular] = useState<RandevuOzet[]>([])
  const [randevuYukleniyor, setRandevuYukleniyor] = useState(true)
  const [loading, setLoading] = useState(true)
  const [simdi, setSimdi] = useState(() => new Date())

  useEffect(() => {
    const s = setInterval(() => setSimdi(new Date()), 60000)
    return () => clearInterval(s)
  }, [])

  useEffect(() => {
    const initDashboard = async () => {
      // NOTYA-AUTH-01: one convention — ensureDoctorAccessToken refreshes expired sessions.
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
        }
      } catch { /* kpi sıfırlarla kalır */ }

      // NOTYA-RANDEVU-03: hafta tek istekte; bugün istemcide türetilir. Aralıklar TRT.
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
          .limit(4)
        if (notesData) {
          setRecentNotes(notesData.map((n: { id: string; specialty: string; created_at: string; content_subjektif: string; approved_at?: string }) => ({
            id: n.id,
            specialty: n.specialty || 'genel',
            date: new Date(n.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }),
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

  const bugunAnahtar = trtGunAnahtari(simdi)
  const bugunkuRandevular = useMemo(
    () => haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === bugunAnahtar),
    [haftalikRandevular, bugunAnahtar]
  )
  const siradaki = useMemo(
    () => bugunkuRandevular.find((rv) => new Date(rv.baslangic).getTime() > simdi.getTime() - 10 * 60000 && rv.durum !== 'tamamlandi' && rv.durum !== 'gelmedi'),
    [bugunkuRandevular, simdi]
  )

  // ——— Brifing cümlesi: ekranın kahramanı. Sayı kartı değil, Ayşe'nin sabah özeti. ———
  const trtSaat = trtSaatOndalik(simdi)
  const selamlama = trtSaat < 12 ? 'Günaydın' : trtSaat < 18 ? 'İyi günler' : 'İyi akşamlar'
  const tarihStr = simdi.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })

  function brifing(): React.ReactNode {
    if (randevuYukleniyor) return 'Gününüz hazırlanıyor…'
    const parcalar: React.ReactNode[] = []
    if (bugunkuRandevular.length === 0) {
      parcalar.push(<span key="bos">Bugün takviminiz boş — sakin bir gün. </span>)
    } else {
      const kalan = bugunkuRandevular.filter((rv) => new Date(rv.baslangic).getTime() > simdi.getTime()).length
      const ilk = siradaki || bugunkuRandevular[0]
      parcalar.push(
        <span key="r">
          Bugün <strong style={{ color: '#EDF1F7' }}>{bugunkuRandevular.length} hastanız</strong> var
          {kalan > 0 && ilk ? <>; {kalan === bugunkuRandevular.length ? 'ilki' : 'sıradaki'} <strong style={{ color: '#0F9B8E' }}>{trtSaatStr(ilk.baslangic)}</strong>&apos;te {ilk.hastaAdi}</> : ', hepsi görüldü'}
          {'. '}
        </span>
      )
    }
    if (kpi.bekleyenOnay > 0) {
      parcalar.push(
        <span key="n">
          <strong
            role="button"
            tabIndex={0}
            onClick={() => router.push('/dashboard/doktor/inceleme')}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push('/dashboard/doktor/inceleme') }}
            style={{ color: '#F59E0B', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >{kpi.bekleyenOnay} not</strong> onayınızı bekliyor.
        </span>
      )
    } else if (!loading) {
      parcalar.push(<span key="t">Tüm notlarınız onaylı.</span>)
    }
    return parcalar
  }

  // ——— Bugün şeridi: 08:00–19:00 TRT, orantılı yerleşim + canlı "şimdi" çizgisi. ———
  const SERIT_BAS = 8
  const SERIT_SON = 19
  const seritYuzde = (t: number) => Math.min(100, Math.max(0, ((t - SERIT_BAS) / (SERIT_SON - SERIT_BAS)) * 100))
  const simdiYuzde = bugunAnahtar === trtGunAnahtari(simdi) ? seritYuzde(trtSaat) : null

  const haftaPulse = useMemo(() => {
    const gunler = buHaftaninGunleri()
    const sayilar = gunler.map((g) => {
      const k = yerelGunAnahtari(g)
      return haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === k).length
    })
    const tavan = Math.max(1, ...sayilar)
    return gunler.map((g, i) => ({ anahtar: yerelGunAnahtari(g), etiket: HAFTA_KISA[i], sayi: sayilar[i], oran: sayilar[i] / tavan }))
  }, [haftalikRandevular])

  const geriSayim = (iso: string): string => {
    const dk = Math.round((new Date(iso).getTime() - simdi.getTime()) / 60000)
    if (dk <= 0) return 'şimdi'
    if (dk < 60) return `${dk} dk sonra`
    return `${Math.floor(dk / 60)} sa ${dk % 60} dk sonra`
  }

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', color: '#EDF1F7' }}>
      <style>{`
        .kokpit-blok:hover { filter: brightness(1.2); }
        .kokpit-satir:hover { background: rgba(255,255,255,0.06) !important; }
        @media (max-width: 700px) { .kokpit-iki { flex-direction: column !important; } }
      `}</style>

      <DoktorNav />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 40px' }}>

        {/* Brifing — kahraman öğe */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#5F7189', textTransform: 'capitalize' }}>{tarihStr}</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '6px 0 10px', letterSpacing: -0.4 }}>{selamlama}, Dr. {doktorAdi}.</h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: '#8FA0B5', maxWidth: 640, margin: 0 }}>{brifing()}</p>
          <button
            type="button"
            onClick={() => router.push('/asistan')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 640, marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '12px 18px', color: '#5F7189', fontSize: 14, cursor: 'text', textAlign: 'left' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F9B8E', flexShrink: 0 }} />
            Ayşe&apos;ye sorun — &ldquo;son hastamın ilaçları neydi?&rdquo;
          </button>
        </div>

        {/* Bugün şeridi */}
        <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 18px 14px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Bugün</span>
            <span onClick={() => router.push('/dashboard/doktor/randevular')} style={{ fontSize: 12, color: '#14B8A6', cursor: 'pointer' }}>Takvimi aç ›</span>
          </div>

          {randevuYukleniyor ? (
            <div style={{ height: 64, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }} />
          ) : bugunkuRandevular.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '6px 0 2px' }}>
              <span style={{ fontSize: 14, color: '#5F7189' }}>Takvim boş — gün sizin.</span>
              <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Randevu ekle</button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', height: 84, borderRadius: 10 }}>
                {/* saat çizgileri */}
                {Array.from({ length: SERIT_SON - SERIT_BAS + 1 }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${(i / (SERIT_SON - SERIT_BAS)) * 100}%`, top: 0, bottom: 18, width: 1, background: 'rgba(255,255,255,0.05)' }} />
                ))}
                {/* şimdi çizgisi */}
                {simdiYuzde !== null && simdiYuzde > 0 && simdiYuzde < 100 && (
                  <div style={{ position: 'absolute', left: `${simdiYuzde}%`, top: -4, bottom: 14, width: 2, background: '#F59E0B', borderRadius: 2, zIndex: 3 }}>
                    <span style={{ position: 'absolute', top: -2, left: 5, fontSize: 9, color: '#F59E0B', fontWeight: 700, whiteSpace: 'nowrap' }}>şimdi</span>
                  </div>
                )}
                {/* randevu blokları — iki şerit, çakışmalar alt alta */}
                {bugunkuRandevular.map((rv, i) => {
                  const t = trtSaatOndalik(new Date(rv.baslangic))
                  const gecmis = new Date(rv.baslangic).getTime() < simdi.getTime()
                  const renk = TUR_RENK[rv.tur] || TUR_RENK.diger
                  return (
                    <div
                      key={rv.id}
                      className="kokpit-blok"
                      onClick={() => router.push('/dashboard/doktor/randevular')}
                      title={`${trtSaatStr(rv.baslangic)} ${rv.hastaAdi}`}
                      style={{
                        position: 'absolute',
                        left: `min(${seritYuzde(t)}%, calc(100% - 120px))`,
                        top: i % 2 === 0 ? 2 : 34,
                        width: 116,
                        background: gecmis ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)',
                        borderLeft: `3px solid ${gecmis ? '#4A5A70' : renk}`,
                        borderRadius: 8,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        zIndex: 2,
                        opacity: gecmis ? 0.65 : 1,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: gecmis ? '#8FA0B5' : '#EDF1F7' }}>{trtSaatStr(rv.baslangic)}</div>
                      <div style={{ fontSize: 11, color: gecmis ? '#5F7189' : '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rv.hastaAdi}</div>
                    </div>
                  )
                })}
                {/* saat etiketleri */}
                {[8, 11, 14, 17, 19].map((h) => (
                  <span key={h} style={{ position: 'absolute', left: `${seritYuzde(h)}%`, bottom: 0, transform: 'translateX(-50%)', fontSize: 10, color: '#4A5A70', fontVariantNumeric: 'tabular-nums' }}>{String(h).padStart(2, '0')}:00</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sırada + Bekleyen işler */}
        <div className="kokpit-iki" style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          <div style={{ flex: 1.2, background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Sırada</div>
            {siradaki ? (
              <div>
                <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700, marginBottom: 4 }}>{geriSayim(siradaki.baslangic)}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{siradaki.hastaAdi}</div>
                <div style={{ fontSize: 13, color: '#8FA0B5', marginBottom: 14 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: TUR_RENK[siradaki.tur] || TUR_RENK.diger, marginRight: 6 }} />
                  {trtSaatStr(siradaki.baslangic)}{siradaki.bitis ? `–${trtSaatStr(siradaki.bitis)}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {siradaki.patientId && (
                    <button type="button" onClick={() => router.push(`/session/new?patientId=${siradaki.patientId}`)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🩺 Muayeneyi Başlat</button>
                  )}
                  {siradaki.patientId && (
                    <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${siradaki.patientId}`)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#C9D4E3', borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>Dosyayı aç</button>
                  )}
                  {!siradaki.patientId && (
                    <button type="button" onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#C9D4E3', borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>Takvimde aç</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#5F7189', lineHeight: 1.6 }}>
                {bugunkuRandevular.length > 0 ? 'Bugünün tüm hastaları görüldü.' : 'Sırada hasta yok.'}
              </div>
            )}
          </div>

          <div style={{ flex: 1, background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bekleyen işler</div>
            {kpi.bekleyenOnay > 0 ? (
              <div
                className="kokpit-satir"
                role="button"
                tabIndex={0}
                onClick={() => router.push('/dashboard/doktor/inceleme')}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push('/dashboard/doktor/inceleme') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', marginBottom: 12 }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>{kpi.bekleyenOnay}</span>
                <span style={{ fontSize: 13, color: '#FDBA74', flex: 1 }}>not onay bekliyor</span>
                <span style={{ color: '#F59E0B' }}>›</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#5F7189', marginBottom: 12 }}>Onay bekleyen not yok.</div>
            )}
            {recentNotes.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="kokpit-satir"
                onClick={() => router.push('/dashboard/doktor/inceleme')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: n.approved_at ? '#22C55E' : '#F59E0B' }} />
                <span style={{ fontSize: 12, color: '#8FA0B5', flexShrink: 0 }}>{n.date}</span>
                <span style={{ fontSize: 12, color: '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content_subjektif.slice(0, 60) || 'Not'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hafta nabzı + ay özeti tek satır */}
        <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 58, marginBottom: 10 }}>
            {haftaPulse.map((g) => {
              const bugunMu = g.anahtar === bugunAnahtar
              return (
                <div
                  key={g.anahtar}
                  onClick={() => router.push('/dashboard/doktor/randevular')}
                  title={`${g.etiket}: ${g.sayi} randevu`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 10, color: bugunMu ? '#0F9B8E' : '#5F7189', fontVariantNumeric: 'tabular-nums' }}>{g.sayi > 0 ? g.sayi : ''}</span>
                  <div style={{ width: '100%', maxWidth: 42, height: Math.max(4, g.oran * 34), borderRadius: 4, background: bugunMu ? '#0F9B8E' : g.sayi > 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 10, color: bugunMu ? '#0F9B8E' : '#5F7189', fontWeight: bugunMu ? 700 : 400 }}>{g.etiket}</span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 13, color: '#5F7189', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            Bu ay <strong style={{ color: '#8FA0B5' }}>{kpi.buAyToplam} muayene</strong> yaptınız; <strong style={{ color: '#8FA0B5' }}>{kpi.aktifHasta} aktif hastanız</strong> var.
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        Notya AI 2026 • KVKK uyumlu • Saat dilimi: Türkiye (TRT)
      </div>
    </div>
  )
}
