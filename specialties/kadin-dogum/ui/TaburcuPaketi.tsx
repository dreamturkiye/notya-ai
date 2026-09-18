'use client'

import { useEffect, useState } from 'react'
import { kutu, giris, etiketS, btn } from './clinic-styles'
import { NTP_DISCLAIMER, TABURCU_ETIKET } from '@/lib/clinical/yenidogan/constants'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'

type Taburcu = {
  ntp1_alindi_at?: string | null
  ntp1_barkod?: string | null
  ntp1_beslenme_sonrasi?: boolean | null
  ntp2_randevu_at?: string | null
  ntp2_yer?: string | null
  hepb1_at?: string | null
  vitk_at?: string | null
  isitme_at?: string | null
  isitme_sonuc?: string | null
  pulseox_at?: string | null
  pulseox_sonuc?: string | null
  kirmizi_refleks?: boolean | null
  gkd_risk?: boolean
  dvit_baslandi?: boolean | null
  emzirme_danismanlik?: boolean | null
  taburcu_onay_at?: string | null
  red_json?: { maddeler?: Array<{ kalem: string; neden: string; status: string }> }
  istisna?: { neden?: string; aciklama?: string } | null
}

function isoLocal(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

export default function TaburcuPaketi({
  dogumId,
  bebekPatientId,
  taburcu,
  gate,
  sms,
  onKaydet,
  onTamamla,
  onRed,
}: {
  dogumId: string
  bebekPatientId?: string | null
  taburcu: Taburcu | null
  gate: { ok: boolean; eksik: string[]; neden: string; tamamlandi?: boolean }
  sms?: string | null
  onKaydet: (patch: Record<string, unknown>) => Promise<void>
  onTamamla: (istisna?: { neden: string; aciklama: string } | null) => Promise<void>
  onRed: (kalem: string, neden: string) => Promise<void>
}) {
  const [t, setT] = useState<Record<string, string>>({})
  const [istisna, setIstisna] = useState({ neden: '', aciklama: '' })
  const [redKalem, setRedKalem] = useState('ntp1')
  const [redNeden, setRedNeden] = useState('')
  const kilitli = Boolean(taburcu?.taburcu_onay_at || gate.tamamlandi)

  useEffect(() => {
    if (!taburcu) return
    setT({
      ntp1Barkod: taburcu.ntp1_barkod || '',
      isitmeSonuc: taburcu.isitme_sonuc || '',
      pulseoxSonuc: taburcu.pulseox_sonuc || '',
    })
  }, [taburcu])

  const tik = async (alan: string, checked: boolean) => {
    if (kilitli) return
    const now = isoLocal()
    await onKaydet({ [alan]: checked ? now : null })
  }

  const zorunluOk = gate.ok || kilitli
  const redler = taburcu?.red_json?.maddeler || []

  return (
    <div style={kutu} data-kd="taburcu-paketi">
      <div style={{ fontWeight: 800, color: '#EDF1F7', marginBottom: 4 }}>Taburcu paketi</div>
      <div style={{ fontSize: 12, color: '#FBBF24', marginBottom: 8 }}>{NTP_DISCLAIMER}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>
        {KADIN_HASTALIKLARI_DOGUM_ETIKETI}: doğum + ilk örnek + lohusa. Pediatri (Ayşe) taburcu sonrası bebeği sahiplenir. Notya e-Nabız yerine geçmez.
      </div>

      {([
        ['ntp1AlindiAt', 'ntp1', taburcu?.ntp1_alindi_at, TABURCU_ETIKET.ntp1],
        ['hepb1At', 'hepb1', taburcu?.hepb1_at, TABURCU_ETIKET.hepb1],
        ['vitkAt', 'vitk', taburcu?.vitk_at, TABURCU_ETIKET.vitk],
        ['isitmeAt', 'isitme', taburcu?.isitme_at, TABURCU_ETIKET.isitme],
      ] as const).map(([alan, kalem, at, etiket]) => (
        <label key={kalem} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, color: '#EDF1F7', fontSize: 13 }}>
          <input type="checkbox" disabled={kilitli} checked={Boolean(at)} onChange={(e) => tik(alan, e.target.checked)} />
          <span>
            <b>{etiket}</b>
            {at && <span style={{ color: '#86EFAC', marginLeft: 8 }}>· {new Date(at).toLocaleString('tr-TR')}</span>}
            {redler.some((r) => r.kalem === kalem) && <span style={{ color: '#F87171', marginLeft: 8 }}>· reddedildi</span>}
          </span>
        </label>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, margin: '10px 0' }}>
        <label><span style={etiketS}>NTP-1 barkod</span><input value={t.ntp1Barkod || ''} disabled={kilitli} onChange={(e) => setT({ ...t, ntp1Barkod: e.target.value })} onBlur={() => onKaydet({ ntp1Barkod: t.ntp1Barkod })} style={giris} /></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C9D4E3', fontSize: 13, marginTop: 18 }}>
          <input type="checkbox" disabled={kilitli} checked={Boolean(taburcu?.ntp1_beslenme_sonrasi)} onChange={(e) => onKaydet({ ntp1BeslenmeSonrasi: e.target.checked })} /> Oral beslenme sonrası
        </label>
        <label><span style={etiketS}>İşitme sonuç</span>
          <select value={t.isitmeSonuc || ''} disabled={kilitli} onChange={(e) => { setT({ ...t, isitmeSonuc: e.target.value }); onKaydet({ isitmeSonuc: e.target.value || null }) }} style={giris}>
            <option value="">—</option>
            <option value="gec">Geçti</option>
            <option value="kaldi">Kaldı</option>
            <option value="yapilmadi">Yapılmadı</option>
          </select>
        </label>
        <label><span style={etiketS}>Pulse-oksijen</span>
          <select value={t.pulseoxSonuc || ''} disabled={kilitli} onChange={(e) => { setT({ ...t, pulseoxSonuc: e.target.value }); onKaydet({ pulseoxSonuc: e.target.value || null, pulseoxAt: e.target.value ? isoLocal() : null }) }} style={giris}>
            <option value="">—</option>
            <option value="gec">Geçti</option>
            <option value="kaldi">Kaldı</option>
          </select>
        </label>
      </div>

      <label style={{ display: 'flex', gap: 8, color: '#EDF1F7', fontSize: 13, marginBottom: 6 }}>
        <input type="checkbox" disabled={kilitli} checked={Boolean(taburcu?.kirmizi_refleks)} onChange={(e) => onKaydet({ kirmiziRefleks: e.target.checked })} /> Kırmızı refleks
      </label>
      <label style={{ display: 'flex', gap: 8, color: '#EDF1F7', fontSize: 13, marginBottom: 6 }}>
        <input type="checkbox" disabled={kilitli} checked={Boolean(taburcu?.gkd_risk)} onChange={(e) => onKaydet({ gkdRisk: e.target.checked })} /> GKD riski (kalça US 6. haftaya)
      </label>
      <label style={{ display: 'flex', gap: 8, color: '#EDF1F7', fontSize: 13, marginBottom: 6 }}>
        <input type="checkbox" disabled={kilitli} checked={Boolean(taburcu?.dvit_baslandi)} onChange={(e) => onKaydet({ dvitBaslandi: e.target.checked })} /> D vitamini başlandı (400 IU / 3 damla)
      </label>
      <label style={{ display: 'flex', gap: 8, color: '#EDF1F7', fontSize: 13, marginBottom: 12 }}>
        <input type="checkbox" disabled={kilitli} checked={Boolean(taburcu?.emzirme_danismanlik)} onChange={(e) => onKaydet({ emzirmeDanismanlik: e.target.checked })} /> Emzirme danışmanlığı
      </label>

      <details style={{ marginBottom: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#FBBF24', fontSize: 13 }}>Ebeveyn reddi (status=red — takvim satırı silinmez)</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <select value={redKalem} onChange={(e) => setRedKalem(e.target.value)} style={giris}>
            <option value="ntp1">NTP-1</option>
            <option value="hepb1">HepB-1</option>
            <option value="vitk">Vit K</option>
            <option value="isitme">İşitme</option>
          </select>
          <input placeholder="Neden" value={redNeden} onChange={(e) => setRedNeden(e.target.value)} style={giris} />
          <button type="button" style={btn()} disabled={kilitli || !redNeden.trim()} onClick={() => onRed(redKalem, redNeden)}>Reddi kaydet</button>
        </div>
      </details>

      {!zorunluOk && (
        <div style={{ fontSize: 12.5, color: '#FCA5A5', marginBottom: 8 }}>{gate.neden}</div>
      )}

      <details style={{ marginBottom: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#C9D4E3', fontSize: 13 }}>İstisna (erken taburcu / redd / sevk) + görev</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <select value={istisna.neden} onChange={(e) => setIstisna({ ...istisna, neden: e.target.value })} style={giris}>
            <option value="">—</option>
            <option value="erken_taburcu">Erken taburcu</option>
            <option value="redd">Redd</option>
            <option value="sevk">Sevk</option>
          </select>
          <textarea placeholder="Gerekçe (zorunlu)" value={istisna.aciklama} onChange={(e) => setIstisna({ ...istisna, aciklama: e.target.value })} style={{ ...giris, minHeight: 56 }} />
        </div>
      </details>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          disabled={kilitli || (!gate.ok && !(istisna.neden && istisna.aciklama.trim()))}
          title={!gate.ok ? 'Zorunlu maddeler veya belgelenmiş istisna gerekir' : 'Taburcuyu tamamla'}
          style={{ ...btn(true), opacity: kilitli || (!gate.ok && !(istisna.neden && istisna.aciklama.trim())) ? 0.45 : 1, cursor: kilitli ? 'not-allowed' : 'pointer' }}
          onClick={() => onTamamla(istisna.neden && istisna.aciklama.trim() ? istisna : null)}
        >
          {kilitli ? 'Taburcu tamamlandı' : 'Taburcuyu tamamla'}
        </button>
        {bebekPatientId && (
          <a href={`/dashboard/doktor/hastalar/${bebekPatientId}?tab=bebek`} style={{ ...btn(), textDecoration: 'none' }}>Bebek kartı →</a>
        )}
      </div>
      {sms && (
        <p style={{ fontSize: 12, color: '#C9D4E3', marginTop: 10 }}>
          Aile SMS metni (isteğe bağlı): <button type="button" style={btn()} onClick={() => navigator.clipboard.writeText(sms)}>Kopyala</button>
        </p>
      )}
    </div>
  )
}
