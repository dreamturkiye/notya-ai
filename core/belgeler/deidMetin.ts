/** NOTYA-BELGE-DEID-02 — user-visible copy for the automatic de-identification step. Turkish is the default (Türkiye
 *  build, KVKK wording); country builds pass their own code and never show Turkish. */
export type DeIdMetin = { maskelendi: string; yukleniyor: string; yedekUyari: string; yedekOnay: string; onizlemeBaslik: string }

const TR: DeIdMetin = {
  maskelendi: 'Kimlik bilgileri otomatik gizlendi',
  yukleniyor: 'Kimlik bilgileri taranıyor ve gizleniyor…',
  yedekUyari: 'Otomatik gizleme yapılamadı. Göndermeden önce görüntüde ad, doğum tarihi, protokol no gibi kimlik bilgisi olmadığını onaylayın.',
  yedekOnay: 'Görüntüde ad, doğum tarihi, protokol no gibi kimlik bilgisi yok. (Fotoğraf üst verisi cihazınızda temizlenir; yalnız kimliksiz kopya gönderilir.)',
  onizlemeBaslik: 'Asistana gidecek kopya',
}
const EN: DeIdMetin = {
  maskelendi: 'Identifying details were hidden automatically',
  yukleniyor: 'Scanning and hiding identifying details…',
  yedekUyari: 'Automatic masking could not be completed. Before sending, confirm the image shows no name, date of birth, MRN / patient ID or similar identifier.',
  yedekOnay: 'The image shows no name, date of birth, MRN / patient ID or similar identifier. (Photo metadata is removed on your device; only the de-identified copy is sent.)',
  onizlemeBaslik: 'Copy that will be sent to the assistant',
}
const RU: DeIdMetin = {
  maskelendi: 'Идентифицирующие данные скрыты автоматически',
  yukleniyor: 'Идентифицирующие данные ищутся и скрываются…',
  yedekUyari: 'Автоматическое скрытие не удалось. Перед отправкой подтвердите, что на снимке нет ФИО, даты рождения, номера карты / ПИНФЛ и подобных данных.',
  yedekOnay: 'На снимке нет ФИО, даты рождения, номера карты / ПИНФЛ и подобных данных. (Метаданные фото удаляются на вашем устройстве; отправляется только обезличенная копия.)',
  onizlemeBaslik: 'Копия, которая будет отправлена ассистенту',
}

export function deIdMetin(ulke?: string): DeIdMetin {
  const k = (ulke || 'tr').toLowerCase()
  if (k === 'tr') return TR
  if (k === 'uz') return RU
  return EN
}
