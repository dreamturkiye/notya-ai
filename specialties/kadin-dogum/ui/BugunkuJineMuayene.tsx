'use client'
/**
 * NOTYA-JINE-OFIS — Visit-first office gynecology encounter.
 * Hikaye → Muayene → A/P → Tarama → Görüntü → Reçete → Kontrol.
 * Disease modules (CYBH, PCOS, AUB…) stay optional below this spine.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { kutu, giris, etiketS, btn } from './clinic-styles'
import { TrTarihAlan } from './TrTarihAlan'
import KolposkopiGaleri from './KolposkopiGaleri'
import StickyJineStrip from './StickyJineStrip'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import {
  taslakBugunkuVizit,
  jineSticky,
  ofisVizitOzet,
  isoToTr,
  type JineOfisSoap,
} from '../engines/jine-ofis-vizit'
import type { Due } from '../engines/jinekoloji-spine'
import type { ColpoImage } from '../schema'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type VizitSatir = { id: string; tur: string; alanlar: Record<string, unknown> | null; soap?: unknown; kontrol_tarihi?: string | null; kontrol_neden?: string | null; created_at: string }
type Veri = {
  kadinSagligi: Record<string, unknown> | null
  due: Due[]
  serviks: { pap_sonuc: string | null; hpv: string | null; tarih: string }[]
  kontrasepsiyon: { yontem: string; aktif: boolean }[]
  vizitler: VizitSatir[]
  gorevler: { id: string; ad: string; due: string | null }[]
  gebe: boolean
  yas?: number | null
  sticky?: { chips: { kod: string; etiket: string; deger: string }[]; gebeChip: string | null }
  taslak?: JineOfisSoap
}

const etiket: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0F9B8E', marginBottom: 8 }
const kucuk: React.CSSProperties = { fontSize: 11.5, color: CHROME_RENK.muted }
const bolum: React.CSSProperties = { ...kutu, marginBottom: 10 }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }

function alan(label: string, value: string, on: (v: string) => void, ph = '', coklu = false) {
  return (
    <label style={{ display: 'block' }}>
      <span style={etiketS}>{label}</span>
      {coklu
        ? <textarea value={value} placeholder={ph} onChange={(e) => on(e.target.value)} style={{ ...giris, minHeight: 64 }} />
        : <input value={value} placeholder={ph} onChange={(e) => on(e.target.value)} style={giris} />}
    </label>
  )
}

export function BugunkuJineMuayene({
  patientId,
  onKlinikMod,
  colpoImages = [],
  goruntuUrl = {},
}: {
  patientId: string
  onKlinikMod?: () => void
  colpoImages?: ColpoImage[]
  goruntuUrl?: Record<string, string>
}) {
  const [v, setV] = useState<Veri | null>(null)
  const [soap, setSoap] = useState<JineOfisSoap | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null) // NOTYA-MUAYENEYE-DON-01
  const [hata, setHata] = useState('')
  const [planYazi, setPlanYazi] = useState('')
  const [randevuSaat, setRandevuSaat] = useState('10:00')
  const [formAcik, setFormAcik] = useState(true)

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/jinekoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json() as Veri
    setV(j)
  }, [patientId])
  useEffect(() => { yukle() }, [yukle])

  useEffect(() => {
    if (!v || soap) return
    const taslak = v.taslak || taslakBugunkuVizit({
      sonSoap: null,
      kadinSagligi: v.kadinSagligi,
      due: v.due,
      kontrasepsiyon: v.kontrasepsiyon.find((k) => k.aktif)?.yontem || String(v.kadinSagligi?.kontrasepsiyon_yontemi || ''),
    })
    setSoap(taslak)
    setPlanYazi(taslak.degerlendirme.plan.join('\n'))
  }, [v, soap])

  const h = soap?.hikaye
  const setH = (k: keyof NonNullable<typeof h>, x: string) => setSoap((p) => p ? { ...p, hikaye: { ...p.hikaye, [k]: x } } : p)
  const setM = (k: keyof JineOfisSoap['muayene'], x: string) => setSoap((p) => p ? { ...p, muayene: { ...p.muayene, [k]: x } } : p)
  const setT = (k: keyof JineOfisSoap['tarama'], x: string | null) => setSoap((p) => p ? { ...p, tarama: { ...p.tarama, [k]: x } } : p)

  const kaydet = async (muayeneFormunaEkle: boolean) => {
    if (!soap) return
    setMesaj(''); setHata(''); setEklenenNot(null)
    const plan = planYazi.split(/\n+/).map((s) => s.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
    const govde = { ...soap, degerlendirme: { ...soap.degerlendirme, plan } }
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/jinekoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, adim: 'ofis_vizit', soap: govde, muayeneFormunaEkle }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi')
      setMesaj(muayeneFormunaEkle
        ? (j.notEkleme?.eklendi ? 'Muayene kaydedildi ve bugünkü forma eklendi.' : `Muayene kaydedildi. ${j.notEkleme?.sebep || ''}`)
        : 'Muayene kaydedildi.')
      setEklenenNot(muayeneFormunaEkle ? eklenenNotId(j) : null)
      setSoap(null)
      await yukle()
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi') }
  }

  const randevuOlustur = async () => {
    const tarih = soap?.kontrol.tarih
    if (!tarih) { setHata('Kontrol tarihi girin.'); return }
    setHata('')
    try {
      const token = await getAccessTokenAsync()
      const [hh, mm] = randevuSaat.split(':').map(Number)
      const bitisD = new Date(`${tarih}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`)
      bitisD.setMinutes(bitisD.getMinutes() + 20)
      const r = await fetch('/api/doktor/randevular', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          baslangic: `${tarih}T${randevuSaat}:00`,
          bitis: `${tarih}T${String(bitisD.getHours()).padStart(2, '0')}:${String(bitisD.getMinutes()).padStart(2, '0')}:00`,
          tur: 'muayene',
          notlar: soap?.kontrol.neden || 'Jinekoloji kontrol',
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Randevu oluşturulamadı')
      setMesaj('Kontrol randevusu oluşturuldu.'); setEklenenNot(null)
    } catch (e) { setHata(e instanceof Error ? e.message : 'Randevu oluşturulamadı') }
  }

  const sticky = useMemo(() => {
    if (v?.sticky) return v.sticky
    if (!v) return { chips: [], gebeChip: null as string | null }
    const aktifK = v.kontrasepsiyon.find((k) => k.aktif)?.yontem || String(v.kadinSagligi?.kontrasepsiyon_yontemi || '')
    return jineSticky({
      lmp: soap?.hikaye.lmp || (v.kadinSagligi?.son_adet_tarihi ? String(v.kadinSagligi.son_adet_tarihi) : null),
      yas: v.yas ?? null,
      kontrasepsiyon: aktifK,
      due: v.due,
      sonrakiKontrol: soap?.kontrol.tarih || v.vizitler[0]?.kontrol_tarihi || null,
      gebe: v.gebe,
    })
  }, [v, soap])

  const papBos = !soap?.tarama.pap && !v?.kadinSagligi?.son_pap && !v?.serviks[0]?.pap_sonuc
  const hpvBos = !soap?.tarama.hpv && !v?.kadinSagligi?.son_hpv && !v?.serviks[0]?.hpv
  const colpoBos = colpoImages.length === 0

  if (!v || !soap || !h) return <div style={{ ...kutu, color: CHROME_RENK.muted, fontSize: 13 }}>Jinekoloji muayenesi yükleniyor…</div>

  return (
    <div data-kd="bugunku-jine">
      <StickyJineStrip
        chips={sticky.chips}
        gebeChip={sticky.gebeChip}
        onKlinikMod={onKlinikMod}
        onBugunkuMuayene={() => {
          setFormAcik(true)
          document.getElementById('bugunku-jine-muayene')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      />

      <div id="bugunku-jine-muayene" style={{ ...kutu, marginTop: 12 }} data-kd="jine-vizit-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontWeight: 800, color: CHROME_RENK.ink, fontSize: 16 }}>Bugünkü jinekoloji muayenesi</div>
            <div style={kucuk}>ACOG pratik gold · SB/KETEM tarama · Berek &amp; Novak / Temel KD. Çelişki iki sütun; birleştirilmez. Gebelik GA/TDT bu omurgada yok.</div>
          </div>
          <button type="button" style={btn()} onClick={() => setFormAcik((x) => !x)}>{formAcik ? 'Küçült' : 'Aç'}</button>
        </div>
        {hata && <div style={{ color: '#F87171', fontSize: 13, marginTop: 8 }}>{hata}</div>}
        {mesaj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ color: '#22C55E', fontSize: 13 }}>{mesaj}</span>
            <MuayeneFormunaDon notId={eklenenNot} />
          </div>
        )}

        {formAcik && (
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <section style={bolum} data-jine-bolum="hikaye">
              <div style={etiket}>1. Hikaye</div>
              <div style={grid}>
                {alan('Başvuru şikayeti', h.sikayet, (x) => setH('sikayet', x), 'ör. lekelenme, ağrı, akıntı')}
                {alan('Süre', h.sure, (x) => setH('sure', x), 'ör. 3 ay')}
                <TrTarihAlan label="Jine SAT (son adet)" value={h.lmp || ''} onChange={(iso) => setH('lmp', iso)} />
                {alan('Gravida / parite', h.gravida_para, (x) => setH('gravida_para', x), 'G2 P1')}
                {alan('İlaç', h.ilac, (x) => setH('ilac', x), 'sürekli ilaç')}
                {alan('Allerji', h.allerji, (x) => setH('allerji', x))}
                {alan('Kontrasepsiyon', h.kontrasepsiyon, (x) => setH('kontrasepsiyon', x), 'RİA / KOK / yok')}
              </div>
            </section>

            <section style={bolum} data-jine-bolum="muayene">
              <div style={etiket}>2. Muayene</div>
              <div style={grid}>
                {alan('Spekulum', soap.muayene.spekulum, (x) => setM('spekulum', x), 'serviks, akıntı', true)}
                {alan('Bimanuel', soap.muayene.bimanuel, (x) => setM('bimanuel', x), 'uterus, adneks, hassasiyet', true)}
                {alan('TVUS', soap.muayene.tvus, (x) => setM('tvus', x), 'ET mm, overler, myom', true)}
                {alan('Serbest not', soap.muayene.serbest, (x) => setM('serbest', x), 'meme, batın…', true)}
              </div>
            </section>

            <section style={bolum} data-jine-bolum="ap">
              <div style={etiket}>3. Değerlendirme / Plan (A/P)</div>
              {alan('Kısa değerlendirme', soap.degerlendirme.degerlendirme, (x) => setSoap((p) => p ? { ...p, degerlendirme: { ...p.degerlendirme, degerlendirme: x } } : p), 'kronik sorunlar taşınır; bugünün kararı hekimindir', true)}
              <label style={{ display: 'block', marginTop: 8 }}>
                <span style={etiketS}>Plan (her satır bir madde)</span>
                <textarea value={planYazi} onChange={(e) => setPlanYazi(e.target.value)} placeholder={'Pap tekrarı\nRİA ip kontrolü'} style={{ ...giris, minHeight: 72 }} />
              </label>
            </section>

            <section style={bolum} data-jine-bolum="tarama">
              <div style={etiket}>4. Tarama / patoloji</div>
              {soap.tarama.dueCue && <div style={{ ...kucuk, marginBottom: 8, color: '#7A5B1E' }}>{soap.tarama.dueCue}</div>}
              <div style={grid}>
                {alan('Pap', soap.tarama.pap, (x) => setT('pap', x), 'NILM / ASC-US / …')}
                {alan('HPV', soap.tarama.hpv, (x) => setT('hpv', x), 'negatif / 16 / 18')}
                {alan('Sitoloji notu', soap.tarama.sitoloji, (x) => setT('sitoloji', x))}
                {alan('Histoloji', soap.tarama.histoloji, (x) => setT('histoloji', x), 'CIN?')}
                <TrTarihAlan label="Sonraki tarama" value={soap.tarama.sonrakiDue || ''} onChange={(iso) => setT('sonrakiDue', iso || null)} />
              </div>
              {(papBos || hpvBos) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {papBos && <span style={{ ...kucuk, color: '#FBBF24' }}>Pap sonucu gir</span>}
                  {hpvBos && <span style={{ ...kucuk, color: '#FBBF24' }}>HPV sonucu gir</span>}
                </div>
              )}
              {v.due.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {v.due.map((d) => (
                    <div key={d.kod} style={{ fontSize: 12, color: CHROME_RENK.muted, padding: '3px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <b style={{ color: d.durum === 'gecikti' ? '#F87171' : d.takvim === 'SB' ? '#93C5FD' : '#0F9B8E' }}>{d.takvim === 'her_ikisi' ? 'SB + ofis' : d.takvim === 'SB' ? 'SB/KETEM' : 'Ofis'}</b>
                      {' · '}{d.ad}{d.due ? ` · ${isoToTr(d.due)}` : ''} · {d.not}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={bolum} data-jine-bolum="goruntu">
              <div style={etiket}>5. Görüntü / kolposkopi</div>
              {colpoBos ? (
                <div>
                  <p style={{ ...kucuk, margin: '0 0 8px' }}>Kolposkopi arşivi boş. Görüntüler mevcut Görüntüleme kaydına bağlıdır; ayrı depo yok.</p>
                  <a href={`/dashboard/doktor/hastalar/${patientId}?tab=goruntuleme`} style={{ ...btn(true), textDecoration: 'none', display: 'inline-block' }}>Kolposkopi görüntüsü ekle</a>
                </div>
              ) : (
                <KolposkopiGaleri images={colpoImages} urls={goruntuUrl} />
              )}
            </section>

            <section style={bolum} data-jine-bolum="recete">
              <div style={etiket}>6. Reçete / işlem</div>
              <p style={kucuk}>Medula e-reçete burada yeniden yazılmaz. Mevcut ilaç ve seans yüzeylerine geçin.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <a href={`/dashboard/doktor/hastalar/${patientId}?tab=ilaclar`} style={{ ...btn(true), textDecoration: 'none' }}>İlaçlar / reçete</a>
                <a href={`/dashboard/doktor/hastalar/${patientId}?tab=muayene`} style={{ ...btn(), textDecoration: 'none' }}>Bugünkü muayene seansı</a>
              </div>
            </section>

            <section style={bolum} data-jine-bolum="kontrol">
              <div style={etiket}>7. Kontrol / sonraki randevu</div>
              <div style={grid}>
                <TrTarihAlan label="Kontrol tarihi" value={soap.kontrol.tarih || ''} onChange={(iso) => setSoap((p) => p ? { ...p, kontrol: { ...p.kontrol, tarih: iso || null } } : p)} />
                {alan('Neden', soap.kontrol.neden, (x) => setSoap((p) => p ? { ...p, kontrol: { ...p.kontrol, neden: x } } : p), 'Pap tekrarı, RİA ip, semptom…')}
                <label style={{ display: 'block' }}>
                  <span style={etiketS}>Saat</span>
                  <input type="time" value={randevuSaat} onChange={(e) => setRandevuSaat(e.target.value)} style={giris} />
                </label>
              </div>
              <button type="button" style={{ ...btn(), marginTop: 8 }} onClick={randevuOlustur} data-kd="cta-kontrol-randevu">Kontrol randevusu</button>
            </section>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={btn()} onClick={() => kaydet(false)}>Sadece kaydet</button>
              <button type="button" style={btn(true)} onClick={() => kaydet(true)} data-kd="cta-jine-kaydet">Kaydet ve bugünkü muayene formuna ekle</button>
            </div>
            <div style={kucuk}>{ofisVizitOzet({ ...soap, degerlendirme: { ...soap.degerlendirme, plan: planYazi.split(/\n+/).map((s) => s.trim()).filter(Boolean) } })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BugunkuJineMuayene
