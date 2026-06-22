// lib/avukat/avukatIntentParser.ts
export type AvukatIntentType =
  | 'CREATE_MUVEKKEL'
  | 'ADD_SURE_UYARISI'
  | 'GENERATE_DILEKCE'
  | 'EMSAL_SEARCH'
  | 'SURE_HESAPLA'
  | 'DAVA_OZET'
  | 'GENEL_SORU'
  | 'UPDATE_DAVA';

export function quickClassifyLegal(message: string): AvukatIntentType {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('yeni mvekkil') || lowerMessage.includes('mvekkil ekle') || lowerMessage.includes('kaydet mvekkil') || lowerMessage.includes('yeni dava a')) {
    return 'CREATE_MUVEKKEL';
  } else if (lowerMessage.includes('sre koy') || lowerMessage.includes('hatrlat') || lowerMessage.includes('sre ekle') || lowerMessage.includes('takvime ekle') || lowerMessage.includes('tarih koy')) {
    return 'ADD_SURE_UYARISI';
  } else if (lowerMessage.includes('dilekce yaz') || lowerMessage.includes('ihtarname hazrla') || lowerMessage.includes('temyiz yaz') || lowerMessage.includes('cevap dilekce') || lowerMessage.includes('dava a')) {
    return 'GENERATE_DILEKCE';
  } else if (lowerMessage.includes('emsal bul') || lowerMessage.includes('ihtar ara') || lowerMessage.includes('yargtay karar') || lowerMessage.includes('danstay karar') || lowerMessage.includes('benzer dava')) {
    return 'EMSAL_SEARCH';
  } else if (lowerMessage.includes('sre ne kadar') || lowerMessage.includes('ka gn kald') || lowerMessage.includes('zamanasüm ne') || lowerMessage.includes('son tarih')) {
    return 'SURE_HESAPLA';
  } else if (lowerMessage.includes('zset ver') || lowerMessage.includes('davay zsetle') || lowerMessage.includes('mvekkil zseti') || lowerMessage.includes('ne durumda dava')) {
    return 'DAVA_OZET';
  } else if (lowerMessage.includes('gncelle') || lowerMessage.includes('not ekle') || lowerMessage.includes('durum gncelle') || lowerMessage.includes('durusüma eklendi')) {
    return 'UPDATE_DAVA';
  } else {
    return 'GENEL_SORU';
  }
}

export function extractMuvekkel(message: string): { name?: string; caseType?: string; notes?: string } {
  const namePattern = /ad|isim|ismi\s+(.+?)(\s+veya\s+|\s+ile\s+|\s+ve\s+|$)/i;
  const caseTypeKeywords = ['kira', 'bosanma', 'is', 'tapu', 'ceza', 'ticaret'];
  const nameMatch = message.match(namePattern);
  let name: string | undefined = nameMatch ? nameMatch[1].trim() : undefined;

  for (const keyword of caseTypeKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      return { name, caseType: keyword };
    }
  }

  return { name, notes: message };
}