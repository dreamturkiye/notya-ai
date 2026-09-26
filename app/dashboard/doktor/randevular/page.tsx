'use client';

/**
 * NOTYA-RANDEVU-02 — takvim, Google Takvim'in ay görünümü gibi bir ızgara.
 *
 * Önceki sürüm yalnızca gün listesiydi (bkz. git geçmişi, NOTYA-RANDEVU-01). O görünüm hâlâ
 * burada — Google Takvim'de de bir güne tıklayınca ayrıntı listesi açılır, tam olarak aynı
 * ilişki. Ay ızgarası "bu ay nasıl görünüyor" sorusuna, gün listesi "bugün ne var, ne
 * yapacağım" sorusuna cevap verir; biri diğerinin yerini tutmuyor.
 *
 * Ay verisini TEK istekte çekiyoruz (ızgarada görünen 42 günün tamamı, önceki/sonraki aydan
 * taşan günler dahil) ve istemci tarafında tarihe göre grupluyoruz — 42 gün için 42 istek atmak
 * hem yavaş hem gereksiz, randevu hacmi (bir doktor için ayda birkaç yüz kayıt) tek sorguya rahat
 * sığar.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { resmiTatilMi } from '@/lib/randevu/resmiTatiller';
import { randevuAksiyonlari, REAKTIVASYON_DURUMU } from '@/lib/randevu/randevuDurum';
import { trAramaNormalize, trIcerir } from '@/lib/utils/turkceArama';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import RandevuMesaji from '@/components/doktor/iletisim/RandevuMesaji';
import HazirMesajlar from '@/components/doktor/iletisim/HazirMesajlar';
import GonderDugmesi from '@/components/doktor/iletisim/GonderDugmesi';
import { cepTelefonuDogrula, TELEFON_MESAJ } from '@/lib/iletisim/cepTelefonu';

export const dynamic = 'force-dynamic';

interface Randevu {
  id: string;
  baslangic: string;
  bitis: string;
  tur: string;
  durum: string;
  notlar: string | null;
  hastaDurumu: string | null;
  iptalNedeni: string | null;
  patientId: string | null;
  hastaAdi: string;
  hastaTelefon: string;
  hastaEmail?: string;
  kayitliHasta: boolean;
}

interface HastaAramaSonucu {
  id: string;
  name: string;
  /** Yalnız aynı adlı iki hastayı ayırt etmek için gösterilir (patients.created_at). */
  kayitTarihi?: string | null;
}

/** Açık listede aynı anda kaç sonuç gösterilir — gerisi "yazmaya devam edin" ile daraltılır. */
const HASTA_SONUC_LIMITI = 10;

const TUR_ETIKET: Record<string, string> = {
  ilk_muayene: 'İlk Muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
  diger: 'Diğer',
};

/** NOTYA-RANDEVU-11: tür bazlı renk kodlaması — referans tasarımlardaki (Google Takvim /
 * Business Calendar 2 tarzı) "güçlü renkler, temiz çizgiler" yaklaşımı. Ay ızgarasındaki
 * chip'in DOLGUSU türün rengi, SOL KENARLIĞI durumun rengi — tek bakışta iki boyut. */
const TUR_RENK: Record<string, string> = {
  ilk_muayene: '#8B5CF6',
  muayene: CHROME_RENK.pine,
  kontrol: '#4A5C8A',
  diger: CHROME_RENK.muted,
};

const DURUM_ETIKET: Record<string, { label: string; color: string; bg: string }> = {
  planlandi: { label: 'Planlandı', color: CHROME_RENK.pine, bg: '#E4F3F1' },
  onaylandi: { label: 'Onaylandı', color: '#2E6E4E', bg: '#E4F3EA' },
  tamamlandi: { label: 'Tamamlandı', color: CHROME_RENK.muted, bg: '#F0EDE5' },
  iptal: { label: 'İptal', color: '#a45b3e', bg: '#FBEAE3' },
  gelmedi: { label: 'Gelmedi', color: '#B4832F', bg: '#FBF3DE' },
};

const HAFTA_GUNLERI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function gunBaslangicBitis(tarih: Date): { baslangic: string; bitis: string } {
  const b = new Date(yerelGunAnahtari(tarih) + 'T00:00:00+03:00');
  const s = new Date(yerelGunAnahtari(tarih) + 'T23:59:59+03:00');
  return { baslangic: b.toISOString(), bitis: s.toISOString() };
}

/** NOTYA-TRT-01: Randevu sistemi TÜRKİYE SAATİ (Europe/Istanbul, sabit UTC+3) üzerinden
 * çalışır — doktor/sekreter dünyanın neresinden bakarsa baksın aynı saatleri görür.
 * Izgara hücreleri "yapısal" tarih anahtarı (yerelGunAnahtari) kullanır; randevular ise
 * ISO anlarının TRT günü (trtGunAnahtari) ile hücrelere dağıtılır. Türkiye 2016'dan beri
 * yaz saati uygulamadığı için +03:00 sabittir. */
const TRT = 'Europe/Istanbul';

function trtGunAnahtari(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TRT });
}

function trtBugunTarihi(): Date {
  return new Date(trtGunAnahtari(new Date()) + 'T00:00:00');
}

function saatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TRT });
}

function tarihBaslikStr(tarih: Date): string {
  const bugun = trtBugunTarihi();
  const secilen = new Date(tarih); secilen.setHours(0, 0, 0, 0);
  const fark = Math.round((secilen.getTime() - bugun.getTime()) / 86400000);
  const temel = tarih.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (fark === 0) return `Bugün · ${temel}`;
  if (fark === 1) return `Yarın · ${temel}`;
  if (fark === -1) return `Dün · ${temel}`;
  return temel;
}

function tarihInputStr(tarih: Date): string {
  return tarih.toISOString().slice(0, 10);
}

/** Yerel tarih anahtarı (yyyy-mm-dd) — toISOString() UTC'ye kayar, gece yarısına yakın randevuları
 * yanlış güne yerleştirebilir. Bu yüzden local getFullYear/Month/Date kullanıyoruz. */
function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

/** Pazartesi başlangıçlı, tam 6 haftalık (42 günlük) ızgara — Google Takvim'in ay görünümüyle
 * aynı sabit yükseklik, ay ortasında satır sayısı değişip düzen zıplamıyor. */
function ayIzgarasi(ay: Date): Date[] {
  const yil = ay.getFullYear();
  const ayIndex = ay.getMonth();
  const ilkGun = new Date(yil, ayIndex, 1);
  const haftaIcindekiIndex = (ilkGun.getDay() + 6) % 7; // Pazartesi=0 olacak şekilde kaydır
  const izgaraBaslangic = new Date(yil, ayIndex, 1 - haftaIcindekiIndex);
  return Array.from({ length: 42 }, (_, i) => new Date(izgaraBaslangic.getFullYear(), izgaraBaslangic.getMonth(), izgaraBaslangic.getDate() + i));
}

function ayBaslikStr(ay: Date): string {
  return ay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default function RandevularPage() {
  const router = useRouter();
  const [gorunum, setGorunum] = useState<'ay' | 'gun' | 'ajanda' | 'liste'>('ay');

  // NOTYA-RANDEVU-10: 640px altı (iPhone dahil tüm telefonlar) için ay ızgarası yerine gün
  // görünümü varsayılan — 7 sütunlu bir ızgara telefon genişliğinde okunaklı olamaz, kullanıcı
  // yine de Ay'a manuel geçebilir (o zaman yatay kaydırma devreye girer).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setGorunum('gun');
  }, []);
  const [ay, setAy] = useState(() => new Date());
  const [gun, setGun] = useState(() => new Date());

  const [aylikRandevular, setAylikRandevular] = useState<Record<string, Randevu[]>>({});
  const [gunlukRandevular, setGunlukRandevular] = useState<Randevu[]>([]);
  const [ajandaRandevular, setAjandaRandevular] = useState<Randevu[]>([]);
  const [listeRandevular, setListeRandevular] = useState<Randevu[]>([]);
  const [kenarRandevular, setKenarRandevular] = useState<Randevu[]>([]);
  const [haftaRandevular, setHaftaRandevular] = useState<Record<string, number>>({});
  const [surukleId, setSurukleId] = useState<string | null>(null);
  const [surukleHedef, setSurukleHedef] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basariMesaji, setBasariMesaji] = useState('');
  const [rol, setRol] = useState<'doktor' | 'sekreter' | null>(null);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenlenenRandevu, setDuzenlenenRandevu] = useState<Randevu | null>(null);
  const [saat, setSaat] = useState('09:00');
  const [sureDk, setSureDk] = useState(20);
  const [tur, setTur] = useState('muayene');
  const [notlar, setNotlar] = useState('');
  const [hastaDurumu, setHastaDurumu] = useState<'saglikli' | 'sikayetli' | ''>('');

  const [hastaArama, setHastaArama] = useState('');
  const [aktifSonucIdx, setAktifSonucIdx] = useState(0);
  const [seciliHasta, setSeciliHasta] = useState<HastaAramaSonucu | null>(null);
  /**
   * NOTYA-RANDEVU-12: kayıtsız (serbest metin) randevu artık SESSİZ VARSAYILAN DEĞİL — doktorun
   * açıkça seçtiği bir yol. Eskiden hasta seçilmediği sürece serbest isim alanları hep açıktı;
   * arama bir sebeple (örn. Türkçe I hatası) eşleşmeyince doktor farkında olmadan kayıtlı
   * hastaya BAĞLI OLMAYAN bir randevu açıyordu ve bu, onaylandığında ikinci bir hasta dosyası
   * yaratıyordu (bkz. [id]/route.ts, otomatikHastaKaydiOlustur).
   */
  const [kayitsizMod, setKayitsizMod] = useState(false);
  const [serbestAd, setSerbestAd] = useState('');
  const [serbestTelefon, setSerbestTelefon] = useState('');
  const [serbestEmail, setSerbestEmail] = useState('');

  // NOTYA-BETA-0925: kayıtlı hastanın cep telefonu (hasta kaydından dolar, kayıtlı değilse zorunlu) + WhatsApp izni.
  const [hastaTelefon, setHastaTelefon] = useState('');
  const [kayitliTelefon, setKayitliTelefon] = useState<string | null>(null); // null = henüz okunmadı
  const [whatsappIzniVar, setWhatsappIzniVar] = useState(false);
  const [whatsappKabul, setWhatsappKabul] = useState(false);
  const [telefonHata, setTelefonHata] = useState('');
  /** Kayıttan sonra tek, sakin soru: Hasta Bilgi Formu WhatsApp'tan gitsin mi? */
  const [formSorusu, setFormSorusu] = useState<{ patientId: string; randevuId: string | null; ad: string } | null>(null);
  const [formLinki, setFormLinki] = useState<string | null>(null);
  const [formLinkiHazirlaniyor, setFormLinkiHazirlaniyor] = useState(false);
  const [formLinkiHata, setFormLinkiHata] = useState('');
  const [kaydediliyor, setKaydediyor] = useState(false);
  const [iptalId, setIptalId] = useState<string | null>(null);
  const [iptalNedeni, setIptalNedeni] = useState('');
  const [modalIptalAcik, setModalIptalAcik] = useState(false);
  const [modalIptalNedeni, setModalIptalNedeni] = useState('');

  const token = ensureDoctorAccessToken;

  const gridGunleri = useMemo(() => ayIzgarasi(ay), [ay]);

  const ayVerisiYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const grid = ayIzgarasi(ay);
      const baslangic = new Date(yerelGunAnahtari(grid[0]) + 'T00:00:00+03:00');
      const bitis = new Date(yerelGunAnahtari(grid[grid.length - 1]) + 'T23:59:59+03:00');
      const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) { setHata('Randevular alınamadı.'); return; }
      const d = await r.json();
      const grup: Record<string, Randevu[]> = {};
      for (const rv of (d.randevular || []) as Randevu[]) {
        const anahtar = trtGunAnahtari(rv.baslangic);
        (grup[anahtar] ||= []).push(rv);
      }
      setAylikRandevular(grup);
    } catch {
      setHata('Randevular alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, [ay]);

  const gunVerisiYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const { baslangic, bitis } = gunBaslangicBitis(gun);
      const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic)}&bitis=${encodeURIComponent(bitis)}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) { setHata('Randevular alınamadı.'); return; }
      const d = await r.json();
      setGunlukRandevular(d.randevular || []);
    } catch {
      setHata('Randevular alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, [gun]);

  /** NOTYA-RANDEVU-11: ajanda ve liste görünümleri için ortak aralık çekici. Ajanda
   * "önümüzdeki 30 gün" sabit penceresine bakar (Google Takvim'in Program görünümü gibi),
   * liste ise mevcut `ay` state'inin tamamına bakar ve ay gezinme oklarını paylaşır. */
  const araligiCek = useCallback(async (baslangic: Date, bitis: Date): Promise<Randevu[] | null> => {
    const t = await token();
    if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return null; }
    const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) { setHata('Randevular alınamadı.'); return null; }
    const d = await r.json();
    return (d.randevular || []) as Randevu[];
  }, []);

  const ajandaYukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const b = new Date(trtGunAnahtari(new Date()) + 'T00:00:00+03:00');
      const s = new Date(b.getTime() + 31 * 86400000 - 1000);
      const liste = await araligiCek(b, s);
      if (liste) setAjandaRandevular(liste);
    } catch { setHata('Randevular alınamadı. Bağlantınızı kontrol edin.'); }
    finally { setYukleniyor(false); }
  }, [araligiCek]);

  const listeYukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const ilkKey = yerelGunAnahtari(new Date(ay.getFullYear(), ay.getMonth(), 1));
      const sonKey = yerelGunAnahtari(new Date(ay.getFullYear(), ay.getMonth() + 1, 0));
      const b = new Date(ilkKey + 'T00:00:00+03:00');
      const s = new Date(sonKey + 'T23:59:59+03:00');
      const liste = await araligiCek(b, s);
      if (liste) setListeRandevular(liste);
    } catch { setHata('Randevular alınamadı. Bağlantınızı kontrol edin.'); }
    finally { setYukleniyor(false); }
  }, [ay, araligiCek]);

  /** NOTYA-RANDEVU-12: kenar çubuğu ajandası (Bugün/Yarın) — hangi görünüm açık olursa
   * olsun beslenmesi gerektiği için kendi 2 günlük penceresini çeker (ucuz sorgu). */
  const kenarYukle = useCallback(async () => {
    try {
      const b = new Date(trtGunAnahtari(new Date()) + 'T00:00:00+03:00');
      const s = new Date(b.getTime() + 2 * 86400000 - 1000);
      const liste = await araligiCek(b, s);
      if (liste) setKenarRandevular(liste);
    } catch { /* kenar çubuğu kritik değil */ }
  }, [araligiCek]);

  /** NOTYA-RANDEVU-13: Gün görünümündeki hafta şeridi için gün başına randevu sayısı —
   * mobil takvim deseninin (Timepage / Fantastical iOS) üst şerit noktalarını besler. */
  const haftaYukle = useCallback(async () => {
    try {
      const pzt = new Date(gun);
      const idx = (pzt.getDay() + 6) % 7;
      pzt.setDate(pzt.getDate() - idx); pzt.setHours(0, 0, 0, 0);
      const pztTrt = new Date(yerelGunAnahtari(pzt) + 'T00:00:00+03:00');
      const paz = new Date(pztTrt.getTime() + 7 * 86400000 - 1000);
      const liste = await araligiCek(pztTrt, paz);
      if (liste) {
        const g: Record<string, number> = {};
        for (const rv of liste) {
          if (rv.durum === 'iptal') continue;
          const k = trtGunAnahtari(rv.baslangic);
          g[k] = (g[k] || 0) + 1;
        }
        setHaftaRandevular(g);
      }
    } catch { /* şerit noktaları kritik değil */ }
  }, [gun, araligiCek]);

  const yenile = useCallback(async () => {
    if (gorunum === 'ay') await ayVerisiYukle();
    else if (gorunum === 'gun') { await gunVerisiYukle(); await haftaYukle(); }
    else if (gorunum === 'ajanda') await ajandaYukle();
    else await listeYukle();
    await kenarYukle();
  }, [gorunum, ayVerisiYukle, gunVerisiYukle, haftaYukle, ajandaYukle, listeYukle, kenarYukle]);

  useEffect(() => { yenile(); }, [yenile]);

  useEffect(() => {
    (async () => {
      const t = await token();
      if (!t) return;
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setRol(d.rol); }
      } catch { /* nav still works without this */ }
    })();
  }, []);

  // NOTYA-ARAMA-TR-01: hasta listesi form AÇILIRKEN bir kez çekilir; arama tamamen istemci
  // tarafında ve anında çalışır. Tuş başına istek gitmediği için debounce'a gerek yok —
  // gecikme eklemek burada yalnızca yazarken listeyi geciktirirdi.
  const [tumHastalar, setTumHastalar] = useState<HastaAramaSonucu[] | null>(null);
  const [hastaListesiYukleniyor, setHastaListesiYukleniyor] = useState(false);
  useEffect(() => {
    if (!formAcik || tumHastalar) return;
    let iptal = false;
    (async () => {
      setHastaListesiYukleniyor(true);
      try {
        const t = await token();
        if (!t) return;
        const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json();
        if (!iptal) {
          setTumHastalar(
            (d.patients || []).map((p: any) => ({ id: p.id, name: p.name, kayitTarihi: p.last_visit || null }))
          );
        }
      } catch {
        // Liste gelmezse arama boş kalır; kayıtsız yol yine de açık — randevu alınamaz duruma düşmesin.
      } finally {
        if (!iptal) setHastaListesiYukleniyor(false);
      }
    })();
    return () => { iptal = true; };
  }, [formAcik, tumHastalar, token]);

  // Form açıkken o günün randevularını her zaman çek — ay görünümünde gunlukRandevular boş kalıyordu.
  useEffect(() => {
    if (!formAcik) return
    let iptal = false
    ;(async () => {
      try {
        const t = await token()
        if (!t) return
        const { baslangic, bitis } = gunBaslangicBitis(gun)
        const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic)}&bitis=${encodeURIComponent(bitis)}`, {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (!r.ok || iptal) return
        const d = await r.json()
        if (!iptal) setGunlukRandevular(d.randevular || [])
      } catch { /* liste boş kalır; kaydet yine sunucu çakışma kontrolü yapar */ }
    })()
    return () => { iptal = true }
  }, [formAcik, gun, token])

  /**
   * NOTYA-ARAMA-TR-01 (canlı hata, Dr. Gökhan 2026-09-17): burada eskiden doğrudan
   * `toLocaleLowerCase('tr-TR')` vardı. Türkçe locale I ile i'yi KASTEN ayrı tutar
   * ('Hasta Iki' → 'hasta ıki'), bu yüzden doktor "hasta iki" yazınca kayıtlı hasta hiç
   * listelenmiyor, form sessizce kayıtsız randevu yoluna düşüyordu. trIcerir() dört I
   * biçimini tek kovaya katlar (bkz. lib/utils/turkceArama.ts + testleri).
   */
  const hastaEslesmeleri = useMemo(() => {
    const q = hastaArama.trim();
    if (!q) return [] as HastaAramaSonucu[];
    return (tumHastalar || []).filter((p) => trIcerir(p.name, q));
  }, [hastaArama, tumHastalar]);

  const hastaSonuclari = useMemo(() => hastaEslesmeleri.slice(0, HASTA_SONUC_LIMITI), [hastaEslesmeleri]);

  /** Aynı ada sahip birden fazla sonuç varsa kayıt tarihiyle ayırt edilir. */
  const cakisanAdlar = useMemo(() => {
    const sayac = new Map<string, number>();
    for (const h of hastaSonuclari) {
      const k = trAramaNormalize(h.name);
      sayac.set(k, (sayac.get(k) || 0) + 1);
    }
    return sayac;
  }, [hastaSonuclari]);

  const aramaMetni = hastaArama.trim();
  const aramaSonucsuz = aramaMetni.length >= 2 && !hastaListesiYukleniyor && tumHastalar !== null && hastaEslesmeleri.length === 0;

  /** Kayıtsız isim yazılırken aynı isimde kayıtlı hasta varsa uyar — sessiz ikinci dosya açılmasın. */
  const kayitsizAdCakismasi = useMemo(() => {
    if (!kayitsizMod || seciliHasta) return [] as HastaAramaSonucu[];
    const q = serbestAd.trim();
    if (q.length < 2) return [] as HastaAramaSonucu[];
    return (tumHastalar || []).filter((p) => trIcerir(p.name, q)).slice(0, 5);
  }, [kayitsizMod, seciliHasta, serbestAd, tumHastalar]);

  useEffect(() => { setAktifSonucIdx(0); }, [hastaArama]);

  // NOTYA-BETA-0925: seçilen kayıtlı hastanın telefonu ve WhatsApp izni (doktor da sekreter de okuyabilir —
  // /api/doktor/iletisim/izin, sahiplik sunucuda).
  const seciliHastaId = formAcik ? seciliHasta?.id ?? null : null;
  useEffect(() => {
    setTelefonHata('');
    setWhatsappKabul(false);
    setWhatsappIzniVar(false);
    setKayitliTelefon(null);
    setHastaTelefon('');
    if (!seciliHastaId) return;
    let iptal = false;
    (async () => {
      try {
        const t = await token();
        if (!t) return;
        const r = await fetch(`/api/doktor/iletisim/izin?patientId=${encodeURIComponent(seciliHastaId)}`, { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json().catch(() => ({}));
        if (iptal || !r.ok) return;
        const tel = String(d.telefon || '');
        setKayitliTelefon(tel);
        setHastaTelefon((mevcut) => mevcut || tel);
        setWhatsappIzniVar(d.whatsapp === true);
      } catch { if (!iptal) setKayitliTelefon(''); }
    })();
    return () => { iptal = true; };
  }, [seciliHastaId, token]);

  async function formLinkiHazirla() {
    if (!formSorusu) return;
    setFormLinkiHazirlaniyor(true);
    setFormLinkiHata('');
    try {
      const t = await token();
      if (!t) { setFormLinkiHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch('/api/doktor/intake-formlari', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: formSorusu.patientId, randevuId: formSorusu.randevuId, kanal: 'whatsapp' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.link) { setFormLinkiHata(d.error || 'Form bağlantısı hazırlanamadı.'); return; }
      setFormLinki(String(d.link));
    } catch {
      setFormLinkiHata('Form bağlantısı hazırlanamadı. Bağlantınızı kontrol edin.');
    } finally {
      setFormLinkiHazirlaniyor(false);
    }
  }

  function formSorusunuKapat() {
    setFormSorusu(null);
    setFormLinki(null);
    setFormLinkiHata('');
  }

  /** Hasta formu zaten doldurduysa soru sorulmaz. */
  async function formDolduMu(patientId: string): Promise<boolean> {
    try {
      const t = await token();
      if (!t) return false;
      const r = await fetch(`/api/doktor/intake-formlari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json().catch(() => ({}));
      return (d.formlar || []).some((f: { durum?: string }) => f.durum === 'dolduruldu' || f.durum === 'incelendi');
    } catch { return false; }
  }

  /** Listeden hasta seçmek: randevu gerçek patient_id'ye bağlanır, serbest metin yolu kapanır. */
  function hastaSec(h: HastaAramaSonucu) {
    setSeciliHasta(h);
    setKayitsizMod(false);
    setHastaArama('');
    setAktifSonucIdx(0);
    setSerbestAd('');
    setSerbestTelefon('');
    setSerbestEmail('');
    setHata('');
  }

  function formuSifirla() {
    setDuzenlenenId(null);
    setDuzenlenenRandevu(null);
    setSaat('09:00');
    setSureDk(20);
    setTur('muayene');
    setNotlar('');
    setHastaDurumu('');
    setHastaArama('');
    setAktifSonucIdx(0);
    setSeciliHasta(null);
    setKayitsizMod(false);
    setSerbestAd('');
    setSerbestTelefon('');
    setSerbestEmail('');
    setModalIptalAcik(false);
    setModalIptalNedeni('');
  }

  function gunHucresineTikla(d: Date) {
    setGun(d);
    setGorunum('gun');
  }

  function yeniRandevuAc(hedefGun?: Date) {
    formuSifirla();
    if (hedefGun) setGun(hedefGun);
    setFormAcik(true);
  }

  function duzenlemeyeAc(rv: Randevu) {
    // Modalın iptal-nedeni satırı AÇIK kalmış olabilir: "İptal Et"e basıp modalı arka plana
    // (backdrop) dokunarak kapatmak formuSifirla()'yı çağırmıyordu, bayrak true kalıyordu. Bir
    // sonraki randevu açıldığında aksiyon satırının tamamı (İptal Et dahil) gizli geliyor, üstelik
    // önceki iptal nedeni metni de duruyordu — dışarıdan "İptal Et düğmesi tepki vermiyor" diye
    // görünen davranışın ikinci sebebi buydu. Düzenlemeye her girişte temiz başla.
    setModalIptalAcik(false);
    setModalIptalNedeni('');
    setHata('');
    setDuzenlenenId(rv.id);
    setDuzenlenenRandevu(rv);
    setSaat(saatStr(rv.baslangic));
    setSureDk(Math.round((new Date(rv.bitis).getTime() - new Date(rv.baslangic).getTime()) / 60000));
    setTur(rv.tur);
    setNotlar(rv.notlar || '');
    setHastaDurumu((rv.hastaDurumu as 'saglikli' | 'sikayetli') || '');
    setGun(new Date(rv.baslangic));
    if (rv.kayitliHasta && rv.patientId) {
      setSeciliHasta({ id: rv.patientId, name: rv.hastaAdi });
      setKayitsizMod(false);
      setSerbestAd(''); setSerbestTelefon('');
    } else {
      setSeciliHasta(null);
      // Zaten kayıtsız açılmış bir randevuyu düzenlerken serbest alanlar açık gelir — ama
      // "Hasta ara" da burada, doktor gerçek hastayı bulup bağlayabilsin diye (PATCH patientId
      // gönderildiğinde serbest metin temizlenip randevu gerçek dosyaya bağlanır).
      setKayitsizMod(true);
      setSerbestAd(rv.hastaAdi); setSerbestTelefon(rv.hastaTelefon); setSerbestEmail(rv.hastaEmail || '');
    }
    setHastaArama('');
    setAktifSonucIdx(0);
    setFormAcik(true);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    // NOTYA-RANDEVU-12: kayıtsız yola düşmek artık açık bir karar. Doktor hastayı seçmediyse ve
    // "kayıtsız" seçeneğini de işaretlemediyse, eskisi gibi kuru bir doğrulama hatası vermek
    // yerine ne yapması gerektiğini söyle — canlı hatada doktor tam burada takılı kalmıştı.
    if (!seciliHasta && !kayitsizMod) {
      setHata('Hastayı "Hasta ara" kutusundan bulup listeden seçin. Hasta kayıtlı değilse "Hasta kayıtlı değil — kayıtsız randevu oluştur"a dokunun.');
      return;
    }
    if (!seciliHasta && !serbestAd.trim()) {
      setHata('Kayıtsız randevu için hasta adı girin.');
      return;
    }
    // Kaan (2026-09-10): e-posta ISTEGE BAGLI (PR #114 karari ile tutarli) — verildiyse gecerli olsun.
    if (!seciliHasta && serbestEmail.trim() && !serbestEmail.trim().includes('@')) {
      setHata('E-posta adresi geçersiz görünüyor.');
      return;
    }
    // NOTYA-BETA-0925 (Dr. Gökhan): cep telefonu — hastanın kayıtlı telefonu yoksa zorunlu; yazıldıysa geçerli olmalı
    // (Türk cep numarası ya da + ile yurt dışı numarası). Sunucu aynı kuralla yeniden denetler.
    setTelefonHata('');
    const telefonGirdisi = (seciliHasta ? hastaTelefon : serbestTelefon).trim();
    const telefonZorunlu = seciliHasta ? !kayitliTelefon : true;
    let telefonDegeri: string | null = null;
    if (telefonGirdisi) {
      const t = cepTelefonuDogrula(telefonGirdisi);
      if (!t.ok) { setTelefonHata(t.hata); setHata(t.hata); return; }
      telefonDegeri = t.deger;
    } else if (telefonZorunlu && (!seciliHasta || kayitliTelefon !== null)) {
      const m = seciliHasta ? 'Hastanın kayıtlı cep telefonu yok. Lütfen cep telefonunu yazın.' : TELEFON_MESAJ.bos;
      setTelefonHata(m); setHata(m); return;
    }
    const kayitliNormal = kayitliTelefon ? (cepTelefonuDogrula(kayitliTelefon) as { deger?: string }).deger || kayitliTelefon : '';
    const telefonDegisti = !!seciliHasta && !!telefonDegeri && telefonDegeri !== kayitliNormal;
    const izinVerildi = !!seciliHasta && whatsappKabul && !whatsappIzniVar;
    setKaydediyor(true);
    setHata('');
    setBasariMesaji('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }

      // NOTYA-TRT-01: girilen saat Türkiye saati olarak yorumlanır (sabit +03:00)
      const baslangicTarihi = new Date(`${yerelGunAnahtari(gun)}T${saat}:00+03:00`);
      const bitisTarihi = new Date(baslangicTarihi.getTime() + sureDk * 60000);

      const govde = {
        patientId: seciliHasta?.id || null,
        hastaAdiSerbest: seciliHasta ? null : serbestAd.trim(),
        hastaTelefonSerbest: seciliHasta ? null : telefonDegeri || '',
        ...(telefonDegisti ? { hastaTelefon: telefonDegeri } : {}),
        ...(izinVerildi ? { whatsappIzni: true } : {}),
        hastaEmailSerbest: seciliHasta ? null : serbestEmail.trim(),
        baslangic: baslangicTarihi.toISOString(),
        bitis: bitisTarihi.toISOString(),
        tur,
        notlar: notlar.trim() || null,
        hastaDurumu: hastaDurumu || null,
      };

      const url = duzenlenenId ? `/api/doktor/randevular/${duzenlenenId}` : '/api/doktor/randevular';
      const yontem = duzenlenenId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method: yontem,
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setHata(j.error || 'Randevu kaydedilemedi.');
        return;
      }
      // Kayıttan sonra tek soru: yeni randevuda ya da telefon / izin yeni girildiyse, hasta formu henüz doldurmadıysa.
      const soruHastasi = seciliHasta && (!duzenlenenId || telefonDegisti || izinVerildi)
        ? { patientId: seciliHasta.id, randevuId: (j.randevu?.id as string | undefined) || duzenlenenId, ad: seciliHasta.name }
        : null;
      formuSifirla();
      setFormAcik(false);
      await yenile();
      if (soruHastasi && !(await formDolduMu(soruHastasi.patientId))) {
        setFormLinki(null);
        setFormLinkiHata('');
        setFormSorusu(soruHastasi);
      }
    } catch {
      setHata('Randevu kaydedilemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediyor(false);
    }
  }

  // NOTYA-RANDEVU-07: dosya açılışı yalnızca onaylandi/tamamlandi/gelmedi geçişinde olur (bkz.
  // API route yorumu). Server bunu yeniHasta olarak döndürünce burada görünür kılıyoruz —
  // "onayla" tıklayıp dosyanın sessizce açılması doktora/sekretere bildirilmeden geçmemeli.
  //
  // Hata YUTULMAZ: eskiden oturum yoksa sessizce `return` ediliyor, PATCH 4xx/5xx dönerse yanıt
  // hiç kontrol edilmeden yenile() çağrılıyordu. Her iki durumda da doktor için sonuç aynıydı —
  // düğmeye basıyor, hiçbir şey olmuyor, hiçbir açıklama da çıkmıyor. Dr. Gökhan'ın "iptal
  // düğmesi tepki vermiyor" gözleminin bir ayağı buydu. Artık başarı/başarısızlık dönüyor ve
  // başarısızlık ekranda yazıyor.
  async function durumDegistir(id: string, durum: string, neden?: string): Promise<boolean> {
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return false; }
      const r = await fetch(`/api/doktor/randevular/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ durum, iptalNedeni: neden }),
      });
      const sonuc = await r.json().catch(() => ({}));
      if (!r.ok) {
        setHata(sonuc?.error || 'Randevu durumu güncellenemedi.');
        return false;
      }
      setHata('');
      if (sonuc?.yeniHasta?.ad) {
        setBasariMesaji(`${sonuc.yeniHasta.ad} için hasta dosyası açıldı.`);
        setTimeout(() => setBasariMesaji(''), 6000);
      }
      await yenile();
      return true;
    } catch {
      setHata('Randevu durumu güncellenemedi. Bağlantınızı kontrol edin.');
      return false;
    }
  }

  /** NOTYA-RANDEVU-14: iptalin tek çıkış kapısı — randevuyu yeniden aktif (Planlandı) yapar.
   * Daha önce böyle bir aksiyon hiçbir yerde yoktu: iptal edilen bir randevu kalıcı olarak
   * iptaldi, saatini değiştirip kaydetmek de durumu değiştirmiyordu (değiştirmemeli de). */
  async function aktifEt(id: string): Promise<boolean> {
    const oldu = await durumDegistir(id, REAKTIVASYON_DURUMU);
    if (oldu) {
      setBasariMesaji('Randevu yeniden aktif edildi — durumu artık "Planlandı".');
      setTimeout(() => setBasariMesaji(''), 6000);
    }
    return oldu;
  }

  /** Modal içinden durum değiştirme — randevuyu "açıp" onaylamak/tamamlamak/iptal etmek için
   * ayrıca gün görünümüne geçmeye gerek kalmasın diye. Aynı randevu; ay ızgarasındaki bir
   * chip'e tıklayıp doğrudan buradan onaylayabilmek gerekiyordu — daha önce bu modalde sadece
   * yeniden planlama alanları vardı, durum kontrolü yoktu. */
  async function modalDurumDegistir(durum: string, neden?: string) {
    if (!duzenlenenId) return;
    const oldu = await durumDegistir(duzenlenenId, durum, neden);
    if (!oldu) return; // hata modal içinde görünür; kapatıp gizlemek işi yine sessizleştirirdi
    setFormAcik(false);
    formuSifirla();
  }

  /** Modaldan reaktivasyon — diğer durum aksiyonlarının aksine modal KAPANMAZ. Dr. Gökhan'ın
   * yapmak istediği tam olarak "aktif et + saatini değiştir"di; rozetin anında Planlandı'ya
   * dönmesi de aksiyonun işe yaradığının görünür kanıtı oluyor. */
  async function modalAktifEt() {
    if (!duzenlenenId) return;
    const oldu = await aktifEt(duzenlenenId);
    if (!oldu) return;
    setDuzenlenenRandevu((r) => (r ? { ...r, durum: REAKTIVASYON_DURUMU, iptalNedeni: null } : r));
  }

  async function modalSil() {
    if (!duzenlenenId) return;
    if (!confirm('Bu randevuyu tamamen silmek istiyor musunuz? (Gerçek bir iptal için "İptal Et" kullanın.)')) return;
    if (!await silIslemi(duzenlenenId)) return; // hata modalda görünsün
    setFormAcik(false);
    formuSifirla();
  }

  async function silIslemi(id: string): Promise<boolean> {
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return false; }
      const r = await fetch(`/api/doktor/randevular/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Randevu silinemedi.');
        return false;
      }
      setHata('');
      await yenile();
      return true;
    } catch {
      setHata('Randevu silinemedi. Bağlantınızı kontrol edin.');
      return false;
    }
  }

  async function sil(id: string) {
    if (!confirm('Bu randevuyu tamamen silmek istiyor musunuz? (Gerçek bir iptal için "İptal Et" kullanın.)')) return;
    await silIslemi(id);
  }

  const siraliGunlukRandevular = useMemo(
    () => [...gunlukRandevular].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
    [gunlukRandevular]
  );

  const ajandaGunleri = useMemo(() => {
    const grup: Record<string, Randevu[]> = {};
    for (const rv of ajandaRandevular) {
      (grup[trtGunAnahtari(rv.baslangic)] ||= []).push(rv);
    }
    return Object.entries(grup)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([anahtar, liste]) => ({
        anahtar,
        tarih: new Date(anahtar + 'T00:00:00'),
        liste: [...liste].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
      }));
  }, [ajandaRandevular]);

  const siraliListe = useMemo(
    () => [...listeRandevular].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
    [listeRandevular]
  );

  const kenarGrup = useMemo(() => {
    const bugunK = trtGunAnahtari(new Date());
    const yarinK = trtGunAnahtari(new Date(Date.now() + 86400000));
    const sirala = (l: Randevu[]) => l.sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());
    const iptalsiz = kenarRandevular.filter((r) => r.durum !== 'iptal');
    return {
      bugun: sirala(iptalsiz.filter((r) => trtGunAnahtari(r.baslangic) === bugunK)),
      yarin: sirala(iptalsiz.filter((r) => trtGunAnahtari(r.baslangic) === yarinK)),
    };
  }, [kenarRandevular]);

  const haftaGunleri = useMemo(() => {
    const pzt = new Date(gun);
    const idx = (pzt.getDay() + 6) % 7;
    pzt.setDate(pzt.getDate() - idx); pzt.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate() + i));
  }, [gun]);

  /** Ortak araç çubuğu gezinmesi — Fantastical'daki tek ‹ Bugün › grubu. Gün görünümünde
   * gün, diğerlerinde ay kaydırır (ajandada ay kaydırmak kenar çubuğu mini ayını gezdirir). */
  function geri() {
    if (gorunum === 'gun') setGun((g) => new Date(g.getTime() - 86400000));
    else setAy((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }
  function ileri() {
    if (gorunum === 'gun') setGun((g) => new Date(g.getTime() + 86400000));
    else setAy((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }
  function bugune() {
    setAy(new Date());
    setGun(new Date());
  }

  /** NOTYA-RANDEVU-11: sürükle-bırak ile yeniden planlama (yalnız ay ızgarası, masaüstü).
   * Saat ve süre korunur, yalnız gün değişir — saat değiştirmek için modal zaten var.
   * PATCH kısmi gövdeyi destekliyor ve çakışma penceresini yeniden kontrol ediyor; çakışma
   * varsa sunucunun hatası aynen gösterilir, hiçbir şey taşınmaz. HTML5 DnD dokunmatikte
   * çalışmaz — mobil zaten Gün görünümünde açılıyor, oradaki Yeniden Planla akışı geçerli. */
  async function tasiRandevu(id: string, hedefGun: Date) {
    setSurukleId(null); setSurukleHedef(null);
    const rv = Object.values(aylikRandevular).flat().find((r) => r.id === id);
    if (!rv) return;
    const eskiB = new Date(rv.baslangic);
    if (trtGunAnahtari(eskiB) === yerelGunAnahtari(hedefGun)) return;
    const sure = new Date(rv.bitis).getTime() - eskiB.getTime();
    const eskiSaatTrt = eskiB.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TRT });
    const yeniB = new Date(`${yerelGunAnahtari(hedefGun)}T${eskiSaatTrt}:00+03:00`);
    const yeniS = new Date(yeniB.getTime() + sure);
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch(`/api/doktor/randevular/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ baslangic: yeniB.toISOString(), bitis: yeniS.toISOString() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Randevu taşınamadı.');
      } else {
        setHata('');
        setBasariMesaji(`${rv.hastaAdi} — ${yeniB.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${saatStr(yeniB.toISOString())} olarak taşındı.`);
        setTimeout(() => setBasariMesaji(''), 5000);
      }
    } catch { setHata('Randevu taşınamadı. Bağlantınızı kontrol edin.'); }
    await ayVerisiYukle();
  }

  const bugunAnahtari = trtGunAnahtari(new Date());

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', color: CHROME_RENK.ink }}>
      <style>{`
        @media (max-width: 1023px) { .fv-aside { display: none !important; } }
        @media (max-width: 639px) {
          .fv-wrap { padding: 10px !important; }
          .fv-toolbar { padding: 10px !important; gap: 8px !important; }
          .fv-title { font-size: 14px !important; min-width: 0 !important; flex: 1 1 auto; }
          .fv-dateinput { display: none !important; }
          .fv-modes { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .fv-seg-btn { padding: 8px 12px !important; font-size: 13px !important; min-height: 36px; }
          .fv-ekle { width: 100%; min-height: 44px; }
        }
        .fv-cell:hover { background: #F6F0E4; }
        .fv-hrow:hover { background: rgba(58,44,34,0.09) !important; }
        .fv-ev:hover { background: rgba(58,44,34,0.08); }
        .fv-mini:hover { background: rgba(58,44,34,0.12) !important; }
      `}</style>
      <div className="fv-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Randevular</h1>
          {rol === 'sekreter' && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: '#E4F3F1', color: CHROME_RENK.pine }}>
              Sekreter olarak bağlısınız
            </span>
          )}
        </div>

        {/* NOTYA-ILETISIM-01: the secretary has no Ana Sayfa — prepared appointment messages live here for them */}
        {rol === 'sekreter' && <HazirMesajlar kartStili={{ marginBottom: 14 }} />}

        <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(58,44,34,0.14)', border: '1px solid rgba(58,44,34,0.08)' }}>

          {/* ——— Kenar çubuğu — koyu iki tonun koyusu: mini ay + Bugün/Yarın ajandası ——— */}
          <aside className="fv-aside" style={{ width: 264, flexShrink: 0, background: '#F6F0E4', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid #F6F0E4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, fontSize: 22, fontWeight: 800, lineHeight: 1.1, textTransform: 'capitalize', color: CHROME_RENK.ink }}>
                {ay.toLocaleDateString('tr-TR', { month: 'long' })} <span style={{ color: CHROME_RENK.pine }}>{ay.getFullYear()}</span>
              </div>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))} style={miniNavBtn}>‹</button>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))} style={miniNavBtn}>›</button>
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((g, i2) => (
                  <div key={i2} style={{ fontSize: 9, color: CHROME_RENK.muted, textAlign: 'center', fontWeight: 700 }}>{g}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
                {gridGunleri.map((d, i2) => {
                  const anahtar = yerelGunAnahtari(d);
                  const bugunMu = anahtar === bugunAnahtari;
                  const buAy = d.getMonth() === ay.getMonth();
                  const dolu = (aylikRandevular[anahtar] || []).some((r) => r.durum !== 'iptal');
                  return (
                    <button
                      key={i2}
                      type="button"
                      className="fv-mini"
                      onClick={() => { setGun(d); setGorunum('gun'); }}
                      style={{ background: bugunMu ? CHROME_RENK.pine : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '3px 0 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                    >
                      <span style={{ fontSize: 11, fontWeight: bugunMu ? 700 : 500, color: bugunMu ? 'white' : buAy ? CHROME_RENK.ink : '#a89a86' }}>{d.getDate()}</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: dolu ? (bugunMu ? 'white' : CHROME_RENK.pine) : 'transparent' }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { etiket: `BUGÜN ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })}`, renk: CHROME_RENK.pine, liste: kenarGrup.bugun, bos: 'Bugün randevu yok' },
                { etiket: 'YARIN', renk: CHROME_RENK.muted, liste: kenarGrup.yarin, bos: 'Yarın randevu yok' },
              ].map((grup) => (
                <div key={grup.etiket}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: grup.renk, marginBottom: 8 }}>{grup.etiket}</div>
                  {grup.liste.length === 0 && <div style={{ fontSize: 12, color: '#a89a86' }}>{grup.bos}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {grup.liste.map((rv) => {
                      const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                      const iptalMi = rv.durum === 'iptal';
                      return (
                        <div key={rv.id} onClick={() => duzenlemeyeAc(rv)} style={{ display: 'flex', gap: 8, cursor: 'pointer', opacity: iptalMi ? 0.45 : 1 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 4, flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: CHROME_RENK.muted, fontVariantNumeric: 'tabular-nums' }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                            <div style={{ fontSize: 13, color: CHROME_RENK.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: iptalMi ? 'line-through' : 'none' }}>{rv.hastaAdi}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ——— Ana panel — koyu iki tonun açığı ——— */}
          <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', color: CHROME_RENK.ink, display: 'flex', flexDirection: 'column' }}>

            <div className="fv-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(58,44,34,0.08)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" onClick={geri} style={panelNavBtn}>‹</button>
                <button type="button" onClick={bugune} style={{ ...panelNavBtn, width: 'auto', padding: '0 12px', fontWeight: 600, fontSize: 13 }}>Bugün</button>
                <button type="button" onClick={ileri} style={panelNavBtn}>›</button>
              </div>
              <div className="fv-title" style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize', minWidth: 130 }}>
                {gorunum === 'gun' ? tarihBaslikStr(gun) : gorunum === 'ajanda' ? 'Önümüzdeki 30 gün' : ayBaslikStr(ay)}
              </div>
              <span title="Tüm saatler Türkiye saatidir" style={{ fontSize: 10, fontWeight: 700, color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.14)', borderRadius: 5, padding: '2px 6px' }}>TRT</span>
              {gorunum === 'gun' && (
                <input
                  className="fv-dateinput"
                  type="date"
                  value={tarihInputStr(gun)}
                  onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }}
                  style={{ background: '#F6F0E4', border: '1px solid rgba(58,44,34,0.16)', color: CHROME_RENK.ink, borderRadius: 8, padding: '6px 8px', fontSize: 13 }}
                />
              )}
              <div style={{ flex: 1 }} />
              <div className="fv-modes" style={{ display: 'flex', background: 'rgba(58,44,34,0.08)', borderRadius: 9, padding: 2 }}>
                {([['ay', 'Ay'], ['gun', 'Gün'], ['ajanda', 'Ajanda'], ['liste', 'Liste']] as const).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className="fv-seg-btn"
                    onClick={() => setGorunum(k)}
                    style={{ background: gorunum === k ? CHROME_RENK.pine : 'transparent', boxShadow: gorunum === k ? '0 1px 5px rgba(58,44,34,0.1)' : 'none', border: 'none', color: gorunum === k ? '#FAF8F4' : CHROME_RENK.ink, fontWeight: gorunum === k ? 700 : 500, borderRadius: 7, padding: '5px 14px', fontSize: 13, cursor: 'pointer', transition: 'background .15s ease, box-shadow .15s ease' }}
                  >{v}</button>
                ))}
              </div>
              <button type="button" className="fv-ekle" onClick={() => yeniRandevuAc(gorunum === 'gun' ? gun : new Date())} style={{ background: CHROME_RENK.pine, border: 'none', color: 'white', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Randevu
              </button>
            </div>

            <div style={{ padding: '12px 16px 0' }}>
              {hata && <div style={{ background: '#FBEAE3', border: '1px solid rgba(164,91,62,0.4)', color: '#a45b3e', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 10 }}>{hata}</div>}
              {resmiTatilMi(new Date()) && (
                <div style={{ background: '#FBEAE3', border: '1px solid rgba(164,91,62,0.4)', color: '#a45b3e', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
                  🔔 Bugün resmi tatil: <strong>{resmiTatilMi(new Date())?.ad}</strong> — randevu planlarken dikkat edin.
                </div>
              )}
              {basariMesaji && (
                <div style={{ background: '#E4F3EA', border: '1px solid rgba(46,110,78,0.5)', color: '#2E6E4E', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 10 }}>{basariMesaji}</div>
              )}
              {gorunum === 'ay' && (
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                  {Object.entries(TUR_ETIKET).map(([k, v]) => (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: TUR_RENK[k] }} /> {v}
                    </span>
                  ))}
                  <span style={{ fontSize: 13, color: CHROME_RENK.muted }}>· içi boş nokta = onay bekliyor · sürükleyip bırakarak taşıyın</span>
                </div>
              )}
            </div>

            {gorunum === 'ay' && (
              <div style={{ overflow: 'auto' }}>
                <div style={{ minWidth: 560 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(58,44,34,0.08)' }}>
                    {HAFTA_GUNLERI.map((g) => (
                      <div key={g} style={{ padding: '7px 6px', fontSize: 10, color: CHROME_RENK.muted, textAlign: 'center', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{g}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {gridGunleri.map((d, i) => {
                      const anahtar = yerelGunAnahtari(d);
                      const buAyIcinde = d.getMonth() === ay.getMonth();
                      const bugunMu = anahtar === bugunAnahtari;
                      const tatil = resmiTatilMi(d);
                      const gunRandevulari = (aylikRandevular[anahtar] || []).filter((rv) => rv.durum !== 'iptal').sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());
                      const gosterilen = gunRandevulari.slice(0, 3);
                      const fazlaSayisi = gunRandevulari.length - gosterilen.length;
                      const hedefMi = surukleId && surukleHedef === anahtar;
                      return (
                        <div
                          key={i}
                          className="fv-cell"
                          onClick={() => gunHucresineTikla(d)}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                          onDragEnter={() => { if (surukleId) setSurukleHedef(anahtar); }}
                          onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) tasiRandevu(id, d); }}
                          title={tatil ? tatil.ad : undefined}
                          style={{
                            minHeight: 104,
                            padding: '5px 5px 6px',
                            borderRight: (i + 1) % 7 !== 0 ? '1px solid #F6F0E4' : 'none',
                            borderTop: '1px solid #F6F0E4',
                            background: hedefMi ? '#E4F3F1' : buAyIcinde ? 'transparent' : 'rgba(58,44,34,0.06)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: bugunMu ? 700 : 500, color: bugunMu ? 'white' : buAyIcinde ? CHROME_RENK.ink : '#a89a86', background: bugunMu ? CHROME_RENK.pine : 'transparent', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                          </div>
                          {tatil && (
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#a45b3e', background: '#FBEAE3', borderRadius: 4, padding: '1px 5px', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tatil.ad}</div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {gosterilen.map((rv) => {
                              const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                              const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                              const surukleyebilir = rv.durum === 'planlandi' || rv.durum === 'onaylandi';
                              const iptalMi = rv.durum === 'iptal';
                              return (
                                <div
                                  key={rv.id}
                                  className="fv-ev"
                                  draggable={surukleyebilir}
                                  onDragStart={(e) => { e.stopPropagation(); setSurukleId(rv.id); e.dataTransfer.setData('text/plain', rv.id); e.dataTransfer.effectAllowed = 'move'; }}
                                  onDragEnd={() => { setSurukleId(null); setSurukleHedef(null); }}
                                  onClick={(e) => { e.stopPropagation(); duzenlemeyeAc(rv); }}
                                  title={`${saatStr(rv.baslangic)} ${rv.hastaAdi} · ${TUR_ETIKET[rv.tur] || rv.tur} · ${durumBilgi.label}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, lineHeight: '15px', color: iptalMi ? CHROME_RENK.muted : CHROME_RENK.ink, padding: '1px 3px', borderRadius: 4, opacity: rv.id === surukleId ? 0.45 : 1, textDecoration: iptalMi ? 'line-through' : 'none', cursor: surukleyebilir ? 'grab' : 'pointer' }}
                                >
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : iptalMi ? '#a89a86' : turRenk, border: `2px solid ${iptalMi ? '#a89a86' : turRenk}` }} />
                                  <span style={{ color: CHROME_RENK.muted, fontVariantNumeric: 'tabular-nums', flexShrink: 0, fontSize: 10 }}>{saatStr(rv.baslangic)}</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rv.hastaAdi}</span>
                                </div>
                              );
                            })}
                            {fazlaSayisi > 0 && <div style={{ fontSize: 10, color: CHROME_RENK.muted, paddingLeft: 15 }}>+{fazlaSayisi} daha</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {gorunum === 'gun' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {/* NOTYA-RANDEVU-13: hafta şeridi — mobil takvim deseni (tüm genişliklerde) */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0 12px', WebkitOverflowScrolling: 'touch' }}>
                  {haftaGunleri.map((d, i) => {
                    const k = yerelGunAnahtari(d);
                    const secili = k === yerelGunAnahtari(gun);
                    const bugunMu = k === bugunAnahtari;
                    const dolu = (haftaRandevular[k] || 0) > 0;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setGun(new Date(d))}
                        style={{ minWidth: 46, flex: 1, background: secili ? CHROME_RENK.pine : '#F6F0E4', border: bugunMu && !secili ? `1px solid ${CHROME_RENK.pine}` : '1px solid transparent', borderRadius: 12, padding: '8px 0 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: secili ? 'rgba(250,248,244,0.85)' : CHROME_RENK.muted }}>{HAFTA_GUNLERI[i]}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: secili ? '#FAF8F4' : CHROME_RENK.ink }}>{d.getDate()}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: dolu ? (secili ? 'white' : CHROME_RENK.pine) : 'transparent' }} />
                      </button>
                    );
                  })}
                </div>

                {yukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && siraliGunlukRandevular.length === 0 && (
                  <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Bu güne ait randevu yok.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {siraliGunlukRandevular.map((rv) => {
                    const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                    const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                    const gecmis = new Date(rv.bitis) < new Date();
                    return (
                      <div
                        key={rv.id}
                        style={{ background: '#F6F0E4', border: '1px solid rgba(58,44,34,0.1)', borderLeft: `3px solid ${turRenk}`, borderRadius: 12, padding: 14, opacity: rv.durum === 'iptal' ? 0.55 : 1 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                            <div style={{ fontSize: 15, marginTop: 2 }}>{rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 11, color: '#B4832F', marginLeft: 6 }}>kayıtsız</span>}</div>
                            <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>{TUR_ETIKET[rv.tur] || rv.tur}{rv.hastaTelefon ? ` · ${rv.hastaTelefon}` : ''}</div>
                            {rv.notlar && <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4, whiteSpace: 'pre-wrap' }}>{rv.notlar}</div>}
                            {rv.durum === 'iptal' && rv.iptalNedeni && <div style={{ fontSize: 12, color: '#a45b3e', marginTop: 4 }}>İptal: {rv.iptalNedeni}</div>}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>
                            {durumBilgi.label}
                          </span>
                        </div>

                        {/* NOTYA-RANDEVU-14: aksiyonlar randevuAksiyonlari()'ndan gelir — daha önce bu
                            satırın TAMAMI `rv.durum !== 'iptal'` ile gizleniyordu, yani iptal edilmiş
                            bir randevunun gün görünümünde tek bir düğmesi bile yoktu: ne geri alma, ne
                            yeniden planlama, ne silme. */}
                        {(() => {
                          const aks = randevuAksiyonlari(rv.durum, gecmis);
                          return (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                              {aks.aktifEt && (
                                <button type="button" onClick={() => aktifEt(rv.id)} style={{ ...aksiyonBtn, background: CHROME_RENK.pine, color: 'white', fontWeight: 700 }}>↺ Aktif Hale Getir</button>
                              )}
                              {!aks.aktifEt && rv.patientId && (
                                <>
                                  <button type="button" onClick={() => router.push(`/session/new?patientId=${rv.patientId}&randevuBaslangic=${encodeURIComponent(rv.baslangic)}`)} style={{ ...aksiyonBtn, background: CHROME_RENK.pine, color: 'white', fontWeight: 700 }}>🩺 Muayeneyi Başlat</button>
                                  <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${rv.patientId}`)} style={{ ...aksiyonBtn, color: CHROME_RENK.pine, fontWeight: 600 }}>Hasta Dosyasını Aç</button>
                                  <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${rv.patientId}?tab=formu`)} style={{ ...aksiyonBtn, color: CHROME_RENK.pine }}>Hasta Formu</button>
                                </>
                              )}
                              {aks.yenidenPlanla && (
                                <button type="button" onClick={() => duzenlemeyeAc(rv)} style={aksiyonBtn}>Yeniden Planla</button>
                              )}
                              {aks.onayla && (
                                <button type="button" onClick={() => durumDegistir(rv.id, 'onaylandi')} style={{ ...aksiyonBtn, color: '#2E6E4E', fontWeight: 600 }}>Onayla</button>
                              )}
                              {aks.tamamlandi && (
                                <button type="button" onClick={() => durumDegistir(rv.id, 'tamamlandi')} style={aksiyonBtn}>Tamamlandı</button>
                              )}
                              {aks.gelmedi && (
                                <button type="button" onClick={() => durumDegistir(rv.id, 'gelmedi')} style={{ ...aksiyonBtn, color: '#B4832F' }}>Gelmedi</button>
                              )}
                              {aks.iptalEt && (
                                <button type="button" onClick={() => { setIptalId(rv.id); setIptalNedeni(''); }} style={{ ...aksiyonBtn, color: '#a45b3e' }}>İptal Et</button>
                              )}
                              {aks.sil && (
                                <button type="button" onClick={() => sil(rv.id)} style={{ ...aksiyonBtn, color: CHROME_RENK.muted }}>Sil</button>
                              )}
                            </div>
                          );
                        })()}

                        {iptalId === rv.id && (
                          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                            <input
                              value={iptalNedeni}
                              onChange={(e) => setIptalNedeni(e.target.value)}
                              placeholder="İptal nedeni (isteğe bağlı)"
                              style={{ flex: 1, background: '#F6F0E4', border: '1px solid rgba(58,44,34,0.16)', color: CHROME_RENK.ink, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
                            />
                            <button
                              type="button"
                              onClick={async () => { await durumDegistir(rv.id, 'iptal', iptalNedeni); setIptalId(null); setIptalNedeni(''); }}
                              style={{ ...aksiyonBtn, background: '#a45b3e', color: 'white', border: 'none' }}
                            >Onayla</button>
                            <button type="button" onClick={() => { setIptalId(null); setIptalNedeni(''); }} style={aksiyonBtn}>Vazgeç</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {gorunum === 'ajanda' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {yukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && ajandaGunleri.length === 0 && <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Önümüzdeki 30 günde randevu yok.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {ajandaGunleri.map(({ anahtar, tarih, liste }) => {
                    const tatil = resmiTatilMi(tarih);
                    const bugunMu = anahtar === bugunAnahtari;
                    return (
                      <div key={anahtar}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(58,44,34,0.08)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: bugunMu ? CHROME_RENK.pine : CHROME_RENK.ink, textTransform: 'capitalize' }}>{tarihBaslikStr(tarih)}</span>
                          {tatil && <span style={{ fontSize: 11, color: '#a45b3e' }}>· {tatil.ad}</span>}
                          <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>· {liste.length} randevu</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {liste.map((rv) => {
                            const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                            const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                            return (
                              <div
                                key={rv.id}
                                className="fv-hrow"
                                onClick={() => duzenlemeyeAc(rv)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#F6F0E4', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                              >
                                <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: CHROME_RENK.muted, minWidth: 92 }}>{saatStr(rv.baslangic)}–{saatStr(rv.bitis)}</span>
                                <span style={{ fontSize: 14, flex: 1, minWidth: 120, textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none' }}>{rv.hastaAdi}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {gorunum === 'liste' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {yukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && siraliListe.length === 0 && <p style={{ color: CHROME_RENK.muted, fontSize: 14 }}>Bu ayda randevu yok.</p>}
                {siraliListe.length > 0 && (
                  <div style={{ border: '1px solid rgba(58,44,34,0.1)', borderRadius: 12, overflow: 'hidden' }}>
                    {siraliListe.map((rv, idx) => {
                      const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                      const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                      const b = new Date(rv.baslangic);
                      return (
                        <div
                          key={rv.id}
                          className="fv-hrow"
                          onClick={() => duzenlemeyeAc(rv)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', borderTop: idx ? '1px solid #F6F0E4' : 'none', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                        >
                          <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: CHROME_RENK.muted, minWidth: 108 }}>
                            {b.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} {HAFTA_GUNLERI[(b.getDay() + 6) % 7]} {saatStr(rv.baslangic)}
                          </span>
                          <span style={{ fontSize: 14, flex: 1, minWidth: 120, textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none' }}>
                            {rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 10, color: '#B4832F', marginLeft: 6 }}>kayıtsız</span>}
                          </span>
                          <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{TUR_ETIKET[rv.tur] || rv.tur}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {formAcik && (
          <div
            role="presentation"
            // Arka plana dokunarak kapatmak da "Vazgeç" ile aynı şey olmalı: eskiden yalnızca
            // formAcik=false yapıyor, modalIptalAcik gibi bayrakları bir sonraki açılışa taşıyordu.
            onClick={() => { setFormAcik(false); formuSifirla(); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          >
            <form
              onSubmit={kaydet}
              onClick={(e) => e.stopPropagation()}
              className="ni-card"
              style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}
            >
              <h3 className="ni-h3">{duzenlenenId ? 'Randevuyu Düzenle' : 'Yeni Randevu'} — {tarihBaslikStr(gun)}</h3>

              {resmiTatilMi(gun) && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#B91C1C', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>
                  Bu tarih resmi tatile denk geliyor: <strong>{resmiTatilMi(gun)?.ad}</strong>
                </div>
              )}

              {duzenlenenId && duzenlenenRandevu && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(10,22,40,0.08)' }}>
                  {(() => {
                    const durumBilgi = DURUM_ETIKET[duzenlenenRandevu.durum] || DURUM_ETIKET.planlandi;
                    const gecmis = new Date(duzenlenenRandevu.bitis) < new Date();
                    const aks = randevuAksiyonlari(duzenlenenRandevu.durum, gecmis);
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: 'rgba(10,22,40,0.5)' }}>Mevcut durum:</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg }}>
                            {durumBilgi.label}
                          </span>
                        </div>
                        {/* NOTYA-RANDEVU-14: iptal edilmiş randevunun ÇIKIŞ KAPISI. Burada daha önce
                            hiçbir şey yoktu — durum 'iptal' ise aksiyon satırının tamamı gizliydi,
                            dolayısıyla modal "Mevcut durum: İptal" rozetinden ibaret kalıyordu ve
                            doktorun elinde randevuyu geri açacak tek bir yol bulunmuyordu. */}
                        {duzenlenenRandevu.durum === 'iptal' && (
                          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#0A1628' }}>
                              Bu randevu iptal edildi{duzenlenenRandevu.iptalNedeni ? ` — ${duzenlenenRandevu.iptalNedeni}` : ''}. Tarih/saat değiştirip
                              Güncelle demek randevuyu yeniden aktif etmez; iptali geri almak için Aktif Hale Getir düğmesini kullanın.
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                              <button type="button" onClick={modalAktifEt} style={{ ...modalAksiyonBtn, background: '#0F9B8E', color: 'white', borderColor: '#0F9B8E', fontWeight: 700 }}>↺ Aktif Hale Getir</button>
                              <button type="button" onClick={modalSil} style={{ ...modalAksiyonBtn, color: CHROME_RENK.muted }}>Sil</button>
                            </div>
                          </div>
                        )}
                        {basariMesaji && (
                          <div style={{ fontSize: 12.5, color: '#0F9B8E', fontWeight: 600, marginTop: 8 }}>{basariMesaji}</div>
                        )}
                        {duzenlenenRandevu.durum !== 'iptal' && !modalIptalAcik && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {duzenlenenRandevu.patientId && (
                              <button type="button" onClick={() => router.push(`/session/new?patientId=${duzenlenenRandevu.patientId}&randevuBaslangic=${encodeURIComponent(duzenlenenRandevu.baslangic)}`)} style={{ ...modalAksiyonBtn, background: '#0F9B8E', color: 'white', borderColor: '#0F9B8E', fontWeight: 700 }}>🩺 Muayeneyi Başlat</button>
                            )}
                            {duzenlenenRandevu.patientId && (
                              <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${duzenlenenRandevu.patientId}`)} style={{ ...modalAksiyonBtn, color: '#0F9B8E', fontWeight: 600, borderColor: '#0F9B8E' }}>Hasta Dosyasını Aç</button>
                            )}
                            {duzenlenenRandevu.patientId && (
                              <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${duzenlenenRandevu.patientId}?tab=formu`)} style={{ ...modalAksiyonBtn, color: '#0F9B8E', borderColor: '#0F9B8E' }}>Hasta Formu</button>
                            )}
                            {aks.onayla && (
                              <button type="button" onClick={() => modalDurumDegistir('onaylandi')} style={modalAksiyonBtn}>Onayla</button>
                            )}
                            {aks.tamamlandi && (
                              <button type="button" onClick={() => modalDurumDegistir('tamamlandi')} style={modalAksiyonBtn}>Tamamlandı</button>
                            )}
                            {aks.gelmedi && (
                              <button type="button" onClick={() => modalDurumDegistir('gelmedi')} style={{ ...modalAksiyonBtn, color: '#F59E0B', borderColor: '#F59E0B' }}>Gelmedi</button>
                            )}
                            {aks.iptalEt && (
                              <button type="button" onClick={() => { setModalIptalNedeni(''); setModalIptalAcik(true); }} style={{ ...modalAksiyonBtn, color: '#EF4444', borderColor: '#EF4444' }}>İptal Et</button>
                            )}
                            <button type="button" onClick={modalSil} style={{ ...modalAksiyonBtn, color: CHROME_RENK.muted }}>Sil</button>
                          </div>
                        )}
                        {modalIptalAcik && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input
                              className="ni-input"
                              value={modalIptalNedeni}
                              onChange={(e) => setModalIptalNedeni(e.target.value)}
                              placeholder="İptal nedeni (isteğe bağlı)"
                              style={{ flex: 1 }}
                            />
                            <button type="button" onClick={() => modalDurumDegistir('iptal', modalIptalNedeni)} style={{ ...modalAksiyonBtn, background: '#EF4444', color: 'white', borderColor: '#EF4444' }}>Onayla</button>
                            <button type="button" onClick={() => { setModalIptalAcik(false); setModalIptalNedeni(''); }} style={modalAksiyonBtn}>Vazgeç</button>
                          </div>
                        )}
                        {/* NOTYA-ILETISIM-01: tell the patient from this device's own WhatsApp / mail */}
                        {!modalIptalAcik && (
                          <RandevuMesaji
                            key={duzenlenenRandevu.id}
                            randevuId={duzenlenenRandevu.id}
                            patientId={duzenlenenRandevu.patientId}
                            iptal={duzenlenenRandevu.durum === 'iptal'}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="ni-field">
                <label className="ni-label" htmlFor="randevu-hasta-ara">Hasta ara</label>
                <input
                  id="randevu-hasta-ara"
                  className="ni-input"
                  value={hastaArama}
                  onChange={(e) => { setHastaArama(e.target.value); setSeciliHasta(null); }}
                  onKeyDown={(e) => {
                    // Enter formu GÖNDERMEZ. Canlı hatada doktor "Hasta iki" yazıp Enter'a bastı
                    // ve doğrudan doğrulama hatasına düştü; Enter burada listeden seçme tuşu.
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (hastaSonuclari[aktifSonucIdx]) hastaSec(hastaSonuclari[aktifSonucIdx]);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setAktifSonucIdx((i) => Math.min(i + 1, Math.max(hastaSonuclari.length - 1, 0)));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setAktifSonucIdx((i) => Math.max(i - 1, 0));
                    }
                  }}
                  placeholder={hastaListesiYukleniyor ? 'Hastalar yükleniyor…' : 'Ad veya soyad yazın…'}
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={hastaSonuclari.length > 0 && !seciliHasta}
                  aria-controls="randevu-hasta-sonuclari"
                />
                {hastaSonuclari.length > 0 && !seciliHasta && (
                  <div className="ni-results" id="randevu-hasta-sonuclari" role="listbox">
                    {hastaSonuclari.map((h, idx) => (
                      <button
                        type="button"
                        key={h.id}
                        className="ni-result"
                        role="option"
                        aria-selected={idx === aktifSonucIdx}
                        onMouseEnter={() => setAktifSonucIdx(idx)}
                        onClick={() => hastaSec(h)}
                        style={idx === aktifSonucIdx ? { background: '#F5F8FF' } : undefined}
                      >
                        <span className="ni-result-name">{h.name}</span>
                        {/* Aynı adlı iki hasta varsa kayıt tarihi ayırt eder — başka bir kimlik
                            bilgisi listelemiyoruz, liste ekranına PHI taşımanın anlamı yok. */}
                        {(cakisanAdlar.get(trAramaNormalize(h.name)) || 0) > 1 && h.kayitTarihi && (
                          <span className="ni-result-brand">Kayıt: {new Date(h.kayitTarihi).toLocaleDateString('tr-TR')}</span>
                        )}
                      </button>
                    ))}
                    {hastaEslesmeleri.length > hastaSonuclari.length && (
                      <div style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(10,22,40,0.5)' }}>
                        {hastaEslesmeleri.length} sonuçtan ilk {hastaSonuclari.length} tanesi — yazmaya devam edin.
                      </div>
                    )}
                  </div>
                )}
                {seciliHasta && (
                  <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, background: '#ECFDF5', border: '2px solid #0F9B8E' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#0F766E', textTransform: 'uppercase' }}>Seçilen hasta</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', lineHeight: 1.2, marginTop: 2 }}>{seciliHasta.name}</div>
                    <button type="button" onClick={() => { setSeciliHasta(null); setKayitsizMod(false); }} style={{ marginTop: 8, background: 'none', border: 'none', color: CHROME_RENK.muted, cursor: 'pointer', textDecoration: 'underline', fontSize: 13, padding: 0 }}>değiştir</button>
                  </div>
                )}
                {/* NOTYA-RANDEVU-12: kayıtsız yola yalnız (a) gerçekten arayıp bulamayınca veya
                    (b) doktor açıkça "kayıtlı değil" deyince geçilir — kendiliğinden değil. */}
                {!seciliHasta && !kayitsizMod && aramaSonucsuz && (
                  <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#9A3412' }}>
                      “{aramaMetni}” için kayıtlı hasta bulunamadı.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setKayitsizMod(true); setSerbestAd(aramaMetni); }}
                      style={{ marginTop: 8, minHeight: 44, padding: '10px 14px', borderRadius: 8, border: '1px solid #F59E0B', background: '#F59E0B', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Hasta kayıtlı değil — kayıtsız randevu oluştur
                    </button>
                  </div>
                )}
                {!seciliHasta && !kayitsizMod && !aramaSonucsuz && (
                  <p className="ni-hint">
                    Yazdıkça kayıtlı hastalar listelenir (Türkçe I/İ farkı önemsiz). Hasta hiç kayıtlı değilse{' '}
                    <button
                      type="button"
                      onClick={() => { setKayitsizMod(true); setSerbestAd(aramaMetni); }}
                      style={{ background: 'none', border: 'none', padding: '8px 4px', color: '#2563EB', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      kayıtsız randevu oluşturun
                    </button>
                  </p>
                )}
                {!seciliHasta && kayitsizMod && (
                  <p className="ni-hint">
                    Kayıtsız randevu oluşturuluyor.{' '}
                    <button
                      type="button"
                      onClick={() => { setKayitsizMod(false); setSerbestAd(''); setSerbestTelefon(''); setSerbestEmail(''); }}
                      style={{ background: 'none', border: 'none', padding: '8px 4px', color: '#2563EB', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Vazgeç, kayıtlı hasta arayacağım
                    </button>
                  </p>
                )}
              </div>

              {!seciliHasta && kayitsizMod && kayitsizAdCakismasi.length > 0 && (
                <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                    Bu isimde kayıtlı hasta var. Kayıtsız devam ederseniz aynı kişi için ikinci bir dosya açılabilir.
                  </p>
                  <div className="ni-results">
                    {kayitsizAdCakismasi.map((h) => (
                      <button key={h.id} type="button" className="ni-result" onClick={() => hastaSec(h)}>
                        <span className="ni-result-name">{h.name}</span>
                        <span className="ni-result-brand">Bu kayıtlı hastaya bağla</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!seciliHasta && kayitsizMod && (
                <div className="ni-grid">
                  <div className="ni-field">
                    <label className="ni-label">Hasta adı *</label>
                    <input className="ni-input" value={serbestAd} onChange={(e) => setSerbestAd(e.target.value)} placeholder="Ad Soyad" />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label" htmlFor="randevu-serbest-telefon">Cep telefonu *</label>
                    <input
                      id="randevu-serbest-telefon"
                      className="ni-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={serbestTelefon}
                      onChange={(e) => { setSerbestTelefon(e.target.value); setTelefonHata(''); }}
                      placeholder="0532 123 45 67"
                      aria-invalid={telefonHata ? true : undefined}
                    />
                    {telefonHata && <div className="ni-error" style={{ marginTop: 6 }}>{telefonHata}</div>}
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">E-posta <span style={{ color: CHROME_RENK.muted, fontWeight: 400 }}>(isteğe bağlı — portal daveti için)</span></label>
                    <input className="ni-input" type="email" value={serbestEmail} onChange={(e) => setSerbestEmail(e.target.value)} placeholder="ornek@eposta.com" />
                  </div>
                </div>
              )}

              {/* NOTYA-BETA-0925 (Dr. Gökhan): kayıtlı hastanın cep telefonu — kayıttan dolar, yoksa zorunlu; hasta
                  kaydına yazılır. Tek kutu: WhatsApp'tan randevu ve form mesajı izni (doktor ve sekreter). */}
              {seciliHasta && (
                <div className="ni-field">
                  <label className="ni-label" htmlFor="randevu-cep-telefonu">
                    Cep telefonu{kayitliTelefon === '' ? ' *' : ''}
                  </label>
                  <input
                    id="randevu-cep-telefonu"
                    className="ni-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={hastaTelefon}
                    onChange={(e) => { setHastaTelefon(e.target.value); setTelefonHata(''); }}
                    placeholder={kayitliTelefon === null ? 'Yükleniyor…' : '0532 123 45 67'}
                    aria-invalid={telefonHata ? true : undefined}
                    aria-describedby="randevu-cep-telefonu-ipucu"
                  />
                  {telefonHata
                    ? <div className="ni-error" style={{ marginTop: 6 }}>{telefonHata}</div>
                    : (
                      <p className="ni-hint" id="randevu-cep-telefonu-ipucu">
                        {kayitliTelefon === ''
                          ? 'Hastanın kayıtlı telefonu yok — randevu için gerekli, hasta kaydına da yazılır. Yurt dışı numarası için + ile başlayın.'
                          : 'Hasta kaydındaki numara. Değiştirirseniz hasta kaydı da güncellenir.'}
                      </p>
                    )}
                  {whatsappIzniVar ? (
                    <p className="ni-hint" style={{ color: CHROME_RENK.pine, fontWeight: 600 }}>✓ WhatsApp mesaj izni kayıtlı.</p>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, fontSize: 14, lineHeight: 1.45, color: CHROME_RENK.ink, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={whatsappKabul}
                        onChange={(e) => setWhatsappKabul(e.target.checked)}
                        style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0, accentColor: CHROME_RENK.pine }}
                      />
                      Hasta, randevu ve form mesajlarını WhatsApp&apos;tan almayı kabul etti
                    </label>
                  )}
                </div>
              )}

              <div className="ni-grid">
                <div className="ni-field">
                  <label className="ni-label">Tarih *</label>
                  <input className="ni-input" type="date" value={tarihInputStr(gun)} onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Saat *</label>
                  {/* NOTYA-RANDEVU: native <input type="time" step=900> Safari/iOS'ta step'i yok sayıp dakika çarkı açıyordu
                      (Kaan, 2026-09-09: "YINE dakikalık"). Her tarayıcıda aynı davranan 15 dk'lık liste: 07:00–21:45.
                      Düzenlemede 15'e bölünmeyen eski bir saat varsa listeye o tek değer de eklenir. */}
                  <select className="ni-input" value={saat} onChange={(e) => setSaat(e.target.value)}>
                    {(() => {
                      const slotlar: string[] = []
                      for (let h = 7; h <= 21; h++) for (const m of [0, 15, 30, 45]) slotlar.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                      if (saat && !slotlar.includes(saat)) slotlar.push(saat)
                      return slotlar.sort().map((s) => <option key={s} value={s}>{s}</option>)
                    })()}
                  </select>
                </div>
                <div className="ni-field">
                  <label className="ni-label">Süre (dk) *</label>
                  <input className="ni-input" type="number" min={5} step={5} value={sureDk} onChange={(e) => setSureDk(Math.max(5, Number(e.target.value) || 20))} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Tür</label>
                  <select className="ni-input" value={tur} onChange={(e) => setTur(e.target.value)}>
                    {Object.entries(TUR_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const formSlotBas = new Date(`${yerelGunAnahtari(gun)}T${saat}:00+03:00`)
                const formSlotBit = new Date(formSlotBas.getTime() + sureDk * 60000)
                const gunListe = siraliGunlukRandevular.filter((r) => r.durum !== 'iptal' && r.id !== duzenlenenId)
                const cakisan = gunListe.filter((r) => new Date(r.baslangic) < formSlotBit && new Date(r.bitis) > formSlotBas)
                return (
                  <div style={{ margin: '4px 0 12px', padding: '10px 12px', borderRadius: 10, background: cakisan.length ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${cakisan.length ? '#FECACA' : 'rgba(10,22,40,0.08)'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cakisan.length ? '#991B1B' : '#334155', marginBottom: 6 }}>
                      {cakisan.length ? `Bu saat dolu (${cakisan.map((r) => r.hastaAdi).join(', ')})` : `Bu günün randevuları${gunListe.length ? ` (${gunListe.length})` : ''}`}
                    </div>
                    {gunListe.length === 0 ? (
                      <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Bu günde başka randevu yok — {saat} boş.</div>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#0A1628', lineHeight: 1.55 }}>
                        {gunListe.map((r) => {
                          const dolu = cakisan.some((c) => c.id === r.id)
                          return (
                            <li key={r.id} style={{ fontWeight: dolu ? 800 : 500, color: dolu ? '#991B1B' : undefined }}>
                              {saatStr(r.baslangic)}–{saatStr(r.bitis)} {r.hastaAdi}
                              {dolu ? ' — çakışıyor' : ''}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })()}

              <div className="ni-field">
                <label className="ni-label">Hasta Durumu</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#0A1628' }}>
                    <input
                      type="checkbox"
                      checked={hastaDurumu === 'saglikli'}
                      onChange={() => setHastaDurumu(hastaDurumu === 'saglikli' ? '' : 'saglikli')}
                    />
                    Sağlam
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#0A1628' }}>
                    <input
                      type="checkbox"
                      checked={hastaDurumu === 'sikayetli'}
                      onChange={() => setHastaDurumu(hastaDurumu === 'sikayetli' ? '' : 'sikayetli')}
                    />
                    Hasta
                  </label>
                </div>
              </div>

              <div className="ni-field">
                <label className="ni-label">Not / Şikayet</label>
                <textarea className="ni-input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="İsteğe bağlı" rows={3} style={{ resize: 'vertical', minHeight: 64 }} />
              </div>

              {hata && <div className="ni-error">{hata}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="ni-btn" disabled={kaydediliyor} style={{ flex: 1 }}>
                  {kaydediliyor ? 'Kaydediliyor…' : duzenlenenId ? 'Güncelle' : 'Randevuyu Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormAcik(false); formuSifirla(); }}
                  style={{ background: 'rgba(10,22,40,0.08)', border: 'none', color: '#0A1628', borderRadius: 10, padding: '0 20px' }}
                >Vazgeç</button>
              </div>
            </form>
          </div>
        )}

        {/* NOTYA-BETA-0925: kayıttan sonra tek, sakin soru — Hasta Bilgi Formu WhatsApp'tan gitsin mi? Gönderim
            her zamanki tek düğmeyle (GonderDugmesi, tür bilgi_formu), bu cihazın kendi WhatsApp'ından. */}
        {formSorusu && !formAcik && (
          <div
            role="dialog"
            aria-label="Hasta Bilgi Formu"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', padding: '0 12px 16px', zIndex: 190, pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 480, background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 18, padding: 16, boxShadow: '0 8px 28px rgba(47,67,52,0.18)', color: CHROME_RENK.ink }}>
              {!formLinki ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Randevu kaydedildi.</div>
                  <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
                    Hasta Bilgi Formu’nu WhatsApp’tan gönderelim mi?
                    <span style={{ display: 'block', fontSize: 13, color: CHROME_RENK.muted, marginTop: 2 }}>{formSorusu.ad}</span>
                  </div>
                  {formLinkiHata && <div className="ni-error" style={{ marginBottom: 10 }}>{formLinkiHata}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => void formLinkiHazirla()}
                      disabled={formLinkiHazirlaniyor}
                      style={{ flex: 1, minHeight: 48, borderRadius: 14, border: 'none', background: CHROME_RENK.pine, color: CHROME_RENK.paper, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {formLinkiHazirlaniyor ? 'Hazırlanıyor…' : 'Evet, gönder'}
                    </button>
                    <button
                      type="button"
                      onClick={formSorusunuKapat}
                      style={{ flex: 1, minHeight: 48, borderRadius: 14, border: `1px solid ${CHROME_RENK.border}`, background: CHROME_RENK.paper, color: CHROME_RENK.ink, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Şimdi değil
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <GonderDugmesi
                    acikBaslat
                    tur="bilgi_formu"
                    patientId={formSorusu.patientId}
                    link={formLinki}
                    onGonderildi={() => setTimeout(formSorusunuKapat, 1500)}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button type="button" onClick={formSorusunuKapat} style={{ background: 'none', border: 'none', color: CHROME_RENK.muted, fontSize: 14, cursor: 'pointer', padding: 6 }}>Kapat</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const miniNavBtn: React.CSSProperties = {
  background: 'rgba(58,44,34,0.1)',
  border: 'none',
  color: CHROME_RENK.ink,
  borderRadius: 8,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 14,
};

const panelNavBtn: React.CSSProperties = {
  background: 'rgba(58,44,34,0.08)',
  border: 'none',
  color: CHROME_RENK.ink,
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 15,
};

// Dokunma hedefi: 12px yazı + 6px dolgu 28px'lik bir düğme yapıyordu — telefonda isabet
// ettirmesi zor. minHeight 36 + inline-flex ortalama, satır sarmasını bozmadan büyütür.
const aksiyonBtn: React.CSSProperties = {
  background: 'rgba(58,44,34,0.08)',
  border: 'none',
  color: CHROME_RENK.ink,
  borderRadius: 8,
  padding: '6px 12px',
  minHeight: 36,
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 12,
  cursor: 'pointer',
};

const modalAksiyonBtn: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(10,22,40,0.15)',
  color: '#0A1628',
  borderRadius: 8,
  padding: '6px 12px',
  minHeight: 36,
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 12,
  cursor: 'pointer',
};
