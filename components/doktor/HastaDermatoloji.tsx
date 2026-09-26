'use client'

/**
 * Live dermatology chapter on the hasta dosyası — visit-first clinic-fit (sprints 1–5).
 * Photos from core görüntüleme (coreImageId only). Dual-sign drafts are not diagnoses.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DermSpine } from '@/specialties/dermatoloji/ui/DermSpine'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { cinsiyetGop } from '@/lib/utils/cinsiyet'
import { yasYilKesir } from '@/lib/doktor/hastaDosyaSekmeleri'
import {
  displayUrlsFromGoruntuleme,
  payloadFromDermApi,
  type LiveDermVeri,
  type LiveGoruntuRow,
} from '@/lib/specialties/dermatoloji-live'
import {
  aktifIslerFromClinic,
  belgeHekimOnayli,
  defaultVisitType,
  fototerapiChip,
  gopChip,
  goruntulemeCaptureHref,
  latestScores,
  nextPhotoCue,
  skorOzeti,
  tbseCue,
  unitChecklist,
  yamaChip,
  type ChecklistState,
  type DermBelgeOzet,
} from '@/specialties/dermatoloji/engines/clinic-fit'
import { gopIsotretinoin } from '@/specialties/dermatoloji/engines/gop-isotretinoin'
import { kararKartlariFromClinic } from '@/specialties/dermatoloji/protocols/karar-kartlari'
import { CLINIC_UNIT_PROFILES, checklistEtiketi } from '@/specialties/dermatoloji/protocols/clinic-units'
import type { ClinicUnit } from '@/specialties/dermatoloji/types'
import { kutu, btn, giris, etiketS } from '@/specialties/dermatoloji/ui/clinic-styles'
import StickyDermStrip from '@/specialties/dermatoloji/ui/StickyDermStrip'
import AktifIsler from '@/specialties/dermatoloji/ui/AktifIsler'
import UniteSecici from '@/specialties/dermatoloji/ui/UniteSecici'
import KararKartlari from '@/specialties/dermatoloji/ui/KararKartlari'
import BelgeAnalizOzet from '@/specialties/dermatoloji/ui/BelgeAnalizOzet'
import SeriesTimepoints from '@/specialties/dermatoloji/ui/SeriesTimepoints'
import OnamPaneli from '@/specialties/dermatoloji/ui/OnamPaneli'
import UnitePanelleri from '@/specialties/dermatoloji/ui/UnitePanelleri'
import LezyonKarti from '@/specialties/dermatoloji/ui/LezyonKarti'
import VucutHaritasi from '@/specialties/dermatoloji/ui/VucutHaritasi'
import FotoDermoskopiGaleri from '@/specialties/dermatoloji/ui/FotoDermoskopiGaleri'
import BeforeAfterCompare from '@/specialties/dermatoloji/ui/BeforeAfterCompare'
import AsistanGorselPanel from '@/specialties/dermatoloji/ui/AsistanGorselPanel'
import SkorPaneli from '@/specialties/dermatoloji/ui/SkorPaneli'
import GopBlok from '@/specialties/dermatoloji/ui/GopBlok'
import YamaTakvimi from '@/specialties/dermatoloji/ui/YamaTakvimi'
import FototerapiDefteri from '@/specialties/dermatoloji/ui/FototerapiDefteri'
import { DERM_FITZ, DERM_UNIT, dermLabel } from '@/specialties/dermatoloji/ui/labels'
import { FITZPATRICK } from '@/specialties/dermatoloji/schema'
import type { MedKaydi, PhotoSession } from '@/specialties/dermatoloji/engines/phototherapy-log'
// DERM-EXCEPTIONAL-01 — bölüm derinliği kartları
import {
  AcilBandi,
  AkneKarti,
  AtopiKarti,
  BehcetTakipKarti,
  BiyolojikSutKarti,
  BullozTakipKarti,
  BzbhForm014Karti,
  DerimHatirlatmaKarti,
  DermoskopiSkorKarti,
  EstetikKarti,
  IslemOdasiYazdir,
  PsoriasisMerdiveniKarti,
  SacTirnakKarti,
} from '@/specialties/dermatoloji/ui/DermKartlarEk'
import { acilBandMetni, dermAcilTara, type DermAcilKod } from '@/specialties/dermatoloji/engines/acil'
import type { BzbhKind } from '@/specialties/dermatoloji/protocols/endemic-bzbh'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: 16,
}

const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#0F9B8E',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
}

const ctaGhost: React.CSSProperties = {
  ...cta,
  background: '#F6F0E4',
  color: CHROME_RENK.ink,
}

type Ziyaret = { id: string; tarih: string; unit: string; visit_type: string; checklist?: ChecklistState; not_metni?: string | null }

type ApiVeri = LiveDermVeri & {
  kayit?: LiveDermVeri['kayit'] & { id: string; unit?: string; visit_type?: string; next_photo_iso?: string | null }
  ziyaretler?: Ziyaret[]
  belgeAnalizleri?: Array<{
    id: string
    belge_id: string
    durum: string
    modality_final?: string | null
    sonuc?: { ozet?: string; tanilar?: Array<{ ad?: string }> } | null
    hekim_ozet?: string | null
    hekim_tanisi?: Array<{ ad?: string }> | null
    olusturuldu?: string | null
  }>
  // DERM-EXCEPTIONAL-01
  medKayitlari?: MedKaydi[]
  islemler?: Array<{ id: string; tarih: string; tur: string }>
}

function gunFarki(a: string, b: string): number {
  const ms = new Date(`${a.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${b.slice(0, 10)}T00:00:00Z`).getTime()
  return Math.round(ms / 86400000)
}

function yerelIsoTarih() {
  const d = new Date()
  const z = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - z).toISOString().slice(0, 10)
}

export default function HastaDermatoloji({
  patientId,
  cinsiyet = null,
  dogumTarihi = null,
  hastaAdi = null,
}: {
  patientId: string
  cinsiyet?: string | null
  dogumTarihi?: string | null
  /** yazdırılabilir onam / Form 014 / SUT taslağı üst bilgisi — URL'ye yazılmaz */
  hastaAdi?: string | null
}) {
  const [veri, setVeri] = useState<ApiVeri | null>(null)
  const [hata, setHata] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [muayeneAcik, setMuayeneAcik] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistState>({})
  const [notMetni, setNotMetni] = useState('')
  const [fitz, setFitz] = useState('')
  const [meslek, setMeslek] = useState('')

  const today = yerelIsoTarih()
  const sex = cinsiyetGop(cinsiyet)
  const pediatric = (yasYilKesir(dogumTarihi) ?? 99) < 18

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch(`/api/doktor/dermatoloji?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Dermatoloji yüklenemedi')
      setVeri(d)
      const pd = (d.kayit?.patient_derm || {}) as { fitzpatrick?: string; occupation?: string }
      setFitz(pd.fitzpatrick || '')
      setMeslek(pd.occupation || '')
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const post = async (body: Record<string, unknown>) => {
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/dermatoloji', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ patientId, ...body }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Kaydedilemedi')
  }

  const kaydet = async (body: Record<string, unknown>, ok = 'Kaydedildi.') => {
    try {
      await post(body)
      setMesaj(ok)
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi')
    }
  }

  const unit = (veri?.kayit?.unit || 'genel') as ClinicUnit
  const visitType = veri?.kayit?.visit_type || defaultVisitType(unit)
  const payload = useMemo(() => {
    if (!veri) return null
    try {
      return payloadFromDermApi(patientId, {
        kayit: veri.kayit,
        lezyonlar: veri.lezyonlar,
        skorlar: veri.skorlar,
        fototerapi: veri.fototerapi,
        yama: veri.yama,
        vision: veri.vision,
        fotoMeta: veri.fotoMeta,
        goruntulemeler: (veri.goruntulemeler || []) as LiveGoruntuRow[],
      }, today)
    } catch {
      return null
    }
  }, [veri, patientId, today])

  const urls = displayUrlsFromGoruntuleme((veri?.goruntulemeler || []) as LiveGoruntuRow[])
  const sonSkor = latestScores(payload?.score_snapshots || veri?.skorlar || [])
  const sessions = (payload?.phototherapy_sessions || veri?.fototerapi || []) as PhotoSession[]
  const patch = (veri?.yama || [])[0] ?? payload?.patch_courses[0] ?? null
  const gopPack = payload?.gop ?? null
  const gopResult = gopIsotretinoin({
    two_contraception: gopPack?.two_contraception ?? false,
    hcg_iso: gopPack?.hcg_iso ?? null,
    hcg_negative: gopPack?.hcg_negative ?? false,
    cycle_day: gopPack?.cycle_day ?? null,
    rx_days: gopPack?.rx_days ?? 30,
    start_iso: gopPack?.start_iso ?? today,
    today_iso: today,
    sex,
  })

  const belgeOzet: DermBelgeOzet[] = (veri?.belgeAnalizleri || []).map((a) => ({
    id: a.id,
    belgeId: a.belge_id,
    durum: a.durum,
    modality: a.modality_final || 'dermatoskopi',
    ozet: a.hekim_ozet || a.sonuc?.ozet || '',
    tanilar: belgeHekimOnayli(a.durum)
      ? (a.hekim_tanisi || []).map((t) => t.ad || '').filter(Boolean)
      : (a.sonuc?.tanilar || []).map((t) => t.ad || '').filter(Boolean),
    hekimOnayli: belgeHekimOnayli(a.durum),
    olusturuldu: a.olusturuldu || '',
  }))

  const isler = payload
    ? aktifIslerFromClinic({
        unit,
        todayIso: today,
        scores: sonSkor,
        patch,
        sessions,
        lastTbseIso: payload.last_tbse_iso ?? null,
        gopAllowed: gopResult.allowed,
        sex,
        photos: payload.photos,
        pediatric,
        nextPhotoIso: veri?.kayit?.next_photo_iso ?? null,
        bullousDif: payload.bullous_workup?.dif ?? null,
        unitIsBullu: unit === 'bullu',
      })
    : []

  const kartlar = kararKartlariFromClinic({
    unit,
    pasi: sonSkor?.pasi,
    dlqi: sonSkor?.dlqi,
    psa: payload?.psa_joint,
    tbScreen: payload?.tb_screen,
    hbvScreen: payload?.hbv_screen,
    photoDevice: sessions[0]?.device,
    uglyDuckling: payload?.ugly_duckling,
    digitalMap: payload?.total_body_map?.deviceHint !== 'manual' && !!payload?.total_body_map,
    fitzpatrick: payload?.patient_derm.fitzpatrick,
    behcet: payload?.behcet_card ?? null,
    bullous: payload?.bullous_workup ?? null,
    bzbhKind: payload?.bzbh_kind,
    acitretinBan: payload?.acitretin_ban,
    visitType,
    month: Number(today.slice(5, 7)),
  })

  const goruntulemeHref = goruntulemeCaptureHref(patientId, 'dermatoskopi')
  const klinikFotoHref = goruntulemeCaptureHref(patientId, 'derm')
  const muayeneHref = `/session/new?patientId=${encodeURIComponent(patientId)}`
  const empty = (veri?.goruntulemeler || []).length === 0
  const nextActions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      <a href={goruntulemeHref} style={cta}>Görüntüleme ekle</a>
      <a href={klinikFotoHref} style={ctaGhost}>Klinik foto</a>
      <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=belgeler&dermModality=dermatoskopi`} style={ctaGhost}>Belgelerde analiz et</a>
      <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=belgeler&dermModality=dermatoskopi`} style={ctaGhost}>Asistana raporla</a>
      <a href={muayeneHref} style={ctaGhost}>Muayene notuna skor işle</a>
    </div>
  )

  const checklistMaddeler = unitChecklist(unit)
  const profil = CLINIC_UNIT_PROFILES.find((p) => p.id === unit)

  // DERM-EXCEPTIONAL-01 — acil kırmızı bayrak: ziyaret notları + lezyon notları + hekim işareti
  const hekimAcilIsaretleri = ((veri?.kayit as { acil_isaretleri?: unknown })?.acil_isaretleri || []) as DermAcilKod[]
  const acilBayraklar = dermAcilTara(
    [
      ...(veri?.ziyaretler || []).slice(0, 3).map((z) => z.not_metni || ''),
      ...(payload?.lesions || []).map((l) => l.notes || ''),
    ],
    hekimAcilIsaretleri,
  )
  const skorGecmisi = payload?.score_snapshots || veri?.skorlar || []
  const oncekiSkor = skorGecmisi[1] ?? null
  const basamakKilidi = ((veri?.kayit as { basamak_kilidi?: Record<string, string> })?.basamak_kilidi || {}) as Record<string, string>
  const psaIsaretleri = ((veri?.kayit as { psa_triyaj?: Record<string, boolean> })?.psa_triyaj || null)
  const izotretinoinKuru = !!gopPack?.start_iso
  // izotretinoin ay-0 / ay-3 foto serisi: kür başlangıcı ve +3 ay civarı klinik foto var mı?
  const akneFotoTarihleri = (payload?.photos || [])
    .filter((p) => p.kind === 'klinik_genel' || p.kind === 'klinik_yakin' || p.kind === 'tedavi_hafta_n')
    .map((p) => p.capturedAt)
    .filter(Boolean) as string[]
  const kurBaslangic = gopPack?.start_iso ?? null
  const akneFotoAy0 = !!kurBaslangic && akneFotoTarihleri.some((t) => Math.abs(gunFarki(t, kurBaslangic)) <= 30)
  const akneFotoAy3 = !!kurBaslangic && akneFotoTarihleri.some((t) => {
    const d = gunFarki(t, kurBaslangic)
    return d >= 60 && d <= 135
  })
  // Biyolojik/sistemik SUT taslağı ve tedavi merdivenleri yalnız ilgili ünitelerde açılır (branş içi ünite kapısı).
  const psoriasisUnitesi = unit === 'psoriasis'
  const atopiUnitesi = unit === 'genel' || unit === 'pediatrik'
  const akneUnitesi = unit === 'genel'

  return (
    <div style={{ display: 'grid', gap: 12 }} data-chapter="dermatoloji">
      <div style={{ ...panel, padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Deri & Lezyon</div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: CHROME_RENK.muted }}>
          Ziyaret-önce klinik yüzey. Lezyonlar görüntülemeden türetilir; ayrı fotoğraf deposu yoktur.
          Tarama desteği, tanı değildir. Doktor onayı gerekir. KETEM deri kanseri taraması değildir.
        </p>
        {empty && nextActions}
      </div>

      <UniteSecici
        unit={unit}
        onChange={(u) => kaydet({ action: 'klinik', unit: u, visit_type: defaultVisitType(u) }, `${dermLabel(DERM_UNIT, u)} seçildi.`)}
      />

      {hata && <div style={{ color: CHROME_RENK.warn, fontSize: 13 }}>{hata}</div>}
      {mesaj && <div style={{ color: '#2E6E4E', fontSize: 13 }}>{mesaj}</div>}
      {yukleniyor && <div style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</div>}

      <AsistanGorselPanel
        reads={payload?.vision_reads ?? []}
        photos={payload?.photos ?? []}
        actor="uzman"
        belgeOzet={belgeOzet}
        onDraft={(r) => kaydet({ action: 'vision', assetIds: r.assetIds, task: r.task, observations: r.observations, drafted_by: r.drafted_by }, 'Taslak kaydedildi.')}
        onOnay={(r) => kaydet({ action: 'vision', id: r.id, onay: true }, 'Uzman onaylandı.')}
      />

      {/* NOTYA-DERM-02: eksik paket — ABCDE/resmi tanı, işlemler, ilaç güvenliği, pediatrik, kozmetik (kapalı) */}
      <DermSpine patientId={patientId} />
      {payload && (
        <>
          <StickyDermStrip
            fitzpatrick={payload.patient_derm.fitzpatrick || '—'}
            unit={unit}
            skorOzet={skorOzeti(sonSkor)}
            gopChip={gopChip(gopPack ?? null, today, sex)}
            yamaChip={yamaChip(patch, today)}
            fototerapiChip={fototerapiChip(sessions)}
            sonrakiFoto={nextPhotoCue(veri?.kayit?.next_photo_iso ?? null, today)}
            tbseCue={tbseCue(payload.last_tbse_iso ?? null, today)}
            onBugunkuMuayene={() => setMuayeneAcik(true)}
            acilBant={acilBandMetni(acilBayraklar)}
          />

          {/* DERM-EXCEPTIONAL-01 · madde 12 — acil kırmızı bayrak bandı, muayeneden önce */}
          <AcilBandi
            bayraklar={acilBayraklar}
            hekimIsaretleri={hekimAcilIsaretleri}
            onIsaretle={(kodlar) => kaydet({ action: 'klinik', acil_isaretleri: kodlar }, 'Acil işareti kaydedildi.')}
            hastaAdi={hastaAdi}
            bugun={today}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} data-derm="imaging-cta">
            <a href={goruntulemeHref} style={cta}>Dermoskopi ekle</a>
            <a href={klinikFotoHref} style={ctaGhost}>Klinik foto</a>
            <a href={klinikFotoHref} style={ctaGhost}>Önce / sonra foto</a>
            <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=belgeler&dermModality=dermatoskopi`} style={ctaGhost}>Belgelerde analiz et</a>
            <a href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=belgeler&dermModality=dermatoskopi`} style={ctaGhost}>Asistana raporla</a>
          </div>

          {muayeneAcik && (
            <section style={kutu} data-derm="bugunku-muayene">
              <h2 style={{ margin: 0, fontSize: 16 }}>Bugünkü muayene · {profil?.label}</h2>
              <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>Ünite kontrol listesi. Yapıldı / reddedildi (neden zorunlu).</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 6 }}>
                {checklistMaddeler.map((m) => {
                  const st = checklist[m]?.durum || 'bekliyor'
                  return (
                    <li key={m} style={{ fontSize: 13 }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="checkbox"
                          checked={st === 'yapildi'}
                          onChange={(e) => setChecklist((prev) => ({ ...prev, [m]: { durum: e.target.checked ? 'yapildi' : 'bekliyor' } }))}
                        />
                        {checklistEtiketi(m)}
                        <button
                          type="button"
                          style={{ ...btn(), padding: '4px 8px', fontSize: 11 }}
                          onClick={() => setChecklist((prev) => ({ ...prev, [m]: { durum: 'reddedildi', neden: prev[m]?.neden || '' } }))}
                        >
                          Reddedildi
                        </button>
                      </label>
                      {checklist[m]?.durum === 'reddedildi' && (
                        <input
                          style={{ ...giris, marginTop: 4 }}
                          placeholder="Red nedeni"
                          value={checklist[m]?.neden || ''}
                          onChange={(e) => setChecklist((prev) => ({ ...prev, [m]: { durum: 'reddedildi', neden: e.target.value } }))}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
              <label style={{ display: 'block', marginTop: 8 }}><span style={etiketS}>Not</span>
                <textarea style={giris} value={notMetni} onChange={(e) => setNotMetni(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  style={btn(true)}
                  onClick={() => {
                    const reddedilen = Object.entries(checklist).filter(([, v]) => v.durum === 'reddedildi' && !v.neden)
                    if (reddedilen.length) { setHata('Reddedildi maddeleri için neden yazın.'); return }
                    kaydet({ action: 'ziyaret', tarih: today, unit, visit_type: visitType, checklist, not_metni: notMetni }, 'Muayene kaydedildi.')
                    setMuayeneAcik(false)
                  }}
                >
                  Kaydet
                </button>
                <button type="button" style={btn()} onClick={() => setMuayeneAcik(false)}>Vazgeç</button>
              </div>
            </section>
          )}

          <AktifIsler isler={isler} />

          <section style={kutu} data-derm="fitz-meslek">
            <h2 style={{ margin: 0, fontSize: 16 }}>Hasta deri kartı</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
              <label>
                <span style={etiketS}>Fitzpatrick</span>
                <select style={giris} value={fitz} onChange={(e) => setFitz(e.target.value)}>
                  <option value="">—</option>
                  {FITZPATRICK.map((x) => <option key={x} value={x}>{dermLabel(DERM_FITZ, x)}</option>)}
                </select>
              </label>
              <label>
                <span style={etiketS}>Meslek</span>
                <input style={giris} value={meslek} onChange={(e) => setMeslek(e.target.value)} />
              </label>
            </div>
            <button
              type="button"
              style={{ ...btn(true), marginTop: 8 }}
              onClick={() => kaydet({
                action: 'klinik',
                patient_derm: {
                  ...(payload.patient_derm || {}),
                  occupation: meslek,
                  ...(fitz ? { fitzpatrick: fitz, phototype: fitz } : {}),
                },
              }, 'Deri kartı kaydedildi.')}
            >
              Kartı kaydet
            </button>
          </section>

          <BeforeAfterCompare pairs={payload.before_after} photos={payload.photos} urls={urls} captureHref={klinikFotoHref} />
          <SeriesTimepoints series={payload.image_series} photos={payload.photos} urls={urls} />
          <FotoDermoskopiGaleri photos={payload.photos} urls={urls} patientId={patientId} fitzpatrick={payload.patient_derm.fitzpatrick} />
          <LezyonKarti
            lesions={payload.lesions}
            emptyAction={empty ? nextActions : undefined}
            patientId={patientId}
            fitzpatrick={payload.patient_derm.fitzpatrick}
            onKaydet={(l) => kaydet({ action: 'lezyon', ...l }, 'Lezyon eklendi.')}
          />
          <VucutHaritasi
            map={payload.total_body_map}
            lesions={payload.lesions}
            emptyAction={empty ? nextActions : undefined}
            lastTbseIso={payload.last_tbse_iso}
            todayIso={today}
            onKaydet={(m) => kaydet({
              action: 'klinik',
              total_body_map: { deviceHint: m.deviceHint, followUpMonths: m.followUpMonths, nodeIds: m.nodeIds.length ? m.nodeIds : payload.lesions.map((l) => l.body_map_node || l.id) },
              last_tbse_iso: m.last_tbse_iso || null,
            }, 'TBSE kaydedildi.')}
          />
          <OnamPaneli
            photos={payload.photos}
            pediatric={pediatric}
            onKaydet={(p) => kaydet({ action: 'foto-meta', ...p }, 'Onam kaydedildi.')}
          />
          <BelgeAnalizOzet patientId={patientId} analizler={belgeOzet} fitzpatrick={payload.patient_derm.fitzpatrick} />
          <SkorPaneli
            pasi={sonSkor?.pasi}
            easi={sonSkor?.easi}
            dlqi={sonSkor?.dlqi}
            uas7={sonSkor?.uas7}
            salt={sonSkor?.salt}
            scorad={(sonSkor as { scorad?: number } | null)?.scorad}
            iga={(sonSkor as { iga?: number } | null)?.iga}
            showUas7={unit === 'urtiker'}
            showSalt={unit === 'sac'}
            showScorad={atopiUnitesi}
            showIga={akneUnitesi}
            emptyAction={nextActions}
            onKaydet={(s) => kaydet({ action: 'skor', recorded_at: today, ...s }, 'Skor kaydedildi.')}
          />
          <GopBlok
            pack={gopPack}
            today={today}
            sex={sex}
            acitretinBan={payload.acitretin_ban}
            onKaydet={(p) => kaydet({ action: 'klinik', gop: p }, 'GÖP kaydedildi.')}
          />
          <YamaTakvimi
            course={patch}
            courses={(veri?.yama || []) as typeof patch[]}
            today={today}
            patientId={patientId}
            onKaydet={(c) => kaydet({ action: 'yama', ...c }, 'Yama kaydedildi.')}
          />
          <FototerapiDefteri
            sessions={sessions}
            medler={veri?.medKayitlari || []}
            lastTbseIso={payload.last_tbse_iso ?? null}
            todayIso={today}
            onEkle={(s) => kaydet({ action: 'fototerapi-seans', ...s }, 'Seans eklendi.')}
            onMedEkle={(m) => kaydet({ action: 'med', ...m }, 'MED kaydedildi.')}
          />

          {/* DERM-EXCEPTIONAL-01 · madde 8 — dermoskopi çalışma sayfaları (3 nokta / 7 nokta / CASH) */}
          <DermoskopiSkorKarti
            lesions={payload.lesions}
            fitzpatrick={payload.patient_derm.fitzpatrick}
            onFitzpatrick={(f) => kaydet({
              action: 'klinik',
              patient_derm: { ...(payload.patient_derm || {}), fitzpatrick: f, phototype: f },
            }, 'Fitzpatrick kaydedildi.')}
            onKaydet={(r) => kaydet({
              action: 'dermoskopi-skor',
              lezyonId: r.lesionId, algoritma: r.algoritma, toplam: r.toplam,
              esikUstu: r.esikUstu, isaretli: r.isaretli, not: r.observations,
            }, 'Dermoskopi çalışma sayfası kaydedildi.')}
          />

          {/* madde 6 — PSOKİD merdiveni + PsA triyajı (psoriasis ünitesi) */}
          {psoriasisUnitesi && (
            <PsoriasisMerdiveniKarti
              pasi={sonSkor?.pasi ?? null}
              pasiOnceki={(oncekiSkor as { pasi?: number } | null)?.pasi ?? null}
              dlqi={sonSkor?.dlqi ?? null}
              dlqiOnceki={(oncekiSkor as { dlqi?: number } | null)?.dlqi ?? null}
              bsaPct={(sonSkor as { bsa_pct?: number } | null)?.bsa_pct ?? null}
              psaIsaretleri={psaIsaretleri}
              kilitliBasamak={basamakKilidi.psoriasis || null}
              onBasamakKilitle={(b) => kaydet({
                action: 'klinik', basamak_kilidi: { ...basamakKilidi, psoriasis: b },
              }, 'Basamak kilitlendi.')}
              onPsaKaydet={(isaretler, sevk) => kaydet({
                action: 'klinik', psa_triyaj: isaretler, psa_joint: sevk,
              }, 'Eklem triyajı kaydedildi.')}
            />
          )}

          {/* madde 7 — TDD AD 2018 basamak kartı (genel / pediatrik ünite) */}
          {atopiUnitesi && (
            <AtopiKarti
              scorad={(sonSkor as { scorad?: number } | null)?.scorad ?? null}
              easi={sonSkor?.easi ?? null}
              pediatrik={pediatric}
              kilitliBasamak={basamakKilidi.atopi || null}
              onBasamakKilitle={(b) => kaydet({
                action: 'klinik', basamak_kilidi: { ...basamakKilidi, atopi: b },
              }, 'Basamak kilitlendi.')}
            />
          )}

          {/* madde 5 — akne IGA + izotretinoin ay 0 / ay 3 foto serisi */}
          {akneUnitesi && (
            <AkneKarti
              iga={(sonSkor as { iga?: number } | null)?.iga ?? null}
              izotretinoinKuru={izotretinoinKuru}
              fotoAy0={akneFotoAy0}
              fotoAy3={akneFotoAy3}
              fotoHref={klinikFotoHref}
            />
          )}

          {/* madde 4 — biyolojik / sistemik SUT rapor taslağı (psoriasis ünitesi) */}
          {psoriasisUnitesi && (
            <BiyolojikSutKarti
              hastaAdi={hastaAdi || ''}
              bugun={today}
              skorlar={{
                pasiSimdi: sonSkor?.pasi ?? null,
                pasiBaslangic: (skorGecmisi[skorGecmisi.length - 1] as { pasi?: number } | undefined)?.pasi ?? null,
                easiSimdi: sonSkor?.easi ?? null,
                dlqiSimdi: sonSkor?.dlqi ?? null,
                bsaPct: (sonSkor as { bsa_pct?: number } | null)?.bsa_pct ?? null,
              }}
              tbScreen={payload.tb_screen}
              hbvScreen={payload.hbv_screen}
              psaTutulumu={payload.psa_joint}
              onKilitle={(r) => kaydet({
                action: 'biyolojik-rapor',
                sablon: r.sablon, endikasyon: r.endikasyon, taslakMetni: r.metin,
                eksikler: r.eksikler, kilitle: r.eksikler.length === 0,
              }, r.eksikler.length === 0 ? 'SUT taslağı kilitlendi.' : 'Taslak kaydedildi (eksikler var).')}
            />
          )}

          {/* madde 14 — SALT çalışma sayfası + trikoskopi notu (saç ünitesi) */}
          {unit === 'sac' && (
            <SacTirnakKarti
              saltToplam={sonSkor?.salt ?? null}
              trikoskopiFotoSayisi={payload.photos.filter((p) => p.kind === 'trichoscopy').length}
              onKaydet={(h) => kaydet({ action: 'klinik', hair_workup: { ...(payload.hair_workup || {}), ...h } }, 'Saç / tırnak kaydedildi.')}
            />
          )}

          {/* madde 13 — Behçet / büllöz izlem kartları (ünite kapısı) */}
          {unit === 'behcet-bagdokusu' && (
            <BehcetTakipKarti
              kart={payload.behcet_card ?? null}
              bugun={today}
              onKaydet={(ek) => kaydet({ action: 'klinik', behcet_izlem: ek }, 'Behçet izlemi kaydedildi.')}
            />
          )}
          {unit === 'bullu' && (
            <BullozTakipKarti
              workup={payload.bullous_workup ?? null}
              onKaydet={(ek) => kaydet({ action: 'klinik', bulloz_izlem: ek }, 'Büllü izlem kaydedildi.')}
            />
          )}
          {payload.bzbh_kind && (
            <BzbhForm014Karti
              bzbhKind={payload.bzbh_kind as BzbhKind}
              hastaAdi={hastaAdi}
              bugun={today}
              sonZiyaretIso={(veri?.ziyaretler || [])[0]?.tarih ?? null}
            />
          )}

          {/* madde 10 — işlem odası: yazdırılabilir onam + numune etiketi (PHI URL'ye yazılmaz) */}
          {(unit === 'cerrahi' || visitType === 'islem') && (
            <IslemOdasiYazdir
              hastaAdi={hastaAdi}
              bugun={today}
              lesions={payload.lesions}
            />
          )}

          {/* madde 11 — kozmetik lot + komplikasyon (yalnız kozmetik ünitesi) */}
          {unit === 'kozmetik' && (
            <EstetikKarti
              fitzpatrick={payload.patient_derm.fitzpatrick}
              bugun={today}
              onKaydet={(k) => kaydet({ action: 'kozmetik-islem', ...k }, 'Kozmetik işlem kaydedildi.')}
            />
          )}

          {/* madde 19 — hekim tetiklemeli Derim hatırlatmaları (portal yalnız gösterir) */}
          <DerimHatirlatmaKarti
            girdi={{
              bugun: today,
              gopAktif: izotretinoinKuru && sex === 'female',
              gopSonrakiHcgIso: gopPack?.hcg_iso ?? null,
              sessions,
              yamaKuru: patch,
              lastTbseIso: payload.last_tbse_iso ?? null,
              nextPhotoIso: veri?.kayit?.next_photo_iso ?? null,
            }}
            onGonder={(h) => kaydet({ action: 'hatirlatma', kod: h.kod, due: h.due }, 'Hastaya hatırlatma gönderildi.')}
          />

          <KararKartlari kartlar={kartlar} />
          <UnitePanelleri
            unit={unit}
            patientId={patientId}
            fitzpatrick={payload.patient_derm.fitzpatrick}
            pediatric={pediatric}
            behcet={payload.behcet_card}
            bullous={payload.bullous_workup}
            bzbhKind={payload.bzbh_kind || null}
            acitretinBan={payload.acitretin_ban}
            onBehcet={(c) => kaydet({ action: 'klinik', behcet_card: c }, 'Behçet kartı kaydedildi.')}
            onBullous={(w) => kaydet({ action: 'klinik', bullous_workup: w }, 'Büllü çalışma kaydedildi.')}
            onBzbh={(k) => kaydet({ action: 'klinik', bzbh_kind: k }, 'BZBH güncellendi.')}
            onAcitretin={(v) => kaydet({ action: 'klinik', acitretin_ban: v }, 'Asitretin işareti kaydedildi.')}
          />
          {visitType === 'islem' && (
            <section style={kutu} data-derm="sut-islem-visit">
              <h2 style={{ margin: 0, fontSize: 16 }}>İşlem ziyareti — SUT</h2>
              <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>700.100 dermoskopi · 530.070 deri biyopsi</p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
