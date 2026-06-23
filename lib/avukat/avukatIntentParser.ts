export function quickClassifyLegal(message: string): string {
  const keywords = message.toLowerCase().split(' ');

  if (keywords.includes('dilekçe') || keywords.includes('talimat')) return 'DILEKCE_OLUSTUR';
  if (keywords.includes('müvekkeli') || keywords.includes(' müşavir')) return 'MUVEKKEL_EKLE';
  if (keywords.includes('süre') || keywords.includes('tarih')) return 'SURE_TAKIP';
  if (keywords.includes('strateji') || keywords.includes('planlama')) return 'STRATEJI_SOR';
  if (keywords.includes('emsal') || keywords.includes('eşya')) return 'EMSAL_ARA';

  return 'GENEL';
}
