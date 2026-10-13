/**
 * NOTYA-ULKE-YASAL-01 — Uzbekistan policy drafts, in Uzbek (Latin and Cyrillic) and Russian.
 * A lawyer has not read them. Personal-data statute named for that review: ZRU-547
 * (https://lex.uz/docs/4831939 — the personal-data law). The landing page does not name it.
 */
import { YASAL_EPOSTA } from '@/lib/ulke/yasal/eposta'
import type { YasalBelge, YasalDilPaketi, YasalKapisi } from '@/lib/ulke/yasal/tipler'

const E = YASAL_EPOSTA

function posta(baslik: string, satr: readonly [string, string, string, string, string, string]): YasalBelge['bolumler'][number] {
  return {
    baslik,
    paragraflar: [
      `${satr[0]} ${E.privacy}`,
      `${satr[1]} ${E.support}`,
      `${satr[2]} ${E.security}`,
      `${satr[3]} ${E.legal}`,
      `${satr[4]} ${E.billing}`,
      `${satr[5]} ${E.hello}`,
    ],
  }
}

const LATN_POSTA = posta('Manzillar', [
  'Shaxsiy maʼlumot boʻyicha soʻrov:',
  'Yordam:',
  'Xavfsizlik xabari:',
  'Shartlar va boshqa huquqiy xabarlar:',
  'Toʻlov:',
  'Umumiy savol va sotuv:',
])

const CYRL_POSTA = posta('Манзиллар', [
  'Шахсий маълумот бўйича сўров:',
  'Ёрдам:',
  'Хавфсизлик хабари:',
  'Шартлар ва бошқа ҳуқуқий хабарлар:',
  'Тўлов:',
  'Умумий савол ва сотув:',
])

const RU_POSTA = posta('Адреса', [
  'Запрос о персональных данных:',
  'Помощь:',
  'Сообщение о безопасности:',
  'Условия и другие юридические сообщения:',
  'Оплата:',
  'Общий вопрос и продажи:',
])

const latn: YasalDilPaketi = {
  kod: 'uz-Latn',
  ad: 'Oʻzbekcha',
  geri: 'Bosh sahifa',
  belgeler: [
    {
      anahtar: 'privacy',
      baslik: 'Maxfiylik xabarnomasi',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Kim yozadi', paragraflar: [`Notya ushbu qoralamani yozadi. Umumiy savol: ${E.hello}. Shaxsiy maʼlumot: ${E.privacy}.`] },
        { baslik: 'Huquqshunos uchun', paragraflar: ['Ushbu qoralama ZRU-547, shaxsiy maʼlumotlar toʻgʻrisidagi qonun, boʻyicha koʻrib chiqilsin. Qoralama xizmat shu qonunga mos ekanini bildirmaydi.'] },
        { baslik: 'Nima saqlanadi', paragraflar: ['Hisobda shifokor bergan ism, pochta, telefon va kasb, hamda kirish yozuvi turadi. Bemor yozuvida shifokor kiritgan matn, qabul, bemor sahifasidagi xabar va yuklangan fayl turadi. Yozuv faqat shifokor yoqqanda olinadi.'] },
        { baslik: 'Kim qaror qiladi', paragraflar: ['Oʻz bemori haqidagi yozuv va bemorga nima koʻrsatilishi shifokorning qarori. Notya dastur beradi. Huquqshunos rollarni qonun boʻyicha nomlaydi; bu qoralama ularni hal boʻlgan deb aytmaydi.'] },
        { baslik: 'Soʻrov', paragraflar: [`Nusxa, tuzatish yoki oʻchirish uchun ${E.privacy} ga yozing.`] },
        LATN_POSTA,
      ],
    },
    {
      anahtar: 'terms',
      baslik: 'Foydalanish shartlari',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Hisob', paragraflar: ['Hisob taklif kodi bilan ochiladi. Shifokor parolni saqlaydi va hisobni bermaydi.'] },
        { baslik: 'Tibbiy qaror', paragraflar: ['Dastur qoralama tayyorlaydi. Tashxis, dori va bemorga aytiladigan gap shifokorda qoladi.'] },
        { baslik: 'Toʻlov va xabar', paragraflar: [`Narx kelishilmaguncha soʻrovdir. Toʻlov: ${E.billing}. Shartlar boʻyicha xabar: ${E.legal}. Qaysi qonun qoʻllanishini huquqshunos aytadi.`] },
        LATN_POSTA,
      ],
    },
    {
      anahtar: 'cookies',
      baslik: 'Cookie-fayllar',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Huquqshunos uchun', paragraflar: ['Cookie-fayllar boʻyicha qoralama ZRU-547 doirasida koʻrib chiqilsin. Qoralama moslikni bildirmaydi.'] },
        { baslik: 'Nima saqlanadi', paragraflar: ['Kirgan shifokor sessiyasi saqlanadi. Ochiq sahifa tanlangan tilni saqlashi mumkin. Reklama cookie-fayli bu qoralamada yoʻq. Roʻyxatni huquqshunos joylashuv boʻyicha tekshiradi.'] },
        LATN_POSTA,
      ],
    },
    {
      anahtar: 'data-request',
      baslik: 'Maʼlumot soʻrovi',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Qanday soʻraladi', paragraflar: [`${E.privacy} ga ism, hisob pochtasi va soʻrovni (nusxa, tuzatish, oʻchirish) yozing. Xatga milliy identifikatsiya raqamini yozmang. Necha kunda javob berilishini huquqshunos belgilaydi.`] },
        LATN_POSTA,
      ],
    },
    {
      anahtar: 'accessibility',
      baslik: 'Foydalanish qulayligi',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Koʻrib chiqish', paragraflar: [`Qoralama WCAG 2.2 AA boʻyicha koʻrib chiqilsin. U mos ekanini bildirmaydi. Toʻsiqni ${E.support} ga, sahifa va maqsad bilan yozing.`] },
      ],
    },
    {
      anahtar: 'medical',
      baslik: 'Tibbiy ogohlantirish',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Qoralama, qaror emas', paragraflar: ['Notya shifokor uchun qoralama tayyorlaydi. Tashxis qoʻymaydi va dori yozmaydi. Shoshilinch yordam uchun mahalliy xizmatga murojaat qiling. Bu sahifa telefon raqami bermaydi.'] },
        { baslik: 'Huquqshunos uchun', paragraflar: ['Tibbiy buyum va reklama qoidalari boʻyicha huquqshunos koʻrib chiqadi. Qoralama xizmat tibbiy buyum ekanini bildirmaydi.'] },
      ],
    },
    {
      anahtar: 'security',
      baslik: 'Xavfsizlik',
      inceleme: 'Bu matnni huquqshunos oʻqimagan. U koʻrib chiqish uchun yozilgan. Xizmat biror qonunga mos ekanini bildirmaydi.',
      bolumler: [
        { baslik: 'Xabar', paragraflar: [`${E.security} ga nima koʻrganingiz, sahifa va vaqtni yozing. Bemor ismi va yozuv matnisiz ham boʻlsa, shunday yozing. Shu manzil /.well-known/security.txt da ham bor. Hisobot uchun haq vaʼda qilinmaydi.`] },
        LATN_POSTA,
      ],
    },
  ],
}

const CYRL_INCELEME = 'Бу матнни ҳуқуқшунос ўқимаган. У кўриб чиқиш учун ёзилган. Хизмат бирор қонунга мос эканини билдирмайди.'

const cyrl: YasalDilPaketi = {
  kod: 'uz-Cyrl',
  ad: 'Ўзбекча',
  geri: 'Бош саҳифа',
  belgeler: [
    {
      anahtar: 'privacy',
      baslik: 'Махфийлик хабарномаси',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Ким ёзади', paragraflar: [`Notya ушбу қораламани ёзади. Умумий савол: ${E.hello}. Шахсий маълумот: ${E.privacy}.`] },
        { baslik: 'Ҳуқуқшунос учун', paragraflar: ['Ушбу қоралама ЗРУ-547, шахсий маълумотлар тўғрисидаги қонун, бўйича кўриб чиқилсин. Қоралама хизмат шу қонунга мос эканини билдирмайди.'] },
        { baslik: 'Нима сақланади', paragraflar: ['Ҳисобда шифокор берган исм, почта, телефон ва касб, ҳамда кириш ёзуви туради. Бемор ёзувида шифокор киритган матн, қабул, бемор саҳифасидаги хабар ва юкланган файл туради. Ёзув фақат шифокор ёққанда олинади.'] },
        { baslik: 'Ким қарор қилади', paragraflar: ['Ўз бемори ҳақидаги ёзув ва беморга нима кўрсатилиши шифокорнинг қарори. Notya дастур беради. Ҳуқуқшунос ролларни қонун бўйича номлайди; бу қоралама уларни ҳал бўлган деб айтмайди.'] },
        { baslik: 'Сўров', paragraflar: [`Нусха, тузатиш ёки ўчириш учун ${E.privacy} га ёзинг.`] },
        CYRL_POSTA,
      ],
    },
    {
      anahtar: 'terms',
      baslik: 'Фойдаланиш шартлари',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Ҳисоб', paragraflar: ['Ҳисоб таклиф коди билан очилади. Шифокор паролни сақлайди ва ҳисобни бермайди.'] },
        { baslik: 'Тиббий қарор', paragraflar: ['Дастур қоралама тайёрлайди. Ташхис, дори ва беморга айтиладиган гап шифокорда қолади.'] },
        { baslik: 'Тўлов ва хабар', paragraflar: [`Нарх келишилмагунча сўровдир. Тўлов: ${E.billing}. Шартлар бўйича хабар: ${E.legal}. Қайси қонун қўлланишини ҳуқуқшунос айтади.`] },
        CYRL_POSTA,
      ],
    },
    {
      anahtar: 'cookies',
      baslik: 'Cookie-файллар',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Ҳуқуқшунос учун', paragraflar: ['Cookie-файллар бўйича қоралама ЗРУ-547 доирасида кўриб чиқилсин. Қоралама мосликни билдирмайди.'] },
        { baslik: 'Нима сақланади', paragraflar: ['Кирган шифокор сессияси сақланади. Очиқ саҳифа танланган тилни сақлаши мумкин. Реклама cookie-файли бу қораламада йўқ. Рўйхатни ҳуқуқшунос жойлашув бўйича текширади.'] },
        CYRL_POSTA,
      ],
    },
    {
      anahtar: 'data-request',
      baslik: 'Маълумот сўрови',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Қандай сўралади', paragraflar: [`${E.privacy} га исм, ҳисоб почтаси ва сўровни (нусха, тузатиш, ўчириш) ёзинг. Хатга миллий идентификация рақамини ёзманг. Неча кунда жавоб берилишини ҳуқуқшунос белгилайди.`] },
        CYRL_POSTA,
      ],
    },
    {
      anahtar: 'accessibility',
      baslik: 'Фойдаланиш қулайлиги',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Кўриб чиқиш', paragraflar: [`Қоралама WCAG 2.2 AA бўйича кўриб чиқилсин. У мос эканини билдирмайди. Тўсиқни ${E.support} га, саҳифа ва мақсад билан ёзинг.`] },
      ],
    },
    {
      anahtar: 'medical',
      baslik: 'Тиббий огоҳлантириш',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Қоралама, қарор эмас', paragraflar: ['Notya шифокор учун қоралама тайёрлайди. Ташхис қўймайди ва дори ёзмайди. Шошилинч ёрдам учун маҳаллий хизматга мурожаат қилинг. Бу саҳифа телефон рақами бермайди.'] },
        { baslik: 'Ҳуқуқшунос учун', paragraflar: ['Тиббий буюм ва реклама қоидалари бўйича ҳуқуқшунос кўриб чиқади. Қоралама хизмат тиббий буюм эканини билдирмайди.'] },
      ],
    },
    {
      anahtar: 'security',
      baslik: 'Хавфсизлик',
      inceleme: CYRL_INCELEME,
      bolumler: [
        { baslik: 'Хабар', paragraflar: [`${E.security} га нима кўрганингиз, саҳифа ва вақтни ёзинг. Бемор исми ва ёзув матнисиз ҳам бўлса, шундай ёзинг. Шу манзил /.well-known/security.txt да ҳам бор. Ҳисобот учун ҳақ ваъда қилинмайди.`] },
        CYRL_POSTA,
      ],
    },
  ],
}

const ru: YasalDilPaketi = {
  kod: 'ru',
  ad: 'Русский',
  geri: 'На главную',
  belgeler: [
    {
      anahtar: 'privacy',
      baslik: 'Уведомление о конфиденциальности',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Кто пишет', paragraflar: [`Этот черновик пишет Notya. Общий вопрос: ${E.hello}. Персональные данные: ${E.privacy}.`] },
        { baslik: 'Для юриста', paragraflar: ['Черновик следует проверить по ЗРУ-547, закону о персональных данных. Черновик не утверждает, что сервис соответствует этому закону.'] },
        { baslik: 'Что хранится', paragraflar: ['В аккаунте — имя, почта, телефон и профессия, которые указал врач, и запись входа. В карте пациента — текст, приём, сообщение на странице пациента и файл, которые внёс врач. Запись звука есть только если врач её включил.'] },
        { baslik: 'Кто решает', paragraflar: ['Что написано о своём пациенте и что ему показано, решает врач. Notya даёт программу. Роли по закону называет юрист; черновик не считает их решёнными.'] },
        { baslik: 'Запрос', paragraflar: [`Для копии, исправления или удаления напишите на ${E.privacy}.`] },
        RU_POSTA,
      ],
    },
    {
      anahtar: 'terms',
      baslik: 'Условия использования',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Аккаунт', paragraflar: ['Аккаунт открывается по коду приглашения. Врач хранит пароль и не передаёт аккаунт.'] },
        { baslik: 'Медицинское решение', paragraflar: ['Программа готовит черновик. Диагноз, назначение и слова пациенту остаются у врача.'] },
        { baslik: 'Оплата и сообщения', paragraflar: [`Цена — запрос, пока о ней не договорились. Оплата: ${E.billing}. Сообщения по условиям: ${E.legal}. Какой закон применяется, говорит юрист.`] },
        RU_POSTA,
      ],
    },
    {
      anahtar: 'cookies',
      baslik: 'Файлы cookie',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Для юриста', paragraflar: ['Черновик о файлах cookie следует проверить в рамках ЗРУ-547. Он не утверждает соответствие.'] },
        { baslik: 'Что хранится', paragraflar: ['Сессия вошедшего врача сохраняется. Открытая страница может запомнить выбранный язык. Рекламного cookie в этом черновике нет. Список сверяет юрист по развёртыванию.'] },
        RU_POSTA,
      ],
    },
    {
      anahtar: 'data-request',
      baslik: 'Запрос о данных',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Как просить', paragraflar: [`На ${E.privacy} напишите имя, почту аккаунта и просьбу: копия, исправление или удаление. Национальный идентификационный номер в письмо не пишите. Срок ответа задаёт юрист.`] },
        RU_POSTA,
      ],
    },
    {
      anahtar: 'accessibility',
      baslik: 'Доступность',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Проверка', paragraflar: [`Черновик следует проверить по WCAG 2.2 AA. Он не утверждает соответствие. О барьере напишите на ${E.support}: страница и цель.`] },
      ],
    },
    {
      anahtar: 'medical',
      baslik: 'Медицинское предупреждение',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Черновик, не решение', paragraflar: ['Notya готовит черновик для врача. Он не ставит диагноз и не назначает лекарство. При срочной помощи обратитесь в местную службу. Эта страница не даёт номера телефона.'] },
        { baslik: 'Для юриста', paragraflar: ['Правила о медицинском изделии и рекламе проверяет юрист. Черновик не утверждает, что сервис является изделием.'] },
      ],
    },
    {
      anahtar: 'security',
      baslik: 'Безопасность',
      inceleme: 'Этот текст не читал юрист. Он написан для проверки. Он не утверждает, что сервис соответствует какому-либо закону.',
      bolumler: [
        { baslik: 'Сообщение', paragraflar: [`На ${E.security} напишите, что вы видели, страницу и время. Имя пациента и текст записи не включайте, если без них можно описать сбой. Тот же адрес есть в /.well-known/security.txt. Оплаты за сообщение черновик не обещает.`] },
        RU_POSTA,
      ],
    },
  ],
}

export const UZ_YASAL: YasalKapisi = { diller: [latn, cyrl, ru] }
