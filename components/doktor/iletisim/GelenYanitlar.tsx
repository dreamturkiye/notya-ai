'use client'

/**
 * WHATSAPP-API-01 — "Gelen Yanıtlar": patient replies that reached the connected WhatsApp number, each as a card with the
 * detected intent and one-tap actions (Onayla / İptal Et / Yeniden Planla / Yanıtla). Loaded only when the doctor opens it.
 * Actions go through /api/doktor/iletisim/whatsapp/yanitlar/[id] (doctor-only, doctor_id-scoped on the server).
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { waIstek } from '@/lib/iletisim/whatsapp/istemci'

export type YanitKarti = {
  id: string
  hasta: string | null
  numara: string | null
  niyet: string
  niyetEtiketi: string
  eslesme: string
  durum: string
  otomatikEylem: string | null
  eylemSonucu: string | null
  onerilenSlotlar: { bas: string; son: string; etiket: string }[] | null
  secilenSlot: string | null
  metin: string
  zaman: string
  eylemYapilabilir: boolean
  yanitlanabilir: boolean
}

const OTOMATIK_ETIKET: Record<string, string> = {
  onaylandi: 'Randevu otomatik onaylandı',
  iptal_edildi: 'Randevu hastanın isteğiyle iptal edildi',
  slot_onerildi: 'Hastaya yeni saatler önerildi',
  // WHATSAPP-CANCEL-01: the values yanit.ts really writes.
  randevu_onaylandi: 'Randevu otomatik onaylandı',
  randevu_iptal: 'Hasta iptal etti; randevu iptal edildi ve saat boşaldı. Hastaya onay mesajı gitti.',
  randevu_iptal_gec: 'Hasta iptal süre sınırı içinde iptal etti; randevu iptal edildi ve saat boşaldı. Hastaya onay mesajı gitti.',
  randevu_iptal_geri_alindi: 'Bu iptal geri alındı; randevu yeniden geçerli.',
  zayif_iptal: 'Hasta gelemeyebileceğini yazdı ama net iptal etmedi; randevu iptal EDİLMEDİ. Hastayı arayıp netleştirin.',
}

const dugme: React.CSSProperties = {
  minHeight: 44, padding: '8px 14px', borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, background: '#fff',
  color: CHROME_RENK.ink, fontSize: 14, fontWeight: 600, fontFamily: CHROME_FONT.sans, cursor: 'pointer',
}

const zamanMetni = (iso: string) => {
  try { return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export function YanitKartiGorunumu(props: {
  k: YanitKarti
  mesgul?: boolean
  mesaj?: string | null
  onEylem?: (eylem: 'onayla' | 'iptal' | 'yeniden_planla' | 'yanitla' | 'goruldu' | 'geri_al', ek?: { metin?: string; baslangic?: string }) => void
}) {
  const { k, mesgul } = props
  const [yanitAcik, setYanitAcik] = useState(false)
  const [metin, setMetin] = useState('')
  const kapali = !!mesgul
  const kim = k.hasta || (k.numara ? `Bilinmeyen numara ${k.numara}` : 'Bilinmeyen gönderen')
  return (
    <li data-whatsapp-yanit={k.id} style={{ listStyle: 'none', padding: '14px 0', borderTop: `1px solid ${CHROME_RENK.border}` }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>{kim}</strong>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: CHROME_RENK.cream, color: CHROME_RENK.pine, fontWeight: 600 }}>{k.niyetEtiketi}</span>
        <span style={{ fontSize: 12, color: CHROME_RENK.muted }}>{zamanMetni(k.zaman)}</span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{k.metin || '—'}</p>
      {k.otomatikEylem && OTOMATIK_ETIKET[k.otomatikEylem] && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: CHROME_RENK.pine }}>{OTOMATIK_ETIKET[k.otomatikEylem]}</p>
      )}
      {k.eslesme === 'coklu' && <p style={{ margin: '6px 0 0', fontSize: 13, color: CHROME_RENK.warn }}>Bu numara birden fazla hastaya kayıtlı; lütfen hastayı kendiniz seçin.</p>}
      {k.onerilenSlotlar && k.onerilenSlotlar.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {k.onerilenSlotlar.map((s) => (
            <button key={s.bas} type="button" disabled={kapali || !k.eylemYapilabilir} style={dugme} onClick={() => props.onEylem?.('yeniden_planla', { baslangic: s.bas })}>
              {s.etiket}
            </button>
          ))}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {k.eylemYapilabilir && (
          <>
            <button type="button" disabled={kapali} style={dugme} onClick={() => props.onEylem?.('onayla')}>Onayla</button>
            <button type="button" disabled={kapali} style={dugme} onClick={() => props.onEylem?.('iptal')}>İptal Et</button>
            <button type="button" disabled={kapali} style={dugme} onClick={() => props.onEylem?.('yeniden_planla')}>Yeniden Planla</button>
          </>
        )}
        {k.eylemYapilabilir && (k.otomatikEylem === 'randevu_iptal' || k.otomatikEylem === 'randevu_iptal_gec') && (
          <button type="button" disabled={kapali} style={dugme} onClick={() => props.onEylem?.('geri_al')}>İptali geri al</button>
        )}
        {k.yanitlanabilir && <button type="button" disabled={kapali} style={dugme} onClick={() => setYanitAcik(!yanitAcik)}>Yanıtla</button>}
        {k.durum === 'yeni' && <button type="button" disabled={kapali} style={{ ...dugme, fontWeight: 400, color: CHROME_RENK.muted }} onClick={() => props.onEylem?.('goruldu')}>Görüldü</button>}
      </div>
      {yanitAcik && (
        <form onSubmit={(e) => { e.preventDefault(); if (metin.trim()) { props.onEylem?.('yanitla', { metin: metin.trim() }); setMetin(''); setYanitAcik(false) } }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={metin} onChange={(e) => setMetin(e.target.value)} maxLength={1000} aria-label="Yanıt" placeholder="Yanıtınızı yazın…" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, fontFamily: CHROME_FONT.sans }} />
          <button type="submit" disabled={kapali || !metin.trim()} style={{ ...dugme, background: CHROME_RENK.pine, color: CHROME_RENK.cream, border: 'none' }}>Gönder</button>
        </form>
      )}
      {props.mesaj && <p role="status" style={{ margin: '8px 0 0', fontSize: 13, color: CHROME_RENK.pine }}>{props.mesaj}</p>}
    </li>
  )
}

export default function GelenYanitlar(props: { yeni?: number }) {
  const [acik, setAcik] = useState(false)
  const [liste, setListe] = useState<YanitKarti[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [mesajlar, setMesajlar] = useState<Record<string, string>>({})

  const yukle = useCallback(async () => {
    try {
      const r = await waIstek('/api/doktor/iletisim/whatsapp/yanitlar')
      const j = r ? await r.json().catch(() => null) : null
      if (!r?.ok || !j) return setHata('Yanıtlar şu an okunamadı.')
      setHata(null)
      setListe(j.yanitlar || [])
    } catch { setHata('Yanıtlar şu an okunamadı.') }
  }, [])
  useEffect(() => { if (acik) void yukle() }, [acik, yukle])

  const eylem = async (id: string, e: string, ek?: { metin?: string; baslangic?: string }) => {
    if (e === 'iptal' && !window.confirm('Randevu iptal edilsin mi? Hastaya bildirim gider.')) return
    if (e === 'geri_al' && !window.confirm('Hastanın WhatsApp ile yaptığı iptal geri alınsın mı? Hastaya randevusunun yeniden geçerli olduğu bildirilir.')) return
    setMesgul(true)
    try {
      const r = await waIstek(`/api/doktor/iletisim/whatsapp/yanitlar/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eylem: e, ...ek }) })
      const j = r ? await r.json().catch(() => ({})) : {}
      setMesajlar((m) => ({ ...m, [id]: r?.ok ? String(j.mesaj || 'Tamam.') : String(j.error || 'İşlem yapılamadı.') }))
    } catch { setMesajlar((m) => ({ ...m, [id]: 'İşlem yapılamadı.' })) }
    setMesgul(false)
    void yukle()
  }

  const yeni = props.yeni || 0
  return (
    <div data-gelen-yanitlar style={{ marginTop: 14 }}>
      <button type="button" aria-expanded={acik} onClick={() => setAcik(!acik)} style={{ ...dugme, width: '100%', textAlign: 'left' }}>
        Gelen Yanıtlar{yeni > 0 ? ` (${yeni} yeni)` : ''}
      </button>
      {acik && (
        <div style={{ marginTop: 6 }}>
          {hata && <p role="alert" style={{ fontSize: 13, color: CHROME_RENK.warn }}>{hata}</p>}
          {liste && liste.length === 0 && <p style={{ fontSize: 14, color: CHROME_RENK.muted }}>Henüz gelen yanıt yok.</p>}
          <ul style={{ margin: 0, padding: 0 }}>
            {(liste || []).map((k) => (
              <YanitKartiGorunumu key={k.id} k={k} mesgul={mesgul} mesaj={mesajlar[k.id]} onEylem={(e, ek) => void eylem(k.id, e, ek)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
