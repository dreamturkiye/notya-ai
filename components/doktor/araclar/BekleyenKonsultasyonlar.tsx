'use client';
/**
 * KONSULTASYON-02 (Kaan 2026-09-19, seçenek #1) — Araçlar › Bekleyen Konsültasyonlar. EVRENSEL (ORTAK_DOKTOR_ARACLARI):
 * 30 branşın hepsi aynı listeyi görür. Kohort paneli olmayan branşlarda "yanıt gelmedi" takibinin tek yüzeyi; kohort
 * paneli olan yedi branş için ikinci giriş noktası.
 *
 * Hekim düzeyinde liste — hasta seçici yok. Veri: GET /api/doktor/konsultasyon?bekleyen=1 (yalnız oturumdaki hekimin
 * satırları, yalnız kendi hastaları). Sıra ve vurgu lib/doktor/konsultasyon.ts'teki TEK tanımdan (bekleyenListesi /
 * beklemeVurgusu) — kohort satırı ve ana sayfa özetiyle aynı veri.
 *
 * İşlemler: hasta dosyası · Yanıt ekle (hasta dosyası › Konsültasyonlar'daki mevcut yanıt formu açık gelir) ·
 * Hatırlat · Yanıtsız kapat (aynı PATCH, aynı metinler — lib/doktor/konsultasyonIstemci.ts).
 * Eşikler takip ipucudur, klinik süre sınırı değildir. Ortak UI: lib/doktor/aracUi.tsx.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAracStil, Istatistik, Rozet } from '@/lib/doktor/aracUi';
import {
  ACILIYET_ETIKETI, BEKLEME_DIKKAT_GUN, BEKLEME_KIRMIZI_GUN, HATIRLATMA_ARALIGI_GUN,
  beklemeVurgusu, bekleyenOzeti, hatirlatmaBeklemesi, trGun, type Aciliyet, type BekleyenKonsultasyon,
} from '@/lib/doktor/konsultasyon';
import {
  HATIRLATMA_GONDERILDI, YANITSIZ_KAPAT_ONAYI, konsultasyonApi, konsultasyonDosyaYolu, konsultasyonIslemi,
} from '@/lib/doktor/konsultasyonIstemci';

export type YanitSuresi = { adet: number; medyanGun: number | null; enUzunGun: number | null }
type IslemSonucu = { ok: boolean; metin: string; sonHatirlatmaAt?: string | null }
export type BekleyenIslemi = (id: string, islem: 'hatirlat' | 'kapat') => Promise<IslemSonucu>

function AciliyetRozeti({ aciliyet }: { aciliyet: string | null }) {
  if (aciliyet === 'acil') return <Rozet ton="kirmizi">{ACILIYET_ETIKETI.acil}</Rozet>;
  if (aciliyet === 'oncelikli') return <Rozet ton="uyari">{ACILIYET_ETIKETI.oncelikli}</Rozet>;
  return <Rozet ton="notr">{ACILIYET_ETIKETI[(aciliyet || 'rutin') as Aciliyet] || ACILIYET_ETIKETI.rutin}</Rozet>;
}

export function BekleyenSatir({ b, islemYap }: { b: BekleyenKonsultasyon; islemYap: BekleyenIslemi }) {
  const stil = useAracStil();
  const [calisiyor, setCalisiyor] = useState<'' | 'hatirlat' | 'kapat'>('');
  const [mesaj, setMesaj] = useState<{ iyi: boolean; metin: string } | null>(null);
  const vurgu = beklemeVurgusu(b.gun);
  const sonraki = hatirlatmaBeklemesi(b.sonHatirlatmaAt);

  const calistir = async (ad: 'hatirlat' | 'kapat') => {
    if (calisiyor) return;
    if (ad === 'kapat' && typeof window !== 'undefined' && !window.confirm(YANITSIZ_KAPAT_ONAYI)) return;
    setCalisiyor(ad); setMesaj(null);
    const s = await islemYap(b.id, ad);
    setCalisiyor('');
    setMesaj({ iyi: s.ok, metin: s.metin });
  };

  const kenar = vurgu === 'kirmizi' ? 'rgba(248,113,113,0.45)' : vurgu === 'uyari' ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)';
  return (
    <div style={{ ...stil.kutu, marginBottom: 10, borderColor: kenar }} data-bekleyen-konsultasyon={b.id} data-vurgu={vurgu}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Rozet ton={vurgu}>{b.gun === 0 ? 'bugün istendi' : `${b.gun} gündür bekliyor`}</Rozet>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#EDF1F7', minWidth: 0, overflowWrap: 'anywhere' }}>{b.hastaAdi}</span>
        <span style={{ ...stil.kucuk, color: '#C9D4E3' }}>→ {b.hedef}</span>
        <AciliyetRozeti aciliyet={b.aciliyet} />
        {b.eskiKayit && <Rozet ton="bilgi">eski kayıt</Rozet>}
      </div>
      {b.klinikSoru && <div style={{ ...stil.metin, marginTop: 8, overflowWrap: 'anywhere' }}>{b.klinikSoru}</div>}
      <div style={{ ...stil.kucuk, marginTop: 6 }}>
        İstem: {trGun(b.istemTarihi)}{b.sonHatirlatmaAt ? ` · son hatırlatma ${trGun(b.sonHatirlatmaAt.slice(0, 10))}` : ''}
      </div>
      <div style={stil.satir}>
        <a href={konsultasyonDosyaYolu(b.patientId, b.id)} style={{ ...stil.btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Yanıt ekle</a>
        <a href={konsultasyonDosyaYolu(b.patientId)} style={stil.ghost}>Hasta dosyası</a>
        <button type="button" onClick={() => calistir('hatirlat')} disabled={!!calisiyor || !!sonraki} aria-disabled={!!calisiyor || !!sonraki}
          title={sonraki ? `Aynı konsültasyon için ${HATIRLATMA_ARALIGI_GUN} günde bir hatırlatma gönderilir.` : undefined}
          style={{ ...stil.ghost, opacity: sonraki ? 0.55 : 1, cursor: sonraki ? 'not-allowed' : 'pointer' }}>
          {calisiyor === 'hatirlat' ? 'Gönderiliyor…' : 'Hatırlat'}
        </button>
        <button type="button" onClick={() => calistir('kapat')} disabled={!!calisiyor} style={stil.ghost}>{calisiyor === 'kapat' ? 'Kapatılıyor…' : 'Yanıtsız kapat'}</button>
      </div>
      {sonraki && !mesaj && <div style={{ ...stil.kucuk, marginTop: 6 }}>Sonraki hatırlatma {trGun(sonraki)} tarihinden itibaren gönderilebilir.</div>}
      {mesaj && <div style={{ fontSize: 13, marginTop: 8, color: mesaj.iyi ? '#5EEAD4' : '#FDE68A' }} aria-live="polite">{mesaj.metin}</div>}
    </div>
  );
}

/** Sunumsal kısım (SSR testi için ayrı). `bekleyenler` null = yükleniyor. */
export function BekleyenKonsultasyonListesi({ bekleyenler, yanitSuresi, hazir = true, hata = '', islemYap }: {
  bekleyenler: BekleyenKonsultasyon[] | null
  yanitSuresi?: YanitSuresi | null
  hazir?: boolean
  hata?: string
  islemYap: BekleyenIslemi
}) {
  const stil = useAracStil();
  if (hata) return <div style={{ ...stil.kutu, ...stil.hata }}>{hata}</div>;
  if (!hazir) return <div style={stil.uyari}>Konsültasyon kayıtları henüz hazır değil — kısa süre içinde açılacak.</div>;
  if (bekleyenler == null) return <div style={{ ...stil.kucuk, fontSize: 14 }}>Yükleniyor…</div>;
  const o = bekleyenOzeti(bekleyenler);

  return (
    <div style={{ minWidth: 0 }} data-bekleyen-konsultasyonlar="">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Istatistik deger={o.sayi} etiket="yanıt bekleyen" />
        <Istatistik deger={o.dikkat} etiket={`${BEKLEME_DIKKAT_GUN}–${BEKLEME_KIRMIZI_GUN - 1} gündür`} ton={o.dikkat ? 'uyari' : 'notr'} />
        <Istatistik deger={o.kirmizi} etiket={`${BEKLEME_KIRMIZI_GUN} gün ve üzeri`} ton={o.kirmizi ? 'kirmizi' : 'notr'} />
        <Istatistik deger={yanitSuresi && yanitSuresi.adet > 0 && yanitSuresi.medyanGun != null ? `${yanitSuresi.medyanGun} gün` : '—'} etiket="istem → yanıt medyanı (son 180 gün)" />
      </div>

      {!bekleyenler.length ? (
        <div style={{ ...stil.kutu, color: '#8FA0B5', fontSize: 14 }}>
          Yanıt bekleyen konsültasyonunuz yok. Konsültasyon istemini hasta dosyası › Konsültasyonlar'dan oluşturursunuz; yanıt gelene kadar burada izlenir.
        </div>
      ) : (
        bekleyenler.map((b) => <BekleyenSatir key={b.id} b={b} islemYap={islemYap} />)
      )}

      <div style={{ ...stil.kucuk, marginTop: 4 }}>
        En uzun bekleyen üstte. Sarı: {BEKLEME_DIKKAT_GUN} gün ve üzeri · kırmızı: {BEKLEME_KIRMIZI_GUN} gün ve üzeri — bu vurgu takibi
        kolaylaştıran bir ipucudur, klinik bir süre sınırı değildir. Hatırlatma hastaya Sağlığım üzerinden gider, klinik bilgi
        içermez; aynı konsültasyon için {HATIRLATMA_ARALIGI_GUN} günde bir gönderilebilir.
      </div>
    </div>
  );
}

export default function BekleyenKonsultasyonlar() {
  const [bekleyenler, setBekleyenler] = useState<BekleyenKonsultasyon[] | null>(null);
  const [yanitSuresi, setYanitSuresi] = useState<YanitSuresi | null>(null);
  const [hazir, setHazir] = useState(true);
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;
    konsultasyonApi('/api/doktor/konsultasyon?bekleyen=1').then(({ ok, j }) => {
      if (iptal) return;
      if (!ok && !Array.isArray(j.bekleyenler)) { setHata(j.error || 'Konsültasyonlar yüklenemedi.'); return; }
      setBekleyenler(Array.isArray(j.bekleyenler) ? j.bekleyenler : []);
      setYanitSuresi(j.yanitSuresi || null);
      setHazir(j.tabloHazir !== false);
    }).catch(() => { if (!iptal) setHata('Konsültasyonlar yüklenemedi — bağlantıyı kontrol edin.'); });
    return () => { iptal = true; };
  }, []);

  const islemYap = useCallback<BekleyenIslemi>(async (id, islem) => {
    try {
      const { ok, j } = await konsultasyonIslemi(id, islem);
      if (!ok) return { ok: false, metin: j.error || 'İşlem yapılamadı.' };
      if (islem === 'kapat') {
        // Kapanan konsültasyon bekleyenler listesinden çıkar (hasta dosyasında "Yanıtsız kapatıldı" olarak kalır).
        setBekleyenler((l) => (l ? l.filter((b) => b.id !== id) : l));
        return { ok: true, metin: 'Yanıtsız kapatıldı.' };
      }
      const son = j.konsultasyon?.son_hatirlatma_at ?? new Date().toISOString();
      setBekleyenler((l) => (l ? l.map((b) => (b.id === id ? { ...b, sonHatirlatmaAt: son } : b)) : l));
      return { ok: true, metin: HATIRLATMA_GONDERILDI };
    } catch {
      return { ok: false, metin: 'İşlem yapılamadı — bağlantıyı kontrol edin.' };
    }
  }, []);

  return <BekleyenKonsultasyonListesi bekleyenler={bekleyenler} yanitSuresi={yanitSuresi} hazir={hazir} hata={hata} islemYap={islemYap} />;
}
