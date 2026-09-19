'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › Psikotrop izlem takvimi. Psikiyatri-only.
 * Hasta seçilirse /api/doktor/psikiyatri GET ile aktif ilaç + onaylı lab tarihlerinden izlem görevleri gelir;
 * hasta seçilmeden de kural kütüphanesi (hangi ilaç sınıfı → hangi tetkik, hangi aralık) okunabilir.
 * DOZ YOKTUR: titrasyon, kesme ve hedef aralık kararı hekimin.
 */
import React, { useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { psikStil, PsikHastaSecici, PsikKopyala, Istatistik, TaslakNotu } from './PsikAracKabugu';
import { PSIK_IZLEM_KURALLARI } from '../../engines/ilacIzlem';
import { HEKIM_KILIT_METNI } from '../../engines/psikiyatri';

type Gorev = { kod: string; ad: string; due: string; labs: string[]; ilac: string; kaynak: string };
type Veri = { izlem: Gorev[]; ilaclar: Array<{ id: string; ilac_adi: string; etken_madde: string | null }> };

export default function IlacIzlemAraci() {
  const [hastaId, setHastaId] = useState('');
  const [veri, setVeri] = useState<Veri | null>(null);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');
  const bugun = new Date().toISOString().slice(0, 10);

  const yukle = async (id: string) => {
    setVeri(null); setDurum(''); setHata('');
    if (!id) return;
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/psikiyatri?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Yüklenemedi'); return; }
      setVeri({ izlem: j.izlem || [], ilaclar: j.ilaclar || [] });
    } catch { setHata('Yüklenemedi'); }
  };

  const gorevAc = async () => {
    setDurum(''); setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/psikiyatri', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'ilac_izlem' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Açılamadı'); return; }
      setDurum(`${j.eklenen ?? 0} yeni görev açıldı (${j.sayi ?? 0} kural eşleşti).`);
    } catch { setHata('Açılamadı'); }
  };

  return (
    <>
      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Hasta</div>
        <PsikHastaSecici secili={hastaId} sec={(id) => { setHastaId(id); yukle(id); }} />
        {hata && <div style={{ ...psikStil.hata, marginTop: 8 }}>{hata}</div>}
      </div>

      {veri && (
        <div style={psikStil.kutu}>
          <div style={psikStil.etiket}>İzlem görevleri</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Istatistik deger={veri.izlem.length} etiket="Açılacak izlem görevi" ton={veri.izlem.length ? 'uyari' : 'iyi'} />
            <Istatistik deger={veri.izlem.filter((g) => g.due < bugun).length} etiket="Vadesi geçmiş" ton={veri.izlem.some((g) => g.due < bugun) ? 'kirmizi' : 'notr'} />
            <Istatistik deger={veri.ilaclar.length} etiket="Aktif psikotrop" />
          </div>
          {!veri.ilaclar.length && <div style={psikStil.kucuk}>Aktif psikotrop kaydı yok. Görevler hasta ilaç listesinden üretilir; Notya ilaç eklemez.</div>}
          {veri.izlem.map((g) => (
            <div key={g.kod} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ ...psikStil.metin, color: g.due < bugun ? '#FCA5A5' : '#EDF1F7' }}>{g.ad}</div>
              <div style={psikStil.kucuk}>{g.ilac} · vade {g.due}{g.labs.length ? ` · ${g.labs.join(', ')}` : ''}</div>
            </div>
          ))}
          {!veri.izlem.length && !!veri.ilaclar.length && <div style={psikStil.kucuk}>Bu ilaçlar için görev gerekmiyor veya tüm tetkikler periyot içinde.</div>}
          <div style={psikStil.satir}>
            <button type="button" style={psikStil.btn} onClick={gorevAc} disabled={!veri.izlem.length}>Görevleri hasta dosyasında aç</button>
          </div>
          {durum && <div style={{ ...psikStil.iyi, marginTop: 8 }}>{durum}</div>}
          <PsikKopyala metin={veri.izlem.map((g) => `${g.ad} — ${g.ilac} — vade ${g.due}`).join('\n')} etiket="İzlem planını kopyala" />
          <TaslakNotu>Sınıf düzeyi izlem önerisidir; tetkik istemi, aralık ve doz kararı hekimindir.</TaslakNotu>
        </div>
      )}

      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Kural kütüphanesi</div>
        <div style={psikStil.kucuk}>Sınıf düzeyi izlem: hangi tetkik, hangi aralık. Doz ve titrasyon yazılmaz.</div>
        {PSIK_IZLEM_KURALLARI.map((k) => (
          <div key={k.kod} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={psikStil.metin}>{k.ad}</div>
            <div style={psikStil.kucuk}>
              {k.labs.length ? `Tetkik: ${k.labs.join(', ')} · ` : ''}periyot {k.periyotAy} ay{k.baslangicGun ? ` · yeni başlangıçta ${k.baslangicGun}. gün` : ''}
            </div>
            <div style={psikStil.kucuk}>{k.dipnot}</div>
          </div>
        ))}
        <TaslakNotu>{HEKIM_KILIT_METNI}</TaslakNotu>
      </div>
    </>
  );
}
