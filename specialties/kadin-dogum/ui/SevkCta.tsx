'use client'

import { useState } from 'react'
import { kutu, btn, giris, etiketS } from './clinic-styles'

export function SevkCta({
  sevk,
  nedenler,
  onSevkOlustur,
}: {
  sevk: boolean
  nedenler: string[]
  onSevkOlustur?: (not: string) => Promise<void> | void
}) {
  const tr: Record<string, string> = {
    'monochorionic twins': 'Monokoryonik ikiz',
    'TTTS concern': 'TTTS şüphesi',
    'EFW <10th + abnormal Doppler': 'EFW <10. persentil + anormal Doppler',
    'PE with severe features': 'Ağır özellikli preeklampsi',
    'placenta previa/accreta': 'Plasenta previa / akreta',
    'insulin GDM poor control': 'İnsülinli GDM, kontrolsüz',
    'cervical length short': 'Kısa serviks',
    'fetal anomaly on 18–22w scan': '18–22. hafta fetal anomali',
    'stillbirth history': 'Ölü doğum öyküsü',
    'risk_class yuksek': 'Yüksek risk sınıfı',
  }
  const [not, setNot] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [yazi, setYazi] = useState(false)
  const gonder = async () => {
    const metin = not.trim() || (sevk ? nedenler.map((n) => tr[n] || n).join('; ') : '')
    if (!metin) { setMesaj('Kısa bir sevk notu yazın.'); return }
    if (!onSevkOlustur) return
    setYazi(true); setMesaj('')
    try {
      await onSevkOlustur(metin)
      setMesaj('Sevk notu kaydedildi.')
      setNot('')
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally { setYazi(false) }
  }
  return (
    <section style={{ ...kutu, borderColor: sevk ? 'rgba(239,68,68,0.45)' : undefined }} data-kd="sevk-cta" data-sevk={sevk ? 'aktif' : 'yok'}>
      <h2 style={{ margin: 0, fontSize: 16, color: sevk ? '#FCA5A5' : undefined }}>
        {sevk ? 'Perinatoloji sevk önerisi' : 'Perinatoloji sevk'}
      </h2>
      {sevk ? (
        <>
          <p style={{ fontSize: 12, color: '#8FA0B5' }}>Sipariş değildir. Risk formu / Riskli Gebelikler tetikledi.</p>
          <ul style={{ fontSize: 13, color: '#EDF1F7' }}>
            {nedenler.map((n) => <li key={n}>{tr[n] || n}</li>)}
          </ul>
        </>
      ) : (
        <p style={{ fontSize: 13, color: '#8FA0B5', margin: '8px 0 0' }} data-sevk-durum="oneri-yok">
          Şu an sevk önerisi yok. Yüksek risk, previa, mo-di ikiz veya Riskli Gebelikler tetikleyince burada görünür. Sipariş değildir.
        </p>
      )}
      <label style={{ display: 'block', marginTop: 10 }}>
        <span style={etiketS}>Sevk notu</span>
        <textarea
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Sevk nedeni / kime (ör. perinatoloji, acil)"
          style={{ ...giris, minHeight: 56 }}
          data-kd="sevk-not"
        />
      </label>
      <button
        type="button"
        style={{ ...btn(true), marginTop: 8, opacity: yazi ? 0.7 : 1 }}
        onClick={gonder}
        disabled={yazi}
        data-kd="sevk-olustur"
      >
        Sevk oluştur / not ekle
      </button>
      {mesaj && <p style={{ fontSize: 12, color: mesaj.includes('Kaydedildi') || mesaj.includes('kaydedildi') ? '#22C55E' : '#F87171', margin: '6px 0 0' }}>{mesaj}</p>}
    </section>
  )
}

export default SevkCta
