export function isitmemHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Kontrol / cihaz ayarı tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Odyoloji kontrolü', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
export function odyoRitim(): string[] {
  return ['Kontrol tarihi uzmanın kaydıyladır', 'Eşik sayısı ve cihaz raporu yoktur']
}
