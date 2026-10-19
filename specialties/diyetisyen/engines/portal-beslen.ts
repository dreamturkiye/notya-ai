export function beslenmemHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Kontrol / plan tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Beslenme kontrolü', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
export function beslenRitim(): string[] {
  return ['2 / 4 / 8. hafta kontrol ritmi', '12. hafta geç kontrol', 'Kalori hedefi burada kilitlenmez']
}
