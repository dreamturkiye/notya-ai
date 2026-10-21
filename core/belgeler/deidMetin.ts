/** NOTYA-BELGE-DEID-02 — user-visible copy for the automatic de-identification step. Turkish is the default (Türkiye
 *  build, KVKK wording); country builds pass their own code and never show Turkish. */
export type DeIdMetin = {
  /** Small non-intrusive line: the doctor sees the ORIGINAL; only the outbound copy is masked. */
  kopyadaGizli: string
  yukleniyor: string; yedekUyari: string; yedekOnay: string
  /** Skipped by the automatic flow because masking failed; stays in Belgeler for manual evaluation. */
  atlandi: string
  chipAd: string; chipMuayene: (t: string) => string; chipDogum: string; chipProtokol: string
  adUyusmuyor: string
}

const TR: DeIdMetin = {
  kopyadaGizli: 'Kimlik bilgileri değerlendirme için gönderilen kopyada otomatik gizlenir',
  atlandi: 'Kimlik gizlenemedi, otomatik değerlendirilmedi',
  chipAd: 'Ad bulundu', chipMuayene: (t) => `Muayene tarihi: ${t}`, chipDogum: 'Doğum tarihi bulundu', chipProtokol: 'Protokol no bulundu',
  adUyusmuyor: 'Görüntüdeki ad hasta adıyla eşleşmiyor',
  yukleniyor: 'Kimlik bilgileri taranıyor ve gizleniyor…',
  yedekUyari: 'Otomatik gizleme yapılamadı. Göndermeden önce görüntüde ad, doğum tarihi, protokol no gibi kimlik bilgisi olmadığını onaylayın.',
  yedekOnay: 'Görüntüde ad, doğum tarihi, protokol no gibi kimlik bilgisi yok. (Fotoğraf üst verisi cihazınızda temizlenir; yalnız kimliksiz kopya gönderilir.)',
}
const EN: DeIdMetin = {
  kopyadaGizli: 'Identifying details are hidden automatically in the copy sent for evaluation',
  atlandi: 'Identity could not be hidden, not evaluated automatically',
  chipAd: 'Name found', chipMuayene: (t) => `Exam date: ${t}`, chipDogum: 'Date of birth found', chipProtokol: 'Record number found',
  adUyusmuyor: 'The name in the image does not match the patient\'s name',
  yukleniyor: 'Scanning and hiding identifying details…',
  yedekUyari: 'Automatic masking could not be completed. Before sending, confirm the image shows no name, date of birth, MRN / patient ID or similar identifier.',
  yedekOnay: 'The image shows no name, date of birth, MRN / patient ID or similar identifier. (Photo metadata is removed on your device; only the de-identified copy is sent.)',
}
const RU: DeIdMetin = {
  kopyadaGizli: 'Идентифицирующие данные автоматически скрываются в копии, отправляемой на оценку',
  atlandi: 'Не удалось скрыть данные, автоматическая оценка не выполнена',
  chipAd: 'Имя найдено', chipMuayene: (t) => `Дата исследования: ${t}`, chipDogum: 'Дата рождения найдена', chipProtokol: 'Номер записи найден',
  adUyusmuyor: 'Имя на изображении не совпадает с именем пациента',
  yukleniyor: 'Идентифицирующие данные ищутся и скрываются…',
  yedekUyari: 'Автоматическое скрытие не удалось. Перед отправкой подтвердите, что на снимке нет ФИО, даты рождения, номера карты / ПИНФЛ и подобных данных.',
  yedekOnay: 'На снимке нет ФИО, даты рождения, номера карты / ПИНФЛ и подобных данных. (Метаданные фото удаляются на вашем устройстве; отправляется только обезличенная копия.)',
}

export function deIdMetin(ulke?: string): DeIdMetin {
  const k = (ulke || 'tr').toLowerCase()
  if (k === 'tr') return TR
  if (k === 'uz') return RU
  return EN
}
