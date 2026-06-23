export const DILEKCE_TURLERI: Record<string, {baslik:string;mahkeme_turu:string;kanun_dayanagi:string;zorunlu_alanlar:string[];sablon:string}> = {
  itiraz_dilekce:{baslik:'Itiraz Dilekcesi',mahkeme_turu:'Asliye Hukuk Mahkemesi',kanun_dayanagi:'HMK 346',zorunlu_alanlar:['muvekkil_adi','konu','itiraz_gerekce'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nKonu: {{konu}}\nACIKLAMA:\n{{itiraz_gerekce}}\nHUKUKI DAYANAK: HMK 346\nSONUC: Itirazimizin kabulunu arz ederiz.'},
  dava_acilis:{baslik:'Dava Acilis Dilekcesi',mahkeme_turu:'Asliye Hukuk Mahkemesi',kanun_dayanagi:'HMK 119',zorunlu_alanlar:['muvekkil_adi','davali_adi','dava_konusu','talep_miktari'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nDavali: {{davali_adi}}\nTalep: {{talep_miktari}} TL\nACIKLAMA:\n{{dava_konusu}}\nHUKUKI DAYANAK: HMK 119\nSONUC: Tahsiline karar verilmesini arz ederiz.'},
  nafaka_talebi:{baslik:'Nafaka Talebi',mahkeme_turu:'Aile Mahkemesi',kanun_dayanagi:'TMK 182',zorunlu_alanlar:['muvekkil_adi','karsi_taraf','nafaka_miktari'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nDavali: {{karsi_taraf}}\nKonu: Nafaka Talebi\nHUKUKI DAYANAK: TMK 182\nSONUC: Aylik {{nafaka_miktari}} TL nafakaya hukmedilmesini arz ederiz.'},
  bosanma_davasi:{baslik:'Bosanma Davasi',mahkeme_turu:'Aile Mahkemesi',kanun_dayanagi:'TMK 166',zorunlu_alanlar:['muvekkil_adi','es_adi','evlilik_tarihi','bosanma_gerekce'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nDavali: {{es_adi}}\nEvlilik: {{evlilik_tarihi}}\nACIKLAMA:\n{{bosanma_gerekce}}\nHUKUKI DAYANAK: TMK 166\nSONUC: Bosanmaya karar verilmesini arz ederiz.'},
  is_akdi_feshi:{baslik:'Haksiz Fesih Dilekcesi',mahkeme_turu:'Is Mahkemesi',kanun_dayanagi:'Is K. 17-18',zorunlu_alanlar:['muvekkil_adi','fesih_tarihi','fesih_gerekce'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nFesih: {{fesih_tarihi}}\nACIKLAMA: {{fesih_gerekce}}\nHUKUKI DAYANAK: Is K. 17,18,19\nSONUC: Tazminat tahsiline karar verilmesini arz ederiz.'},
  icra_itiraz:{baslik:'Icra Itiraz',mahkeme_turu:'Icra Hukuk Mahkemesi',kanun_dayanagi:'IIK 62',zorunlu_alanlar:['muvekkil_adi','alacakli_adi','takip_no','itiraz_gerekce'],sablon:'{{mahkeme}} BASKANLIGINA\nBorclu: {{muvekkil_adi}}\nAlacakli: {{alacakli_adi}}\nTakip: {{takip_no}}\nACIKLAMA: {{itiraz_gerekce}}\nHUKUKI DAYANAK: IIK 62\nSONUC: Itirazimizin kabulune ve takibin durdurulmasina karar verilmesini arz ederiz.'},
  idari_itiraz:{baslik:'Idari Islem Iptali',mahkeme_turu:'Idare Mahkemesi',kanun_dayanagi:'IYUK 7',zorunlu_alanlar:['muvekkil_adi','idare_adi','islem_tarihi','iptal_gerekce'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nDavali: {{idare_adi}}\nIslem: {{islem_tarihi}}\nACIKLAMA: {{iptal_gerekce}}\nHUKUKI DAYANAK: IYUK 7\nSONUC: Islemin iptaline karar verilmesini arz ederiz.'},
  tespit_talebi:{baslik:'Tespit Dilekcesi',mahkeme_turu:'Asliye Hukuk Mahkemesi',kanun_dayanagi:'HMK 106',zorunlu_alanlar:['muvekkil_adi','tespit_konusu'],sablon:'{{mahkeme}} BASKANLIGINA\nDavaci: {{muvekkil_adi}}\nKonu: {{tespit_konusu}}\nHUKUKI DAYANAK: HMK 106\nSONUC: Tespitine karar verilmesini arz ederiz.'},
}

export function buildDilekceSystemPrompt(turId:string,avukat:{name:string;baro:string},muvekkil:Record<string,unknown>|null):string{
  const tur=DILEKCE_TURLERI[turId]
  if(!tur) return 'Gecersiz tur'
  return 'Sen deneyimli bir Turk avukatinin yazisma asistanisin.
'+tur.baslik+' olusturacaksin. Mahkeme: '+tur.mahkeme_turu+'. Kanun: '+tur.kanun_dayanagi+'.
Avukat: '+avukat.name+' Baro: '+avukat.baro+'
'+(muvekkil?'Muvekkil: '+JSON.stringify(muvekkil):'')+'
Sablon: '+tur.sablon+'
Yaniti SADECE JSON formatinda ver: {"dilekce_metni":"...","eksik_bilgiler":[],"uyarilar":[]}'
}
