'use client';
/**
 * NOTYA-MEDULA P1b — Reçete sayfası (kâğıt / MBYS), doktor için tek büyük düğme.
 *
 * Kaan direktifi (2026-09-09): tüm doktorlara en iyi işlev — kimi kâğıt yazar, kimi MBYS kullanır.
 * Sadelik kuralı: doktor ilk açılışta Ayşe'ye bir kez "nasıl yazıyorsunuz?" der; cevap meslektaş
 * hafızasına (kategori uygulama, anahtar recete-yolu) yazılır ve ondan sonra bu sayfa TEK büyük
 * düğmeyle açılır (kâğıt → Yazdır, MBYS → Kopyala). Diğer yollar küçük bağlantı olarak kalır
 * (yakınsak fazlalık: yol değişirse hiçbir şey öğrenmesi gerekmez).
 *
 * Kutu adedi ekranda düzenlenebilir (Notya kutu içeriğini bilmez; doktor bir dokunuşla düzeltir),
 * kâğıt boyu A5/A4 seçilebilir ve hatırlanır. Ayşe'nin SUT/güvenlik uyarıları ekranda, kâğıtta değil.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari';

type Yol = 'kagit' | 'mbys';
interface Satir { ilacAdi: string; etkenMadde: string; dozMetni: string; kullanimOzeti: string; gunSayisi: number | null; kutu: number }
interface Veri {
  satirlar: Satir[]
  tanilar: { taniKodu: string; taniAdi?: string }[]
  uyarilar: string[]
  metin: string
  baslik: { doktor: { unvan: string; ad: string; brans: string; klinik: string }; ozel?: { satirlar: string[]; diplomaNo: string; logoDataUrl: string }; taslakMi?: boolean; hasta: { ad: string; dogum: string | null; cinsiyet: string | null }; tarih: string }
  xml: string
}

const BRANS_AD: Record<string, string> = BRANS_ETIKETLERI as Record<string, string>; // 30 branş (Kaan 2026-09-10)

function yas(dogum: string | null): string {
  if (!dogum) return '';
  const d = new Date(dogum); if (isNaN(d.getTime())) return '';
  const ay = Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000));
  return ay < 24 ? `${ay} aylık` : `${Math.floor(ay / 12)} yaş`;
}
function trTarih(iso: string): string { return new Date(iso).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' }); }

const buyukDugme: React.CSSProperties = { background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '12px 22px', fontFamily: 'system-ui', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,155,142,0.35)' };
const kucukBaglanti: React.CSSProperties = { background: 'transparent', border: 'none', color: '#9FB3C8', fontFamily: 'system-ui', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: '6px 4px' };

export default function ReceteYazdirPage() {
  const params = useParams<{ id: string }>();
  const [veri, setVeri] = useState<Veri | null>(null);
  const [hata, setHata] = useState('');
  const [yol, setYol] = useState<Yol | null>(null);          // null = henüz sorulmadı
  const [yolYukleniyor, setYolYukleniyor] = useState(true);
  const [kagit, setKagit] = useState<'A5' | 'A4'>('A5');
  const [kutular, setKutular] = useState<number[]>([]);
  const [kopya, setKopya] = useState(false);
  // NOTYA-RECETE-03 (Kaan 2026-09-10): başlığı doktor kendisi yazar — satırlar, diploma no, logo
  const [baslikDuzenle, setBaslikDuzenle] = useState(false);
  const [bSatirlar, setBSatirlar] = useState('');
  const [bDiploma, setBDiploma] = useState('');
  const [bLogo, setBLogo] = useState('');
  const [bKaydediyor, setBKaydediyor] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const [r, h] = await Promise.all([
          fetch(`/api/doktor/medula/recete?noteId=${params.id}`, { headers: { Authorization: `Bearer ${t}` } }),
          fetch('/api/doktor/hafiza', { headers: { Authorization: `Bearer ${t}` } }),
        ]);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Reçete alınamadı');
        setVeri(j);
        setKutular((j.satirlar || []).map((s: Satir) => s.kutu || 1));
        setBSatirlar((j.baslik?.ozel?.satirlar || []).join('\n'));
        setBDiploma(j.baslik?.ozel?.diplomaNo || '');
        setBLogo(j.baslik?.ozel?.logoDataUrl || '');
        if (h.ok) {
          const hj = await h.json();
          const kayitlar = (hj.kayitlar || []) as { kategori: string; anahtar: string; deger: string }[];
          const y = kayitlar.find((k) => k.anahtar === 'recete-yolu');
          if (y) setYol(/mbys|medula|program|yazılım|bilgisayar/i.test(y.deger) ? 'mbys' : 'kagit');
          const b = kayitlar.find((k) => k.anahtar === 'recete-kagit-boyu');
          if (b && /a4/i.test(b.deger)) setKagit('A4');
        }
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
      finally { setYolYukleniyor(false); }
    })();
  }, [params.id]);

  /** Ayşe'nin bir kez sorduğu tercih — meslektaş hafızasına yazılır (doktor söyledi → anında kesin). */
  const yolSec = async (secim: Yol) => {
    setYol(secim);
    try {
      const t = await ensureDoctorAccessToken();
      await fetch('/api/doktor/hafiza', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ kategori: 'uygulama', anahtar: 'recete-yolu', deger: secim === 'kagit' ? 'Reçeteyi kâğıda yazdırır (kâğıt reçete)' : 'Reçeteyi MBYS/Medula programına girer (kopyala-yapıştır)' }) });
    } catch { /* tercih kritik değil */ }
  };
  const kagitSec = async (b: 'A5' | 'A4') => {
    setKagit(b);
    try {
      const t = await ensureDoctorAccessToken();
      await fetch('/api/doktor/hafiza', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ kategori: 'uygulama', anahtar: 'recete-kagit-boyu', deger: `Reçeteyi ${b} kâğıda basar` }) });
    } catch { /* tercih kritik değil */ }
  };

  const logoSec = (f: File | null) => {
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const maks = 320; const oran = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * oran); c.height = Math.round(img.height * oran);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      setBLogo(c.toDataURL('image/png'));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const baslikKaydet = async () => {
    setBKaydediyor(true);
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/recete-baslik', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ satirlar: bSatirlar.split('\n'), diplomaNo: bDiploma, logoDataUrl: bLogo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi');
      setVeri((v) => v ? { ...v, baslik: { ...v.baslik, ozel: { satirlar: bSatirlar.split('\n').map((x) => x.trim()).filter(Boolean), diplomaNo: bDiploma, logoDataUrl: bLogo } } } : v);
      setBaslikDuzenle(false);
    } catch (e) { alert(e instanceof Error ? e.message : 'Kaydedilemedi'); }
    finally { setBKaydediyor(false); }
  };
  const kutuMetni = () => {
    if (!veri) return '';
    // Ekranda düzenlenen kutu adetleri kopyalanan metne de yansır
    let m = veri.metin;
    veri.satirlar.forEach((s, i) => { m = m.replace(`Adet: ${s.kutu} kutu`, `Adet: ${kutular[i] ?? s.kutu} kutu`); });
    return m;
  };
  const kopyala = async () => {
    await navigator.clipboard.writeText(kutuMetni());
    setKopya(true); setTimeout(() => setKopya(false), 3000);
  };
  const xmlIndir = () => {
    if (!veri) return;
    const blob = new Blob([veri.xml], { type: 'application/xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `erecete-${params.id.slice(0, 8)}.xml`; a.click();
  };

  if (hata) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!veri || yolYukleniyor) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666' }}>Reçete hazırlanıyor…</div>;
  const { baslik, satirlar, tanilar, uyarilar } = veri;
  const bransAd = (BRANS_AD[baslik.doktor.brans] || baslik.doktor.brans || '').replace(/\s*\(.*\)\s*$/, ''); // "Pediatri (Çocuk Sağlığı)" → "Pediatri"
  const mm = (v: number) => v * 3.78;
  const en = kagit === 'A5' ? mm(148) : mm(210);
  const boy = kagit === 'A5' ? mm(210) : mm(297);

  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh' }}>
      <style>{`
        @media print { .yazdirma-gizle { display: none !important; } body { background: white !important; } .recete-kagit { box-shadow: none !important; margin: 0 !important; width: auto !important; min-height: auto !important; } .kutu-giris { border: none !important; background: transparent !important; width: 2.2em !important; text-align: right; padding: 0 !important; } .kutu-eksi, .kutu-arti { display: none !important; } @page { size: ${kagit} portrait; margin: 12mm; } }
      `}</style>

      {/* Üst çubuk: tek büyük düğme (doktorun yolu) + küçük diğerleri */}
      <div className="yazdirma-gizle" style={{ background: '#0B1628', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Reçete · {baslik.hasta.ad || 'Hasta'}</span>
        {yol === null ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#C9D4E3', fontFamily: 'system-ui', fontSize: 13 }}><b style={{ color: '#2DD4BF' }}>Ayşe:</b> Reçeteyi nasıl yazıyorsunuz? Bir kez söyleyin, aklımda tutayım.</span>
            <button type="button" onClick={() => yolSec('kagit')} style={buyukDugme}>🖨️ Kâğıda yazdırıyorum</button>
            <button type="button" onClick={() => yolSec('mbys')} style={{ ...buyukDugme, background: '#1F5F8B' }}>💻 Programa giriyorum (MBYS / Medula)</button>
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {yol === 'kagit' ? (
              <>
                <button type="button" onClick={() => window.print()} style={buyukDugme}>🖨️ Reçeteyi yazdır ({kagit})</button>
                {/* Kaan (2026-09-10): Türkiye'de reçete kâğıdı standardı A5 — A5 varsayılan, A4 seçenek */}
                <button type="button" onClick={() => kagitSec(kagit === 'A5' ? 'A4' : 'A5')} style={kucukBaglanti}>{kagit === 'A5' ? 'A4 kâğıda geç' : 'A5 standarda dön'}</button>
                <button type="button" onClick={kopyala} style={kucukBaglanti}>{kopya ? '✓ Kopyalandı' : 'Programa kopyala'}</button>
              </>
            ) : (
              <>
                <button type="button" onClick={kopyala} style={buyukDugme}>{kopya ? '✓ Kopyalandı — programa yapıştırın' : '📋 Programa kopyala (MBYS / Medula)'}</button>
                <button type="button" onClick={xmlIndir} style={kucukBaglanti}>e-Reçete XML</button>
                <button type="button" onClick={() => window.print()} style={kucukBaglanti}>Kâğıda yazdır</button>
              </>
            )}
            <button type="button" onClick={() => setYol(null)} title="Reçete yolunu değiştir" style={{ ...kucukBaglanti, color: '#6B7F95' }}>değiştir</button>
          </span>
        )}
      </div>

      {uyarilar.length > 0 && (
        <div className="yazdirma-gizle" style={{ maxWidth: en, margin: '12px auto 0', padding: '10px 14px', background: '#FFF7E6', border: '1px solid #F5C36A', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#5C3D00' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Ayşe — imzalamadan önce:</div>
          {uyarilar.map((u, i) => <div key={i}>• {u}</div>)}
        </div>
      )}
      {baslik.taslakMi && (
        <div className="yazdirma-gizle" style={{ maxWidth: en, margin: '12px auto 0', padding: '10px 14px', background: '#EEF2FF', border: '1px solid #A5B4FC', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#3730A3' }}>
          Bu not henüz onaylanmadı — aşağıdaki ilaçlar nottaki <b>öneri</b>dir. Notu onayladığınızda ilaçlar hasta dosyasına ve portala işlenir; reçete o kayıtlardan üretilir.
        </div>
      )}
      {satirlar.length > 0 && (
        <div className="yazdirma-gizle" style={{ maxWidth: en, margin: '8px auto 0', fontFamily: 'system-ui', fontSize: 12, color: '#4B5563' }}>Kutu adedini satırın sağından düzeltebilirsiniz; yazdırılan ve kopyalanan reçeteye yansır.</div>
      )}
      <div className="yazdirma-gizle" style={{ maxWidth: en, margin: '8px auto 0', fontFamily: 'system-ui', fontSize: 12 }}>
        {!baslikDuzenle ? (
          <button type="button" onClick={() => setBaslikDuzenle(true)} style={{ background: 'transparent', border: 'none', color: '#0F766E', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 12 }}>✎ Reçete başlığını düzenle (adres, telefon, diploma no, logo)</button>
        ) : (
          <div style={{ background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
            <label style={{ display: 'grid', gap: 4, color: '#374151' }}>Başlık satırları (her satır ayrı — ör. uzmanlık, adres, telefon)
              <textarea value={bSatirlar} onChange={(e) => setBSatirlar(e.target.value)} rows={3} placeholder={'Çocuk Sağlığı ve Hastalıkları Uzmanı\nBağdat Cad. No:12 Kadıköy / İstanbul\n0216 000 00 00'} style={{ fontFamily: 'inherit', fontSize: 13, padding: 8, border: '1px solid #D1D5DB', borderRadius: 6 }} />
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
              <label style={{ display: 'grid', gap: 4, color: '#374151' }}>Diploma No
                <input value={bDiploma} onChange={(e) => setBDiploma(e.target.value)} style={{ fontFamily: 'inherit', fontSize: 13, padding: 8, border: '1px solid #D1D5DB', borderRadius: 6, width: 160 }} />
              </label>
              <label style={{ display: 'grid', gap: 4, color: '#374151' }}>Logo (PNG/JPG)
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => logoSec(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
              </label>
              {bLogo && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={bLogo} alt="logo" style={{ height: 36 }} /><button type="button" onClick={() => setBLogo('')} style={{ background: 'transparent', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 12 }}>kaldır</button></span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={baslikKaydet} disabled={bKaydediyor} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>{bKaydediyor ? 'Kaydediliyor…' : 'Kaydet'}</button>
              <button type="button" onClick={() => setBaslikDuzenle(false)} style={{ background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}>Vazgeç</button>
            </div>
          </div>
        )}
      </div>

      {/* Kâğıt */}
      <div className="recete-kagit" style={{ width: en, minHeight: boy, background: 'white', margin: '12px auto 32px', padding: kagit === 'A5' ? '28px 32px' : '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', fontFamily: 'Georgia, "Times New Roman", serif', color: '#111', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: 8, marginBottom: 12 }}>
          {baslik.ozel?.logoDataUrl && <img src={baslik.ozel.logoDataUrl} alt="" style={{ height: 44, marginBottom: 4 }} />}
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>{baslik.doktor.unvan} {baslik.doktor.ad || '________________'}</div>
          {baslik.ozel && baslik.ozel.satirlar.length > 0
            ? baslik.ozel.satirlar.map((s, i) => <div key={i} style={{ fontSize: i === 0 ? 12 : 11, color: i === 0 ? '#111' : '#333' }}>{s}</div>)
            : (<>
                {bransAd && <div style={{ fontSize: 12 }}>{bransAd} Uzmanı</div>}
                {baslik.doktor.klinik && <div style={{ fontSize: 11, color: '#333' }}>{baslik.doktor.klinik}</div>}
              </>)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 14, gap: 12 }}>
          <div>
            <div><b>Hasta:</b> {baslik.hasta.ad || '________________'}</div>
            <div><b>Yaş:</b> {yas(baslik.hasta.dogum) || '____'}{baslik.hasta.cinsiyet ? ` · ${baslik.hasta.cinsiyet === 'male' ? 'E' : 'K'}` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><b>Tarih:</b> {trTarih(baslik.tarih)}</div>
            {tanilar.length > 0 && <div><b>Tanı:</b> {tanilar.map((t) => t.taniKodu).join(', ')}</div>}
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, fontStyle: 'italic', marginBottom: 8 }}>Rp.</div>
        {satirlar.length === 0 && <div style={{ fontSize: 12, color: '#666' }}>Bu notta ilaç yok.</div>}
        <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13, lineHeight: 1.55 }}>
          {satirlar.map((s, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span><b>{s.ilacAdi}</b>{s.dozMetni ? ` ${s.dozMetni}` : ''}</span>
                <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <button type="button" className="kutu-eksi" onClick={() => setKutular((k) => k.map((v, j) => (j === i ? Math.max(1, v - 1) : v)))} style={{ border: '1px solid #ccc', background: '#f7f7f7', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}>−</button>
                  <input className="kutu-giris" type="number" min={1} max={20} value={kutular[i] ?? 1} onChange={(e) => setKutular((k) => k.map((v, j) => (j === i ? Math.max(1, Number(e.target.value) || 1) : v)))} style={{ width: 36, textAlign: 'right', fontFamily: 'inherit', fontSize: 13, border: '1px solid #ddd', borderRadius: 4, padding: '1px 4px' }} />
                  <span>kutu</span>
                  <button type="button" className="kutu-arti" onClick={() => setKutular((k) => k.map((v, j) => (j === i ? Math.min(20, v + 1) : v)))} style={{ border: '1px solid #ccc', background: '#f7f7f7', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}>+</button>
                </span>
              </div>
              <div style={{ paddingLeft: 10, fontStyle: 'italic' }}>S: {s.kullanimOzeti}</div>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: 'auto', paddingTop: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#333', borderTop: '1px solid #111', paddingTop: 6, minWidth: 180 }}>
            Kaşe / İmza<br />
            <span style={{ color: '#666' }}>Diploma No: {baslik.ozel?.diplomaNo || '____________'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
