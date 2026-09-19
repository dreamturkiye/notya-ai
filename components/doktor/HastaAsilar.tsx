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
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { ULUSAL_TAKVIM, OZEL_ASILAR, PEDIATRIK_ASI_ADLARI, TAKVIM_SURUM } from '@/lib/asi/ulusalAsiTakvimi';
import { hitapMetinleri } from '@/lib/specialties/hitap';
import { Rozet } from '@/lib/doktor/aracUi';
import { asiKaynakRozeti, asiKaynakTuru, trTarih } from '@/lib/asi/karneOkuma';
import AsiKarnesiOkuma from '@/components/doktor/AsiKarnesiOkuma';

interface Asi {
  id: string;
  asi_adi: string;
  doz_no: number | null;
  kategori: 'pediatrik' | 'yetiskin';
  uygulama_tarihi: string | null;
  sonraki_doz_tarihi: string | null;
  kaynak: 'beyan' | 'kayit';
  notlar: string | null;
  belge_id?: string | null;
}

const KAYNAK_KENAR = { karne: 'rgba(96,165,250,0.55)', beyan: 'rgba(255,255,255,0.18)', klinik: 'rgba(45,212,191,0.55)' } as const;

const YAYGIN_YETISKIN = ['Tetanoz-Difteri (Td)', 'Grip', 'KOVID-19', 'Zona (Herpes Zoster)', 'Pnömokok'];

/**
 * BRANS-ALAN-SIZMASI: `veliDili` (lib/specialties/kapsam → veliDiliMi; VELI-YASAL-ONAM: reşit olmayan hasta her branşta)
 * "veli" kelimesini açar; `pediatrikBaglam` (pediatrikBaglamMi) ve `cocukHasta` SB çocukluk takvimini ve yeni kaydın
 * varsayılan kategorisini seçer. Eskiden her hastada (KD'nin erişkin hastası dahil) varsayılan 'pediatrik' ve
 * "Hasta/veli beyanı" idi.
 */
export default function HastaAsilar({ patientId, pediatrikBaglam = false, veliDili = pediatrikBaglam, cocukHasta = false }: { patientId: string; pediatrikBaglam?: boolean; veliDili?: boolean; cocukHasta?: boolean }) {
  const hitap = hitapMetinleri(veliDili);
  const [asilar, setAsilar] = useState<Asi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [asiAdi, setAsiAdi] = useState('');
  const [dozNo, setDozNo] = useState('');
  const [kategori, setKategori] = useState<'pediatrik' | 'yetiskin'>(cocukHasta ? 'pediatrik' : 'yetiskin');
  useEffect(() => { setKategori(cocukHasta ? 'pediatrik' : 'yetiskin'); }, [cocukHasta]);
  const [uygulamaTarihi, setUygulamaTarihi] = useState('');
  const [sonrakiDozTarihi, setSonrakiDozTarihi] = useState('');
  const [kaynak, setKaynak] = useState<'kayit' | 'beyan'>('kayit');
  const [kaydediyor, setKaydediyor] = useState(false);
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [karneAcik, setKarneAcik] = useState(false);
  const [bilgi, setBilgi] = useState('');

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
    setAsiAdi(''); setDozNo(''); setUygulamaTarihi(''); setSonrakiDozTarihi(''); setKaynak('kayit');
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

  const pediatrikler = asilar.filter((a) => a.kategori === 'pediatrik');
  const yetiskinler = asilar.filter((a) => a.kategori === 'yetiskin');

  function Liste({ baslik, kayitlar }: { baslik: string; kayitlar: Asi[] }) {
    if (kayitlar.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{baslik}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {kayitlar.map((a) => {
            const yaklasan = a.sonraki_doz_tarihi && new Date(a.sonraki_doz_tarihi) >= new Date() && new Date(a.sonraki_doz_tarihi) <= new Date(Date.now() + 7 * 86400000);
            const tur = asiKaynakTuru(a);
            const rozet = asiKaynakRozeti(tur, hitap.beyanEtiketi);
            return (
              <div key={a.id} data-asi-kaynak={tur} style={{ background: '#111C33', borderRadius: 10, padding: 12, borderLeft: `3px solid ${KAYNAK_KENAR[tur]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.asi_adi}{a.doz_no ? ` · ${a.doz_no}. doz` : ''}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{a.uygulama_tarihi ? `Uygulandı: ${trTarih(a.uygulama_tarihi)}` : 'Uygulama tarihi girilmedi'}</span>
                    <Rozet ton={rozet.ton}>{rozet.metin}</Rozet>
                  </div>
                  {a.sonraki_doz_tarihi && (
                    <div style={{ fontSize: 12, marginTop: 2, color: yaklasan ? '#F59E0B' : '#64748B' }}>
                      Sonraki doz: {trTarih(a.sonraki_doz_tarihi)}{yaklasan ? ' · Yaklaşıyor' : ''}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => sil(a.id)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#EF4444', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Sil</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aşılar</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => { setKarneAcik((v) => !v); setBilgi(''); }} style={{ background: 'rgba(255,255,255,0.08)', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
            {karneAcik ? 'Karne yüklemeyi kapat' : '📷 Aşı karnesi yükle'}
          </button>
          {/* BRANS-ALAN-SIZMASI: SB çocukluk dönemi takvimi yalnız çocuk hastada / pediatrik bağlamda — KD'nin erişkin hastasında yok */}
          {(cocukHasta || pediatrikBaglam) && (
            <button type="button" onClick={() => setTakvimAcik((v) => !v)} style={{ background: 'rgba(255,255,255,0.08)', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
              {takvimAcik ? 'Takvimi Gizle' : '📋 Ulusal Aşı Takvimi'}
            </button>
          )}
          <button type="button" onClick={() => setFormAcik((v) => !v)} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            + Aşı Ekle
          </button>
        </div>
      </div>

      {bilgi && <div role="status" style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.4)', color: '#5EEAD4', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{bilgi}</div>}
      {karneAcik && (
        <AsiKarnesiOkuma
          patientId={patientId}
          onKaydedildi={async (adet) => { setKarneAcik(false); setBilgi(`${adet} aşı karneden aktarıldı (hekim onaylı).`); await yukle(); }}
        />
      )}

      {hata && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{hata}</div>}

      {takvimAcik && (cocukHasta || pediatrikBaglam) && (
        <div style={{ background: '#111C33', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{TAKVIM_SURUM}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
            2025 GBP güncellemesi: Hepatit B artık 6’lı karmanın içinde — 1. aydaki tekil doz kaldırıldı (istisna: anne HBsAg+). “Ekle” formatı doldurur, tarih seçip kaydedersiniz.
          </div>
          {ULUSAL_TAKVIM.map((d) => (
            <div key={d.donem} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{d.donem}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {d.asilar.map((a) => (
                  <div key={d.donem + a.ad} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 150 }}>{a.ad}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{a.dozEtiket}</span>
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
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{a.onerilenDonem}</span>
                <span style={{ fontSize: 10, color: '#94A3B8', width: '100%' }}>{a.not}</span>
                <button type="button" onClick={() => takvimdenEkle(a.ad, null)} style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Ekle</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {formAcik && (
        <form onSubmit={kaydet} style={{ background: '#111C33', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Aşı Adı *</label>
              <input
                value={asiAdi}
                onChange={(e) => setAsiAdi(e.target.value)}
                list="yaygin-asilar"
                placeholder="Örn. Hepatit B, Tetanoz-Difteri, Grip"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
              />
              <datalist id="yaygin-asilar">
                {[...PEDIATRIK_ASI_ADLARI, ...YAYGIN_YETISKIN].map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value as 'pediatrik' | 'yetiskin')} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                <option value="pediatrik">Pediatrik</option>
                <option value="yetiskin">Yetişkin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Doz No</label>
              <input type="number" min={1} value={dozNo} onChange={(e) => setDozNo(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Uygulama Tarihi</label>
              <input type="date" value={uygulamaTarihi} onChange={(e) => setUygulamaTarihi(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Sonraki Doz / Hatırlatma Tarihi</label>
              <input type="date" value={sonrakiDozTarihi} onChange={(e) => setSonrakiDozTarihi(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Kaynak</label>
              <select value={kaynak} onChange={(e) => setKaynak(e.target.value as 'kayit' | 'beyan')} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                <option value="kayit">Bu klinikte uygulandı</option>
                <option value="beyan">{hitap.beyanEtiketi}</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={kaydediyor} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            {kaydediyor ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>
      )}

      {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
      {!yukleniyor && asilar.length === 0 && <p style={{ color: '#94A3B8' }}>Henüz aşı kaydı yok.</p>}

      <Liste baslik="Pediatrik" kayitlar={pediatrikler} />
      <Liste baslik="Yetişkin" kayitlar={yetiskinler} />
    </div>
  );
}
