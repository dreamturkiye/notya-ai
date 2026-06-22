// app/asistan/mali/page.tsx
'use client';

import React, { useState } from 'react';
import { Conversation } from '@/components/AsistanConversation';
import { MEVZUAT_DATABASE } from '@/lib/ai/mevzuatEngine';
import { useRouter } from 'next/navigation';

const DERYA = {
  fullName: 'Uzm. Mali Musavir Derya Hanim',
  title: 'SMMM | 15 Yil Istanbul | Vergi & SGK Uzmani',
  color: '#2563EB'
};

const expertiseChips = [
  'Vergi Danismanligi', 'SGK', 'Enflasyon Muhasebesi', 'Ar-Ge Tesviki', 
  'Vergi Inceleme Savunmasi', 'Konkordato', 'YMM Tasdik', 'Yapilandirma'
];

const quickQuestions = [
  '2026 nakit tahsilat siniri nedir?', 'MASAK 30-31 ne getirdi?', 
  'Ar-Ge indirimi nasil hesaplanir?', 'Enflasyon muhasebesi zorunlu mu?', 
  'YMM tasdik ne zaman gerekli?', 'Vergi yapilandirmasi son basvuru ne zaman?', 
  'Kurumlar vergisi orani 2026 nedir?', 'KDV tevkifat oranlari nelerdir?'
];

const MaliPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState('idle');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuickQuestion = (question: string) => {
    setConversationHistory([question]);
    setStatus('connecting');
    // Trigger conversation with the selected question
  };

  const filteredMevzuat = Object.values(MEVZUAT_DATABASE).filter(item =>
    item.kanun.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.madde.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ozet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row">
      <main className="flex-1 p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Uzm. Derya - Mali Musavirlik Asistani</h1>
        </header>
        <div className="flex mb-4">
          {expertiseChips.map(chip => (
            <span key={chip} className="bg-gray-200 text-gray-800 px-3 py-1 mr-2 rounded-full cursor-pointer">
              {chip}
            </span>
          ))}
        </div>
        <div className="flex mb-4">
          {quickQuestions.map(question => (
            <button key={question} onClick={() => handleQuickQuestion(question)} className="bg-blue-500 text-white px-3 py-1 mr-2 rounded-full cursor-pointer">
              {question}
            </button>
          ))}
        </div>
        <Conversation
          status={status}
          conversationHistory={conversationHistory}
          onStatusChange={setStatus}
          onMessageSend={() => {}}
        />
      </main>
      <aside className="hidden md:block w-1/4 p-4 border-l">
        <input 
          type="text" 
          placeholder="Mevzuat ara..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full mb-4 px-3 py-2 border rounded"
        />
        <div className="overflow-y-auto max-h-screen">
          {filteredMevzuat.map(item => (
            <div key={item.id} className="mb-4 p-4 bg-white border rounded shadow">
              <h2 className="text-lg font-bold">{item.kanun}</h2>
              <p className="text-sm text-gray-600 mb-2"><strong>Maddeler:</strong> {item.madde}</p>
              <p className="text-sm text-gray-600 line-clamp-3">{item.ozet}</p>
              <span className={`inline-block px-2 py-1 rounded-full ${item.yururluk ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {item.yururluk ? 'Yürürlükte' : 'Kullandımdan Kaldırıldı'}
              </span>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-500">
                Daha fazla bilgi
              </a>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default MaliPage;