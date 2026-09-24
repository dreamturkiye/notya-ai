'use client'

import { kutu, giris, etiketS } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Lohusa = {
  kanama?: string | null
  meme?: string | null
  epizyo_kesi?: string | null
  duygu_durum?: string | null
  rhogam_at?: string | null
  rhogam_endike?: boolean | null
  demir_devam?: boolean | null
}

export default function LohusaPaketi({
  lohusa,
  onKaydet,
}: {
  lohusa: Lohusa | null
  onKaydet: (patch: Record<string, unknown>) => Promise<void>
}) {
  const l = lohusa || {}
  return (
    <div style={kutu} data-kd="lohusa-paket">
      <div style={{ fontWeight: 800, color: CHROME_RENK.ink, marginBottom: 4 }}>Lohusa kontrol listesi (anne)</div>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 10 }}>
        DSBYR — kanama, meme, epizyo/kesi, duygu durum, endike ise Anti-D, demir devam. Yenidoğan tarama sonuçları burada ve anne Belgeler’de tutulmaz.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <label><span style={etiketS}>Kanama / loşi</span>
          <select defaultValue={l.kanama || ''} onChange={(e) => onKaydet({ kanama: e.target.value || null })} style={giris}>
            <option value="">—</option>
            <option>Normal</option>
            <option>Fazla</option>
            <option>Kötü kokulu</option>
            <option>Kesildi</option>
          </select>
        </label>
        <label><span style={etiketS}>Meme</span>
          <select defaultValue={l.meme || ''} onChange={(e) => onKaydet({ meme: e.target.value || null })} style={giris}>
            <option value="">—</option>
            <option>Sorunsuz</option>
            <option>Çatlak / ağrı</option>
            <option>Tıkanıklık</option>
            <option>Mastit şüphesi</option>
          </select>
        </label>
        <label><span style={etiketS}>Epizyo / kesi</span>
          <select defaultValue={l.epizyo_kesi || ''} onChange={(e) => onKaydet({ epizyoKesi: e.target.value || null })} style={giris}>
            <option value="">—</option>
            <option>İyileşiyor</option>
            <option>Enfeksiyon şüphesi</option>
            <option>Ayrışma</option>
          </select>
        </label>
        <label><span style={etiketS}>Duygu durum</span>
          <select defaultValue={l.duygu_durum || ''} onChange={(e) => onKaydet({ duyguDurum: e.target.value || null })} style={giris}>
            <option value="">—</option>
            <option>İyi</option>
            <option>Hüzünlü (baby blues)</option>
            <option>Depresif belirtiler</option>
          </select>
        </label>
      </div>
      <label style={{ display: 'flex', gap: 8, marginTop: 10, color: CHROME_RENK.ink, fontSize: 13 }}>
        <input type="checkbox" defaultChecked={Boolean(l.rhogam_endike)} onChange={(e) => onKaydet({ rhogamEndike: e.target.checked })} />
        Anti-D (Rhogam) endike
      </label>
      {l.rhogam_endike && (
        <label style={{ display: 'block', marginTop: 8 }}>
          <span style={etiketS}>Anti-D tarihi</span>
          <input type="datetime-local" defaultValue={l.rhogam_at ? l.rhogam_at.slice(0, 16) : ''} onBlur={(e) => onKaydet({ rhogamAt: e.target.value || null })} style={giris} />
        </label>
      )}
      <label style={{ display: 'flex', gap: 8, marginTop: 8, color: CHROME_RENK.ink, fontSize: 13 }}>
        <input type="checkbox" defaultChecked={Boolean(l.demir_devam)} onChange={(e) => onKaydet({ demirDevam: e.target.checked })} />
        Demir profilaksisine devam
      </label>
      <div style={{ marginTop: 10, fontSize: 11.5, color: CHROME_RENK.muted }}>Kaynak: SB DSBYR lohusa izlemi. DÖBYR gebelik izlemi ile birleştirilmez.</div>
    </div>
  )
}
