'use client';
/**
 * PREMATURE-MODUL — Araçlar › Düzeltilmiş yaş ve büyüme. Doğum tarihi + doğumdaki gestasyon + ölçüm → kronolojik ve düzeltilmiş yaş,
 * postmenstrüel yaş, tahmini term tarihi ve persentilin ikisiyle yan yana karşılaştırması (Neyzi / WHO).
 * Kural (lib/clinical/prematur/duzeltilmisYas.ts): doğumda < 37 hafta → kronolojik 24 aya kadar düzeltilmiş yaş; term bebek düzeltilmez;
 * aşılar kronolojik yaşa göre yapılır. Karar desteğidir; yorum hekimindir. Prematüre eğrisi (Fenton / Olsen) bu sürümde yok.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { pediStil, Alan, Segment, TaslakNotu, KopyalaButonu, Rozet, PediHastaSecici, usePediHasta, useUrlHasta } from './PediAracKabugu';
import { cmCoz, kiloCoz, tarihCoz, tarihGoster, yasMetni, gebelikHaftasiCoz, tr } from '../../engines/girdi';
import { olcumSatirlari, persentilKisa, PARAM_AD, REFERANS_AD, type Referans } from '../../engines/buyume';
import { duzeltilmisYas, duzeltilmisYasMetni, gestasyonGunu, gestasyonMetni, postmenstrualMetni, VARSAYILAN_DUZELTME_KURALI } from '@/lib/clinical/prematur/duzeltilmisYas';
import type { BuyumeParametre, Cinsiyet } from '@/lib/clinical/buyumeEgrisi';

const { kutu, etiket, kucuk, input, uyari } = pediStil;
const bugun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

export default function DuzeltilmisYasAraci() {
  const [hastaId, setHastaId] = useState('');
  useUrlHasta(setHastaId);
  const { ozet, hata } = usePediHasta(hastaId);
  const [dogum, setDogum] = useState('');
  const [gest, setGest] = useState('');
  const [tarih, setTarih] = useState(() => tarihGoster(bugun()));
  const [cins, setCins] = useState<Cinsiyet | ''>('');
  const [ref, setRef] = useState<Referans>('neyzi');
  const [kilo, setKilo] = useState('');
  const [boy, setBoy] = useState('');
  const [bas, setBas] = useState('');

  useEffect(() => {
    if (!ozet) return;
    if (ozet.dogumIso) setDogum(tarihGoster(ozet.dogumIso));
    if (ozet.cinsiyet) setCins(ozet.cinsiyet);
    const gh = ozet.dogumBilgisi?.gebelikHaftasi;
    setGest(gh != null ? String(gh).replace('.', ',') : '');
  }, [ozet]);

  const dogumIso = tarihCoz(dogum), tarihIso = tarihCoz(tarih);
  const gestGun = gestasyonGunu(gebelikHaftasiCoz(gest));
  const yas = useMemo(() => (dogumIso && tarihIso ? duzeltilmisYas({ dogumIso, gestasyonGun: gestGun, tarihIso }) : null), [dogumIso, tarihIso, gestGun]);
  const olcum = { tarih: tarihIso || '', kilo: kiloCoz(kilo), boy: cmCoz(boy), basCevresi: cmCoz(bas) };
  const var_ = !!(olcum.kilo || olcum.boy || olcum.basCevresi);
  const [kron, duz] = useMemo(() => {
    if (!dogumIso || !tarihIso || !cins || !var_) return [null, null] as const;
    return [olcumSatirlari(ref, cins, dogumIso, [olcum])[0] || null, olcumSatirlari(ref, cins, dogumIso, [olcum], gestGun)[0] || null] as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogumIso, tarihIso, cins, ref, kilo, boy, bas, gestGun]);

  const metin = yas && yas.gecerli && yas.prematur
    ? `Doğum ${dogum}, gestasyon ${gestasyonMetni(gestGun)} hf. ${tarih} tarihinde kronolojik yaş ${yasMetni(dogumIso!, tarihIso!)}; ${yas.buyume.duzeltilmis ? `düzeltilmiş yaş ${duzeltilmisYasMetni(yas, tarihIso!)}` : 'düzeltme uygulanmıyor (24 ay ve üzeri)'}; postmenstrüel ${postmenstrualMetni(yas)} hf. Aşılar kronolojik yaşa göredir.`
    : '';

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Bebek</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        {hata && <div style={{ ...pediStil.hata, marginTop: 6 }}>{hata}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 14 }}>
          <Alan etiket="Doğum tarihi"><input value={dogum} onChange={(e) => setDogum(e.target.value)} placeholder="12.03.2026" aria-label="Doğum tarihi" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Doğumdaki gebelik haftası" ipucu={gest && gestGun == null ? 'Okunamadı — ör. 29+3' : gestGun != null ? `${gestasyonMetni(gestGun)} hafta` : 'ör. 29+3'}><input value={gest} onChange={(e) => setGest(e.target.value)} placeholder="29+3" aria-label="Doğumdaki gebelik haftası" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Değerlendirme tarihi"><input value={tarih} onChange={(e) => setTarih(e.target.value)} aria-label="Değerlendirme tarihi" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Cinsiyet"><Segment etiket="Cinsiyet" deger={cins} set={setCins} secenekler={[['female', 'Kız'], ['male', 'Erkek']]} /></Alan>
        </div>
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Yaş</div>
        {!yas ? <div style={{ ...kucuk, fontSize: 14 }}>Doğum tarihini ve doğumdaki gebelik haftasını girin.</div>
          : !yas.gecerli ? <div style={uyari}>{yas.durumKodu === 'gestasyon-yok' ? 'Doğumdaki gebelik haftası girilmedi — düzeltme yapılamaz.' : yas.durumKodu === 'gestasyon-gecersiz' ? 'Gebelik haftası 20–45 aralığında olmalı.' : 'Tarihler okunamadı veya değerlendirme tarihi doğumdan önce.'}</div>
          : !yas.prematur ? <div style={{ fontSize: 15 }}>Doğumda ≥ 37 hafta: düzeltme uygulanmaz. Yaş {yasMetni(dogumIso!, tarihIso!)}.</div>
          : (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 15 }}>Kronolojik yaş: <b>{yasMetni(dogumIso!, tarihIso!)}</b></div>
              {yas.buyume.duzeltilmis
                ? <div style={{ fontSize: 18 }}>Düzeltilmiş yaş: <b>{duzeltilmisYasMetni(yas, tarihIso!)}</b> <Rozet ton="uyari">{yas.erkenGun} gün erken doğum</Rozet></div>
                : <div style={{ fontSize: 15 }}>Düzeltme kronolojik {VARSAYILAN_DUZELTME_KURALI.buyumeUstAy}. aydan sonra uygulanmaz.</div>}
              <div style={kucuk}>Postmenstrüel yaş {postmenstrualMetni(yas)} (hafta+gün) · tahmini term tarihi {tarihGoster(yas.terimTarihiIso)}</div>
              <div style={kucuk}>Büyüme ve gelişim değerlendirmesi düzeltilmiş yaşla yapılır; aşılar kronolojik yaşa göre uygulanır.</div>
              {yas.buyume.termOncesi && <div style={uyari}>Bebek henüz tahmini term tarihine ulaşmadı: Neyzi ve WHO eğrileri bu yaşta uygulanamaz — prematüre büyüme eğrisi (Fenton / Olsen) bu sürümde bulunmuyor.</div>}
              {metin && <KopyalaButonu metin={metin} etiket="Yaş satırını kopyala" />}
            </div>
          )}
      </div>

      <div style={kutu}>
        <div style={{ ...etiket, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><span>Büyüme — kronolojik ve düzeltilmiş yaşla</span>
          <Segment etiket="Referans" deger={ref} set={setRef} secenekler={[['neyzi', 'Neyzi'], ['who', 'WHO']]} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <Alan etiket="Kilo (kg)"><input value={kilo} onChange={(e) => setKilo(e.target.value)} placeholder="5,2" aria-label="Kilo" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Boy (cm)"><input value={boy} onChange={(e) => setBoy(e.target.value)} placeholder="58" aria-label="Boy" inputMode="decimal" style={input} /></Alan>
          <Alan etiket="Baş çevresi (cm)"><input value={bas} onChange={(e) => setBas(e.target.value)} placeholder="40" aria-label="Baş çevresi" inputMode="decimal" style={input} /></Alan>
        </div>
        {kron && duz ? (
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {(['kilo', 'boy', 'basCevresi'] as BuyumeParametre[]).filter((p) => kron.deger[p] != null).map((p) => (
              <div key={p} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'baseline', fontSize: 15 }}>
                <b style={{ minWidth: 110 }}>{PARAM_AD[p]} {tr(kron.deger[p]!, 1)}</b>
                <span>düzeltilmiş yaşla: <b>{duz.sonuc[p] ? `${persentilKisa(duz.sonuc[p]!.persentil)}. persentil` : duz.termOncesi ? 'uygulanamaz' : 'kapsam dışı'}</b></span>
                {duz.duzeltilmis && <span style={kucuk}>kronolojik yaşla {kron.sonuc[p] ? `${persentilKisa(kron.sonuc[p]!.persentil)}. persentil` : '—'} (prematüre için yanıltıcı)</span>}
              </div>
            ))}
            <div style={kucuk}>{REFERANS_AD[ref]} · yorum hekimindir; bu sayılar tanı değildir.</div>
          </div>
        ) : <div style={{ ...kucuk, marginTop: 10 }}>Doğum tarihi, cinsiyet ve en az bir ölçüm girin.</div>}
      </div>

      <TaslakNotu>
        Düzeltilmiş yaş = kronolojik yaş − (40 hafta − doğumdaki gestasyon). Doğumda &lt; 37 hafta olanlar için kronolojik 24 aya kadar uygulanır.
        Kaynak: AAP Fetüs ve Yenidoğan Komitesi yaş terminolojisi (Engle, Pediatrics 2004;114:1362); CDC/WHO büyüme eğrisi kullanım rehberi (MMWR 2010;59 RR-9). Karar desteğidir.
      </TaslakNotu>
    </>
  );
}
