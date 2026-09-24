'use client';

/**
 * ASI-KARNESI-01 — hasta dosyası › Aşılar › "Aşı karnesi yükle".
 *
 * Dr. Gökhan Mamur: "Doktoru hastanın elindeki aşı karnesinin resmini çekip … yüklesin. Orada AI aşı karnesini okuyup
 * tüm aşıları bu sistemdeki aşı kayıtlarına geçsin."
 * Kaan'ın kararı (2026-09-19): TOPLU ONAY + satır düzeltme. Hiçbir satır onaysız kaydedilmez.
 *
 * Akış: fotoğraf (mobilde kamera) / PDF → MEVCUT Kasa yolu (POST /api/doktor/documents, şifreli medical_documents)
 * → POST /api/doktor/asilar/karne { adim: 'oku' } (taslak, asilar'a yazılmaz) → bu ekran: hekim her satırı
 * düzeltebilir / çıkarabilir → tek düğme { adim: 'onayla', hekimOnayi: true } → kaynak='beyan' + kanıt izi.
 * Okunamayan satır "Okunamadı — elle girin" gelir; hekim düzeltmeden ya da "kontrol ettim" demeden onay açılmaz
 * (sunucu da aynı kuralı uygular — lib/asi/karneOkuma.ts onaySatirlariniDogrula).
 */

import React, { useRef, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { Rozet } from '@/lib/doktor/aracUi';
import {
  KARNE_BELGE_KATEGORISI, OKUNAMADI_ETIKETI, takvimEslestir,
  type KarneEslesme, type KarneSatiri, type Okunabilirlik,
} from '@/lib/asi/karneOkuma';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type TaslakSatir = KarneSatiri & { eslesme: KarneEslesme; hekimDuzeltti: boolean };

interface OkumaYaniti {
  belgeId: string;
  okunabilirlik: Okunabilirlik;
  asiKarnesiMi: boolean;
  not: string | null;
  kimlikUyarisi: string | null;
  satirlar: Array<KarneSatiri & { eslesme: KarneEslesme }>;
}

/** Telefon fotoğrafı 4 MB Kasa sınırını ve model görüntü sınırını aşmasın: uzun kenar ≤ 2400 px JPEG. PDF'e dokunulmaz. */
const AZAMI_KENAR = 2400;
async function karneDosyasiHazirla(dosya: File): Promise<File> {
  if (dosya.type === 'application/pdf' || !dosya.type.startsWith('image/')) return dosya;
  if (dosya.size < 1_500_000 && ['image/jpeg', 'image/png', 'image/webp'].includes(dosya.type)) return dosya;
  try {
    const bmp = await createImageBitmap(dosya);
    const oran = Math.min(1, AZAMI_KENAR / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * oran);
    canvas.height = Math.round(bmp.height * oran);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
    if (!blob) return dosya;
    return new File([blob], (dosya.name || 'asi-karnesi').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return dosya; // HEIC vb. çözülemedi — Kasa kendi tür kuralıyla dürüst hata verir
  }
}

const OKUNABILIRLIK_AD: Record<Okunabilirlik, string> = { iyi: 'Okunabilirlik iyi', kismi: 'Kısmi okuma', dusuk: 'Okunabilirlik düşük' };

const girdi: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 14, minHeight: 40 };
const ikincilDugme: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 13, cursor: 'pointer', minHeight: 44 };

export default function AsiKarnesiOkuma({ patientId, onKaydedildi }: { patientId: string; onKaydedildi: (adet: number) => void }) {
  const kameraRef = useRef<HTMLInputElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [asama, setAsama] = useState<'bos' | 'yukleniyor' | 'okunuyor' | 'onay' | 'kaydediliyor'>('bos');
  const [hata, setHata] = useState('');
  const [okuma, setOkuma] = useState<Omit<OkumaYaniti, 'satirlar'> | null>(null);
  const [satirlar, setSatirlar] = useState<TaslakSatir[]>([]);

  function sifirla() {
    setAsama('bos'); setOkuma(null); setSatirlar([]);
  }

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const secilen = e.target.files?.[0];
    e.target.value = '';
    if (!secilen) return;
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      setAsama('yukleniyor');
      const dosya = await karneDosyasiHazirla(secilen);
      const fd = new FormData();
      fd.append('file', dosya);
      fd.append('patientId', patientId);
      fd.append('category', KARNE_BELGE_KATEGORISI);
      const y = await fetch('/api/doktor/documents', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd });
      const yj = await y.json().catch(() => ({}));
      if (!y.ok || !yj.document?.id) { setHata(yj.error || 'Karne yüklenemedi.'); setAsama('bos'); return; }

      setAsama('okunuyor');
      const o = await fetch('/api/doktor/asilar/karne', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ adim: 'oku', belgeId: yj.document.id }),
      });
      const oj = (await o.json().catch(() => ({}))) as Partial<OkumaYaniti> & { error?: string };
      if (!o.ok || !Array.isArray(oj.satirlar)) {
        setHata(`${oj.error || 'Karne okunamadı.'} Karne Kasa'ya kaydedildi (Belgeler).`);
        setAsama('bos');
        return;
      }
      setOkuma({ belgeId: String(oj.belgeId), okunabilirlik: oj.okunabilirlik || 'dusuk', asiKarnesiMi: oj.asiKarnesiMi !== false, not: oj.not ?? null, kimlikUyarisi: oj.kimlikUyarisi ?? null });
      setSatirlar(oj.satirlar.map((s) => ({ ...s, hekimDuzeltti: false })));
      setAsama('onay');
    } catch {
      setHata('Karne yüklenemedi.');
      setAsama('bos');
    }
  }

  function duzelt(anahtar: string, alan: Partial<Pick<TaslakSatir, 'asiAdi' | 'dozNo' | 'uygulamaTarihi'>>) {
    setSatirlar((xs) => xs.map((s) => {
      if (s.anahtar !== anahtar) return s;
      const yeni = { ...s, ...alan, hekimDuzeltti: true };
      if (alan.asiAdi !== undefined) yeni.eslesme = takvimEslestir(alan.asiAdi);
      return yeni;
    }));
  }
  const kontrolEttim = (anahtar: string) => setSatirlar((xs) => xs.map((s) => (s.anahtar === anahtar ? { ...s, hekimDuzeltti: true } : s)));
  const cikar = (anahtar: string) => setSatirlar((xs) => xs.filter((s) => s.anahtar !== anahtar));

  const bekleyen = satirlar.filter((s) => s.okunamadi && !s.hekimDuzeltti).length;
  const adsiz = satirlar.filter((s) => !s.asiAdi.trim()).length;

  async function hepsiniOnayla() {
    if (!okuma || !satirlar.length || bekleyen || adsiz) return;
    setAsama('kaydediliyor');
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); setAsama('onay'); return; }
      const r = await fetch('/api/doktor/asilar/karne', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adim: 'onayla',
          belgeId: okuma.belgeId,
          hekimOnayi: true,
          satirlar: satirlar.map((s) => ({ asiAdi: s.asiAdi, dozNo: s.dozNo, uygulamaTarihi: s.uygulamaTarihi, okunamadi: s.okunamadi, hekimDuzeltti: s.hekimDuzeltti })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi.'); setAsama('onay'); return; }
      sifirla();
      onKaydedildi(Number(j.kaydedilen) || 0);
    } catch {
      setHata('Kaydedilemedi.');
      setAsama('onay');
    }
  }

  const takvimSatirlari = satirlar.filter((s) => s.eslesme.grup === 'takvim');
  const disSatirlar = satirlar.filter((s) => s.eslesme.grup !== 'takvim');

  // Düz fonksiyon (bileşen değil): iç bileşen her tuşta yeniden bağlanır ve girdi odağı kaybolurdu.
  function satirCiz(s: TaslakSatir) {
    const kirmizi = s.okunamadi && !s.hekimDuzeltti;
    return (
      <div key={s.anahtar} data-karne-satir={s.anahtar} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${kirmizi ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {kirmizi && <Rozet ton="kirmizi">{OKUNAMADI_ETIKETI}</Rozet>}
          {s.okunamadi && s.hekimDuzeltti && <Rozet ton="iyi">Hekim kontrol etti</Rozet>}
          <Rozet ton={s.eslesme.grup === 'takvim' ? 'bilgi' : 'uyari'}>{s.eslesme.etiket}</Rozet>
          {s.okunamadiNedeni && <span style={{ fontSize: 12, color: CHROME_RENK.warn }}>{s.okunamadiNedeni}</span>}
        </div>
        {s.hamMetin && <div style={{ fontSize: 12, color: '#94A3B8' }}>Karnede: “{s.hamMetin}”</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(72px, 0.6fr) minmax(0, 1.4fr)', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#94A3B8', gridColumn: '1 / -1' }}>Aşı adı
            <input aria-label="Aşı adı" value={s.asiAdi} onChange={(e) => duzelt(s.anahtar, { asiAdi: e.target.value })} placeholder="Elle girin" style={girdi} />
          </label>
          <label style={{ fontSize: 11, color: '#94A3B8' }}>Doz
            <input aria-label="Doz no" type="number" min={1} max={10} value={s.dozNo ?? ''} onChange={(e) => duzelt(s.anahtar, { dozNo: e.target.value ? Number(e.target.value) : null })} placeholder="—" style={girdi} />
          </label>
          <label style={{ fontSize: 11, color: '#94A3B8' }}>Uygulama tarihi
            <input aria-label="Uygulama tarihi" type="date" value={s.uygulamaTarihi ?? ''} onChange={(e) => duzelt(s.anahtar, { uygulamaTarihi: e.target.value || null })} style={girdi} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {kirmizi && <button type="button" onClick={() => kontrolEttim(s.anahtar)} style={ikincilDugme}>Karneyle karşılaştırdım, böyle kalsın</button>}
          <button type="button" onClick={() => cikar(s.anahtar)} style={{ ...ikincilDugme, color: CHROME_RENK.warn }}>Çıkar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <input ref={kameraRef} type="file" accept="image/*" capture="environment" onChange={dosyaSecildi} style={{ display: 'none' }} data-karne-kamera="" />
      <input ref={dosyaRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={dosyaSecildi} style={{ display: 'none' }} data-karne-dosya="" />

      {asama === 'bos' && (
        <div style={{ background: '#111C33', borderRadius: 12, padding: 14, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Aşı karnesi yükle</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Kağıt aşı karnesinin fotoğrafını çekin ya da PDF'ini seçin. Ayşe okur, siz satır satır kontrol edip tek seferde onaylarsınız — onaysız hiçbir satır kaydedilmez. Karne Kasa'da şifreli saklanır.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => kameraRef.current?.click()} style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>📷 Fotoğraf çek</button>
            <button type="button" onClick={() => dosyaRef.current?.click()} style={ikincilDugme}>Dosya seç (fotoğraf / PDF)</button>
          </div>
        </div>
      )}

      {(asama === 'yukleniyor' || asama === 'okunuyor') && (
        <div style={{ background: '#111C33', borderRadius: 12, padding: 14, fontSize: 13, color: CHROME_RENK.muted }}>
          {asama === 'yukleniyor' ? 'Karne Kasa\'ya yükleniyor…' : 'Ayşe karneyi okuyor… (el yazısı ve soluk kaşeler biraz sürebilir)'}
        </div>
      )}

      {hata && <div role="alert" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 12px', fontSize: 13, marginTop: 8 }}>{hata}</div>}

      {(asama === 'onay' || asama === 'kaydediliyor') && okuma && (
        <div data-karne-onay="" style={{ background: '#111C33', borderRadius: 12, padding: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Karneden okunanlar — hekim onayı bekliyor</div>
            <Rozet ton={okuma.okunabilirlik === 'iyi' ? 'iyi' : okuma.okunabilirlik === 'kismi' ? 'uyari' : 'kirmizi'}>{OKUNABILIRLIK_AD[okuma.okunabilirlik]}</Rozet>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Taslaktır. Her satırı karneyle karşılaştırın; yanlış okunanı düzeltin, istemediğinizi çıkarın. Kaydedilenler “Karneden aktarıldı · hekim onaylı” olarak, bu klinikte uygulanan dozlardan ayrı görünür.</div>
          {okuma.kimlikUyarisi && <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', color: '#FDE68A', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{okuma.kimlikUyarisi}</div>}
          {!okuma.asiKarnesiMi && <div style={{ fontSize: 13, color: '#FDE68A' }}>Bu belge bir aşı karnesine benzemiyor. Aşıları elle girebilirsiniz.</div>}
          {okuma.not && <div style={{ fontSize: 12, color: '#94A3B8' }}>Okuma notu: {okuma.not}</div>}
          {!satirlar.length && <div style={{ fontSize: 13, color: '#94A3B8' }}>Aktarılacak satır kalmadı.</div>}

          {takvimSatirlari.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SB Ulusal Aşı Takvimi ({takvimSatirlari.length})</div>
              {takvimSatirlari.map(satirCiz)}
            </div>
          )}
          {disSatirlar.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Özel / takvim dışı aşılar ({disSatirlar.length})</div>
              {disSatirlar.map(satirCiz)}
            </div>
          )}

          {(bekleyen > 0 || adsiz > 0) && (
            <div style={{ fontSize: 12, color: CHROME_RENK.warn }}>
              {bekleyen > 0 && `${bekleyen} satır okunamadı — düzeltin, "böyle kalsın" deyin ya da çıkarın. `}
              {adsiz > 0 && `${adsiz} satırda aşı adı boş.`}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={hepsiniOnayla} disabled={asama === 'kaydediliyor' || !satirlar.length || bekleyen > 0 || adsiz > 0}
              style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, opacity: !satirlar.length || bekleyen > 0 || adsiz > 0 ? 0.5 : 1 }}>
              {asama === 'kaydediliyor' ? 'Kaydediliyor…' : `Hepsini onayla ve kaydet (${satirlar.length})`}
            </button>
            <button type="button" onClick={sifirla} disabled={asama === 'kaydediliyor'} style={ikincilDugme}>Vazgeç</button>
          </div>
          <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>Karne Kasa'da kalır; vazgeçerseniz aşı kaydı yazılmaz.</div>
        </div>
      )}
    </div>
  );
}
