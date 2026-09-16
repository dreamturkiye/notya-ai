'use client'

/**
 * Live dermatology chapter on the hasta dosyası — visit-first clinic-fit (sprints 1–5).
 * Photos from core görüntüleme (coreImageId only). Dual-sign drafts are not diagnoses.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { CLINIC_UNIT_PROFILES } from '@/specialties/dermatoloji/protocols/clinic-units'
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
import type { PhotoSession } from '@/specialties/dermatoloji/engines/phototherapy-log'

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
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
  background: 'rgba(255,255,255,0.08)',
  color: '#EDF1F7',
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
}: {
  patientId: string
  cinsiyet?: string | null
  dogumTarihi?: string | null
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

  return (
    <div style={{ display: 'grid', gap: 12 }} data-chapter="dermatoloji">
      <div style={{ ...panel, padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Deri & Lezyon</div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#8FA0B5' }}>
          Ziyaret-önce klinik yüzey. Lezyonlar görüntülemeden türetilir; ayrı fotoğraf deposu yoktur.
          Asistan taslağı tanı değildir; uzman onayı gerekir. KETEM deri kanseri taraması değildir.
        </p>
        {empty && nextActions}
      </div>

      <UniteSecici
        unit={unit}
        onChange={(u) => kaydet({ action: 'klinik', unit: u, visit_type: defaultVisitType(u) }, `${dermLabel(DERM_UNIT, u)} seçildi.`)}
      />

      {hata && <div style={{ color: '#FCA5A5', fontSize: 13 }}>{hata}</div>}
      {mesaj && <div style={{ color: '#86EFAC', fontSize: 13 }}>{mesaj}</div>}
      {yukleniyor && <div style={{ color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>}

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
              <p style={{ fontSize: 12, color: '#8FA0B5' }}>Ünite kontrol listesi. Yapıldı / reddedildi (neden zorunlu).</p>
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
                        {m}
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
          <AsistanGorselPanel
            reads={payload.vision_reads}
            photos={payload.photos}
            actor="uzman"
            belgeOzet={belgeOzet}
            onDraft={(r) => kaydet({ action: 'vision', assetIds: r.assetIds, task: r.task, observations: r.observations, drafted_by: r.drafted_by }, 'Taslak kaydedildi.')}
            onOnay={(r) => kaydet({ action: 'vision', id: r.id, onay: true }, 'Uzman onaylandı.')}
          />
          <SkorPaneli
            pasi={sonSkor?.pasi}
            easi={sonSkor?.easi}
            dlqi={sonSkor?.dlqi}
            uas7={sonSkor?.uas7}
            salt={sonSkor?.salt}
            showUas7={unit === 'urtiker'}
            showSalt={unit === 'sac'}
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
            today={today}
            patientId={patientId}
            onKaydet={(c) => kaydet({ action: 'yama', ...c }, 'Yama kaydedildi.')}
          />
          <FototerapiDefteri
            sessions={sessions}
            onEkle={(s) => kaydet({ action: 'fototerapi-seans', ...s }, 'Seans eklendi.')}
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
              <p style={{ fontSize: 13, color: '#8FA0B5' }}>700.100 dermoskopi · 530.070 deri biyopsi</p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
