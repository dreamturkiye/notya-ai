'use client'

/**
 * FOTO-AI-01 — Ayşe's photo evaluation panel (decision support, never a diagnosis) and the change panel of compare mode.
 * Everything the model said is shown as a SUGGESTION with per-item Kabul / Düzelt / Reddet. Nothing here is written into the
 * signed examination note. The photo that reaches the server is a downscaled, metadata-free derivative made on this device.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  BAYRAK_ETIKETI, GUVEN_ETIKETI, type FotoDegerlendirme, type Guven,
} from '@/lib/doktor/muayeneEk/foto/sema'
import { gozlemHedefleri } from '@/lib/doktor/muayeneEk/foto/sema'
import { mutabakatMetni, KARAR_ETIKETI, type GeriBildirimKarari, type Mutabakat } from '@/lib/doktor/muayeneEk/foto/ogrenme'
import { bolgeEtiketi } from '@/lib/doktor/fotoArsiv/bolgeler'
import {
  aiCalistir, aiOku, ApiHatasi, bitmapAl, geriBildirimGonder, karsilastirCalistir, karsilastirOku,
  type KarsilastirmaYaniti, type TekDegerlendirmeYaniti,
} from './api'
import { turevUret } from './istemciGorsel'
import { baslikKucuk, birincil, dugme, girdi, kart, R, rozet } from './stil'

export const GUVENLIK_METNI = 'Karar destek aracıdır, tanı değildir.'

const DEGISIM_TR: Record<string, string> = {
  buyume: 'Büyüme', kuculme: 'Küçülme', 'renk-degisimi': 'Renk değişimi', 'yeni-lezyon': 'Yeni lezyon', 'kaybolan-lezyon': 'Kaybolan lezyon',
  iyilesme: 'İyileşme', kotulesme: 'Kötüleşme', 'degisim-yok': 'Belirgin değişim yok',
}
const KALITE_TR: Record<string, string> = { iyi: 'İyi', orta: 'Orta', yetersiz: 'Yetersiz' }
const guvenRozeti = (g: Guven) => <span style={rozet(g === 'yuksek' ? R.pine : g === 'orta' ? '#7a5b14' : R.warn, g === 'yuksek' ? 'rgba(47,67,52,0.1)' : g === 'orta' ? 'rgba(212,193,150,0.35)' : 'rgba(164,91,62,0.12)')}>{GUVEN_ETIKETI[g]}</span>

export function GuvenlikBandi() {
  return (
    <div role="note" data-testid="ai-guvenlik" style={{ background: 'rgba(212,193,150,0.28)', border: `1px solid ${R.gold}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: R.ink, lineHeight: 1.45 }}>
      <strong>{GUVENLIK_METNI}</strong> Ayşe’nin önerileri imzalı muayene notuna otomatik eklenmez; kararı siz verirsiniz.
    </div>
  )
}

function UretimBilgisi({ uretim }: { uretim: { surum: string; model: string | null; kaynak: 'model' | 'onbellek'; uretildi: string; onarildi: boolean } }) {
  const t = new Date(uretim.uretildi)
  return (
    <div data-testid="ai-uretim" style={{ fontSize: 11.5, color: R.muted, lineHeight: 1.5 }}>
      İstem sürümü {uretim.surum} · Model {uretim.model ?? 'bilinmiyor'} · {uretim.kaynak === 'onbellek' ? 'Aynı görüntü için kayıtlı sonuç (yeniden çağrılmadı)' : 'Yeni değerlendirme'}
      {Number.isNaN(t.getTime()) ? '' : ` · ${t.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' })}`}
      {uretim.onarildi ? ' · çıktı onarım adımından geçti' : ''}
    </div>
  )
}

interface PanelProps {
  patientId: string
  belgeId: string
  /** Region currently on the photo (null = none). */
  bolge: string | null
  onBolgeUygula: (id: string) => void
  veliDili: boolean
}

export default function FotoAiPaneli({ patientId, belgeId, bolge, onBolgeUygula, veliDili }: PanelProps) {
  const [durum, setDurum] = useState<'yukleniyor' | 'bos' | 'calisiyor' | 'hazir' | 'kapali' | 'yetkisiz' | 'hata'>('yukleniyor')
  const [yanit, setYanit] = useState<Extract<TekDegerlendirmeYaniti, { durum: 'tamam' }> | null>(null)
  const [mesaj, setMesaj] = useState('')

  const uygula = useCallback((y: TekDegerlendirmeYaniti) => {
    if (y.durum === 'tamam') { setYanit(y); setDurum('hazir'); setMesaj('') }
    else if (y.durum === 'yok') { setYanit(null); setDurum('bos') }
    else if (y.durum === 'kapali') { setDurum('kapali'); setMesaj(y.mesaj) }
    else { setDurum('hata'); setMesaj(y.mesaj) }
  }, [])

  useEffect(() => {
    let iptal = false
    setDurum('yukleniyor'); setYanit(null); setMesaj('')
    aiOku(patientId, belgeId).then((y) => { if (!iptal) uygula(y) }).catch((e: unknown) => {
      if (iptal) return
      if (e instanceof ApiHatasi && e.durum === 403) setDurum('yetkisiz')
      else if (e instanceof ApiHatasi && e.durum === 404) { setDurum('kapali'); setMesaj('Fotoğraf yapay zekâ incelemesi bu hesap için kapalı.') }
      else { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Yüklenemedi.') }
    })
    return () => { iptal = true }
  }, [patientId, belgeId, uygula])

  const calistir = async (yenile: boolean) => {
    setDurum('calisiyor'); setMesaj('')
    try {
      const b = await bitmapAl(patientId, belgeId)
      const turev = await turevUret(b)
      uygula(await aiCalistir(patientId, belgeId, turev, yenile, bolge))
    } catch (e) {
      if (e instanceof ApiHatasi && e.durum === 403) setDurum('yetkisiz')
      else { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Değerlendirme başarısız.') }
    }
  }

  return (
    <section aria-label="Ayşe fotoğraf incelemesi" data-testid="ai-paneli" style={{ display: 'grid', gap: 10 }}>
      <GuvenlikBandi />
      {durum === 'yukleniyor' && <div style={{ fontSize: 13, color: R.muted }}>Yükleniyor…</div>}
      {durum === 'yetkisiz' && <div style={{ fontSize: 13, color: R.muted }}>Yapay zekâ incelemesi yalnızca hekime açıktır.</div>}
      {durum === 'kapali' && <div style={{ fontSize: 13, color: R.muted }}>{mesaj || 'Bu branşta görüntü analizi kapalıdır.'}</div>}
      {durum === 'hata' && <div role="alert" style={{ fontSize: 13, color: R.warn }}>{mesaj}</div>}
      {(durum === 'bos' || durum === 'hata') && (
        <div>
          <button style={birincil} onClick={() => calistir(false)} data-testid="ai-baslat">Ayşe ile incele</button>
          <p style={{ fontSize: 12, color: R.muted, margin: '6px 0 0' }}>Fotoğrafın küçültülmüş, konum ve cihaz bilgisi içermeyen bir kopyası değerlendirilir. Aynı görüntü için sonuç saklanır; yeniden çağrılmaz.</p>
        </div>
      )}
      {durum === 'calisiyor' && <div role="status" style={{ fontSize: 13, color: R.ink }}>Ayşe inceliyor… (birkaç saniye sürebilir)</div>}
      {durum === 'hazir' && yanit && (
        <Sonuc
          patientId={patientId} belgeId={belgeId} y={yanit.gorunum} bolge={bolge} veliDili={veliDili}
          onBolgeUygula={onBolgeUygula} onYenile={() => calistir(true)}
        />
      )}
    </section>
  )
}

function Sonuc({ patientId, belgeId, y, bolge, onBolgeUygula, onYenile, veliDili }: {
  patientId: string; belgeId: string; y: Extract<TekDegerlendirmeYaniti, { durum: 'tamam' }>['gorunum']; bolge: string | null
  onBolgeUygula: (id: string) => void; onYenile: () => void; veliDili: boolean
}) {
  const d: FotoDegerlendirme = y.deger
  const [kararlar, setKararlar] = useState<Record<string, GeriBildirimKarari>>(() => Object.fromEntries(y.geriBildirimler.map((g) => [g.gozlemAnahtari, g.karar])))
  const [mutabakat, setMutabakat] = useState<Mutabakat>(y.mutabakat)
  const [duzeltAcik, setDuzeltAcik] = useState<string | null>(null)
  const [duzeltMetin, setDuzeltMetin] = useState('')
  const [hata, setHata] = useState('')
  const hedefler = gozlemHedefleri(d)
  const kimlikli = new Set(hedefler.map((h) => h.anahtar))

  const gonder = async (anahtar: string, karar: GeriBildirimKarari, duzeltme?: string) => {
    setHata('')
    try {
      const r = await geriBildirimGonder(patientId, belgeId, anahtar, karar, duzeltme)
      if (r.durum === 'tamam') { setKararlar((k) => ({ ...k, [anahtar]: karar })); setMutabakat(r.mutabakat); setDuzeltAcik(null); setDuzeltMetin('') }
      else setHata('mesaj' in r ? r.mesaj : 'Geri bildirim kaydedilemedi.')
    } catch (e) { setHata(e instanceof Error ? e.message : 'Geri bildirim kaydedilemedi.') }
  }
  const gb = (anahtar: string) => {
    if (!kimlikli.has(anahtar)) return null
    const mevcut = kararlar[anahtar]
    return (
      <div style={{ marginTop: 6 }}>
        <div role="group" aria-label="Geri bildirim" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['kabul', 'duzelt', 'reddet'] as const).map((k) => (
            <button key={k} data-testid={`gb-${k}`} aria-pressed={mevcut === k}
              onClick={() => (k === 'duzelt' ? setDuzeltAcik(duzeltAcik === anahtar ? null : anahtar) : gonder(anahtar, k))}
              style={{ ...dugme, minHeight: 36, padding: '4px 12px', fontSize: 12.5, ...(mevcut === k ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }}>
              {KARAR_ETIKETI[k]}
            </button>
          ))}
        </div>
        {duzeltAcik === anahtar && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input style={girdi} value={duzeltMetin} maxLength={600} placeholder="Doğrusu nedir? (isteğe bağlı)" onChange={(e) => setDuzeltMetin(e.target.value)} aria-label="Düzeltme" />
            <button style={birincil} onClick={() => gonder(anahtar, 'duzelt', duzeltMetin.trim() || undefined)}>Gönder</button>
          </div>
        )}
      </div>
    )
  }

  const kb = d.kirmiziBayraklar.filter((b) => b.durum === 'var' || b.durum === 'olasi')
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {y.uyarlamalar.length > 0 && (
        <div data-testid="ai-uyarlama" style={{ ...kart, fontSize: 12.5, background: '#faf6ee' }}>
          <div style={baslikKucuk}>Geri bildirimlerinize göre ayarlandı</div>
          {y.uyarlamalar.map((u) => <div key={u.ozellik + u.anahtar}>• {u.mesaj}</div>)}
        </div>
      )}

      {!d.degerlendirilebilir && (
        <div role="alert" data-testid="ai-abstain" style={{ ...kart, borderColor: R.warn }}>
          <strong>Bu fotoğraf güvenle değerlendirilemedi.</strong>
          <div style={{ fontSize: 13, marginTop: 4 }}>{d.abstain?.neden || 'Görüntü değerlendirme için yetersiz.'}</div>
        </div>
      )}

      <div style={kart}>
        <div style={baslikKucuk}>Çekim kalitesi</div>
        <div style={{ fontSize: 13.5 }}>
          <span style={rozet(d.kalite.genel === 'iyi' ? R.pine : R.warn, d.kalite.genel === 'iyi' ? 'rgba(47,67,52,0.1)' : 'rgba(164,91,62,0.12)')}>{KALITE_TR[d.kalite.genel]}</span>
          <span style={{ color: R.muted }}> · Netlik: {d.kalite.bulaniklik === 'yok' ? 'iyi' : d.kalite.bulaniklik} · Işık: {d.kalite.isik} · Kadraj: {d.kalite.kadraj}{d.kalite.olcekReferansi ? ' · ölçek referansı var' : ''}</span>
        </div>
        {d.kalite.yenidenCekim && <div data-testid="ai-yeniden-cek" style={{ marginTop: 6, fontSize: 13, color: R.warn }}><strong>Çekimi yenileyin:</strong> {d.kalite.yenidenCekim}</div>}
      </div>

      {d.bolge.id && (
        <div style={kart}>
          <div style={baslikKucuk}>Bölge önerisi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{bolgeEtiketi(d.bolge.id)}</strong> {guvenRozeti(d.bolge.guven)}
            {bolge !== d.bolge.id && <button style={{ ...dugme, minHeight: 34, padding: '2px 10px', fontSize: 12.5 }} onClick={() => onBolgeUygula(d.bolge.id!)} data-testid="ai-bolge-uygula">Bölgeyi uygula</button>}
          </div>
          {gb("bolge")}
        </div>
      )}

      {d.morfoloji && (
        <div style={kart} data-testid="ai-morfoloji">
          <div style={baslikKucuk}>Morfolojik tanım</div>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 10px', fontSize: 13.5 }}>
            {([['Renk', d.morfoloji.renk], ['Boyut', d.morfoloji.boyut], ['Sınır', d.morfoloji.sinir], ['Yüzey', d.morfoloji.yuzey], ['Dağılım', d.morfoloji.dagilim], ['Sayı', d.morfoloji.sayi]] as const).map(([k, v]) => v ? (
              <div key={k} style={{ display: 'contents' }}><dt style={{ color: R.muted }}>{k}</dt><dd style={{ margin: 0 }}>{v}</dd></div>
            ) : null)}
          </dl>
          {!d.morfoloji.boyut && <div style={{ fontSize: 11.5, color: R.muted, marginTop: 4 }}>Ölçek referansı olmadığı için boyut verilmedi.</div>}
          {gb("morfoloji")}
        </div>
      )}

      {d.gozlemler.length > 0 && (
        <div style={kart}>
          <div style={baslikKucuk}>Gözlemler</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, fontSize: 13.5 }}>
            {d.gozlemler.map((g) => (
              <li key={g.anahtar}>{g.metin} {guvenRozeti(g.guven)}{gb(g.anahtar)}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ ...kart, ...(kb.length ? { borderColor: R.warn } : {}) }} data-testid="ai-bayraklar">
        <div style={baslikKucuk}>Kırmızı bayrak taraması</div>
        {kb.length === 0 && <div style={{ fontSize: 13, color: R.muted }}>Bu fotoğrafta işaretlenen bir kırmızı bayrak yok. Bu, bulgu olmadığı anlamına gelmez.</div>}
        {kb.map((b) => (
          <div key={b.kod} style={{ marginBottom: 8 }}>
            <strong style={{ color: R.warn, fontSize: 13.5 }}>{BAYRAK_ETIKETI[b.kod as keyof typeof BAYRAK_ETIKETI] ?? b.kod}</strong> <span style={rozet(R.warn, 'rgba(164,91,62,0.12)')}>{b.durum === 'var' ? 'Var' : 'Olası'}</span>
            {b.kriter && <div style={{ fontSize: 12.5 }}>Ölçüt: {b.kriter}</div>}
            {b.not && <div style={{ fontSize: 12.5, color: R.muted }}>{b.not}</div>}
            {gb(`bayrak:${b.kod}`)}
          </div>
        ))}
        {kb.length > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: R.warn }}>Doktor incelemesi gerekir.</div>}
      </div>

      {d.ayiricilar.length > 0 && (
        <div style={kart} data-testid="ai-ayiricilar">
          <div style={baslikKucuk}>Ayırıcı değerlendirme (tanı değildir)</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, fontSize: 13.5 }}>
            {d.ayiricilar.map((a) => (
              <li key={a.anahtar}>
                <strong>{a.ad}</strong> {guvenRozeti(a.guven)}
                {a.ayirtEdici && <div style={{ fontSize: 12.5, color: R.muted }}>Ayırt etmeye yarayacak: {a.ayirtEdici}</div>}
                {gb(`ayirici:${a.anahtar}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.oneri && <div style={{ ...kart, fontSize: 13.5 }}><div style={baslikKucuk}>Öneri</div>{d.oneri}</div>}
      {d.sinirlar.length > 0 && (
        <div style={{ fontSize: 12, color: R.muted }}>
          <div style={baslikKucuk}>Sınırlar</div>
          {d.sinirlar.map((s, i) => <div key={i}>• {s}</div>)}
        </div>
      )}
      {hata && <div role="alert" style={{ fontSize: 12.5, color: R.warn }}>{hata}</div>}

      <div data-testid="ai-mutabakat" style={{ fontSize: 12.5, color: R.ink }}>{mutabakatMetni(mutabakat)}</div>
      <UretimBilgisi uretim={y.uretim} />
      <div><button style={{ ...dugme, minHeight: 36, fontSize: 12.5 }} onClick={onYenile} data-testid="ai-yenile">Yeniden değerlendir</button></div>
    </div>
  )
}

// ─── compare mode: change detection against the prior photo of the same region ──────────────────────────────
export function FotoDegisimPaneli({ patientId, belgeId, oncekiId }: { patientId: string; belgeId: string; oncekiId: string }) {
  const [durum, setDurum] = useState<'yukleniyor' | 'bos' | 'calisiyor' | 'hazir' | 'kapali' | 'yetkisiz' | 'hata'>('yukleniyor')
  const [y, setY] = useState<Extract<KarsilastirmaYaniti, { durum: 'tamam' }> | null>(null)
  const [mesaj, setMesaj] = useState('')

  const uygula = useCallback((r: KarsilastirmaYaniti) => {
    if (r.durum === 'tamam') { setY(r); setDurum('hazir'); setMesaj('') }
    else if (r.durum === 'yok') { setY(null); setDurum('bos') }
    else if (r.durum === 'kapali') { setDurum('kapali'); setMesaj(r.mesaj) }
    else { setDurum('hata'); setMesaj(r.mesaj) }
  }, [])

  useEffect(() => {
    let iptal = false
    setDurum('yukleniyor'); setY(null)
    karsilastirOku(patientId, belgeId, oncekiId).then((r) => { if (!iptal) uygula(r) }).catch((e: unknown) => {
      if (iptal) return
      if (e instanceof ApiHatasi && e.durum === 403) setDurum('yetkisiz')
      else if (e instanceof ApiHatasi && e.durum === 404) setDurum('bos')
      else { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Yüklenemedi.') }
    })
    return () => { iptal = true }
  }, [patientId, belgeId, oncekiId, uygula])

  const calistir = async (yenile: boolean) => {
    setDurum('calisiyor')
    try {
      const [a, b] = await Promise.all([bitmapAl(patientId, belgeId), bitmapAl(patientId, oncekiId)])
      const [ta, tb] = await Promise.all([turevUret(a, 1024), turevUret(b, 1024)])
      uygula(await karsilastirCalistir(patientId, belgeId, oncekiId, ta, tb, yenile))
    } catch (e) { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Karşılaştırma başarısız.') }
  }

  return (
    <section aria-label="Ayşe değişim analizi" data-testid="degisim-paneli" style={{ display: 'grid', gap: 8 }}>
      <GuvenlikBandi />
      {durum === 'yukleniyor' && <div style={{ fontSize: 13, color: R.muted }}>Yükleniyor…</div>}
      {durum === 'yetkisiz' && <div style={{ fontSize: 13, color: R.muted }}>Değişim analizi yalnızca hekime açıktır.</div>}
      {durum === 'kapali' && <div style={{ fontSize: 13, color: R.muted }}>{mesaj}</div>}
      {durum === 'hata' && <div role="alert" style={{ fontSize: 13, color: R.warn }}>{mesaj}</div>}
      {durum === 'calisiyor' && <div role="status" style={{ fontSize: 13 }}>Ayşe iki fotoğrafı karşılaştırıyor…</div>}
      {(durum === 'bos' || durum === 'hata') && <div><button style={birincil} onClick={() => calistir(false)} data-testid="degisim-baslat">Değişimi değerlendir</button></div>}
      {durum === 'hazir' && y && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12.5, color: R.muted }}>{y.gunFarki} gün arayla çekilmiş iki fotoğraf karşılaştırıldı.</div>
          {!y.deger.karsilastirilabilir && <div role="alert" style={{ ...kart, borderColor: R.warn, fontSize: 13 }}><strong>Güvenle karşılaştırılamadı.</strong> {y.deger.neden}</div>}
          {y.deger.ozet && <div style={{ ...kart, fontSize: 13.5 }}>{y.deger.ozet} {guvenRozeti(y.deger.genelGuven)}</div>}
          {y.deger.degisimler.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 13.5 }}>
              {y.deger.degisimler.map((c, i) => <li key={i}><strong>{DEGISIM_TR[c.etiket] ?? c.etiket}.</strong> {c.metin} {guvenRozeti(c.guven)}</li>)}
            </ul>
          )}
          {y.deger.oneri && <div style={{ fontSize: 13, color: R.warn, fontWeight: 600 }}>{y.deger.oneri}</div>}
          {y.deger.sinirlar.map((s, i) => <div key={i} style={{ fontSize: 12, color: R.muted }}>• {s}</div>)}
          <UretimBilgisi uretim={y.uretim} />
          <div><button style={{ ...dugme, minHeight: 36, fontSize: 12.5 }} onClick={() => calistir(true)}>Yeniden değerlendir</button></div>
        </div>
      )}
    </section>
  )
}
