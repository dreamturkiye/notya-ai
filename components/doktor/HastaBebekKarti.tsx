'use client'

/**
 * Pediatri / Ayşe bebek kartı — timeline. Does not import specialties/pediatri (frozen).
 */
import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { NTP_DISCLAIMER } from '@/lib/clinical/yenidogan/constants'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Gorev = {
  id: string
  kind: string
  title: string
  due_at: string
  due_end_at?: string | null
  status: string
  urgency: 'ok' | 'amber' | 'red'
  asi_kod?: string | null
}
type NtpPanel = {
  id: string
  belge_id: string
  sample_no: string | null
  durum: string
  numune_tarihi: string | null
  satirlar: Array<{ canonical_key: string | null; flag: string; raw_name: string }>
}
type Veri = {
  disclaimer: string
  bebek?: { patientId: string; ad: string }
  anne?: { patientId: string; ad: string }
  dogum?: { dogum_at: string; yol: string; kilo: number | null; apgar_1: number | null; apgar_5: number | null }
  timeline?: {
    ntp1: boolean
    ntp2: Gorev | null
    isitme: string | null
    hepb1: boolean
    dvit: boolean
    sonrakiIzlem: Gorev | null
    sonrakiAsi: { kod: string; due_at: string; given_at: string | null } | null
  }
  ntp?: NtpPanel[]
  gorevler?: Gorev[]
  asilar?: Array<{ kod: string; due_at: string; given_at: string | null }>
  smsNtp2?: string | null
}

const URG: Record<string, string> = { ok: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const FLAG: Record<string, string> = {
  normal: '#0F9B8E',
  sinir: '#FBBF24',
  pozitif_suphe: '#F87171',
  yetersiz_ornek: '#FB923C',
  tekrar: '#FB923C',
}

export default function HastaBebekKarti({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Veri | null>(null)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [mesaj, setMesaj] = useState('')

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch(`/api/doktor/yenidogan?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` } })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Yüklenemedi')
      setVeri(d)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const gorevDurum = async (id: string, status: string, neden?: string) => {
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/yenidogan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gorev-durum', gorevId: id, status, neden }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      setHata(j.error || 'Güncellenemedi')
      return
    }
    setMesaj(status === 'red' ? 'Red kaydedildi — takvim satırı duruyor.' : 'Görev güncellendi.')
    yukle()
  }

  if (yukleniyor) return <div style={{ padding: 16, color: CHROME_RENK.muted, fontSize: 13 }}>Bebek kartı yükleniyor…</div>
  if (!veri?.bebek) {
    return (
      <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 20, color: CHROME_RENK.muted, fontSize: 13 }}>
        Bu dosyada bebek kartı yok. Canlı doğum kaydı {KADIN_HASTALIKLARI_DOGUM_ETIKETI} bölümünde bebek kartını otomatik açar.
      </div>
    )
  }

  const tl = veri.timeline
  const kutu: React.CSSProperties = { background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: CHROME_RENK.ink }}>Bebek kartı · {veri.bebek.ad || 'Yenidoğan'}</div>
      <div style={{ fontSize: 12.5, color: '#FBBF24', margin: '6px 0 10px' }}>{veri.disclaimer || NTP_DISCLAIMER}</div>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 12 }}>
        Ayşe / pediatri sahiplenir. {KADIN_HASTALIKLARI_DOGUM_ETIKETI} doğum + ilk örnek + lohusayı tutar. Notya e-Nabız veya ulusal tarama kaydı değildir.
        {veri.anne?.patientId && (
          <> · <Link href={`/dashboard/doktor/hastalar/${veri.anne.patientId}?tab=gebelik`} style={{ color: '#0F9B8E' }}>Anne dosyası</Link></>
        )}
      </div>
      {veri.dogum && (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 12 }}>
          Doğum {new Date(veri.dogum.dogum_at).toLocaleString('tr-TR')} · {veri.dogum.yol}
          {veri.dogum.kilo != null ? ` · ${veri.dogum.kilo} g` : ''}
          {veri.dogum.apgar_1 != null ? ` · APGAR ${veri.dogum.apgar_1}/${veri.dogum.apgar_5 ?? '—'}` : ''}
        </div>
      )}

      <div style={kutu}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>Zaman çizelgesi</div>
        {[
          ['NTP-1 alındı', tl?.ntp1],
          ['NTP-2', Boolean(tl?.ntp2 && tl.ntp2.status === 'yapildi')],
          ['İşitme', Boolean(tl?.isitme && tl.isitme !== 'yapilmadi')],
          ['HepB-1', Boolean(tl?.hepb1)],
          ['D vit', Boolean(tl?.dvit)],
        ].map(([etiket, ok]) => (
          <div key={String(etiket)} style={{ fontSize: 13.5, color: CHROME_RENK.ink, marginBottom: 4 }}>
            <span style={{ color: ok ? '#86EFAC' : CHROME_RENK.muted }}>{ok ? '[x]' : '[ ]'}</span> {etiket}
            {etiket === 'İşitme' && tl?.isitme ? ` · ${tl.isitme}` : ''}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {(veri.ntp || []).flatMap((p) => p.satirlar).filter((s) => s.flag && s.flag !== 'unknown' && s.flag !== 'normal').slice(0, 8).map((s, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: FLAG[s.flag] || CHROME_RENK.muted, border: '1px solid currentColor', borderRadius: 999, padding: '2px 8px' }}>
              {(s.canonical_key || s.raw_name).replace('ntp_', '')} {s.flag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 10 }}>
          Sonraki izlem: {tl?.sonrakiIzlem ? `${tl.sonrakiIzlem.title} · ${new Date(tl.sonrakiIzlem.due_at).toLocaleDateString('tr-TR')}` : '—'}
        </div>
        <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>
          Sonraki aşı: {tl?.sonrakiAsi ? `${tl.sonrakiAsi.kod} · ${new Date(tl.sonrakiAsi.due_at).toLocaleDateString('tr-TR')}` : '—'}
        </div>
      </div>

      <div style={kutu}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>NTP sonuç belgeleri (bebek)</div>
        {(veri.ntp || []).length === 0 && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Henüz NTP belgesi yok. Sonuç PDF’ini bebek Belgeler’ine yükleyip Asistana raporla.</div>}
        {(veri.ntp || []).map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: CHROME_RENK.muted, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span>NTP-{p.sample_no || '?'} · {p.durum} · {p.numune_tarihi ? new Date(p.numune_tarihi).toLocaleDateString('tr-TR') : '—'}</span>
            <Link href={`/dashboard/doktor/hastalar/${patientId}/belgeler/${p.belge_id}/lab`} style={{ color: '#0F9B8E', fontWeight: 700 }}>Asistana raporla →</Link>
          </div>
        ))}
      </div>

      <div style={kutu}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>Görevler</div>
        {(veri.gorevler || []).filter((g) => g.kind !== 'yeni_bebek').map((g) => (
          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${g.status === 'red' ? '#F87171' : URG[g.urgency] || '#475569'}`, paddingLeft: 8 }}>
            <div>
              <div style={{ color: CHROME_RENK.ink }}>{g.title}</div>
              <div style={{ color: CHROME_RENK.muted, fontSize: 11.5 }}>{new Date(g.due_at).toLocaleDateString('tr-TR')} · {g.status}{g.status === 'red' ? ' (takvim duruyor)' : ''}</div>
            </div>
            {g.status === 'bekliyor' && (
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => gorevDurum(g.id, 'yapildi')} style={{ background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Yapıldı</button>
                <button type="button" onClick={() => {
                  const neden = window.prompt('Red nedeni (takvim satırı silinmez)')
                  if (neden) gorevDurum(g.id, 'red', neden)
                }} style={{ background: 'rgba(255,255,255,0.08)', color: CHROME_RENK.ink, border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Red</button>
              </span>
            )}
          </div>
        ))}
      </div>

      {veri.smsNtp2 && (
        <button type="button" onClick={() => navigator.clipboard.writeText(veri.smsNtp2 || '')} style={{ background: 'rgba(255,255,255,0.08)', color: CHROME_RENK.ink, border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          NTP-2 aile SMS metnini kopyala
        </button>
      )}
      {mesaj && <div style={{ marginTop: 8, color: '#0F9B8E', fontSize: 12 }}>{mesaj}</div>}
      {hata && <div style={{ marginTop: 8, color: '#F87171', fontSize: 12 }}>{hata}</div>}
    </div>
  )
}
