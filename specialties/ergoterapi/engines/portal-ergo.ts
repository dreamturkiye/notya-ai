export function ergomHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Ev programı / seans tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Ergoterapi seansı', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
export function ergoRitim(): string[] {
  return ['GYA seans tarihi uzmanın kaydıyladır', 'Altı hafta GYA gözden geçirme', 'Bağımsızlık skoru yoktur']
}
