'use client';
/**
 * ARACLAR-CILA-01 Faz 4 — Araçlar › Sık kullandıklarım / hızlı şablonlar (evrensel, her branş).
 *
 * Muayenehane hekimi aynı 20-30 tabloyu tekrar tekrar görür. Bu araç hekimin KENDİ yazdığı vizit
 * şablonlarını tutar: alışılmış tanı + reçete taslağı + kontrol aralığı, tek dokunuşla ön doldurulur
 * ve TAMAMEN düzenlenebilir. Sık kullanılanlar üste çıkar (kullanım sayacı).
 *
 * DOKTOR-IZOLASYON: şablonlar hekime özeldir; /api/doktor/araclar/sablonlarim her sorguyu
 * doctor_id = oturum sahibi ile daraltır — başka hekimin şablonu görünmez.
 * DOZ KİLİDİ: Notya hazır şablon, ilaç ya da doz ÖNERMEZ; boş başlar, içeriği hekim yazar.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { sablonSatirlari, sablonSirala, SABLON_SINIRLARI, type DoktorSablonu } from '@/lib/doktor/sablonlar';
import {
  aracStil, Alan, HastaSecici, Istatistik, Katlanir, KopyalaButonu,
  MuayeneFormunaEkle, Rozet, TaslakNotu, VURGU_TEAL,
} from '@/lib/doktor/aracUi';

const stil = aracStil(VURGU_TEAL);
const { kutu, etiket, kucuk, metin, satir, btn, ghost, input, hata: hataStil } = stil;

const BOS = { ad: '', tani: '', receteTaslagi: '', kontrolAraligi: '', notlar: '' };
type Taslak = typeof BOS;

export default function Sablonlarim() {
  const [liste, setListe] = useState<DoktorSablonu[] | null>(null);
  const [hata, setHata] = useState('');
  const [ara, setAra] = useState('');
  const [acik, setAcik] = useState<string | null>(null);
  const [taslak, setTaslak] = useState<Taslak>(BOS);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/araclar/sablonlarim', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Şablonlar yüklenemedi.'); setListe([]); return; }
      setListe(sablonSirala((j.sablonlar || []) as DoktorSablonu[]));
      if (j.tabloHazir === false) setHata(j.error || 'Şablon tablosu henüz hazır değil.');
    } catch { setHata('Şablonlar yüklenemedi — bağlantıyı kontrol edin.'); setListe([]); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);

  const kucukHarf = (s: string) => s.toLocaleLowerCase('tr-TR');
  const gorunen = (liste || []).filter((s) => !ara.trim() || kucukHarf(`${s.ad} ${s.tani || ''}`).includes(kucukHarf(ara.trim())));

  const formDoldur = (s: DoktorSablonu) => setTaslak({
    ad: s.ad, tani: s.tani || '', receteTaslagi: s.recete_taslagi || '',
    kontrolAraligi: s.kontrol_araligi || '', notlar: s.notlar || '',
  });

  const kaydet = async () => {
    if (!taslak.ad.trim() || kaydediyor) return;
    setKaydediyor(true); setMesaj('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/araclar/sablonlarim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(duzenlenen ? { id: duzenlenen } : {}), ...taslak }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMesaj(j.error || 'Kaydedilemedi.'); return; }
      setMesaj(duzenlenen ? 'Şablon güncellendi.' : 'Şablon kaydedildi.');
      setTaslak(BOS); setDuzenlenen(null);
      await yukle();
    } catch { setMesaj('Kaydedilemedi — bağlantıyı kontrol edin.'); }
    finally { setKaydediyor(false); }
  };

  const sil = async (id: string) => {
    setMesaj('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/araclar/sablonlarim?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json().catch(() => ({}));
      setMesaj(r.ok ? 'Şablon silindi.' : j.error || 'Silinemedi.');
      if (acik === id) setAcik(null);
      await yukle();
    } catch { setMesaj('Silinemedi — bağlantıyı kontrol edin.'); }
  };

  /** "Bu viziti şablondan doldur" — sayaç artar, şablon üste çıkar. İçerik değişmez. */
  const kullan = async (s: DoktorSablonu) => {
    setAcik(s.id);
    try {
      const t = await getAccessTokenAsync();
      await fetch('/api/doktor/araclar/sablonlarim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, kullanildi: true }),
      });
      await yukle();
    } catch { /* sayaç kritik değil — panel açık kalır */ }
  };

  const acikSablon = (liste || []).find((s) => s.id === acik) || null;
  const acikSatirlar = acikSablon ? sablonSatirlari(acikSablon) : [];

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Şablonlarım</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 12px' }}>
          <Istatistik deger={liste == null ? '—' : liste.length} etiket="kayıtlı şablon" ton={liste?.length ? 'iyi' : 'notr'} />
          <Istatistik deger={liste == null ? '—' : liste.reduce((t, s) => t + (s.kullanim_sayisi || 0), 0)} etiket="toplam kullanım" />
        </div>
        <div style={{ ...satir, marginTop: 0 }}>
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Şablon ara (ad ya da tanı)" aria-label="Şablon ara" style={{ ...input, flex: '1 1 220px', width: 'auto' }} />
        </div>
        {hata && <div style={{ ...hataStil, marginTop: 8 }}>{hata}</div>}
        {liste == null && <div style={{ ...kucuk, marginTop: 10 }}>Yükleniyor…</div>}
        {liste != null && !liste.length && !hata && (
          <div style={{ ...kucuk, marginTop: 10, fontSize: 14 }}>Henüz şablonunuz yok. Notya hazır şablon, ilaç ya da doz önermez — aşağıdan kendi şablonunuzu yazın; sık kullandıklarınız zamanla üste çıkar.</div>
        )}
        {liste != null && !!liste.length && !gorunen.length && <div style={{ ...kucuk, marginTop: 10 }}>Aramaya uyan şablon yok.</div>}
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {gorunen.map((s) => (
            <div key={s.id} style={{ border: `1px solid ${acik === s.id ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '10px 12px', background: 'rgba(0,0,0,0.14)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ ...metin, fontWeight: 700 }}>{s.ad}</div>
                  {s.tani && <div style={kucuk}>{s.tani}</div>}
                </div>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {s.kullanim_sayisi > 0 && <Rozet ton="iyi">{s.kullanim_sayisi} kez kullanıldı</Rozet>}
                  <button type="button" onClick={() => kullan(s)} style={btn}>Bu viziti şablondan doldur</button>
                </span>
              </div>
              {acik === s.id && (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                  {acikSatirlar.length
                    ? <div style={{ ...metin, whiteSpace: 'pre-wrap' }}>{acikSatirlar.join('\n')}</div>
                    : <div style={kucuk}>Bu şablonda içerik yok — düzenleyip doldurun.</div>}
                  <div style={satir}>
                    <KopyalaButonu metin={acikSatirlar.join('\n')} etiket="Şablonu kopyala" />
                    <button type="button" onClick={() => { setDuzenlenen(s.id); formDoldur(s); }} style={ghost}>Düzenle</button>
                    <button type="button" onClick={() => sil(s.id)} style={ghost}>Sil</button>
                  </div>
                  <MuayeneFormunaEkle hastaId={hasta.id} arac={`Şablon: ${s.ad}`} satirlar={acikSatirlar} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı)</div>
        <div style={kucuk}>Şablonu bugünkü muayene formuna eklemek için hasta seçin. Şablonun kendisi hastaya bağlı değildir.</div>
        <HastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
      </div>

      <div style={kutu}>
        <div style={etiket}>{duzenlenen ? 'Şablonu düzenle' : 'Yeni şablon'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Alan etiket="Şablon adı" ipucu="ör. “üst solunum yolu enfeksiyonu”">
            <input value={taslak.ad} onChange={(e) => setTaslak((p) => ({ ...p, ad: e.target.value }))} maxLength={SABLON_SINIRLARI.ad} placeholder="üst solunum yolu enfeksiyonu" aria-label="Şablon adı" style={input} />
          </Alan>
          <Alan etiket="Alışılmış tanı" ipucu="Hekimin kendi yazdığı metin.">
            <input value={taslak.tani} onChange={(e) => setTaslak((p) => ({ ...p, tani: e.target.value }))} maxLength={SABLON_SINIRLARI.tani} aria-label="Alışılmış tanı" style={input} />
          </Alan>
          <Alan etiket="Kontrol aralığı" ipucu="ör. “gerekirse 3 gün sonra”">
            <input value={taslak.kontrolAraligi} onChange={(e) => setTaslak((p) => ({ ...p, kontrolAraligi: e.target.value }))} maxLength={SABLON_SINIRLARI.kontrolAraligi} aria-label="Kontrol aralığı" style={input} />
          </Alan>
        </div>
        <div style={{ marginTop: 12 }}>
          <Alan etiket="Reçete taslağı" ipucu="Notya ilaç ya da doz önermez — bu alan tamamen sizin yazdığınızdır.">
            <textarea value={taslak.receteTaslagi} onChange={(e) => setTaslak((p) => ({ ...p, receteTaslagi: e.target.value }))} rows={4} maxLength={SABLON_SINIRLARI.receteTaslagi} aria-label="Reçete taslağı" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
        </div>
        <div style={{ marginTop: 12 }}>
          <Alan etiket="Not (isteğe bağlı)">
            <textarea value={taslak.notlar} onChange={(e) => setTaslak((p) => ({ ...p, notlar: e.target.value }))} rows={3} maxLength={SABLON_SINIRLARI.notlar} aria-label="Şablon notu" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
        </div>
        <div style={satir}>
          <button type="button" onClick={kaydet} disabled={!taslak.ad.trim() || kaydediyor} style={{ ...btn, opacity: taslak.ad.trim() && !kaydediyor ? 1 : 0.55, cursor: taslak.ad.trim() && !kaydediyor ? 'pointer' : 'not-allowed' }}>
            {kaydediyor ? 'Kaydediliyor…' : duzenlenen ? 'Değişiklikleri kaydet' : 'Şablonu kaydet'}
          </button>
          {duzenlenen && <button type="button" onClick={() => { setDuzenlenen(null); setTaslak(BOS); }} style={ghost}>Vazgeç</button>}
          {mesaj && <span style={{ fontSize: 13, color: /edilemedi|kontrol/.test(mesaj) ? '#FDE68A' : '#5EEAD4' }} aria-live="polite">{mesaj}</span>}
        </div>
        <Katlanir baslik="Şablonlar kime ait, ne içerir">
          <div style={kucuk}>Şablonlar yalnız size aittir; başka hekim göremez. İçerik tamamen sizin yazdığınız metindir — Notya hazır şablon, ilaç ya da doz önermez. Şablondan doldurulan her alan vizit sırasında serbestçe değiştirilebilir.</div>
        </Katlanir>
        <TaslakNotu>Şablon bir hatırlatmadır, reçete ya da tanı değildir; her vizitte içeriği hekim gözden geçirir. Nota yalnız “Bugünkü muayene formuna ekle”ye bastığınızda yazılır.</TaslakNotu>
      </div>
    </>
  );
}
