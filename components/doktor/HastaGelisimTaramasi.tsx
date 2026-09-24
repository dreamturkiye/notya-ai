'use client';
/**
 * NOTYA-GELISIM-01 (Kaan 2026-09-14) — hasta dosyasındaki Gelişim Taraması sekmesi. "Denver II"
 * değil — T.C. Sağlık Bakanlığı GİDR'ye dayalı, sabit skor üretmez. AI, doktorun işaretlediği
 * yapıyor/yapmıyor paternini SOAP-stili bir yoruma ve sevk önerisine çevirir.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { GELISIM_ALAN_BASLIK, GIDR_3_YAS_SONRASI_REHBERLIK, type GelisimYasBasamagi } from '@/lib/clinical/gelisimTaramasi';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

interface GecmisTarama { id: string; ay_yas: number; yas_basamak_etiket: string; ai_yorum: string | null; sevk_onerisi: boolean; created_at: string }

export default function HastaGelisimTaramasi({ patientId }: { patientId: string }) {
  const [basamak, setBasamak] = useState<GelisimYasBasamagi | null>(null);
  const [mevcutYasAy, setMevcutYasAy] = useState<number | null>(null);
  const [yanitlar, setYanitlar] = useState<Record<string, boolean | null>>({});
  const [gecmis, setGecmis] = useState<GecmisTarama[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [degerlendiriliyor, setDegerlendiriliyor] = useState(false);
  const [sonuc, setSonuc] = useState<{ yorum: string; sevkOnerisi: boolean } | null>(null);
  const [notEklendi, setNotEklendi] = useState<string | null>(null);
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/gelisim-taramasi?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      setBasamak(d.basamak || null);
      setMevcutYasAy(d.mevcutYasAy ?? null);
      setGecmis(d.taramalar || []);
      if (d.basamak) {
        const bas: Record<string, boolean | null> = {};
        d.basamak.maddeler.forEach((m: { alan: string; madde: string }) => { bas[`${m.alan}::${m.madde}`] = null; });
        setYanitlar(bas);
      }
    } catch { setHata('Yüklenemedi.'); } finally { setYukleniyor(false); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  const hepsiYanitlandi = basamak ? basamak.maddeler.every((m) => yanitlar[`${m.alan}::${m.madde}`] !== null && yanitlar[`${m.alan}::${m.madde}`] !== undefined) : false;

  const degerlendir = async () => {
    if (!basamak) return;
    setDegerlendiriliyor(true); setHata(''); setNotEklendi(null);
    try {
      const t = await ensureDoctorAccessToken();
      const yanitDizisi = basamak.maddeler.map((m) => ({ alan: m.alan, madde: m.madde, yapiyor: !!yanitlar[`${m.alan}::${m.madde}`] }));
      const r = await fetch('/api/doktor/gelisim-taramasi', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ patientId, yanitlar: yanitDizisi }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Değerlendirilemedi');
      setSonuc({ yorum: d.yorum, sevkOnerisi: d.sevkOnerisi });
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Değerlendirilemedi');
    } finally {
      setDegerlendiriliyor(false);
    }
  };

  const muayeneFormunaEkle = async () => {
    if (!basamak || !sonuc) return;
    setDegerlendiriliyor(true);
    try {
      const t = await ensureDoctorAccessToken();
      const yanitDizisi = basamak.maddeler.map((m) => ({ alan: m.alan, madde: m.madde, yapiyor: !!yanitlar[`${m.alan}::${m.madde}`] }));
      const r = await fetch('/api/doktor/gelisim-taramasi', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ patientId, yanitlar: yanitDizisi, muayeneFormunaEkle: true }),
      });
      const d = await r.json();
      setNotEklendi(d.notEkleme?.eklendi ? 'Bugünkü muayene formuna eklendi.' : (d.notEkleme?.sebep || 'Nota eklenemedi.'));
      setEklenenNot(eklenenNotId(d)); // NOTYA-MUAYENEYE-DON-01
      yukle();
    } catch { setNotEklendi('Nota eklenemedi.'); setEklenenNot(null); } finally { setDegerlendiriliyor(false); }
  };

  const kutu: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 16 };

  if (yukleniyor) return <div style={{ padding: 20, color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>
        Gelişim Taraması — T.C. Sağlık Bakanlığı Gelişimi İzleme ve Değerlendirme Rehberi (GİDR) esaslı. Sabit bir skor üretmez; her maddeyi aileden açık uçlu sorup işaretleyin.
      </div>

      {!basamak && mevcutYasAy !== null && mevcutYasAy > 24 && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>{GIDR_3_YAS_SONRASI_REHBERLIK.baslik}</div>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 8 }}>Bu yaş için itemli bir kontrol listesi yok; kaynak rehber destekleyici gözlem önerir:</div>
          {GIDR_3_YAS_SONRASI_REHBERLIK.ozet.map((s, i) => <div key={i} style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 4 }}>• {s}</div>)}
        </div>
      )}
      {!basamak && mevcutYasAy === null && (
        <div style={{ padding: 20, color: CHROME_RENK.muted, fontSize: 13 }}>Doğum tarihi kayıtlı değil — yaşa uygun basamak belirlenemiyor.</div>
      )}

      {basamak && (
        <>
          <div style={{ fontSize: 13, color: '#0F9B8E', fontWeight: 700 }}>{basamak.etiket} basamağı ({mevcutYasAy !== null ? `${Math.round(mevcutYasAy)} aylık` : ''})</div>
          <div style={kutu}>
            {(['iletisim', 'alici-dil', 'hareket-kaba', 'hareket-ince', 'iliski', 'oyun-kendine-bakim'] as const).map((alan) => {
              const maddeler = basamak.maddeler.filter((m) => m.alan === alan);
              if (!maddeler.length) return null;
              return (
                <div key={alan} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 6 }}>{GELISIM_ALAN_BASLIK[alan]}</div>
                  {maddeler.map((m) => {
                    const key = `${m.alan}::${m.madde}`;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: CHROME_RENK.ink, fontSize: 13.5, flex: 1 }}>{m.madde}</span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {(['Yapıyor', 'Yapmıyor'] as const).map((etiket, i) => {
                            const deger = i === 0;
                            const secili = yanitlar[key] === deger;
                            return (
                              <button key={etiket} type="button" onClick={() => setYanitlar((y) => ({ ...y, [key]: deger }))}
                                style={{ background: secili ? '#0F9B8E' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (secili ? '#0F9B8E' : 'rgba(255,255,255,0.12)'), color: secili ? 'white' : '#9FB3C8', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                                {etiket}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <button type="button" disabled={!hepsiYanitlandi || degerlendiriliyor} onClick={degerlendir}
            style={{ background: hepsiYanitlandi ? '#0F9B8E' : 'rgba(255,255,255,0.08)', border: 'none', color: hepsiYanitlandi ? 'white' : CHROME_RENK.muted, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: hepsiYanitlandi ? 'pointer' : 'default' }}>
            {degerlendiriliyor ? 'Değerlendiriliyor…' : 'Testi Değerlendir'}
          </button>

          {sonuc && (
            <div style={{ ...kutu, borderColor: (sonuc.sevkOnerisi ? '#F59E0B' : '#22C55E') + '55', background: (sonuc.sevkOnerisi ? '#F59E0B' : '#22C55E') + '14' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: sonuc.sevkOnerisi ? '#F59E0B' : '#22C55E', marginBottom: 6 }}>{sonuc.sevkOnerisi ? 'İleri değerlendirme önerilir' : 'Yaşına uygun gelişim'}</div>
              <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>{sonuc.yorum}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" disabled={degerlendiriliyor} onClick={muayeneFormunaEkle} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Bugünkü Muayene Formuna Ekle</button>
              </div>
              {notEklendi && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: notEklendi.includes('eklendi') ? '#22C55E' : '#F59E0B' }}>{notEklendi}</span>
                  <MuayeneFormunaDon notId={eklenenNot} />
                </div>
              )}
            </div>
          )}
          {hata && <div style={{ fontSize: 12, color: '#F87171' }}>{hata}</div>}
        </>
      )}

      {gecmis.length > 0 && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: CHROME_RENK.ink }}>Geçmiş Taramalar</div>
          {gecmis.map((g) => (
            <div key={g.id} style={{ padding: '8px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: CHROME_RENK.muted }}>{new Date(g.created_at).toLocaleDateString('tr-TR')} · {g.yas_basamak_etiket}</span>
                <span style={{ color: g.sevk_onerisi ? '#F59E0B' : '#22C55E' }}>{g.sevk_onerisi ? 'İleri değerlendirme önerildi' : 'Uygun'}</span>
              </div>
              {g.ai_yorum && <div style={{ color: CHROME_RENK.muted, fontSize: 12, marginTop: 4 }}>{g.ai_yorum}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
