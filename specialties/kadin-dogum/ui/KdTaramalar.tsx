'use client'
/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Gebelikte tiroid · HPV aşısı · SMA taşıyıcılık · PMS/PMDD günlüğü.
 * YALNIZ Kadın Hastalıkları ve Doğum (HastaGebelik içinde `kdHekimi` kapısı + rota 403). Motor: lib/clinical/kdTaramalar.ts.
 * Doz yok; bayrak/istem/örüntü karar desteğidir — tanıyı hekim yazar. Kaynaklar her sekmede "Kaynak" altında.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { PMDD_ALANLARI, PMDD_KRITERLERI, PMDD_YONETIM_SECENEKLERI, SMA_DURUMLARI, SMA_ES_DURUMLARI, SMA_SONUCLARI, TIROID_DURUMLARI, TIROID_RISK_FAKTORLERI, HPV_ASI_TIPLERI } from '@/lib/clinical/kdTaramalar'
import type { KdTaramaOzeti } from '@/lib/doktor/kdTaramaSunucu'
import { KD_TARAMA_KAYNAKLARI, TR_HPV_ULUSAL_DURUM, TR_PMDD_YONETIM, TR_SMA_PROGRAM } from '../protocols/kd-taramalar-tr'
import {
  HPV_TIP_ETIKET, PMDD_ALAN_KISA, PMDD_KRITER_ETIKET, PMDD_OLCEK_ETIKET, SMA_DURUM_ETIKET, SMA_ES_ETIKET, SMA_SONUC_ETIKET,
  TIROID_BAYRAK_ETIKET, TIROID_DURUM_ETIKET, TIROID_KAYNAK_ETIKET, TIROID_RISK_ETIKET, TIROID_TAKIP_ETIKET,
} from '../engines/kdTaramaMetinleri'

type Sekme = 'tiroid' | 'hpv' | 'sma' | 'pmdd'
const kutu: React.CSSProperties = { border: '1px solid rgba(58,44,34,0.12)', borderRadius: 12, padding: '10px 14px', display: 'grid', gap: 10 }
const giris: React.CSSProperties = { border: '1px solid rgba(58,44,34,0.2)', borderRadius: 8, padding: '6px 8px', fontSize: 13, width: 110 }
const kucuk: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.muted }
const btn = (aktif = false): React.CSSProperties => ({ border: '1px solid rgba(58,44,34,0.2)', borderRadius: 999, padding: '5px 12px', fontSize: 13, background: aktif ? CHROME_RENK.ink : 'transparent', color: aktif ? '#fff' : CHROME_RENK.ink, cursor: 'pointer' })
const renk = (b: string) => (b === 'yuksek' || b === 'dusuk' ? '#B23A48' : b === 'aralikta' ? '#2E7D5B' : CHROME_RENK.muted)
const Kaynak = ({ kodlar, ek }: { kodlar: string[]; ek?: string }) => (
  <details style={kucuk}><summary style={{ cursor: 'pointer' }}>Kaynak</summary>
    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>{kodlar.map((k) => <li key={k}>{KD_TARAMA_KAYNAKLARI[k]?.ad}{KD_TARAMA_KAYNAKLARI[k] && !KD_TARAMA_KAYNAKLARI[k].ulusal ? ' — uluslararası' : ''}</li>)}</ul>
    {ek && <p style={{ margin: '6px 0 0' }}>{ek}</p>}
  </details>
)

export default function KdTaramalar({ patientId }: { patientId: string }) {
  const [sekme, setSekme] = useState<Sekme>('tiroid')
  const [veri, setVeri] = useState<KdTaramaOzeti | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [f, setF] = useState<Record<string, string>>({})
  const [riskler, setRiskler] = useState<string[]>([])
  const [kriterler, setKriterler] = useState<string[]>([])
  const [yonetim, setYonetim] = useState<string[]>([])
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }))

  const yukle = useCallback(async () => {
    const t = await ensureDoctorAccessToken()
    const r = await fetch(`/api/doktor/kd-tarama?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` } })
    if (r.ok) { const d = (await r.json()) as KdTaramaOzeti; setVeri(d); setRiskler(d.tiroid.riskler) }
  }, [patientId])
  useEffect(() => { yukle() }, [yukle])

  const gonder = async (govde: Record<string, unknown>, tamam: string) => {
    setMesaj('')
    const t = await ensureDoctorAccessToken()
    const r = await fetch('/api/doktor/kd-tarama', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ patientId, ...govde }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setMesaj(j.error || 'Kaydedilemedi'); return }
    setMesaj(tamam); setF({}); await yukle()
  }

  const hafta = veri?.gebelik?.hafta ?? null
  return (
    <section style={{ ...kutu, marginTop: 12 }} data-kd="kd-taramalar">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <b style={{ color: CHROME_RENK.ink, fontSize: 14 }}>Tarama ve takip kayıtları</b>
        {([['tiroid', 'Gebelikte tiroid'], ['hpv', 'HPV aşısı'], ['sma', 'SMA taşıyıcılık'], ['pmdd', 'PMS / PMDD']] as const).map(([k, a]) => (
          <button key={k} type="button" style={btn(sekme === k)} onClick={() => { setSekme(k); setMesaj('') }}>{a}</button>
        ))}
      </div>
      {mesaj && <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>{mesaj}</div>}
      {!veri && <div style={kucuk}>Yükleniyor…</div>}

      {veri && sekme === 'tiroid' && (
        <div style={{ display: 'grid', gap: 10 }} data-kd="tiroid">
          {veri.tiroid.tarama.goster && (
            <div style={{ background: '#F59E0B14', borderLeft: '3px solid #F59E0B', padding: '6px 10px', fontSize: 13 }} data-kd="tsh-tarama-istemi">
              İlk vizit TSH taraması: bu gebelikte kayıtlı TSH yok. TEMD 2023 Öneri 23A — gebe ilk başvurduğunda tiroid hastalığı için tarama yapılır.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
            <span>Durum:</span>
            <select value={f.durum ?? veri.tiroid.durum} onChange={(e) => set('durum', e.target.value)} style={{ ...giris, width: 260 }}>
              {TIROID_DURUMLARI.map((d) => <option key={d} value={d}>{TIROID_DURUM_ETIKET[d]}</option>)}
            </select>
            <button type="button" style={btn()} onClick={() => gonder({ tur: 'tiroid_durum', veri: { durum: f.durum ?? veri.tiroid.durum, riskler } }, 'Tiroid durumu kaydedildi.')}>Durumu kaydet</button>
          </div>
          <details style={kucuk}><summary style={{ cursor: 'pointer' }}>Risk faktörleri (ATA 2017 Öneri 97 — bilgi; Türkiye'de tarama TEMD'e göre evrensel)</summary>
            <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>{TIROID_RISK_FAKTORLERI.map((r) => (
              <label key={r} style={{ display: 'flex', gap: 6 }}><input type="checkbox" checked={riskler.includes(r)} onChange={(e) => setRiskler(e.target.checked ? [...riskler, r] : riskler.filter((x) => x !== r))} />{TIROID_RISK_ETIKET[r]}</label>
            ))}</div>
          </details>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'end', fontSize: 12 }}>
            <label>Tarih<br /><input type="date" style={giris} value={f.tarih || ''} onChange={(e) => set('tarih', e.target.value)} /></label>
            <label>Gebelik haftası<br /><input style={giris} inputMode="numeric" value={f.hafta ?? (hafta != null ? String(hafta) : '')} onChange={(e) => set('hafta', e.target.value)} /></label>
            <label>TSH (mIU/L)<br /><input style={giris} inputMode="decimal" value={f.tsh || ''} onChange={(e) => set('tsh', e.target.value)} /></label>
            <label>Lab. gebelik aralığı TSH alt–üst<br /><input style={{ ...giris, width: 52 }} value={f.labTshAlt || ''} onChange={(e) => set('labTshAlt', e.target.value)} />–<input style={{ ...giris, width: 52 }} value={f.labTshUst || ''} onChange={(e) => set('labTshUst', e.target.value)} /></label>
            <label>Lab. gebelik dışı TSH alt–üst<br /><input style={{ ...giris, width: 52 }} value={f.gdAlt || ''} onChange={(e) => set('gdAlt', e.target.value)} />–<input style={{ ...giris, width: 52 }} value={f.gdUst || ''} onChange={(e) => set('gdUst', e.target.value)} /></label>
            <label>sT4 (birim)<br /><input style={{ ...giris, width: 60 }} value={f.ft4 || ''} onChange={(e) => set('ft4', e.target.value)} /> <input style={{ ...giris, width: 60 }} placeholder="pmol/L" value={f.ft4Birim || ''} onChange={(e) => set('ft4Birim', e.target.value)} /></label>
            <label>Lab. trimester sT4 alt–üst<br /><input style={{ ...giris, width: 52 }} value={f.labFt4Alt || ''} onChange={(e) => set('labFt4Alt', e.target.value)} />–<input style={{ ...giris, width: 52 }} value={f.labFt4Ust || ''} onChange={(e) => set('labFt4Ust', e.target.value)} /></label>
            <button type="button" style={btn()} onClick={() => gonder({ tur: 'tiroid_olcum', veri: { tarih: f.tarih || undefined, hafta: f.hafta ?? hafta, tsh: f.tsh, ft4: f.ft4, ft4Birim: f.ft4Birim, labTshAlt: f.labTshAlt, labTshUst: f.labTshUst, gebelikDisiTshAlt: f.gdAlt, gebelikDisiTshUst: f.gdUst, labFt4Alt: f.labFt4Alt, labFt4Ust: f.labFt4Ust } }, 'Tiroid sonucu kaydedildi.')}>Sonucu kaydet</button>
          </div>
          {veri.tiroid.olcumler.length > 0 && (
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}><thead><tr style={{ textAlign: 'left', color: CHROME_RENK.muted }}><th>Tarih</th><th>Hf</th><th>TSH</th><th>Aralık (kaynak)</th><th>sT4</th><th>Hedef (LT4)</th></tr></thead>
              <tbody>{veri.tiroid.olcumler.map((o) => (
                <tr key={o.id} style={{ borderTop: '1px solid rgba(58,44,34,0.1)' }}>
                  <td>{o.tarih}</td><td>{String(o.veri.hafta)}</td>
                  <td style={{ color: renk(o.degerlendirme.tsh.bayrak), fontWeight: 700 }}>{o.veri.tsh != null ? `${o.veri.tsh} · ${TIROID_BAYRAK_ETIKET[o.degerlendirme.tsh.bayrak]}` : '—'}</td>
                  <td>{o.degerlendirme.tsh.alt ?? '—'}–{o.degerlendirme.tsh.ust ?? '—'} <span style={kucuk}>({TIROID_KAYNAK_ETIKET[o.degerlendirme.tsh.kaynak]})</span></td>
                  <td style={{ color: renk(o.degerlendirme.ft4.bayrak) }}>{o.veri.ft4 != null ? `${o.veri.ft4} · ${TIROID_BAYRAK_ETIKET[o.degerlendirme.ft4.bayrak]}` : '—'}</td>
                  <td>{o.degerlendirme.hedef ? `${o.degerlendirme.hedef === 'hedef_ustu' ? 'Hedef üstü' : 'Hedefte'} (<${o.degerlendirme.hedefUst})` : '—'}</td>
                </tr>))}</tbody></table>
          )}
          {veri.tiroid.takip.length > 0 && (
            <div style={{ fontSize: 12.5 }} data-kd="tiroid-takip"><b>Takip noktaları</b>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{veri.tiroid.takip.map((p, i) => (
                <span key={i} style={{ border: '1px solid rgba(58,44,34,0.15)', borderRadius: 999, padding: '2px 8px', opacity: p.durum === 'gecti' ? 0.5 : 1, fontWeight: p.durum === 'simdi' ? 700 : 400 }}>
                  {TIROID_TAKIP_ETIKET[p.kod]} · {p.kod === 'postpartum_tft' ? `doğum sonrası ${p.haftaBas}. hf` : p.haftaBas === p.haftaSon ? `${p.haftaBas}. hf` : `${p.haftaBas}–${p.haftaSon}. hf`}
                </span>))}</div>
              {veri.tiroid.durum === 'hipertiroidi' && <p style={{ ...kucuk, margin: '4px 0 0' }}>TRAb: geçmişte ablasyon/cerrahi ile tedavi edilmiş Graves'te erken gebelikte; erken gebelikte yüksekse veya ATİ sürüyorsa 18–22. hafta; 18–22'de yüksekse veya 3. trimesterde ATİ varsa 30–34. hafta (ATA 2017 Öneri 52).</p>}
            </div>
          )}
          {veri.tiroid.durum === 'hipotiroidi' && (
            <div style={{ display: 'grid', gap: 6 }} data-kd="lt4-not">
              <div style={{ display: 'flex', gap: 6, alignItems: 'end', fontSize: 12 }}>
                <label style={{ flex: 1 }}>Levotiroksin doz ayarlaması — hekimin kendi notu (Notya doz önermez)<br /><input style={{ ...giris, width: '100%' }} maxLength={300} value={f.lt4 || ''} onChange={(e) => set('lt4', e.target.value)} /></label>
                <button type="button" style={btn()} onClick={() => gonder({ tur: 'lt4_not', veri: { metin: f.lt4, hafta } }, 'Levotiroksin notu kaydedildi.')}>Notu kaydet</button>
              </div>
              {veri.tiroid.lt4Notlari.map((n) => <div key={n.id} style={kucuk}>{n.tarih}{n.veri.hafta != null ? ` · ${n.veri.hafta}. hf` : ''} — {String(n.veri.metin)}</div>)}
              <div style={kucuk}>Doğumdan sonra gebelik öncesi doza dönüş ve postpartum 6. hafta TSH (TEMD 2023 s. 288; ATA 2017 Öneri 37). Tedavi hedefi: 1. trimester TSH &lt;2,5, 2.–3. trimester &lt;3 mU/L (TEMD Öneri 23D).</div>
            </div>
          )}
          <Kaynak kodlar={['TEMD_2023', 'ATA_2017']} ek="Aralık sırası: laboratuvarın gebelik/trimester aralığı → ATA 2017 yedeği (gebelik dışı aralık 1. trimesterde −0,4/−0,5 mU/L, 7. haftadan) → ATA Öneri 26 üst sınır ~4,0 mU/L (1. trimester, 7. haftadan). 2.–3. trimesterde ATA sayı vermez: laboratuvar aralığı girilmedikçe bayrak konmaz. sT4 yalnız yönteme özgü laboratuvar aralığıyla." />
        </div>
      )}

      {veri && sekme === 'hpv' && (
        <div style={{ display: 'grid', gap: 10 }} data-kd="hpv">
          <div style={kucuk}>{TR_HPV_ULUSAL_DURUM}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'end', fontSize: 12 }}>
            <label>Doz<br /><select style={{ ...giris, width: 70 }} value={f.no || ''} onChange={(e) => set('no', e.target.value)}><option value="">—</option>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}. doz</option>)}</select></label>
            <label>Tarih<br /><input type="date" style={giris} value={f.hpvTarih || ''} onChange={(e) => set('hpvTarih', e.target.value)} /></label>
            <label>Aşı tipi<br /><select style={{ ...giris, width: 180 }} value={f.tip || ''} onChange={(e) => set('tip', e.target.value)}><option value="">—</option>{HPV_ASI_TIPLERI.map((t) => <option key={t} value={t}>{HPV_TIP_ETIKET[t]}</option>)}</select></label>
            <label>Ürün adı (isteğe bağlı)<br /><input style={giris} value={f.urun || ''} onChange={(e) => set('urun', e.target.value)} /></label>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={f.immun === 'baskilanmis'} onChange={(e) => set('immun', e.target.checked ? 'baskilanmis' : 'normal')} />Bağışıklığı baskılanmış / HIV</label>
            <button type="button" style={btn()} onClick={() => gonder({ tur: 'hpv_doz', veri: { no: Number(f.no), tarih: f.hpvTarih, tip: f.tip, urun: f.urun, immun: f.immun } }, 'HPV dozu kaydedildi.')}>Dozu kaydet</button>
          </div>
          <div style={{ fontSize: 13 }} data-kd="hpv-plan">
            {veri.hpv.dozlar.map((d) => <div key={d.id}>{String(d.veri.no)}. doz · {d.tarih} · {HPV_TIP_ETIKET[String(d.veri.tip)] || '—'}{d.veri.urun ? ` · ${d.veri.urun}` : ''}</div>)}
            {veri.hpv.plan.durum === 'kayit_yok' && <div style={kucuk}>Kayıtlı doz yok.</div>}
            {veri.hpv.plan.durum === 'kural_yok' && <div style={kucuk}>İlk doz yaşı {veri.hpv.ilkDozYasi ?? 'bilinmiyor (doğum tarihi gerekli)'} için kaynakta şema satırı yok — şema hekim kararı.</div>}
            {veri.hpv.plan.durum === 'tamamlandi' && <div style={{ color: '#2E7D5B', fontWeight: 700 }}>Şema tamamlandı ({veri.hpv.plan.yapilan}/{veri.hpv.plan.gereken} doz; ilk doz yaşı {veri.hpv.ilkDozYasi}).</div>}
            {veri.hpv.plan.durum === 'devam' && <div><b>Sonraki: {veri.hpv.plan.sonraki?.no}. doz</b>{veri.hpv.plan.sonraki?.enErken ? ` — en erken ${veri.hpv.plan.sonraki.enErken}` : ' — aralık kaynakta belirtilmemiş'}{veri.hpv.plan.sonraki?.enGec ? `, en geç ${veri.hpv.plan.sonraki.enGec}` : ''} (gereken en az {veri.hpv.plan.gereken} doz; ilk doz yaşı {veri.hpv.ilkDozYasi})</div>}
            {veri.hpv.plan.uyarilar.includes('sira_hatali') && <div style={{ color: '#B23A48' }}>Doz numaraları tarih sırasıyla uyuşmuyor — kaydı kontrol edin.</div>}
            {veri.hpv.plan.uyarilar.includes('aralik_erken') && <div style={{ color: '#B23A48' }}>Bir doz kaynağın belirttiği en kısa aralıktan önce yapılmış.</div>}
          </div>
          <div style={{ fontSize: 12.5 }} data-kd="hpv-serviks"><b>Serviks tarama geçmişi</b> (Jinekoloji › serviks kayıtları)
            {veri.hpv.serviks.length === 0 ? <div style={kucuk}>Kayıtlı smear/HPV testi yok.</div> : veri.hpv.serviks.map((s) => <div key={s.id} style={kucuk}>{s.tarih} · Pap: {s.pap || '—'} · HPV: {s.hpv || '—'}{s.plan ? ` · plan: ${s.plan}` : ''}</div>)}
          </div>
          <Kaynak kodlar={['WHO_HPV_2022', 'SB_ASI_2020']} ek="DSÖ 2022: 9–14 ve 15–20 yaş bir veya iki doz; 21 yaş üstü 6 ay arayla iki doz; bağışıklığı baskılanmış (HIV dahil) en az iki, mümkünse üç doz. Pediatri Dijital Aşı Onam sistemi burada kullanılmaz." />
        </div>
      )}

      {veri && sekme === 'sma' && (
        <div style={{ display: 'grid', gap: 10 }} data-kd="sma">
          <div style={kucuk}>{TR_SMA_PROGRAM}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'end', fontSize: 12 }}>
            <label>Durum<br /><select style={{ ...giris, width: 140 }} value={f.smaDurum || ''} onChange={(e) => set('smaDurum', e.target.value)}><option value="">—</option>{SMA_DURUMLARI.map((d) => <option key={d} value={d}>{SMA_DURUM_ETIKET[d]}</option>)}</select></label>
            <label>Tarih<br /><input type="date" style={giris} value={f.smaTarih || ''} onChange={(e) => set('smaTarih', e.target.value)} /></label>
            {f.smaDurum === 'yapildi' && <>
              <label>Sonuç (rapordaki gibi)<br /><select style={{ ...giris, width: 210 }} value={f.smaSonuc || ''} onChange={(e) => set('smaSonuc', e.target.value)}><option value="">—</option>{SMA_SONUCLARI.map((d) => <option key={d} value={d}>{SMA_SONUC_ETIKET[d]}</option>)}</select></label>
              <label>SMN1 kopya (rapordaki gibi)<br /><input style={{ ...giris, width: 70 }} value={f.smaKopya || ''} onChange={(e) => set('smaKopya', e.target.value)} /></label>
              <label>Eş testi<br /><select style={giris} value={f.esDurum || ''} onChange={(e) => set('esDurum', e.target.value)}><option value="">—</option>{SMA_ES_DURUMLARI.map((d) => <option key={d} value={d}>{SMA_ES_ETIKET[d]}</option>)}</select></label>
              {f.esDurum === 'yapildi' && <><label>Eş sonucu<br /><select style={{ ...giris, width: 210 }} value={f.esSonuc || ''} onChange={(e) => set('esSonuc', e.target.value)}><option value="">—</option>{SMA_SONUCLARI.map((d) => <option key={d} value={d}>{SMA_SONUC_ETIKET[d]}</option>)}</select></label><label>Eş SMN1 kopya<br /><input style={{ ...giris, width: 70 }} value={f.esKopya || ''} onChange={(e) => set('esKopya', e.target.value)} /></label></>}
              <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={f.gd === '1'} onChange={(e) => set('gd', e.target.checked ? '1' : '')} />Genetik danışmaya yönlendirildi</label>
            </>}
            <button type="button" style={btn()} onClick={() => gonder({ tur: 'sma', veri: { durum: f.smaDurum, tarih: f.smaTarih, sonuc: f.smaSonuc, smn1Kopya: f.smaKopya, esDurumu: f.esDurum, esSonucu: f.esSonuc, esSmn1Kopya: f.esKopya, genetikDanisma: f.gd ? 'yonlendirildi' : 'yonlendirilmedi' } }, 'SMA kaydı kaydedildi.')}>Kaydet</button>
          </div>
          {veri.sma.son && (
            <div style={{ fontSize: 13 }} data-kd="sma-son">
              Son kayıt ({veri.sma.son.tarih}): {SMA_DURUM_ETIKET[String(veri.sma.son.veri.durum)]}{veri.sma.son.veri.sonuc ? ` — ${SMA_SONUC_ETIKET[String(veri.sma.son.veri.sonuc)]}` : ''}{veri.sma.son.veri.smn1Kopya ? ` · SMN1 kopya: ${veri.sma.son.veri.smn1Kopya}` : ''}
              {veri.sma.degerlendirme?.ok && veri.sma.degerlendirme.esTestiIstemi && <div style={{ color: '#B23A48', fontWeight: 700 }} data-kd="sma-es-istemi">Eş taraması önerin: tek eş taşıyıcıysa diğer eş, sessiz taşıyıcılık olasılığına karşı Tıbbi Genetik uzmanına yönlendirilir (SB).</div>}
              {veri.sma.degerlendirme?.ok && veri.sma.degerlendirme.genetikDanismaIstemi && <div style={{ color: '#B23A48' }} data-kd="sma-gd-istemi">Genetik danışma sevki önerin (doğum öncesi tanı / preimplantasyon tanı seçenekleri).</div>}
              {veri.sma.degerlendirme?.ok && veri.sma.degerlendirme.ciftTasiyici && <div style={{ color: '#B23A48', fontWeight: 700 }}>Her iki eş taşıyıcı (raporlara göre).</div>}
              <div style={kucuk}>Kopya sayısı yorumlanmaz; taşıyıcılık laboratuvar raporundaki gibi kaydedilir.</div>
            </div>
          )}
          <Kaynak kodlar={['SB_SMA_2023']} />
        </div>
      )}

      {veri && sekme === 'pmdd' && (
        <div style={{ display: 'grid', gap: 10 }} data-kd="pmdd">
          {!veri.pmdd.gunluk || veri.pmdd.gunluk.veri.durum !== 'acik'
            ? <div><button type="button" style={btn()} onClick={() => gonder({ tur: 'pmdd_gunluk', veri: {} }, 'Günlük açıldı; hasta Sağlığım › Takip\'ten doldurur.')}>Semptom günlüğünü başlat (Sağlığım)</button><div style={kucuk}>Hasta her gün telefonundan doldurur (yalnız bugün/dün — prospektif). En az iki döngü gerekir.</div></div>
            : <div style={{ fontSize: 13 }}>Günlük açık ({veri.pmdd.gunluk.tarih}'den beri, {veri.pmdd.gunler.length} gün kayıtlı). <button type="button" style={btn()} onClick={() => gonder({ islem: 'gunluk_kapat', gunlukId: veri.pmdd.gunluk!.id }, 'Günlük kapatıldı.')}>Günlüğü kapat</button></div>}
          {veri.pmdd.ozet && (
            <div style={{ fontSize: 12.5 }} data-kd="pmdd-ozet">
              <b>Günlük özeti</b> — değerlendirilebilir döngü: {veri.pmdd.ozet.degerlendirilebilir}, örüntü görülen: {veri.pmdd.ozet.oruntuDongu}{veri.pmdd.ozet.ikiDonguTamam ? ' (iki döngü tamam — kriter F desteklenir)' : ' (iki döngü tamamlanmadı — "geçici")'}
              {veri.pmdd.ozet.donguler.map((d) => (
                <div key={d.adetBaslangici} style={{ marginTop: 6 }}>
                  <div>Adet {d.adetBaslangici}: önce {d.once.tam ? 'tam' : `${d.once.eksikGun} gün eksik`}, sonra {d.sonra.tam ? 'tam' : `${d.sonra.eksikGun} gün eksik`} — {d.oruntu === null ? 'puanlanamadı' : d.oruntu ? `örüntü var (${d.karsilayan} belirti, B grubundan ${d.bKarsilayan})` : `örüntü yok (${d.karsilayan} belirti)`}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{PMDD_ALANLARI.map((a) => <span key={a} style={{ ...kucuk, border: '1px solid rgba(58,44,34,0.12)', borderRadius: 6, padding: '1px 5px', background: d.alanlar[a].karsilar ? '#F59E0B22' : 'transparent' }}>{PMDD_ALAN_KISA[a]}: {d.alanlar[a].onceEnYuksek ?? '—'}→{d.alanlar[a].sonraEnYuksek ?? '—'}</span>)}</div>
                </div>))}
              <div style={kucuk}>Ölçek: {PMDD_OLCEK_ETIKET.map((e, i) => `${i} ${e}`).join(' · ')}. "Çok az/yok" 0–1, "belirgin" 4–5 Notya günlüğünün tasarım seçimidir (doğrulanmış kesim değil). Özet tanı değildir.</div>
            </div>
          )}
          <div style={{ display: 'grid', gap: 4, fontSize: 12.5 }} data-kd="pmdd-kontrol"><b>DSM-5-TR kontrol listesi (hekim işaretler)</b>
            {PMDD_KRITERLERI.map((k) => <label key={k} style={{ display: 'flex', gap: 6 }}><input type="checkbox" checked={kriterler.includes(k)} onChange={(e) => setKriterler(e.target.checked ? [...kriterler, k] : kriterler.filter((x) => x !== k))} />{PMDD_KRITER_ETIKET[k]}</label>)}
            <b style={{ marginTop: 6 }}>Yönetim seçenekleri (hekimin seçtiği metin; doz yok)</b>
            {PMDD_YONETIM_SECENEKLERI.map((k) => <label key={k} style={{ display: 'flex', gap: 6 }}><input type="checkbox" checked={yonetim.includes(k)} onChange={(e) => setYonetim(e.target.checked ? [...yonetim, k] : yonetim.filter((x) => x !== k))} />{TR_PMDD_YONETIM[k]}</label>)}
            <input style={{ ...giris, width: '100%' }} maxLength={500} placeholder="Hekim notu" value={f.pmddNot || ''} onChange={(e) => set('pmddNot', e.target.value)} />
            <button type="button" style={{ ...btn(), justifySelf: 'start' }} onClick={() => gonder({ tur: 'pmdd_kontrol', veri: { kriterler, yonetim, not: f.pmddNot } }, 'Kontrol listesi kaydedildi.')}>Kontrol listesini kaydet</button>
            {veri.pmdd.kontrol && <div style={kucuk}>Son: {veri.pmdd.kontrol.tarih} — {veri.pmdd.kontrol.veri.durum === 'tum_kriterler' ? 'tüm kriterler işaretli' : veri.pmdd.kontrol.veri.durum === 'gecici' ? 'F dışında tümü (geçici)' : 'eksik'}.</div>}
          </div>
          <Kaynak kodlar={['DSM5TR', 'ACOG_PMD']} ek="Günlük Notya'nın özgün günlüğüdür: DRSP (Endicott 2006) ticari kullanım izni doğrulanamadığı için kullanılmadı; maddeler DSM-5-TR B1–B4 / C1–C7 gruplarına eşlenir. Kriter metni kopyalanmamıştır." />
        </div>
      )}
    </section>
  )
}
