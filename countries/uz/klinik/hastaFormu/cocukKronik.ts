/**
 * Paediatrics asks the long-term conditions question in a child's own list, not the adult list of the core form
 * (no high blood pressure, no COPD). Same question key (`surunkali`) and, where the meaning stays, the same option
 * keys ('opka' = asthma, 'yurak' = a heart condition from birth), so an earlier answer still reads. On the guardian
 * form only. Roles: those Türkiye's child form covers (pediatri, cocuk-cerrahisi). MACHINE-WRITTEN; awaits a paediatric
 * clinician of Uzbekistan like every set.
 */
import { cok, s, u, YOQ } from './yardimci'

export const UZ_COCUK_ROLLERI: readonly string[] = ['pediatri', 'cocuk-cerrahisi']

export const UZ_COCUK_KRONIK = [
  cok('surunkali', u('Bolada shifokor aniqlagan surunkali kasalliklar bormi?', 'Болада шифокор аниқлаган сурункали касалликлар борми?', 'Есть ли у ребёнка хронические заболевания, установленные врачом?'), [
    s('opka', 'Bronxial astma', 'Бронхиал астма', 'Бронхиальная астма'),
    s('epilepsiya', 'Epilepsiya yoki tutqanoq', 'Эпилепсия ёки тутқаноқ', 'Эпилепсия или судороги'),
    s('yurak', 'Tugʻma yurak nuqsoni', 'Туғма юрак нуқсони', 'Врождённый порок сердца'),
    s('diabet', '1-turdagi qandli diabet', '1-турдаги қандли диабет', 'Сахарный диабет 1 типа'),
    s('seliakiya', 'Seliakiya (glyuten kasalligi)', 'Целиакия (глютен касаллиги)', 'Целиакия'),
    s('ekzema', 'Ekzema (atopik dermatit)', 'Экзема (атопик дерматит)', 'Экзема (атопический дерматит)'),
    s('oziq_allergiya', 'Ogʻir reaksiya (anafilaksiya) berishi mumkin boʻlgan oziq-ovqat allergiyasi', 'Оғир реакция (анафилаксия) бериши мумкин бўлган озиқ-овқат аллергияси', 'Пищевая аллергия, способная вызвать тяжёлую реакцию (анафилаксию)'),
    s('buyrak', 'Buyrak yoki siydik yoʻllari kasalligi', 'Буйрак ёки сийдик йўллари касаллиги', 'Заболевание почек или мочевыводящих путей'),
    s('qalqonsimon', 'Qalqonsimon bez kasalligi', 'Қалқонсимон без касаллиги', 'Заболевание щитовидной железы'),
    s('qon', 'Oʻroqsimon hujayrali anemiya yoki boshqa qon kasalligi', 'Ўроқсимон ҳужайрали анемия ёки бошқа қон касаллиги', 'Серповидноклеточная анемия или другое заболевание крови'),
    s('rivojlanish', 'Rivojlanish yoki nevrologik kasallik', 'Ривожланиш ёки неврологик касаллик', 'Нарушение развития или неврологическое заболевание'),
    s('onkologik', 'Onkologik kasallik', 'Онкологик касаллик', 'Онкологическое заболевание'),
    s('boshqa', 'Boshqa kasallik', 'Бошқа касаллик', 'Другое заболевание'),
    YOQ(),
  ], { zorunlu: true }),
]
