'use client';
/**
 * NOTYA-BELGE-01 — /dashboard/doktor/hastalar/[id]/belgeler/[belgeId]
 * Media + "Asistana raporla" + taslak rapor + Motorlar chips + resmi tanı kilidi + Onayla (→ SOAP Objektif)
 * + Plan düzenle → Muayeneyi onayla (revizyon). Disclaimer strip always visible (locked).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import { getAccessTokenAsync, toolsShell, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji';
import { bransKurali, tierBMotorlari, SES_MODALITELERI } from '@/core/belgeler/router';
import { gorseliKimliksizlestir, sesiHazirla, type DeIdGorsel } from '@/core/belgeler/deid';
import { tierBCalistir, tarayiciYetenek } from '@/core/belgeler/tarayiciMotor';
import { UYARI_SERIDI } from '@/core/belgeler/yazar';
import type { BelgeRaporu, MotorCiktisi } from '@/core/belgeler/types';

type Doc = { id: string; fileName: string; fileType: string; fileSize: number; category: string | null; createdAt: string };
type Analiz = { id: string; durum: string; sonuc: BelgeRaporu | null; fusion: { fused: { kod: string; label_tr: string; p: number; sources: string[]; karsi: string[] }[]; capPct: number; acilNedenler: string[]; duzeltmeler: string[] } | null; motor_ciktilari: MotorCiktisi[]; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; note_id: string | null; onaylandi_at: string | null; olusturuldu: string; modality_final: string };

const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 4 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const bantRenk: Record<string, string> = { 'yüksek': '#2DD4BF', 'orta': '#FBBF24', 'düşük': '#94A3B8' };

export default function BelgeAnalizPage() {
  const { id: patientId, belgeId } = useParams<{ id: string; belgeId: string }>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [analiz, setAnaliz] = useState<Analiz | null>(null);
  const [bransKey, setBransKey] = useState('genel');
  const [modalite, setModalite] = useState<Modalite | ''>('');
  const [klinikNot, setKlinikNot] = useState('');
  const [kimlikYok, setKimlikYok] = useState(false);
  const [durum, setDurum] = useState<'hazir' | 'hazirlaniyor' | 'motorlar' | 'yaziyor' | 'hata'>('hazir');
  const [mesaj, setMesaj] = useState('');
  const [taniTaslak, setTaniTaslak] = useState('');
  const [ozetTaslak, setOzetTaslak] = useState('');
  const [plan, setPlan] = useState('');
  const [planAcik, setPlanAcik] = useState(false);
  const [uyusmazlik, setUyusmazlik] = useState<string | null>(null);

  const kural = bransKurali(bransKey);
  const yetenek = useMemo(() => (typeof window !== 'undefined' ? tarayiciYetenek() : null), []);
  const sesMi = SES_MODALITELERI.includes((modalite || 'serbest') as Modalite);
  const pdfMi = doc?.fileType === 'application/pdf';
  const rapor = analiz?.sonuc || null;

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const [dr, ar] = await Promise.all([
      fetch(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`/api/doktor/belgeler/analiz?documentId=${encodeURIComponent(belgeId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ]);
    if (dr.ok) { const j = await dr.json(); const list: Doc[] = j.documents || j.docs || j || []; setDoc(Array.isArray(list) ? list.find((d) => d.id === belgeId) || null : null); }
    if (ar.ok) { const j = await ar.json(); setAnaliz(j.analiz || null); setBransKey(j.bransKey || 'genel'); if (j.analiz?.hekim_tanisi?.length) setTaniTaslak(j.analiz.hekim_tanisi.map((t: { ad: string; icd10?: string | null }) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join('\n')); setOzetTaslak(j.analiz?.hekim_ozet || j.analiz?.sonuc?.ozet || ''); }
  }, [patientId, belgeId]);
  useEffect(() => { yukle(); }, [yukle]);

  // default modality guess from file type / category
  useEffect(() => {
    if (!doc || modalite) return;
    if (doc.fileType.startsWith('audio/')) setModalite(kural.modaliteler.includes('ses_kalp') && doc.category === 'cihaz-kaydi' ? 'ses_kalp' : kural.modaliteler.includes('ses_akciger') ? 'ses_akciger' : 'ses_kalp');
    else if (doc.fileType === 'application/pdf') setModalite('pdf_rapor');
    else setModalite(kural.modaliteler.find((m) => !m.startsWith('ses') && m !== 'pdf_rapor') || 'serbest');
  }, [doc, kural, modalite]);

  const raporla = async () => {
    if (!doc || !modalite) return;
    if (!pdfMi && !kimlikYok) { setMesaj('Göndermeden önce görüntüde hasta adı / TC / tarih bulunmadığını onaylayın (KVKK).'); return; }
    setMesaj(''); setUyusmazlik(null); setDurum('hazirlaniyor');
    const token = await getAccessTokenAsync();
    try {
      let deid: DeIdGorsel | null = null; let sesMetrikleri: Record<string, number | string> | null = null; let tierB: MotorCiktisi[] = [];
      if (!pdfMi) {
        const r = await fetch(`/api/doktor/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error('Belge indirilemedi');
        const blob = await r.blob();
        if (sesMi) {
          const s = await sesiHazirla(blob); deid = s.spektrogram; sesMetrikleri = { ...s.metrikler, ...(s.kaliteDusuk ? { kalite_notu: s.neden || '' } : {}) };
        } else {
          deid = await gorseliKimliksizlestir(blob);
        }
        setDurum('motorlar');
        const istenen = tierBMotorlari(bransKey, modalite as Modalite);
        if (istenen.length && !sesMi) { try { tierB = await tierBCalistir(istenen, modalite as Modalite, { bitmap: await createImageBitmap(blob) }); } catch { tierB = []; } }
      }
      setDurum('yaziyor');
      const r = await fetch('/api/doktor/belgeler/analiz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: doc.id, modalityFinal: modalite, klinikNot, deid: deid ? { mime: deid.mime, base64: deid.base64, hash: deid.hash } : null, sesMetrikleri, tierB, fitzpatrickBilinmiyor: true }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Taslak üretilemedi');
      if (j.uyusmazlik) setUyusmazlik(`Asistan görüntüyü "${j.analiz?.sonuc?.modalite}" olarak gördü; siz "${j.secilenModalite}" seçtiniz. Modaliteyi kontrol edip yeniden raporlayın veya taslağı bu haliyle değerlendirin.`);
      setDurum('hazir'); await yukle();
    } catch (e) { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Hata'); }
  };

  const kaydet = async (alan: 'ozet' | 'hekim_tanisi') => {
    if (!analiz) return;
    const token = await getAccessTokenAsync();
    const sonraki = alan === 'ozet' ? ozetTaslak : taniTaslak.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^(.*?)\s*\(([A-Z]\d{2}(?:\.\d{1,2})?)\)\s*$/); return m ? { ad: m[1].trim(), icd10: m[2] } : { ad: s, icd10: null }; });
    const r = await fetch('/api/doktor/belgeler/analiz', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, alan, sonraki }) });
    const j = await r.json().catch(() => ({}));
    setMesaj(r.ok ? (alan === 'ozet' ? 'Özet kaydedildi.' : 'Resmi tanı kilitlendi.') : j.error || 'Kaydedilemedi');
    await yukle();
  };

  const onayla = async (adim: 'onayla' | 'muayene_onayla') => {
    if (!analiz) return;
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/belgeler/analiz/onayla', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, adim, plan: adim === 'muayene_onayla' ? plan : undefined }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMesaj(j.error || 'Onaylanamadı'); return; }
    setMesaj(adim === 'onayla' ? 'Rapor muayenenin Objektif bölümüne eklendi.' : 'Muayene onaylandı; plan revizyonu kaydedildi.');
    setPlanAcik(false); await yukle();
  };

  const taniOnerisiEkle = (ad: string, icd10?: string | null) => setTaniTaslak((t) => (t ? t + '\n' : '') + (icd10 ? `${ad} (${icd10})` : ad));

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 12px' }}>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', color: '#FBBF24', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{UYARI_SERIDI}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
          {/* LEFT: media + controls */}
          <div>
            <div style={{ ...toolsCard, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#EDF1F7' }}>{doc?.fileName || 'Belge'}</div>
                <a href={`/dashboard/doktor/hastalar/${patientId}`} style={{ color: '#2DD4BF', fontSize: 12 }}>← Hasta dosyası</a>
              </div>
              {doc && <div style={{ marginTop: 8 }}><DocumentViewer documentId={doc.id} fileName={doc.fileName} fileType={doc.fileType} onClose={() => {}} /></div>}
            </div>
            <div style={toolsCard}>
              <div style={etiket}>Asistana raporla · {kural.ad}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={modalite} onChange={(e) => setModalite(e.target.value as Modalite)} style={{ ...toolsInput, width: 'auto' }}>
                  {kural.modaliteler.map((m) => <option key={m} value={m} style={{ color: '#000' }}>{MODALITE_TR[m]}</option>)}
                  <option value="serbest" style={{ color: '#000' }}>Serbest görüntü (yalnızca tarif)</option>
                </select>
                <input value={klinikNot} onChange={(e) => setKlinikNot(e.target.value)} placeholder="Klinik not (isteğe bağlı): 3 gündür ateş, öksürük" style={{ ...toolsInput, flex: 1, minWidth: 220 }} />
              </div>
              {!pdfMi && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, fontSize: 12, color: '#8FA0B5', cursor: 'pointer' }}>
                  <input type="checkbox" checked={kimlikYok} onChange={(e) => setKimlikYok(e.target.checked)} />
                  <span>Görüntüde hasta adı, TC, doğum tarihi gibi kimlik bilgisi yok. (Fotoğraf üst verisi cihazınızda temizlenir; yalnız kimliksiz kopya gönderilir.)</span>
                </label>
              )}
              {yetenek && <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{yetenek.not} Tarayıcı motorları: {tierBMotorlari(bransKey, (modalite || 'serbest') as Modalite).join(', ') || 'bu modalite için yok (yalnız asistan)'}.</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={raporla} disabled={durum !== 'hazir' && durum !== 'hata' || !modalite} style={{ ...btn, opacity: durum === 'hazir' || durum === 'hata' ? 1 : 0.6 }}>
                  {durum === 'hazirlaniyor' ? 'Kimliksizleştiriliyor…' : durum === 'motorlar' ? 'Motorlar çalışıyor…' : durum === 'yaziyor' ? 'Asistan yazıyor…' : analiz ? 'Yeniden raporla' : 'Asistana raporla'}
                </button>
                {mesaj && <span style={{ fontSize: 12, color: durum === 'hata' ? '#F87171' : '#2DD4BF' }}>{mesaj}</span>}
              </div>
            </div>
          </div>

          {/* RIGHT: report */}
          <div>
            {!rapor && <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 13 }}>Henüz taslak yok. Modaliteyi seçin ve "Asistana raporla" deyin.</div>}
            {rapor && analiz && (
              <>
                {analiz.durum === 'kalite_dusuk' && <div style={{ ...toolsCard, borderColor: 'rgba(248,113,113,0.4)', color: '#F87171', fontSize: 13, marginBottom: 10 }}>Kalite düşük — tanı önerisi üretilmedi. {rapor.sinirlar[0] || ''}</div>}
                {uyusmazlik && <div style={{ ...toolsCard, borderColor: 'rgba(251,191,36,0.4)', color: '#FBBF24', fontSize: 13, marginBottom: 10 }}>{uyusmazlik}</div>}
                {rapor.acil_bayrak && <div style={{ ...toolsCard, background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.5)', color: '#F87171', fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚠ ACİL BAYRAK — {analiz.fusion?.acilNedenler?.join(', ') || 'kırmızı bayrak bulgu'}</div>}

                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Özet <span style={{ fontWeight: 400, color: '#64748B' }}>· {rapor.modalite} · kalite {rapor.kalite} · düzenlenebilir</span></div>
                  <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={5} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} disabled={analiz.durum === 'muayene_onaylandi'} />
                  <div style={{ marginTop: 6 }}><button type="button" onClick={() => kaydet('ozet')} style={btnGhost} disabled={analiz.durum === 'muayene_onaylandi'}>Özeti kaydet</button></div>
                </div>

                {rapor.bulgular.length > 0 && (
                  <div style={{ ...toolsCard, marginBottom: 10 }}>
                    <div style={etiket}>Bulgular</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#EDF1F7' }}>{rapor.bulgular.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </div>
                )}

                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Olası tanılar <span style={{ fontWeight: 400, color: '#64748B' }}>· güven üst sınırı %{analiz.fusion?.capPct ?? 70}</span></div>
                  {rapor.tanilar.length === 0 && <div style={{ fontSize: 12, color: '#64748B' }}>Tanı önerisi yok.</div>}
                  {rapor.tanilar.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ minWidth: 64, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: bantRenk[t.guven_bant] }}>%{t.guven_pct}</div><div style={{ fontSize: 10, color: bantRenk[t.guven_bant] }}>{t.guven_bant}</div></div>
                      <div style={{ flex: 1, fontSize: 13, color: '#EDF1F7' }}>
                        <div style={{ fontWeight: 700 }}>{t.ad} {t.icd10 && <span style={{ color: '#8FA0B5', fontWeight: 400 }}>({t.icd10})</span>}</div>
                        {t.destek.length > 0 && <div style={{ fontSize: 11, color: '#2DD4BF' }}>destek: {t.destek.join(', ')}</div>}
                        {t.karsi.length > 0 && <div style={{ fontSize: 11, color: '#F87171' }}>karşı: {t.karsi.join(', ')}</div>}
                      </div>
                      <button type="button" onClick={() => taniOnerisiEkle(t.ad, t.icd10)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }} disabled={analiz.durum === 'muayene_onaylandi'}>Resmi tanıya al</button>
                    </div>
                  ))}
                </div>

                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Resmi tanı (hekim) <span style={{ fontWeight: 400, color: '#64748B' }}>· her satır bir tanı; ICD-10 parantez içinde</span></div>
                  <textarea value={taniTaslak} onChange={(e) => setTaniTaslak(e.target.value)} rows={3} placeholder="Örn. Pnömoni (J18.9)" style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} disabled={analiz.durum === 'muayene_onaylandi'} />
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => kaydet('hekim_tanisi')} style={btnGhost} disabled={analiz.durum === 'muayene_onaylandi'}>Resmi tanıyı kilitle</button>
                    <button type="button" onClick={() => onayla('onayla')} style={btn} disabled={!analiz.hekim_tanisi?.length || analiz.durum === 'kalite_dusuk' || analiz.durum === 'onaylandi' || analiz.durum === 'muayene_onaylandi'} title="Son muayenenin Objektif bölümüne yazar">Onayla → Muayene Objektif</button>
                    {(analiz.durum === 'onaylandi') && <button type="button" onClick={() => setPlanAcik(!planAcik)} style={btnGhost}>Plan düzenle</button>}
                  </div>
                  {planAcik && analiz.durum === 'onaylandi' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={etiket}>Plan (ilaç / doz / konsült)</div>
                      <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder="Mevcut planı korumak için boş bırakın; değişiklik için tam planı yazın." style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                      <div style={{ marginTop: 6 }}><button type="button" onClick={() => onayla('muayene_onayla')} style={btn}>Muayeneyi onayla</button></div>
                    </div>
                  )}
                  {analiz.durum === 'muayene_onaylandi' && <div style={{ marginTop: 6, fontSize: 12, color: '#2DD4BF' }}>Muayene onaylandı — rapor kilitli. {analiz.note_id && <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: '#2DD4BF' }}>Notu aç →</a>}</div>}
                  {analiz.durum === 'onaylandi' && analiz.note_id && <div style={{ marginTop: 6, fontSize: 12, color: '#2DD4BF' }}>Objektif'e eklendi. <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: '#2DD4BF' }}>Notu aç →</a></div>}
                </div>

                {rapor.oneri && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 13, color: '#EDF1F7' }}><div style={etiket}>Öneri</div>{rapor.oneri}</div>}
                {rapor.sinirlar.length > 0 && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 12, color: '#8FA0B5' }}><div style={etiket}>Sınırlar</div><ul style={{ margin: 0, paddingLeft: 18 }}>{rapor.sinirlar.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}

                <div style={{ ...toolsCard, fontSize: 12 }}>
                  <div style={etiket}>Motorlar</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(analiz.motor_ciktilari || []).map((m, i) => (
                      <span key={i} style={{ border: `1px solid ${m.hata ? 'rgba(248,113,113,0.5)' : m.dogrulanmis ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius: 999, padding: '3px 9px', color: m.hata ? '#F87171' : '#EDF1F7' }} title={m.hata || (m.dogrulanmis ? 'doğrulanmış motor' : 'genel değerlendirme')}>
                        {m.motor} · {m.tier}{m.dogrulanmis ? ' ✓' : ''}{m.hata ? ' ✗' : ''}
                      </span>
                    ))}
                  </div>
                  {analiz.fusion?.fused?.length ? (
                    <div style={{ marginTop: 8, color: '#8FA0B5' }}>
                      {analiz.fusion.fused.map((f) => <div key={f.kod}>{f.label_tr} <span style={{ color: '#EDF1F7' }}>p={f.p}</span> · destek {f.sources.join(', ') || '—'}{f.karsi.length ? ` · karşı ${f.karsi.join(', ')}` : ''}</div>)}
                    </div>
                  ) : null}
                  {analiz.fusion?.duzeltmeler?.length ? <div style={{ marginTop: 6, color: '#64748B' }}>Sistem düzeltmeleri: {analiz.fusion.duzeltmeler.join('; ')}</div> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
