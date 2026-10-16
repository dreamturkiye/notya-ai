'use client'

/**
 * NOTYA-ASI-STOK-BARKOD-01 — Entegrasyonlar → Aşı Stok ve Barkod Sistemi.
 * Modül aç/kapa (branş varsayılanının üzerine yazar) + stok listesi (düşük stok / SKT uyarısı) +
 * yeni stok ekleme formu (barkod/lot elle girilir veya bir barkod okuyucu klavye gibi yazar).
 */
import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const TEAL = CHROME_RENK.pine
const AMBER = '#B4832F'
const RED = '#B3261E'
const GREEN = '#3F7D4A'
const BORDER = CHROME_RENK.border
const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted

type Lot = {
  id: string
  asiAdi: string
  barkod: string
  lotNo: string | null
  miktar: number
  sonKullanmaTarihi: string | null
  sktDurumu: 'gecerli' | 'yaklasiyor' | 'gecti'
  dusukStok: boolean
  stokTukendi: boolean
  varsayilanUygulamaBolgesi: string | null
}

const bos = { asiAdi: '', barkod: '', lotNo: '', miktar: '', sonKullanmaTarihi: '', birimFiyatKurus: '', varsayilanUygulamaBolgesi: '' }

export default function AsiStokPage() {
  const [lotlar, setLotlar] = useState<Lot[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [modulDurumu, setModulDurumu] = useState<{ aktifOverride: boolean | null; faturaVarsayilan: boolean; bransVarsayilani: boolean; etkinAktif: boolean } | null>(null)
  const [form, setForm] = useState(bos)
  const [kaydediliyor, setKaydediliyor] = useState(false)

  const token = () => getDoctorAccessToken()

  const yukle = useCallback(async () => {
    const t = token()
    if (!t) { window.location.href = '/giris/doktor'; return }
    setYukleniyor(true)
    try {
      const [modulR, stokR] = await Promise.all([
        fetch('/api/doktor/asi-stok/modul', { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()),
        fetch('/api/doktor/asi-stok', { headers: { Authorization: `Bearer ${t}` } }),
      ])
      setModulDurumu(modulR)
      if (stokR.status === 403) { setLotlar([]); setHata('') }
      else {
        const d = await stokR.json()
        if (!stokR.ok) setHata(d?.error || 'Stok listesi okunamadı.')
        else setLotlar(d.lotlar || [])
      }
    } catch {
      setHata('Bağlantı hatası.')
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const modulAc = async (aktif: boolean | null) => {
    const t = token()
    if (!t) return
    const r = await fetch('/api/doktor/asi-stok/modul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ aktif }),
    })
    if (r.ok) await yukle()
  }

  const stokEkle = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token()
    if (!t) return
    setKaydediliyor(true)
    setHata('')
    try {
      const r = await fetch('/api/doktor/asi-stok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          asiAdi: form.asiAdi,
          barkod: form.barkod,
          lotNo: form.lotNo || null,
          miktar: Number(form.miktar),
          sonKullanmaTarihi: form.sonKullanmaTarihi || null,
          birimFiyatKurus: form.birimFiyatKurus ? Math.round(Number(form.birimFiyatKurus) * 100) : null,
          varsayilanUygulamaBolgesi: form.varsayilanUygulamaBolgesi || null,
        }),
      })
      const d = await r.json()
      if (!r.ok) setHata(d?.error || 'Stok eklenemedi.')
      else { setForm(bos); await yukle() }
    } catch {
      setHata('Bağlantı hatası.')
    } finally {
      setKaydediliyor(false)
    }
  }

  if (yukleniyor) return <div style={{ padding: 24, fontFamily: CHROME_FONT.sans, color: MUTED }}>Yükleniyor…</div>

  const kapaliVeBransVarsayilaniKapali = modulDurumu && !modulDurumu.etkinAktif && modulDurumu.aktifOverride === null

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 80px', fontFamily: CHROME_FONT.sans, color: INK }}>
      <Link href="/dashboard/doktor/entegrasyonlar" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>← Entegrasyonlar</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '10px 0 4px' }}>Aşı Stok ve Barkod Sistemi</h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>
        Lot takibi, muayenede barkod tarama, tek dokunuşla stok düşümü, aşı karnesi ve e-Nabız kaydı.
      </p>

      <section style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Modül durumu</div>
        {modulDurumu && (
          <>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>
              Branşınızın varsayılanı: <b style={{ color: INK }}>{modulDurumu.bransVarsayilani ? 'açık' : 'kapalı'}</b>.{' '}
              {modulDurumu.aktifOverride === null
                ? 'Şu an branş varsayılanını kullanıyorsunuz.'
                : `Kendi seçiminiz branş varsayılanının üzerine yazıyor: ${modulDurumu.aktifOverride ? 'açık' : 'kapalı'}.`}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => modulAc(true)} style={btn(modulDurumu.etkinAktif ? TEAL : '#FFFFFF', modulDurumu.etkinAktif ? '#FFFFFF' : INK)}>Aç</button>
              <button onClick={() => modulAc(false)} style={btn(!modulDurumu.etkinAktif ? TEAL : '#FFFFFF', !modulDurumu.etkinAktif ? '#FFFFFF' : INK)}>Kapat</button>
              {modulDurumu.aktifOverride !== null && (
                <button onClick={() => modulAc(null)} style={btn('#FFFFFF', MUTED)}>Branş varsayılanına dön</button>
              )}
            </div>
          </>
        )}
      </section>

      {kapaliVeBransVarsayilaniKapali && (
        <div style={{ fontSize: 13, color: AMBER, marginBottom: 16 }}>
          Modül kapalı — muayene ekranında barkod tarama görünmez, stok eklenemez. "Aç"a basarak etkinleştirin.
        </div>
      )}

      {modulDurumu?.etkinAktif && (
        <>
          <section style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stoğa ekle</div>
            <form onSubmit={stokEkle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input required placeholder="Aşı adı" value={form.asiAdi} onChange={(e) => setForm({ ...form, asiAdi: e.target.value })} style={inp} />
              <input required placeholder="Barkod / lot kodu (tarayın veya yazın)" value={form.barkod} onChange={(e) => setForm({ ...form, barkod: e.target.value })} style={inp} />
              <input placeholder="Lot/Parti No (opsiyonel)" value={form.lotNo} onChange={(e) => setForm({ ...form, lotNo: e.target.value })} style={inp} />
              <input required type="number" min={1} placeholder="Miktar" value={form.miktar} onChange={(e) => setForm({ ...form, miktar: e.target.value })} style={inp} />
              <input type="date" placeholder="Son kullanma tarihi" value={form.sonKullanmaTarihi} onChange={(e) => setForm({ ...form, sonKullanmaTarihi: e.target.value })} style={inp} />
              <input type="number" min={0} step="0.01" placeholder="Birim fiyat (TL, opsiyonel)" value={form.birimFiyatKurus} onChange={(e) => setForm({ ...form, birimFiyatKurus: e.target.value })} style={inp} />
              <input placeholder="Varsayılan uygulama bölgesi (opsiyonel)" value={form.varsayilanUygulamaBolgesi} onChange={(e) => setForm({ ...form, varsayilanUygulamaBolgesi: e.target.value })} style={{ ...inp, gridColumn: '1 / -1' }} />
              <button disabled={kaydediliyor} type="submit" style={{ ...btn(TEAL, '#fff'), gridColumn: '1 / -1' }}>{kaydediliyor ? 'Kaydediliyor…' : 'Stoğa ekle'}</button>
            </form>
          </section>

          <section style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stok listesi</div>
            {lotlar.length === 0 ? (
              <div style={{ color: MUTED, fontSize: 14 }}>Henüz stok eklenmedi.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lotlar.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{l.asiAdi}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>
                        Barkod: {l.barkod}{l.lotNo ? ` · Lot: ${l.lotNo}` : ''}{l.sonKullanmaTarihi ? ` · SKT: ${l.sonKullanmaTarihi}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: l.stokTukendi ? RED : l.dusukStok ? AMBER : GREEN }}>{l.miktar} doz</div>
                      {l.sktDurumu === 'gecti' && <div style={{ fontSize: 11, color: RED, fontWeight: 600 }}>SKT GEÇTİ</div>}
                      {l.sktDurumu === 'yaklasiyor' && <div style={{ fontSize: 11, color: AMBER, fontWeight: 600 }}>SKT yaklaşıyor</div>}
                      {l.dusukStok && l.sktDurumu !== 'gecti' && <div style={{ fontSize: 11, color: AMBER }}>Stok az</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {hata && <div style={{ color: RED, fontSize: 13, marginTop: 14 }}>{hata}</div>}
    </div>
  )
}

const inp: React.CSSProperties = { border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 10px', fontSize: 14, fontFamily: CHROME_FONT.sans }
function btn(bg: string, fg: string): React.CSSProperties {
  return { background: bg, color: fg, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: CHROME_FONT.sans }
}
