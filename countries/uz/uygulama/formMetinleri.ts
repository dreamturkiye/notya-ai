/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: every sentence of the INTAKE FORM's screens, in the three forms of the application:
 *
 *   uz-Latn   Uzbek, Latin script       uz-Cyrl   Uzbek, Cyrillic script       ru   Russian
 *
 *   hekim   the doctor's controls (the patient's file, an appointment, the visit screen)
 *   davet   the INVITATION the doctor copies and sends to the patient
 *   hasta   the form as the PATIENT sees it on their own page
 *   birim   the names of the units of measure the pack uses (centimetres, kilograms, degrees Celsius)
 *
 * THE QUESTIONS ARE NOT HERE: they are clinical content and live in ../klinik/hastaFormu/.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Nobody who speaks Uzbek or Russian as a first language has read this
 * text yet. `davet` and `hasta` are PATIENT-FACING: a patient reads the invitation in a messenger under the
 * doctor's own name, and the form on their own phone, with nobody beside them to explain. They come first for the
 * native reader, and must be read and corrected before a real doctor asks a patient to fill in a form
 * (docs/COUNTRY-PACK-UZBEKISTAN.md, "The intake form"; checklist C13, E8, E11).
 * The Cyrillic form was written by hand, line by line — it is not a transliteration at run time.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Same rules as the other catalogues of this folder: the shape is the kit's type (FormMetni), so a missing key in
 * any form is a type error and fails the build. Written fresh for Uzbekistan — there is no Turkish source.
 * Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi. The Cyrillic and Russian forms carry
 * no Latin letter (the code is «ПИН-код», and the degree sign is followed by the Cyrillic letter).
 *
 * THE PIN IS NEVER IN THE INVITATION: the doctor tells it separately. The address of the patient's page is the LAST
 * thing in the text, with nothing after it, so that a messenger does not glue a full stop to the link.
 *
 * PLACEHOLDERS: '%' one value; '%1' and '%2' two (each key of the type says which).
 */
import type { FormMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { UzUygulamaDili } from './metinler'

const UZ_LATN: FormMetni = {
  hekim: {
    baslik: 'Koʻrikdan oldingi soʻrovnoma',
    aciklama: 'Bemor koʻrikdan oldin oʻz sahifasida qisqa soʻrovnomani toʻldiradi: avval umumiy savollar, keyin sizning yoʻnalishingiz savollari. Tizim bemorga hech narsa yubormaydi.',
    durumYok: 'Bu bemordan soʻrovnoma hali soʻralmagan.',
    durumBekliyor: 'Soʻrovnoma % kuni soʻralgan. Bemor hali boshlamagan.',
    durumTaslak: 'Bemor toʻldirishni boshlagan, lekin hali yubormagan. Oxirgi saqlash: %.',
    durumGonderildi: 'Bemor soʻrovnomani % kuni yuborgan.',
    iste: 'Soʻrovnomani toʻldirishni soʻrash',
    bekliyor: 'Kuting…',
    yapilamadi: 'Bajarib boʻlmadi. Qaytadan urinib koʻring.',
    istendi: 'Soʻrovnoma bemor sahifasida kutmoqda.',
    acikVar: 'Bu bemorda toʻldirilmagan soʻrovnoma bor edi: u oʻz holicha qoldirildi.',
    davetBaslik: 'Taklif matni',
    davetDil: 'Matn tili (bemorning tili)',
    davetIzoh: 'Hech narsa avtomatik yuborilmaydi: matnni bemorga oʻzingiz yuborasiz. PIN-kodni alohida ayting.',
    baglantiVar: 'Bu bemorning havolasi bor. Uni qayta koʻrsatib boʻlmaydi, shuning uchun matnda havola yoʻq: bemor oʻzidagi havolani ochadi.',
    yeniBaglanti: 'Yangi havola berish va matnga qoʻshish',
    yeniBaglantiUyari: 'Yangi havola bersangiz, bemordagi eski havola shu zahoti ishlamay qoladi va PIN-kod ham oʻzgaradi. Bemorga yangi havolani ham, yangi PIN-kodni ham berishingiz kerak boʻladi.',
    yeniBaglantiOnay: 'Ha, yangi havola berilsin',
    vazgec: 'Bekor qilish',
    cevaplar: 'Bemorning javoblari',
    beyan: 'Bemorning oʻz soʻzlari. Tekshirilmagan.',
    veliBeyani: 'Ota-onasi yoki qonuniy vakili toʻldirgan. Tekshirilmagan.',
    notaGirmez: 'Bu javoblar qayd yozilishida ishlatilmaydi.',
    surumFarkli: 'Bu soʻrovnoma soʻralganidan keyin savollar roʻyxati oʻzgargan: ayrim javoblar koʻrsatilmasligi mumkin.',
    yenidenAc: 'Qayta ochish',
    yenidenAcUyari: 'Qayta ochilgach, bemor javoblarini oʻzgartira oladi va soʻrovnomani yana yuborishi kerak boʻladi.',
    yenidenAcildi: 'Soʻrovnoma qayta ochildi.',
    geriCek: 'Soʻrovni bekor qilish',
    geriCekildi: 'Soʻrov bekor qilindi. Soʻrovnoma bemor sahifasidan olib tashlandi.',
    oncekiler: 'Avvalgi soʻrovnomalar',
  },
  // PATIENT-FACING. The address comes last, with nothing after it.
  davet: {
    metin: 'Assalomu alaykum! Shifokor %1 koʻrikdan oldin qisqa soʻrovnomani toʻldirishingizni soʻraydi. PIN-kodni shifokoringiz alohida aytadi. Sahifangiz havolasi: %2',
    metinAdsiz: 'Assalomu alaykum! Shifokoringiz koʻrikdan oldin qisqa soʻrovnomani toʻldirishingizni soʻraydi. PIN-kodni shifokoringiz alohida aytadi. Sahifangiz havolasi: %',
    baglantisiz: 'Assalomu alaykum! Shifokor % koʻrikdan oldin qisqa soʻrovnomani toʻldirishingizni soʻraydi. Buning uchun sizga avval berilgan havola orqali sahifangizni oching.',
    baglantisizAdsiz: 'Assalomu alaykum! Shifokoringiz koʻrikdan oldin qisqa soʻrovnomani toʻldirishingizni soʻraydi. Buning uchun sizga avval berilgan havola orqali sahifangizni oching.',
  },
  // PATIENT-FACING.
  hasta: {
    bekliyorBaslik: 'Koʻrikdan oldingi soʻrovnoma',
    bekliyorAciklama: 'Shifokoringiz koʻrikdan oldin bir necha savolga javob berishingizni soʻraydi. Bu bir necha daqiqa vaqt oladi.',
    veliAciklama: 'Shifokor koʻrikdan oldin farzandingiz haqida bir necha savolga javob berishingizni soʻraydi. Bu bir necha daqiqa vaqt oladi.',
    baslat: 'Toʻldirishni boshlash',
    devam: 'Davom ettirish',
    yenidenAcildi: 'Shifokoringiz soʻrovnomani qayta ochdi. Javoblaringizni koʻrib chiqing va yana yuboring.',
    rizaBaslik: 'Boshlashdan oldin',
    rizaKabul: 'Roziman',
    rizaGerekli: 'Davom etish uchun roziligingiz kerak.',
    zorunlu: 'majburiy',
    evet: 'Ha',
    hayir: 'Yoʻq',
    kaydediliyor: 'Saqlanmoqda…',
    kaydedildi: 'Javoblaringiz saqlandi.',
    kaydedilemedi: 'Saqlab boʻlmadi. Internetni tekshirib, qaytadan urinib koʻring.',
    ileri: 'Keyingi',
    geri: 'Orqaga',
    bolum: '%1-qism, jami %2',
    gonder: 'Shifokorga yuborish',
    gonderiliyor: 'Yuborilmoqda…',
    gonderilemedi: 'Yuborib boʻlmadi. Qaytadan urinib koʻring.',
    gonderUyari: 'Yuborganingizdan keyin javoblaringizni oʻqiy olasiz, lekin oʻzgartira olmaysiz.',
    eksik: 'Majburiy deb belgilangan savollarga javob bering.',
    sayiGecersiz: '%1 dan %2 gacha boʻlgan son kiriting.',
    gonderildiBaslik: 'Soʻrovnoma yuborildi',
    gonderildi: 'Soʻrovnomani % kuni yuborgansiz. Shifokoringiz uni koʻrikdan oldin oʻqiydi.',
    cevaplarim: 'Javoblarim',
    degistirilemez: 'Javoblarni oʻzgartirib boʻlmaydi. Biror narsa notoʻgʻri boʻlsa, shifokoringizga ayting.',
    kapat: 'Sahifamga qaytish',
  },
  birim: { cm: 'sm', kg: 'kg', C: '°C' },
}

const UZ_CYRL: FormMetni = {
  hekim: {
    baslik: 'Кўрикдан олдинги сўровнома',
    aciklama: 'Бемор кўрикдан олдин ўз саҳифасида қисқа сўровномани тўлдиради: аввал умумий саволлар, кейин сизнинг йўналишингиз саволлари. Тизим беморга ҳеч нарса юбормайди.',
    durumYok: 'Бу бемордан сўровнома ҳали сўралмаган.',
    durumBekliyor: 'Сўровнома % куни сўралган. Бемор ҳали бошламаган.',
    durumTaslak: 'Бемор тўлдиришни бошлаган, лекин ҳали юбормаган. Охирги сақлаш: %.',
    durumGonderildi: 'Бемор сўровномани % куни юборган.',
    iste: 'Сўровномани тўлдиришни сўраш',
    bekliyor: 'Кутинг…',
    yapilamadi: 'Бажариб бўлмади. Қайтадан уриниб кўринг.',
    istendi: 'Сўровнома бемор саҳифасида кутмоқда.',
    acikVar: 'Бу беморда тўлдирилмаган сўровнома бор эди: у ўз ҳолича қолдирилди.',
    davetBaslik: 'Таклиф матни',
    davetDil: 'Матн тили (беморнинг тили)',
    davetIzoh: 'Ҳеч нарса автоматик юборилмайди: матнни беморга ўзингиз юборасиз. ПИН-кодни алоҳида айтинг.',
    baglantiVar: 'Бу беморнинг ҳаволаси бор. Уни қайта кўрсатиб бўлмайди, шунинг учун матнда ҳавола йўқ: бемор ўзидаги ҳаволани очади.',
    yeniBaglanti: 'Янги ҳавола бериш ва матнга қўшиш',
    yeniBaglantiUyari: 'Янги ҳавола берсангиз, бемордаги эски ҳавола шу заҳоти ишламай қолади ва ПИН-код ҳам ўзгаради. Беморга янги ҳаволани ҳам, янги ПИН-кодни ҳам беришингиз керак бўлади.',
    yeniBaglantiOnay: 'Ҳа, янги ҳавола берилсин',
    vazgec: 'Бекор қилиш',
    cevaplar: 'Беморнинг жавоблари',
    beyan: 'Беморнинг ўз сўзлари. Текширилмаган.',
    veliBeyani: 'Ота-онаси ёки қонуний вакили тўлдирган. Текширилмаган.',
    notaGirmez: 'Бу жавоблар қайд ёзилишида ишлатилмайди.',
    surumFarkli: 'Бу сўровнома сўралганидан кейин саволлар рўйхати ўзгарган: айрим жавоблар кўрсатилмаслиги мумкин.',
    yenidenAc: 'Қайта очиш',
    yenidenAcUyari: 'Қайта очилгач, бемор жавобларини ўзгартира олади ва сўровномани яна юбориши керак бўлади.',
    yenidenAcildi: 'Сўровнома қайта очилди.',
    geriCek: 'Сўровни бекор қилиш',
    geriCekildi: 'Сўров бекор қилинди. Сўровнома бемор саҳифасидан олиб ташланди.',
    oncekiler: 'Аввалги сўровномалар',
  },
  // PATIENT-FACING. The address comes last, with nothing after it.
  davet: {
    metin: 'Ассалому алайкум! Шифокор %1 кўрикдан олдин қисқа сўровномани тўлдиришингизни сўрайди. ПИН-кодни шифокорингиз алоҳида айтади. Саҳифангиз ҳаволаси: %2',
    metinAdsiz: 'Ассалому алайкум! Шифокорингиз кўрикдан олдин қисқа сўровномани тўлдиришингизни сўрайди. ПИН-кодни шифокорингиз алоҳида айтади. Саҳифангиз ҳаволаси: %',
    baglantisiz: 'Ассалому алайкум! Шифокор % кўрикдан олдин қисқа сўровномани тўлдиришингизни сўрайди. Бунинг учун сизга аввал берилган ҳавола орқали саҳифангизни очинг.',
    baglantisizAdsiz: 'Ассалому алайкум! Шифокорингиз кўрикдан олдин қисқа сўровномани тўлдиришингизни сўрайди. Бунинг учун сизга аввал берилган ҳавола орқали саҳифангизни очинг.',
  },
  // PATIENT-FACING.
  hasta: {
    bekliyorBaslik: 'Кўрикдан олдинги сўровнома',
    bekliyorAciklama: 'Шифокорингиз кўрикдан олдин бир неча саволга жавоб беришингизни сўрайди. Бу бир неча дақиқа вақт олади.',
    veliAciklama: 'Шифокор кўрикдан олдин фарзандингиз ҳақида бир неча саволга жавоб беришингизни сўрайди. Бу бир неча дақиқа вақт олади.',
    baslat: 'Тўлдиришни бошлаш',
    devam: 'Давом эттириш',
    yenidenAcildi: 'Шифокорингиз сўровномани қайта очди. Жавобларингизни кўриб чиқинг ва яна юборинг.',
    rizaBaslik: 'Бошлашдан олдин',
    rizaKabul: 'Розиман',
    rizaGerekli: 'Давом этиш учун розилигингиз керак.',
    zorunlu: 'мажбурий',
    evet: 'Ҳа',
    hayir: 'Йўқ',
    kaydediliyor: 'Сақланмоқда…',
    kaydedildi: 'Жавобларингиз сақланди.',
    kaydedilemedi: 'Сақлаб бўлмади. Интернетни текшириб, қайтадан уриниб кўринг.',
    ileri: 'Кейинги',
    geri: 'Орқага',
    bolum: '%1-қисм, жами %2',
    gonder: 'Шифокорга юбориш',
    gonderiliyor: 'Юборилмоқда…',
    gonderilemedi: 'Юбориб бўлмади. Қайтадан уриниб кўринг.',
    gonderUyari: 'Юборганингиздан кейин жавобларингизни ўқий оласиз, лекин ўзгартира олмайсиз.',
    eksik: 'Мажбурий деб белгиланган саволларга жавоб беринг.',
    sayiGecersiz: '%1 дан %2 гача бўлган сон киритинг.',
    gonderildiBaslik: 'Сўровнома юборилди',
    gonderildi: 'Сўровномани % куни юборгансиз. Шифокорингиз уни кўрикдан олдин ўқийди.',
    cevaplarim: 'Жавобларим',
    degistirilemez: 'Жавобларни ўзгартириб бўлмайди. Бирор нарса нотўғри бўлса, шифокорингизга айтинг.',
    kapat: 'Саҳифамга қайтиш',
  },
  birim: { cm: 'см', kg: 'кг', C: '°С' },
}

const RU: FormMetni = {
  hekim: {
    baslik: 'Анкета перед приёмом',
    aciklama: 'Перед приёмом пациент заполняет короткую анкету на своей странице: сначала общие вопросы, затем вопросы по вашей специальности. Система ничего не отправляет пациенту.',
    durumYok: 'У этого пациента анкету ещё не запрашивали.',
    durumBekliyor: 'Анкета запрошена %. Пациент ещё не начал её заполнять.',
    durumTaslak: 'Пациент начал заполнять анкету, но ещё не отправил её. Последнее сохранение: %.',
    durumGonderildi: 'Пациент отправил анкету %.',
    iste: 'Попросить заполнить анкету',
    bekliyor: 'Подождите…',
    yapilamadi: 'Не удалось выполнить. Попробуйте ещё раз.',
    istendi: 'Анкета ждёт пациента на его странице.',
    acikVar: 'У этого пациента уже была незаполненная анкета: она оставлена как есть.',
    davetBaslik: 'Текст приглашения',
    davetDil: 'Язык текста (язык пациента)',
    davetIzoh: 'Ничего не отправляется автоматически: текст пациенту отправляете вы сами. ПИН-код сообщите отдельно.',
    baglantiVar: 'У этого пациента уже есть ссылка. Показать её ещё раз нельзя, поэтому в тексте ссылки нет: пациент откроет ту, что у него есть.',
    yeniBaglanti: 'Выдать новую ссылку и добавить её в текст',
    yeniBaglantiUyari: 'Если выдать новую ссылку, прежняя ссылка пациента сразу перестанет работать, а ПИН-код изменится. Пациенту нужно будет передать и новую ссылку, и новый ПИН-код.',
    yeniBaglantiOnay: 'Да, выдать новую ссылку',
    vazgec: 'Отмена',
    cevaplar: 'Ответы пациента',
    beyan: 'Со слов пациента. Не проверено.',
    veliBeyani: 'Заполнил родитель или законный представитель. Не проверено.',
    notaGirmez: 'Эти ответы не используются при составлении записи.',
    surumFarkli: 'После запроса этой анкеты список вопросов изменился: часть ответов может не отображаться.',
    yenidenAc: 'Открыть заново',
    yenidenAcUyari: 'После этого пациент сможет изменить ответы и должен будет отправить анкету ещё раз.',
    yenidenAcildi: 'Анкета открыта заново.',
    geriCek: 'Отозвать запрос',
    geriCekildi: 'Запрос отозван. Анкета убрана со страницы пациента.',
    oncekiler: 'Предыдущие анкеты',
  },
  // PATIENT-FACING. The address comes last, with nothing after it.
  davet: {
    metin: 'Здравствуйте! Врач %1 просит вас заполнить короткую анкету перед приёмом. ПИН-код врач сообщит вам отдельно. Ссылка на вашу страницу: %2',
    metinAdsiz: 'Здравствуйте! Ваш врач просит вас заполнить короткую анкету перед приёмом. ПИН-код врач сообщит вам отдельно. Ссылка на вашу страницу: %',
    baglantisiz: 'Здравствуйте! Врач % просит вас заполнить короткую анкету перед приёмом. Для этого откройте свою страницу по ссылке, которую вам дали раньше.',
    baglantisizAdsiz: 'Здравствуйте! Ваш врач просит вас заполнить короткую анкету перед приёмом. Для этого откройте свою страницу по ссылке, которую вам дали раньше.',
  },
  // PATIENT-FACING.
  hasta: {
    bekliyorBaslik: 'Анкета перед приёмом',
    bekliyorAciklama: 'Ваш врач просит вас ответить на несколько вопросов перед приёмом. Это займёт несколько минут.',
    veliAciklama: 'Врач просит вас ответить на несколько вопросов о вашем ребёнке перед приёмом. Это займёт несколько минут.',
    baslat: 'Начать заполнение',
    devam: 'Продолжить',
    yenidenAcildi: 'Врач открыл анкету заново. Проверьте свои ответы и отправьте её ещё раз.',
    rizaBaslik: 'Прежде чем начать',
    rizaKabul: 'Я согласен (согласна)',
    rizaGerekli: 'Чтобы продолжить, нужно ваше согласие.',
    zorunlu: 'обязательно',
    evet: 'Да',
    hayir: 'Нет',
    kaydediliyor: 'Сохраняем…',
    kaydedildi: 'Ваши ответы сохранены.',
    kaydedilemedi: 'Не удалось сохранить. Проверьте интернет и попробуйте ещё раз.',
    ileri: 'Далее',
    geri: 'Назад',
    bolum: 'Часть %1 из %2',
    gonder: 'Отправить врачу',
    gonderiliyor: 'Отправляем…',
    gonderilemedi: 'Не удалось отправить. Попробуйте ещё раз.',
    gonderUyari: 'После отправки вы сможете читать свои ответы, но не сможете их изменить.',
    eksik: 'Ответьте на вопросы, отмеченные как обязательные.',
    sayiGecersiz: 'Введите число от %1 до %2.',
    gonderildiBaslik: 'Анкета отправлена',
    gonderildi: 'Вы отправили анкету %. Врач прочитает её перед приёмом.',
    cevaplarim: 'Мои ответы',
    degistirilemez: 'Изменить ответы нельзя. Если что-то неверно, скажите об этом врачу.',
    kapat: 'Вернуться на мою страницу',
  },
  birim: { cm: 'см', kg: 'кг', C: '°С' },
}

export const UZ_FORM_METINLERI: Readonly<Record<UzUygulamaDili, FormMetni>> = {
  'uz-Latn': UZ_LATN,
  'uz-Cyrl': UZ_CYRL,
  ru: RU,
}
