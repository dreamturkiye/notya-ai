'use client';

/**
 * NOTYA-INTAKE-02 — hasta dosyasındaki Aşılar sekmesi. Pediatrik ve yetişkin kayıtları aynı
 * listede, kategoriye göre gruplu gösterilir — pediatrik hastalar için doz numarası ve sonraki
 * doz tarihi (SB Ulusal Aşılama Takvimi'ne göre çok daha yoğun); yetişkinler için tek doz/yıllık
 * (tetanoz-difteri, grip, KOVID) mantığı.
 *
 * ASI-KARNESI-01 (Dr. Gökhan Mamur; Kaan 2026-09-19): "Aşı karnesi yükle" — fotoğraf/PDF → Ayşe okur → hekim toplu
 * onaylar (AsiKarnesiOkuma). Karneden aktarılanlar klinikte uygulananlardan GÖRSEL OLARAK AYRI: her satırda kaynak
 * rozeti (lib/asi/karneOkuma → asiKaynakRozeti, paylaşılan Rozet) ve kaynağa göre kenar rengi.
 *
 * NOTYA-ASI-TABLO-01 (Dr. Gökhan; 2026-10-03): kart listesi yerine düzenlenebilir tablo — aşı adı, piyasa adı,
 * uygulama tarihi, kaç aylıkken, doz, uygulama yeri, lot. Silinebilir. Mobil/tablet: yatay kaydırma + dar
 * ekranda etiketli satır ızgarası (16px input — iOS zoom yok).
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { ULUSAL_TAKVIM, OZEL_ASILAR, PEDIATRIK_ASI_ADLARI, TAKVIM_SURUM } from '@/lib/asi/ulusalAsiTakvimi';
import { hitapMetinleri } from '@/lib/specialties/hitap';
import { Rozet } from '@/lib/doktor/aracUi';
import { asiKaynakRozeti, asiKaynakTuru } from '@/lib/asi/karneOkuma';
import { LOT_AZAMI, YER_AZAMI } from '@/lib/asi/asiLotYeri';
import { PIYASA_AZAMI, uygulamaYasAy } from '@/lib/asi/karneBelgesi';
import AsiKarnesiOkuma from '@/components/doktor/AsiKarnesiOkuma';
import AsiKarnesiEylemleri from '@/components/doktor/AsiKarnesiEylemleri';
import AsiHatirlatmaListesi from '@/components/doktor/AsiHatirlatmaListesi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { TrTarihAlan } from '@/specialties/kadin-dogum/ui/TrTarihAlan';

interface Asi {
  id: string;
  asi_adi: string;
  piyasa_adi?: string | null;
  doz_no: number | null;
  kategori: 'pediatrik' | 'yetiskin';
  uygulama_tarihi: string | null;
  sonraki_doz_tarihi: string | null;
  uygulama_yas_ay?: number | null;
  kaynak: 'beyan' | 'kayit';
  notlar: string | null;
  belge_id?: string | null;
  lot_no?: string | null;
  uygulama_yeri?: string | null;
}

const KAYNAK_KENAR = { karne: 'rgba(96,165,250,0.55)', beyan: 'rgba(58,44,34,0.12)', klinik: 'rgba(45,212,191,0.55)' } as const;

const YAYGIN_YETISKIN = ['Tetanoz-Difteri (Td)', 'Grip', 'KOVID-19', 'Zona (Herpes Zoster)', 'Pnömokok'];

const GIRIS: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  background: '#FFFFFF',
  border: '1px solid rgba(58,44,34,0.16)',
  color: '#3b2e24',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 16, // iOS Safari focus zoom'u engeller
  boxSizing: 'border-box',
};

const TH: React.CSSProperties = {
  padding: '8px 6px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#8b7d70',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(58,44,34,0.12)',
};

function yasAyGoster(a: Asi, dogumTarihi: string | null | undefined): string {
  if (a.uygulama_yas_ay != null && Number.isFinite(a.uygulama_yas_ay)) return String(a.uygulama_yas_ay);
  const hesap = uygulamaYasAy(dogumTarihi, a.uygulama_tarihi);
  return hesap == null ? '' : String(hesap);
}

/**
 * BRANS-ALAN-SIZMASI: `veliDili` (lib/specialties/kapsam → veliDiliMi; VELI-YASAL-ONAM: reşit olmayan hasta her branşta)
 * "veli" kelimesini açar; `pediatrikBaglam` (pediatrikBaglamMi) ve `cocukHasta` SB çocukluk takvimini ve yeni kaydın
 * varsayılan kategorisini seçer. Eskiden her hastada (KD'nin erişkin hastası dahil) varsayılan 'pediatrik' ve
 * "Hasta/veli beyanı" idi.
 */
export default function HastaAsilar({
  patientId,
  dogumTarihi = null,
  pediatrikBaglam = false,
  veliDili = pediatrikBaglam,
  cocukHasta = false,
}: {
  patientId: string;
  dogumTarihi?: string | null;
  pediatrikBaglam?: boolean;
  veliDili?: boolean;
  cocukHasta?: boolean;
}) {
  const hitap = hitapMetinleri(veliDili);
  const [asilar, setAsilar] = useState<Asi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [asiAdi, setAsiAdi] = useState('');
  const [piyasaAdi, setPiyasaAdi] = useState('');
  const [dozNo, setDozNo] = useState('');
  const [kategori, setKategori] = useState<'pediatrik' | 'yetiskin'>(cocukHasta ? 'pediatrik' : 'yetiskin');
  useEffect(() => { setKategori(cocukHasta ? 'pediatrik' : 'yetiskin'); }, [cocukHasta]);
  const [uygulamaTarihi, setUygulamaTarihi] = useState('');
  const [sonrakiDozTarihi, setSonrakiDozTarihi] = useState('');
  const [uygulamaYasAyForm, setUygulamaYasAyForm] = useState('');
  const [kaynak, setKaynak] = useState<'kayit' | 'beyan'>('kayit');
  const [lotNo, setLotNo] = useState('');
  const [uygulamaYeri, setUygulamaYeri] = useState('');
  const [kaydediyor, setKaydediyor] = useState(false);
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [karneAcik, setKarneAcik] = useState(false);
  const [bilgi, setBilgi] = useState('');
  const [darEkran, setDarEkran] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 720px)');
    const uygula = () => setDarEkran(mq.matches);
    uygula();
    mq.addEventListener?.('change', uygula);
    return () => mq.removeEventListener?.('change', uygula);
  }, []);

  // Yeni kayıt formunda tarih değişince yaş (ay) ön doldurulur — hekim yine düzeltebilir.
  useEffect(() => {
    if (!uygulamaTarihi || !dogumTarihi) return;
    const ay = uygulamaYasAy(dogumTarihi, uygulamaTarihi);
    if (ay != null) setUygulamaYasAyForm(String(ay));
  }, [uygulamaTarihi, dogumTarihi]);

  const token = ensureDoctorAccessToken;

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch(`/api/doktor/asilar?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) { setHata('Aşı kayıtları alınamadı.'); return; }
      const d = await r.json();
      setAsilar(d.asilar || []);
    } catch {
      setHata('Aşı kayıtları alınamadı.');
    } finally {
      setYukleniyor(false);
    }
  }, [patientId]);

  useEffect(() => { yukle(); }, [yukle]);

  function formuSifirla() {
    setAsiAdi(''); setPiyasaAdi(''); setDozNo(''); setUygulamaTarihi(''); setSonrakiDozTarihi('');
    setUygulamaYasAyForm(''); setKaynak('kayit'); setLotNo(''); setUygulamaYeri('');
  }

  /** NOTYA-ASI-01: takvimden tek tıkla ön dolu ekleme — doktor adı/dozu elle yazmaz. */
  function takvimdenEkle(ad: string, doz: number | null) {
    setAsiAdi(ad);
    setDozNo(doz ? String(doz) : '');
    setKategori('pediatrik');
    setKaynak('kayit');
    setFormAcik(true);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!asiAdi.trim()) { setHata('Aşı adı zorunludur.'); return; }
    setKaydediyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch('/api/doktor/asilar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, asiAdi, dozNo: dozNo ? Number(dozNo) : null, kategori,
          uygulamaTarihi: uygulamaTarihi || null, sonrakiDozTarihi: sonrakiDozTarihi || null, kaynak,
          lotNo: lotNo.trim() || null, uygulamaYeri: uygulamaYeri.trim() || null,
          piyasaAdi: piyasaAdi.trim() || null,
          uygulamaYasAy: uygulamaYasAyForm !== '' ? Number(uygulamaYasAyForm) : null,
        }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setHata(j.error || 'Kaydedilemedi.'); return; }
      formuSifirla();
      setFormAcik(false);
      await yukle();
    } catch {
      setHata('Kaydedilemedi.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function sil(id: string) {
    if (!confirm('Bu aşı kaydını silmek istiyor musunuz?')) return;
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/asilar/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      await yukle();
    } catch { /* ignore */ }
  }

  async function guncelle(id: string, govde: Record<string, unknown>) {
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch(`/api/doktor/asilar/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Güncellenemedi.');
        await yukle();
        return;
      }
      const d = await r.json();
      if (d.asi) {
        setAsilar((onceki) => onceki.map((a) => (a.id === id ? { ...a, ...d.asi } : a)));
      }
    } catch {
      setHata('Güncellenemedi.');
    }
  }

  const pediatrikler = asilar.filter((a) => a.kategori === 'pediatrik');
  const yetiskinler = asilar.filter((a) => a.kategori === 'yetiskin');

  function Liste({ baslik, kayitlar }: { baslik: string; kayitlar: Asi[] }) {
    if (kayitlar.length === 0) return null;
    return (
      <div data-asi-tablo-grup="" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#8b7d70', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{baslik}</div>
        {darEkran ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kayitlar.map((a) => (
              <AsiSatirDuzenle
                key={a.id}
                a={a}
                dogumTarihi={dogumTarihi}
                hitapBeyan={hitap.beyanEtiketi}
                mod="kart"
                onGuncelle={guncelle}
                onSil={sil}
              />
            ))}
          </div>
        ) : (
          <div data-asi-tablo-sarici="" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 12, background: '#F6F0E4' }}>
            <table data-asi-tablo="" style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Aşı adı</th>
                  <th style={TH}>Piyasa adı</th>
                  <th style={TH}>Uygulama tarihi</th>
                  <th style={TH}>Yaş (ay)</th>
                  <th style={TH}>Doz</th>
                  <th style={TH}>Uygulama yeri</th>
                  <th style={TH}>Lot no</th>
                  <th style={{ ...TH, width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {kayitlar.map((a) => (
                  <AsiSatirDuzenle
                    key={a.id}
                    a={a}
                    dogumTarihi={dogumTarihi}
                    hitapBeyan={hitap.beyanEtiketi}
                    mod="tablo"
                    onGuncelle={guncelle}
                    onSil={sil}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @media (max-width: 720px) {
          .asi-ekle-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#8b7d70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aşılar</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => { setKarneAcik((v) => !v); setBilgi(''); }} style={{ background: '#F6F0E4', color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.16)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
            {karneAcik ? 'Karne yüklemeyi kapat' : '📷 Aşı karnesi yükle'}
          </button>
          {/* BRANS-ALAN-SIZMASI: SB çocukluk dönemi takvimi yalnız çocuk hastada / pediatrik bağlamda — KD'nin erişkin hastasında yok */}
          {(cocukHasta || pediatrikBaglam) && (
            <button type="button" onClick={() => setTakvimAcik((v) => !v)} style={{ background: '#F6F0E4', color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.16)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
              {takvimAcik ? 'Takvimi Gizle' : '📋 Ulusal Aşı Takvimi'}
            </button>
          )}
          <button type="button" onClick={() => setFormAcik((v) => !v)} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            + Aşı Ekle
          </button>
        </div>
      </div>

      {bilgi && <div role="status" style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.4)', color: '#0F9B8E', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{bilgi}</div>}
      {karneAcik && (
        <AsiKarnesiOkuma
          patientId={patientId}
          onKaydedildi={async (adet) => { setKarneAcik(false); setBilgi(`${adet} aşı karneden aktarıldı (hekim onaylı).`); await yukle(); }}
        />
      )}

      {!yukleniyor && <AsiKarnesiEylemleri patientId={patientId} kayitSayisi={asilar.length} />}
      {/* ASI-KARNESI-01 (D): bu hastanın yaklaşan/geçen sonraki doz tarihleri — hekim metni görür, onaylar, gönderir */}
      {!yukleniyor && asilar.some((a) => a.sonraki_doz_tarihi) && (
        <div style={{ marginBottom: 16 }}><AsiHatirlatmaListesi patientId={patientId} yenile={asilar.length} /></div>
      )}

      {hata && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{hata}</div>}

      {takvimAcik && (cocukHasta || pediatrikBaglam) && (
        <div style={{ background: '#F6F0E4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{TAKVIM_SURUM}</div>
          <div style={{ fontSize: 11, color: '#8b7d70', marginBottom: 12 }}>
            2025 GBP güncellemesi: Hepatit B artık 6’lı karmanın içinde — 1. aydaki tekil doz kaldırıldı (istisna: anne HBsAg+). “Ekle” formatı doldurur, tarih seçip kaydedersiniz.
          </div>
          {ULUSAL_TAKVIM.map((d) => (
            <div key={d.donem} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{d.donem}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {d.asilar.map((a) => (
                  <div key={d.donem + a.ad} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(58,44,34,0.035)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 150 }}>{a.ad}</span>
                    <span style={{ fontSize: 11, color: '#8b7d70' }}>{a.dozEtiket}</span>
                    {a.not && <span style={{ fontSize: 10, color: '#F59E0B', width: '100%' }}>{a.not}</span>}
                    <button type="button" onClick={() => takvimdenEkle(a.ad, a.doz)} style={{ background: 'rgba(15,155,142,0.2)', color: '#0F9B8E', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Ekle</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, marginTop: 14 }}>Takvim dışı — özel aşılar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {OZEL_ASILAR.map((a) => (
              <div key={a.ad} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 150 }}>{a.ad}</span>
                <span style={{ fontSize: 11, color: '#8b7d70' }}>{a.onerilenDonem}</span>
                <span style={{ fontSize: 10, color: '#8b7d70', width: '100%' }}>{a.not}</span>
                <button type="button" onClick={() => takvimdenEkle(a.ad, null)} style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Ekle</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {formAcik && (
        <form onSubmit={kaydet} style={{ background: '#F6F0E4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div className="asi-ekle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Aşı Adı *</label>
              <input
                value={asiAdi}
                onChange={(e) => setAsiAdi(e.target.value)}
                list="yaygin-asilar"
                placeholder="Örn. Hepatit B, Tetanoz-Difteri, Grip"
                style={GIRIS}
              />
              <datalist id="yaygin-asilar">
                {[...PEDIATRIK_ASI_ADLARI, ...YAYGIN_YETISKIN].map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Piyasa adı</label>
              <input value={piyasaAdi} onChange={(e) => setPiyasaAdi(e.target.value)} maxLength={PIYASA_AZAMI} placeholder="Örn. Priorix, Hexaxim" style={GIRIS} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value as 'pediatrik' | 'yetiskin')} style={GIRIS}>
                <option value="pediatrik">Pediatrik</option>
                <option value="yetiskin">Yetişkin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Doz No</label>
              <input type="number" min={1} inputMode="numeric" value={dozNo} onChange={(e) => setDozNo(e.target.value)} style={GIRIS} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Uygulama Tarihi <span style={{ fontWeight: 400 }}>(gg.aa.yyyy)</span></label>
              <TrTarihAlan value={uygulamaTarihi} onChange={setUygulamaTarihi} style={GIRIS} name="uygulama_tarihi" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Yaş (ay) — uygulama anı</label>
              <input type="number" min={0} max={600} inputMode="numeric" value={uygulamaYasAyForm} onChange={(e) => setUygulamaYasAyForm(e.target.value)} placeholder="Doğum + tarihten" style={GIRIS} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Sonraki Doz / Hatırlatma Tarihi <span style={{ fontWeight: 400 }}>(gg.aa.yyyy)</span></label>
              <TrTarihAlan value={sonrakiDozTarihi} onChange={setSonrakiDozTarihi} style={GIRIS} name="sonraki_doz_tarihi" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Kaynak</label>
              <select value={kaynak} onChange={(e) => setKaynak(e.target.value as 'kayit' | 'beyan')} style={GIRIS}>
                <option value="kayit">Bu klinikte uygulandı</option>
                <option value="beyan">{hitap.beyanEtiketi}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Lot no</label>
              <input value={lotNo} onChange={(e) => setLotNo(e.target.value)} maxLength={LOT_AZAMI} placeholder="İsteğe bağlı" style={GIRIS} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8b7d70', display: 'block', marginBottom: 4 }}>Uygulama yeri</label>
              <input value={uygulamaYeri} onChange={(e) => setUygulamaYeri(e.target.value)} maxLength={YER_AZAMI} placeholder="Örn. IM sol deltoid" style={GIRIS} />
            </div>
          </div>
          <button type="submit" disabled={kaydediyor} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
            {kaydediyor ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>
      )}

      {yukleniyor && <p style={{ color: '#8b7d70' }}>Yükleniyor…</p>}
      {!yukleniyor && asilar.length === 0 && <p style={{ color: '#8b7d70' }}>Henüz aşı kaydı yok.</p>}

      <Liste baslik="Pediatrik" kayitlar={pediatrikler} />
      <Liste baslik="Yetişkin" kayitlar={yetiskinler} />
    </div>
  );
}

function AsiSatirDuzenle({
  a,
  dogumTarihi,
  hitapBeyan,
  mod,
  onGuncelle,
  onSil,
}: {
  a: Asi;
  dogumTarihi?: string | null;
  hitapBeyan: string;
  mod: 'tablo' | 'kart';
  onGuncelle: (id: string, govde: Record<string, unknown>) => Promise<void>;
  onSil: (id: string) => void;
}) {
  const tur = asiKaynakTuru(a);
  const rozet = asiKaynakRozeti(tur, hitapBeyan);
  const [asiAdi, setAsiAdi] = useState(a.asi_adi || '');
  const [piyasa, setPiyasa] = useState(a.piyasa_adi || '');
  const [tarih, setTarih] = useState(a.uygulama_tarihi || '');
  const [yasAy, setYasAy] = useState(yasAyGoster(a, dogumTarihi));
  const [doz, setDoz] = useState(a.doz_no != null ? String(a.doz_no) : '');
  const [yer, setYer] = useState(a.uygulama_yeri || '');
  const [lot, setLot] = useState(a.lot_no || '');
  const kaydediyor = useRef(false);

  useEffect(() => {
    setAsiAdi(a.asi_adi || '');
    setPiyasa(a.piyasa_adi || '');
    setTarih(a.uygulama_tarihi || '');
    setYasAy(yasAyGoster(a, dogumTarihi));
    setDoz(a.doz_no != null ? String(a.doz_no) : '');
    setYer(a.uygulama_yeri || '');
    setLot(a.lot_no || '');
  }, [a, dogumTarihi]);

  async function kaydetAlan(govde: Record<string, unknown>) {
    if (kaydediyor.current) return;
    kaydediyor.current = true;
    try {
      await onGuncelle(a.id, govde);
    } finally {
      kaydediyor.current = false;
    }
  }

  function tarihDegisti(v: string) {
    setTarih(v);
    if (a.uygulama_yas_ay == null && dogumTarihi) {
      const ay = uygulamaYasAy(dogumTarihi, v || null);
      if (ay != null) setYasAy(String(ay));
    }
  }

  const lbl = (metin: string) =>
    mod === 'kart' ? <label style={{ fontSize: 11, color: '#8b7d70', display: 'block', marginBottom: 4 }}>{metin}</label> : null;

  const hucreler = [
    <div key="adi" data-asi-alan="adi">
      {lbl('Aşı adı')}
      <input
        aria-label="Aşı adı"
        value={asiAdi}
        onChange={(e) => setAsiAdi(e.target.value)}
        onBlur={() => { if (asiAdi.trim() && asiAdi.trim() !== (a.asi_adi || '')) void kaydetAlan({ asiAdi: asiAdi.trim() }); }}
        style={GIRIS}
      />
      <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Rozet ton={rozet.ton}>{rozet.metin}</Rozet>
      </div>
    </div>,
    <div key="piyasa" data-asi-alan="piyasa">
      {lbl('Piyasa adı')}
      <input
        aria-label="Piyasa adı"
        value={piyasa}
        maxLength={PIYASA_AZAMI}
        onChange={(e) => setPiyasa(e.target.value)}
        onBlur={() => { if ((piyasa.trim() || null) !== (a.piyasa_adi || null)) void kaydetAlan({ piyasaAdi: piyasa.trim() || null }); }}
        placeholder="—"
        style={GIRIS}
      />
    </div>,
    <div key="tarih" data-asi-alan="tarih">
      {lbl('Uygulama tarihi (gg.aa.yyyy)')}
      <TrTarihAlan
        value={tarih}
        name={`uygulama_tarihi_${a.id}`}
        style={GIRIS}
        onChange={(iso) => {
          tarihDegisti(iso);
          const yeni = iso || null;
          if (yeni !== (a.uygulama_tarihi || null)) {
            const govde: Record<string, unknown> = { uygulamaTarihi: yeni };
            if (a.uygulama_yas_ay == null && dogumTarihi && yeni) {
              const ay = uygulamaYasAy(dogumTarihi, yeni);
              if (ay != null) govde.uygulamaYasAy = ay;
            }
            void kaydetAlan(govde);
          }
        }}
      />
    </div>,
    <div key="yas" data-asi-alan="yas">
      {lbl('Yaş (ay)')}
      <input
        aria-label="Uygulama anında yaş (ay)"
        type="number"
        min={0}
        max={600}
        inputMode="numeric"
        value={yasAy}
        onChange={(e) => setYasAy(e.target.value)}
        onBlur={() => {
          const n = yasAy === '' ? null : Number(yasAy);
          const onceki = a.uygulama_yas_ay != null ? a.uygulama_yas_ay : uygulamaYasAy(dogumTarihi, a.uygulama_tarihi);
          if (n !== onceki) void kaydetAlan({ uygulamaYasAy: n });
        }}
        placeholder="—"
        style={GIRIS}
      />
    </div>,
    <div key="doz" data-asi-alan="doz">
      {lbl('Doz')}
      <input
        aria-label="Kaçıncı doz"
        type="number"
        min={1}
        inputMode="numeric"
        value={doz}
        onChange={(e) => setDoz(e.target.value)}
        onBlur={() => {
          const n = doz === '' ? null : Number(doz);
          if (n !== a.doz_no) void kaydetAlan({ dozNo: n });
        }}
        placeholder="—"
        style={GIRIS}
      />
    </div>,
    <div key="yer" data-asi-alan="yer">
      {lbl('Uygulama yeri')}
      <input
        aria-label="Uygulama yeri"
        value={yer}
        maxLength={YER_AZAMI}
        onChange={(e) => setYer(e.target.value)}
        onBlur={() => { if ((yer.trim() || null) !== (a.uygulama_yeri || null)) void kaydetAlan({ uygulamaYeri: yer.trim() || null }); }}
        placeholder="—"
        style={GIRIS}
      />
    </div>,
    <div key="lot" data-asi-alan="lot">
      {lbl('Lot no')}
      <input
        aria-label="Lot numarası"
        value={lot}
        maxLength={LOT_AZAMI}
        onChange={(e) => setLot(e.target.value)}
        onBlur={() => { if ((lot.trim() || null) !== (a.lot_no || null)) void kaydetAlan({ lotNo: lot.trim() || null }); }}
        placeholder="—"
        style={GIRIS}
      />
    </div>,
  ];

  const silBtn = (
    <button
      type="button"
      onClick={() => onSil(a.id)}
      style={{ background: '#FBEAE3', border: 'none', color: '#EF4444', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', minHeight: 40, whiteSpace: 'nowrap' }}
    >
      Sil
    </button>
  );

  if (mod === 'kart') {
    return (
      <div
        data-asi-kaynak={tur}
        data-asi-satir="kart"
        style={{
          background: '#F6F0E4',
          borderRadius: 12,
          padding: 12,
          borderLeft: `3px solid ${KAYNAK_KENAR[tur]}`,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {hucreler}
        </div>
        <div style={{ marginTop: 10, textAlign: 'right' }}>{silBtn}</div>
      </div>
    );
  }

  const td: React.CSSProperties = { padding: '8px 6px', verticalAlign: 'top', borderBottom: '1px solid rgba(58,44,34,0.08)' };
  const genislik = [140, 110, 140, 72, 64, 110, 100] as const;
  return (
    <tr data-asi-kaynak={tur} data-asi-satir="tablo" style={{ borderLeft: `3px solid ${KAYNAK_KENAR[tur]}` }}>
      {hucreler.map((h, i) => (
        <td key={i} style={{ ...td, minWidth: genislik[i] }}>{h}</td>
      ))}
      <td style={{ ...td, width: 56 }}>{silBtn}</td>
    </tr>
  );
}
