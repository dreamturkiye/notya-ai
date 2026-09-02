'use client';

/**
 * NOTYA-INTAKE-01 — hasta dosyasındaki Hasta Bilgi Formu sekmesi: form gönder, doldurulmuş
 * yanıtları görüntüle, "incelendi" işaretle. Doktor randevu öncesi bu sekmeden formu okuyup
 * muayeneye hazır gelir — istenen tam olarak buydu ("prior to the visit to save time").
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari';
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs';

interface IntakeFormOzet {
  id: string;
  brans: string;
  durum: 'gonderildi' | 'dolduruldu' | 'incelendi';
  gonderim_kanali: string;
  gonderildi_at: string;
  dolduruldu_at: string | null;
  incelendi_at: string | null;
}

const DURUM_ETIKET: Record<string, { label: string; color: string; bg: string }> = {
  gonderildi: { label: 'Gönderildi, bekleniyor', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  dolduruldu: { label: 'Dolduruldu — incelenmedi', color: '#0F9B8E', bg: 'rgba(15,155,142,0.15)' },
  incelendi: { label: 'İncelendi', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
};

export default function HastaIntake({ patientId }: { patientId: string }) {
  const [formlar, setFormlar] = useState<IntakeFormOzet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [gonderPaneliAcik, setGonderPaneliAcik] = useState(false);
  const [secilenBrans, setSecilenBrans] = useState<string>('genel');
  const [secilenKanal, setSecilenKanal] = useState<'whatsapp' | 'elden'>('whatsapp');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [olusturulanLink, setOlusturulanLink] = useState<{ link: string; whatsappGonderildi: boolean } | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);

  const [acikFormId, setAcikFormId] = useState<string | null>(null);
  const [acikFormDetay, setAcikFormDetay] = useState<{ yanitlar: Record<string, unknown>; durum: string } | null>(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);

  const token = ensureDoctorAccessToken;

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch(`/api/doktor/intake-formlari?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) { setHata('Formlar alınamadı.'); return; }
      const d = await r.json();
      setFormlar(d.formlar || []);
    } catch {
      setHata('Formlar alınamadı.');
    } finally {
      setYukleniyor(false);
    }
  }, [patientId]);

  useEffect(() => { yukle(); }, [yukle]);

  async function formGonder() {
    setGonderiliyor(true);
    setHata('');
    setOlusturulanLink(null);
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch('/api/doktor/intake-formlari', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, brans: secilenBrans, kanal: secilenKanal }),
      });
      const d = await r.json();
      if (!r.ok) { setHata(d.error || 'Form oluşturulamadı.'); return; }
      setOlusturulanLink({ link: d.link, whatsappGonderildi: d.whatsappGonderildi });
      await yukle();
    } catch {
      setHata('Form oluşturulamadı.');
    } finally {
      setGonderiliyor(false);
    }
  }

  async function formuAc(formId: string) {
    setAcikFormId(formId);
    setAcikFormDetay(null);
    setDetayYukleniyor(true);
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch(`/api/doktor/intake-formlari/${formId}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      if (r.ok) setAcikFormDetay({ yanitlar: d.form.yanitlar, durum: d.form.durum });
    } catch { /* ignore */ }
    finally { setDetayYukleniyor(false); }
  }

  async function incelendiIsaretle(formId: string) {
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/intake-formlari/${formId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${t}` } });
      await yukle();
      setAcikFormId(null);
    } catch { /* ignore */ }
  }

  function linkiKopyala() {
    if (!olusturulanLink) return;
    navigator.clipboard?.writeText(olusturulanLink.link).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    });
  }

  const branslar = Object.entries(BRANS_ETIKETLERI) as [SpecialtyKey, string][];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasta Bilgi Formu</div>
        <button
          type="button"
          onClick={() => setGonderPaneliAcik((v) => !v)}
          style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          + Form Gönder
        </button>
      </div>

      {hata && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{hata}</div>}

      {gonderPaneliAcik && (
        <div style={{ background: '#111C33', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Branş</label>
              <select
                value={secilenBrans}
                onChange={(e) => setSecilenBrans(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
              >
                <option value="genel">Genel (branşsız)</option>
                {branslar.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Gönderim Şekli</label>
              <select
                value={secilenKanal}
                onChange={(e) => setSecilenKanal(e.target.value as 'whatsapp' | 'elden')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
              >
                <option value="whatsapp">WhatsApp (otomatik gönder)</option>
                <option value="elden">Sadece link oluştur (elden paylaş)</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={formGonder}
            disabled={gonderiliyor}
            style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            {gonderiliyor ? 'Oluşturuluyor…' : 'Formu Oluştur'}
          </button>

          {olusturulanLink && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(15,155,142,0.1)', borderRadius: 8 }}>
              {olusturulanLink.whatsappGonderildi && <p style={{ fontSize: 12, color: '#0F9B8E', marginBottom: 8 }}>WhatsApp ile gönderildi ✓</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={olusturulanLink.link} onFocus={(e) => e.target.select()} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12 }} />
                <button type="button" onClick={linkiKopyala} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                  {kopyalandi ? 'Kopyalandı ✓' : 'Kopyala'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
      {!yukleniyor && formlar.length === 0 && <p style={{ color: '#94A3B8' }}>Henüz form gönderilmedi.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {formlar.map((f) => {
          const durumBilgi = DURUM_ETIKET[f.durum] || DURUM_ETIKET.gonderildi;
          const bransEtiket = BRANS_ETIKETLERI[f.brans as SpecialtyKey] || 'Genel';
          return (
            <div key={f.id}>
              <div
                onClick={() => (f.durum === 'gonderildi' ? null : formuAc(acikFormId === f.id ? '' : f.id))}
                style={{
                  background: '#111C33', borderRadius: 12, padding: 14,
                  cursor: f.durum === 'gonderildi' ? 'default' : 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{bransEtiket}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    Gönderildi: {new Date(f.gonderildi_at).toLocaleDateString('tr-TR')}
                    {f.dolduruldu_at ? ` · Dolduruldu: ${new Date(f.dolduruldu_at).toLocaleDateString('tr-TR')}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg }}>
                  {durumBilgi.label}
                </span>
              </div>

              {acikFormId === f.id && (
                <div style={{ background: '#0B1424', borderRadius: 12, padding: 14, marginTop: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
                  {detayYukleniyor && <p style={{ color: '#94A3B8', fontSize: 13 }}>Yükleniyor…</p>}
                  {acikFormDetay && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                        {Object.entries(acikFormDetay.yanitlar).map(([k, v]) => (
                          <div key={k} style={{ fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                            <span style={{ color: '#64748B' }}>{k}:</span>{' '}
                            <span style={{ color: 'white' }}>{Array.isArray(v) ? v.join(', ') : String(v ?? '—')}</span>
                          </div>
                        ))}
                      </div>
                      {f.durum === 'dolduruldu' && (
                        <button
                          type="button"
                          onClick={() => incelendiIsaretle(f.id)}
                          style={{ marginTop: 12, background: '#22C55E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
                        >
                          İncelendi Olarak İşaretle
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
