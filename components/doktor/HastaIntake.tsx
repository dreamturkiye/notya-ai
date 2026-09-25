'use client';

/**
 * NOTYA-INTAKE-01 — hasta dosyasındaki Hasta Bilgi Formu sekmesi: form gönder, doldurulmuş
 * yanıtları görüntüle, "incelendi" işaretle. Doktor randevu öncesi bu sekmeden formu okuyup
 * muayeneye hazır gelir — istenen tam olarak buydu ("prior to the visit to save time").
 *
 * NOTYA-YENI-GORUNUM-04 (Kaan, 2026-09-25): "Abi bu sayfa da siyah kalmış" — bu bileşen orijinal
 * redesign denetiminin kapsamı dışında kalmış (components/doktor/HastaAsilar.tsx ve
 * app/asistan/page.tsx ile aynı sebep), baştan sona hâlâ tam koyu lacivertti (#111C33/#0B1424,
 * translucent-white dolgular). Kremsi/çam paletine çevrildi; işlevsel mantığın tamamı korundu.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { BRANS_ETIKETLERI, BRANS_SORULARI } from '@/lib/intake/bransSorulari';
import { bransAnahtari } from '@/lib/specialties/kapsam';
import { coreBolumlerIcin } from '@/lib/intake/coreAlanlar';
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import GonderDugmesi from '@/components/doktor/iletisim/GonderDugmesi';

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
  gonderildi: { label: 'Gönderildi, bekleniyor', color: '#B4832F', bg: 'rgba(180,131,47,0.14)' },
  dolduruldu: { label: 'Dolduruldu — incelenmedi', color: '#0F9B8E', bg: 'rgba(15,155,142,0.12)' },
  incelendi: { label: 'İncelendi', color: '#3F7D4A', bg: 'rgba(63,125,74,0.14)' },
};

// Kaan (2026-09-10): doktor inceleme görünümünde ham alan kimliği (tcKimlik, dogumTarihi) değil,
// formdaki Türkçe etiket ve dd.mm.yyyy tarih gösterilir.
function etiketHaritasi(brans: string): Record<string, string> {
  const h: Record<string, string> = {};
  for (const b of coreBolumlerIcin(brans)) for (const a of b.alanlar) h[a.id] = a.etiket;
  const bs = (BRANS_SORULARI as Record<string, { alanlar: { id: string; etiket: string; tur?: string }[] }>)[brans];
  if (bs) for (const a of bs.alanlar) if (a.tur !== 'bolum-basligi') h[a.id] = a.etiket;
  return h;
}
function degerGoster(v: unknown): string {
  // NOTYA-INTAKE-08: isteğe bağlı alanlar (örn. sigorta) artık boş gönderilebiliyor — boş dize
  // de en az null kadar "boş". Eskiden yalnız null/undefined '—' oluyordu, boş dize ise satırı
  // sessizce bomboş bırakıp render hatası gibi görünüyordu.
  if (Array.isArray(v)) return v.filter((x) => String(x ?? '').trim()).join(', ') || '—';
  const t = String(v ?? '').trim();
  if (!t) return '—';
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : t;
}

export default function HastaIntake({ patientId }: { patientId: string }) {
  const [formlar, setFormlar] = useState<IntakeFormOzet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [gonderPaneliAcik, setGonderPaneliAcik] = useState(false);
  const [secilenBrans, setSecilenBrans] = useState<string>('genel');
  // Kaan (2026-09-10): varsayılan branş = doktorun kendi branşı (pediatristte Pediatri), 'Genel' değil
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        const sp = String(j?.data?.specialty || '');
        // BRANS-ALAN-SIZMASI / KD-ISIMLENDIRME-01: gerçek KD profilleri 'kadin-dogum' taşır (BRANS_ETIKETLERI anahtarı değil) — tek çözücüyle kanonik anahtara çöz
        const k = bransAnahtari(sp);
        if (k && Object.prototype.hasOwnProperty.call(BRANS_ETIKETLERI, k)) setSecilenBrans(k);
      } catch { /* varsayılan genel kalır */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [olusturulanLink, setOlusturulanLink] = useState<{ link: string } | null>(null);
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
        body: JSON.stringify({ patientId, brans: secilenBrans }),
      });
      const d = await r.json();
      if (!r.ok) { setHata(d.error || 'Form oluşturulamadı.'); return; }
      setOlusturulanLink({ link: d.link });
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
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasta Bilgi Formu</div>
        <button
          type="button"
          onClick={() => { setOlusturulanLink(null); setGonderPaneliAcik((v) => !v); }}
          style={{ background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          + Form Gönder
        </button>
      </div>

      {hata && <div style={{ background: '#FBEAE3', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{hata}</div>}

      {gonderPaneliAcik && (
        <div style={{ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px)', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>Branş</label>
              <select
                value={secilenBrans}
                onChange={(e) => setSecilenBrans(e.target.value)}
                style={{ width: '100%', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
              >
                <option value="genel">Genel (branşsız)</option>
                {branslar.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
          {!olusturulanLink && (
            <button
              type="button"
              onClick={formGonder}
              disabled={gonderiliyor}
              style={{ background: CHROME_RENK.pine, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              {gonderiliyor ? 'Hazırlanıyor…' : 'Formu hazırla'}
            </button>
          )}

          {olusturulanLink && (
            <div style={{ marginTop: 4 }}>
              {/* NOTYA-ILETISIM-01: the link goes out from this device's own WhatsApp / e-mail (no Twilio). */}
              <GonderDugmesi acikBaslat tur="bilgi_formu" patientId={patientId} link={olusturulanLink.link} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <input readOnly aria-label="Form bağlantısı" value={olusturulanLink.link} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.muted, borderRadius: 8, padding: '6px 10px', fontSize: 12 }} />
                <button type="button" onClick={linkiKopyala} style={{ background: 'none', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.pine, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  {kopyalandi ? 'Kopyalandı ✓' : 'Bağlantıyı kopyala'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {yukleniyor && <p style={{ color: CHROME_RENK.muted }}>Yükleniyor…</p>}
      {!yukleniyor && formlar.length === 0 && <p style={{ color: CHROME_RENK.muted }}>Henüz form gönderilmedi.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {formlar.map((f) => {
          const durumBilgi = DURUM_ETIKET[f.durum] || DURUM_ETIKET.gonderildi;
          const bransEtiket = BRANS_ETIKETLERI[f.brans as SpecialtyKey] || 'Genel';
          return (
            <div key={f.id}>
              <div
                onClick={() => (f.durum === 'gonderildi' ? null : formuAc(acikFormId === f.id ? '' : f.id))}
                style={{
                  background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 14,
                  cursor: f.durum === 'gonderildi' ? 'default' : 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: CHROME_RENK.ink }}>{bransEtiket}</div>
                  <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>
                    Gönderildi: {new Date(f.gonderildi_at).toLocaleDateString('tr-TR')}
                    {f.dolduruldu_at ? ` · Dolduruldu: ${new Date(f.dolduruldu_at).toLocaleDateString('tr-TR')}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg }}>
                  {durumBilgi.label}
                </span>
              </div>

              {acikFormId === f.id && (
                <div style={{ background: '#FBF8F2', borderRadius: 12, padding: 14, marginTop: 4, border: `1px solid ${CHROME_RENK.border}` }}>
                  {detayYukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</p>}
                  {acikFormDetay && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                        {(() => { const etk = etiketHaritasi(f.brans); return Object.entries(acikFormDetay.yanitlar).map(([k, v]) => (
                          <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', columnGap: 16, alignItems: 'start', fontSize: 13, borderBottom: `1px solid ${CHROME_RENK.border}`, padding: '6px 0' }}>
                            <span style={{ color: CHROME_RENK.muted }}>{etk[k] || k}</span>
                            <span style={{ color: CHROME_RENK.ink, wordBreak: 'break-word' }}>{degerGoster(v)}</span>
                          </div>
                        )); })()}
                      </div>
                      {f.durum === 'dolduruldu' && (
                        <button
                          type="button"
                          onClick={() => incelendiIsaretle(f.id)}
                          style={{ marginTop: 12, background: '#3F7D4A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
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
