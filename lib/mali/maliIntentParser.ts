export function quickClassifyMali(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('beyan') || lowerMessage.includes('beyanat')) {
        return 'BEYAN_SORUSU';
    } else if (lowerMessage.includes('musteri ekle') || lowerMessage.includes('müşteri ekle')) {
        return 'MUSTERI_EKLE';
    } else if (lowerMessage.includes('not al') || lowerMessage.includes('not alma')) {
        return 'NOT_AL';
    } else if (lowerMessage.includes('takvim') || lowerMessage.includes('tarih')) {
        return 'TAKVIM_SORUSU';
    } else {
        return 'GENEL';
    }
}
