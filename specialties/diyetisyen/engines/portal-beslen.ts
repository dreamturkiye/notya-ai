export function beslenmemHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Kontrol / plan tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Beslenme kontrolü', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
