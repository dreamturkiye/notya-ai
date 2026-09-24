'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — manşet takvim kartları, durum rozeti, kayan antijen listesi, taslak rozeti.
 * DERM-EXCEPTIONAL-01 — Araçlar › Yama D2/D4. Dermatoloji-only (BRANS_DOKTOR_ARACLARI).
 * Uygulama tarihi → plannedReads D2/D4 ve patchStatus durumu; Avrupa baz serisi seçilebilir liste.
 * Hesap kaydedilmez; kalıcı kür kaydı hasta dosyasının Deri sekmesindedir.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { plannedReads, patchStatus, EUROPEAN_BASELINE } from '../../engines/patch-calendar';
import { DERM_PATCH_STATUS, dermLabel } from '../labels';
import { dermStil, Istatistik, Katlanir, MuayeneFormunaEkle, Rozet, TaslakNotu, DermHastaSecici, KopyalaButonu } from './DermAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, metin, satir, btn, ghost, kaydir } = dermStil;
const bugun = () => new Date().toISOString().slice(0, 10);

const DURUM_TON: Record<string, 'iyi' | 'uyari' | 'kirmizi' | 'notr'> = {
  not_yet: 'notr',
  open_d2: 'uyari',
  open_d4: 'uyari',
  overdue_d2: 'kirmizi',
  overdue_d4: 'kirmizi',
  done: 'iyi',
};

export default function YamaAraci() {
  const [uygulama, setUygulama] = useState(bugun());
  const [okumaD2, setOkumaD2] = useState('');
  const [okumaD4, setOkumaD4] = useState('');
  const [uygulanan, setUygulanan] = useState<string[]>([]);
  const [pozitif, setPozitif] = useState<string[]>([]);
  const [ara, setAra] = useState('');
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const plan = useMemo(() => plannedReads(uygulama || bugun()), [uygulama]);
  const durum = useMemo(() => patchStatus(
    { series: 'european_baseline' as const, appliedAt: uygulama || bugun(), readD2: okumaD2 || null, readD4: okumaD4 || null, photoIds: [], positives: pozitif },
    bugun(),
  ), [uygulama, okumaD2, okumaD4, pozitif]);

  const kucukHarf = (s: string) => s.toLocaleLowerCase('tr-TR');
  const gorunen = EUROPEAN_BASELINE.filter((a) => !ara.trim() || kucukHarf(`${a.ad} ${a.kaynak}`).includes(kucukHarf(ara.trim())));
  const ad = (kod: string) => EUROPEAN_BASELINE.find((a) => a.kod === kod)?.ad || kod;

  const cevir = (liste: string[], set: (x: string[]) => void, kod: string) =>
    set(liste.includes(kod) ? liste.filter((x) => x !== kod) : [...liste, kod]);

  const kopyaMetni = [
    `Yama testi — uygulama ${uygulama} · D2 ${plan.d2} · D4 ${plan.d4}`,
    `Durum: ${dermLabel(DERM_PATCH_STATUS, durum)}${okumaD2 ? ` · D2 okundu ${okumaD2}` : ''}${okumaD4 ? ` · D4 okundu ${okumaD4}` : ''}`,
    `Uygulanan antijen: ${uygulanan.length ? uygulanan.map(ad).join(', ') : 'Avrupa baz serisi (seçim yapılmadı)'}`,
    `Pozitif: ${pozitif.length ? pozitif.map(ad).join(', ') : 'yok'}`,
    'Okuma zamanlaması ve klinik ilgi değerlendirmesi hekimindir.',
  ].join('\n');

  const notSatirlari = [
    `Yama testi — D0 ${uygulama} · D2 okuma ${plan.d2} · D4 okuma ${plan.d4}`,
    `Durum: ${dermLabel(DERM_PATCH_STATUS, durum)}${okumaD2 ? ` · D2 okundu ${okumaD2}` : ''}${okumaD4 ? ` · D4 okundu ${okumaD4}` : ''}`,
    `Uygulanan antijen: ${uygulanan.length ? uygulanan.map(ad).join(', ') : 'Avrupa baz serisi (seçim yapılmadı)'}`,
    `Pozitif: ${pozitif.length ? pozitif.map(ad).join(', ') : 'yok'}`,
  ];

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Uygulama ve okuma</div>
        <div style={satir}>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>D0 uygulama
            <input type="date" aria-label="Uygulama tarihi" value={uygulama} onChange={(e) => setUygulama(e.target.value || bugun())} style={{ ...dermStil.input, width: 175 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>D2 okundu
            <input type="date" aria-label="D2 okuma tarihi" value={okumaD2} onChange={(e) => setOkumaD2(e.target.value)} style={{ ...dermStil.input, width: 175 }} />
          </label>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>D4 okundu
            <input type="date" aria-label="D4 okuma tarihi" value={okumaD4} onChange={(e) => setOkumaD4(e.target.value)} style={{ ...dermStil.input, width: 175 }} />
          </label>
        </div>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(244,114,182,0.35)' }} aria-live="polite">
        <div style={etiket}>Okuma takvimi</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <Istatistik deger={uygulama} etiket="D0 uygulama" />
          <Istatistik deger={plan.d2} etiket="D2 okuma" ton={okumaD2 ? 'iyi' : 'notr'} />
          <Istatistik deger={plan.d4} etiket="D4 okuma" ton={okumaD4 ? 'iyi' : 'notr'} />
        </div>
        <div style={satir}><span style={metin}>Durum:</span> <Rozet ton={DURUM_TON[durum] || 'notr'}>{dermLabel(DERM_PATCH_STATUS, durum)}</Rozet></div>
        <Katlanir baslik="Geç okuma (D7)">
          <div style={kucuk}>Geç okuma gerekebilen antijenler için hekim ek randevu planlar; bu araç D2 / D4 takvimini hesaplar.</div>
        </Katlanir>
      </div>

      <div style={kutu}>
        <div style={etiket}>Avrupa baz serisi ({EUROPEAN_BASELINE.length} antijen)</div>
        <div style={kucuk}>Uygulananları işaretleyin; okuma sonrası pozitifleri ayrıca seçin. Konsantrasyon ve vehikül seri üreticisinindir.</div>
        <div style={satir}>
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Antijen ara" aria-label="Antijen ara" style={{ ...dermStil.input, flex: '1 1 220px', width: 'auto' }} />
          <button type="button" onClick={() => setUygulanan(EUROPEAN_BASELINE.map((a) => a.kod))} style={ghost}>Tüm seriyi işaretle</button>
          <button type="button" onClick={() => { setUygulanan([]); setPozitif([]); }} style={ghost}>Temizle</button>
        </div>
        <div style={{ ...kaydir, marginTop: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {gorunen.map((a, i) => (
            <div key={a.kod} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '10px 12px', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 260px', minHeight: 44, cursor: 'pointer' }}>
                <input type="checkbox" checked={uygulanan.includes(a.kod)} onChange={() => cevir(uygulanan, setUygulanan, a.kod)} style={{ width: 20, height: 20 }} />
                <span>
                  <span style={metin}>{a.ad}</span>
                  <span style={{ ...kucuk, display: 'block' }}>{a.kaynak}</span>
                </span>
              </label>
              <button
                type="button"
                aria-pressed={pozitif.includes(a.kod)}
                onClick={() => cevir(pozitif, setPozitif, a.kod)}
                style={{
                  minHeight: 40, borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: pozitif.includes(a.kod) ? 'rgba(248,113,113,0.18)' : 'transparent',
                  color: pozitif.includes(a.kod) ? CHROME_RENK.warn : CHROME_RENK.muted,
                  border: `1px solid ${pozitif.includes(a.kod) ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.16)'}`,
                }}
              >Pozitif</button>
            </div>
          ))}
          {!gorunen.length && <div style={{ padding: '24px 14px', textAlign: 'center', ...kucuk }}>Aramaya uyan antijen yok.</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <Istatistik deger={uygulanan.length} etiket="antijen işaretli" />
          <Istatistik deger={pozitif.length} etiket="pozitif" ton={pozitif.length ? 'kirmizi' : 'notr'} />
        </div>
        <div style={satir}><KopyalaButonu metin={kopyaMetni} etiket="Takvimi ve seriyi kopyala" /></div>
        <MuayeneFormunaEkle hastaId={hasta.id} arac="Yama testi D2 / D4" satirlar={notSatirlari} />
        <TaslakNotu>Okuma zamanlaması, klinik ilgi değerlendirmesi ve pozitifliğin anlamı hekimindir. Hesap kaydedilmez, nota otomatik yazılmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Kür kaydı, D2/D4 fotoğrafları ve pozitifler hasta dosyasının Deri sekmesinde saklanır.</div>
        <DermHastaSecici secili={hasta.id} sec={(id, ad2) => setHasta({ id, ad: ad2 })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'deri')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Deri) →</a></div>}
      </div>
    </>
  );
}
