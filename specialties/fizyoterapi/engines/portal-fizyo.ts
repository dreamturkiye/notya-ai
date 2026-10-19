export function fizyomHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Ev egzersizi / seans tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Sonraki fizyoterapi seansı', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
export function fizyoRitim(): string[] {
  return ['Seans tarihi uzmanın kaydıyladır', 'Ev programı kontrolü', 'Dört hafta gözden geçirme', 'Ev programı reçete değildir']
}
