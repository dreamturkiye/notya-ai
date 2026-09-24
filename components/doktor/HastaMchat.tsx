'use client';
/**
 * NOTYA-MCHAT-01 (Kaan 2026-09-14) — hasta dosyasındaki M-CHAT-R/F sekmesi, Aşılar sekmesiyle
 * aynı desende. Doktor 20 soruyu aileye sorup Evet/Hayır işaretler; "Testi Değerlendir" anında
 * (deterministik, resmi algoritma) sonucu gösterir; "Bugünkü muayene formuna ekle" ile bugünkü
 * nota tek satır ekler.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { MCHAT_R_SORULARI, mchatPuanla, type MchatSonuc } from '@/lib/clinical/mchatR';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

interface GecmisTest { id: string; toplam_puan: number; risk_seviyesi: string; sonuc_metni: string; created_at: string }

const RISK_RENK: Record<string, string> = { dusuk: '#22C55E', orta: '#F59E0B', yuksek: '#EF4444' }

export default function HastaMchat({ patientId }: { patientId: string }) {
  const [cevaplar, setCevaplar] = useState<Record<number, boolean | null>>(() => {
    const baslangic: Record<number, boolean | null> = {};
    MCHAT_R_SORULARI.forEach((s) => { baslangic[s.no] = null; });
    return baslangic;
  });
  const [sonuc, setSonuc] = useState<MchatSonuc | null>(null);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [notEklendi, setNotEklendi] = useState<string | null>(null);
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);
  const [gecmis, setGecmis] = useState<GecmisTest[]>([]);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/mchat?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      setGecmis(d.testler || []);
    } catch { /* geçmiş kritik değil */ }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  const hepsiYanitlandi = MCHAT_R_SORULARI.every((s) => cevaplar[s.no] !== null);

  const degerlendir = () => {
    const cevaplarNo: Record<number, boolean> = {};
    MCHAT_R_SORULARI.forEach((s) => { cevaplarNo[s.no] = !!cevaplar[s.no]; });
    setSonuc(mchatPuanla(cevaplarNo));
    setNotEklendi(null);
    setEklenenNot(null);
  };

  const kaydetVeEkle = async (muayeneFormunaEkle: boolean) => {
    setKaydediyor(true); setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      const cevaplarStr: Record<string, boolean> = {};
      MCHAT_R_SORULARI.forEach((s) => { cevaplarStr[String(s.no)] = !!cevaplar[s.no]; });
      const r = await fetch('/api/doktor/mchat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ patientId, cevaplar: cevaplarStr, muayeneFormunaEkle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Kaydedilemedi');
      if (muayeneFormunaEkle) {
        setNotEklendi(d.notEkleme?.eklendi ? 'Bugünkü muayene formuna eklendi.' : (d.notEkleme?.sebep || 'Nota eklenemedi.'));
        setEklenenNot(eklenenNotId(d)); // NOTYA-MUAYENEYE-DON-01 — onayın yanındaki dönüş bağlantısı
      }
      yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setKaydediyor(false);
    }
  };

  const kutu: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 16 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>
        M-CHAT-R/F — Değiştirilmiş Erken Çocukluk Dönemi Otizm Tarama Ölçeği (resmi Türkçe çeviri, Robins/Fein/Barton 2009 · mchatscreen.com). Aileye sorup işaretleyin.
      </div>

      <div style={kutu}>
        {MCHAT_R_SORULARI.map((s) => (
          <div key={s.no} style={{ padding: '10px 0', borderBottom: s.no < 20 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: CHROME_RENK.ink, fontSize: 13.5 }}>{s.no}. {s.metin}</span>
                {s.ornek && <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>{s.ornek}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {(['Evet', 'Hayır'] as const).map((etiket, i) => {
                  const deger = i === 0;
                  const secili = cevaplar[s.no] === deger;
                  return (
                    <button key={etiket} type="button" onClick={() => setCevaplar((c) => ({ ...c, [s.no]: deger }))}
                      style={{ background: secili ? '#0F9B8E' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (secili ? '#0F9B8E' : 'rgba(255,255,255,0.12)'), color: secili ? 'white' : '#9FB3C8', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {etiket}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" disabled={!hepsiYanitlandi} onClick={degerlendir}
        style={{ background: hepsiYanitlandi ? '#0F9B8E' : 'rgba(255,255,255,0.08)', border: 'none', color: hepsiYanitlandi ? 'white' : CHROME_RENK.muted, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: hepsiYanitlandi ? 'pointer' : 'default' }}>
        Testi Değerlendir {!hepsiYanitlandi && `(${MCHAT_R_SORULARI.filter((s) => cevaplar[s.no] === null).length} soru kaldı)`}
      </button>

      {sonuc && (
        <div style={{ ...kutu, borderColor: RISK_RENK[sonuc.riskSeviyesi] + '55', background: RISK_RENK[sonuc.riskSeviyesi] + '14' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: RISK_RENK[sonuc.riskSeviyesi] }}>{sonuc.sonucMetni}</div>
          <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 4 }}>Toplam puan: {sonuc.toplamPuan}/20 — {sonuc.riskEtiket}</div>
          {sonuc.riskSeviyesi === 'orta' && (
            <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 8 }}>Not: 3-7 puan resmi araçta önce İzlem (Follow-Up) görüşmesi gerektirir; bu uygulama şimdilik doğrudan sevk önerisi veriyor.</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" disabled={kaydediyor} onClick={() => kaydetVeEkle(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: CHROME_RENK.ink, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Sadece Kaydet</button>
            <button type="button" disabled={kaydediyor} onClick={() => kaydetVeEkle(true)} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{kaydediyor ? 'Kaydediliyor…' : 'Bugünkü Muayene Formuna Ekle'}</button>
          </div>
          {notEklendi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: notEklendi.includes('eklendi') ? '#22C55E' : '#F59E0B' }}>{notEklendi}</span>
              <MuayeneFormunaDon notId={eklenenNot} />
            </div>
          )}
          {hata && <div style={{ fontSize: 12, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        </div>
      )}

      {gecmis.length > 0 && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: CHROME_RENK.ink }}>Geçmiş Uygulamalar</div>
          {gecmis.map((g) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: CHROME_RENK.muted }}>{new Date(g.created_at).toLocaleDateString('tr-TR')}</span>
              <span style={{ color: RISK_RENK[g.risk_seviyesi] }}>{g.toplam_puan}/20 — {g.sonuc_metni}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
