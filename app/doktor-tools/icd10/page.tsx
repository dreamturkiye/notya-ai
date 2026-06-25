'use client';

import DoktorNav from '@/components/doktor/DoktorNav';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ICDResult {
  code: string;
  turkish: string;
  english: string;
  chapter: string;
}

export default function ICD10Page() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICDResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('icd10_recent');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecent = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('icd10_recent', JSON.stringify(updated));
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Kod kopyalandı');
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]);

    try {
      const authData = localStorage.getItem('auth-token');
      const token = authData ? JSON.parse(authData).access_token : '';

      const res = await fetch('/api/doktor/araclar/icd10', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: searchQuery })
      });

      const data = await res.json();
      setResults(data.results || []);
      saveRecent(searchQuery);
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#0A1628',
    minHeight: '100vh',
    fontFamily: '-apple-system,BlinkMacSystemFont,system-ui',
    color: 'white'
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
    animation: 'fadeIn 0.3s ease-out'
  };

  const headerStyle: React.CSSProperties = {
    paddingTop: '40px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)'
  };

  const searchWrapperStyle: React.CSSProperties = {
    position: 'relative',
    marginTop: '32px',
    marginBottom: '24px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '56px',
    fontSize: '18px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    color: 'white',
    padding: '0 160px 0 20px',
    outline: 'none'
  };

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '8px',
    height: '40px',
    backgroundColor: '#0F9B8E',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0 24px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  };

  const recentStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '16px'
  };

  const pillStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '12px',
    color: 'white',
    cursor: 'pointer'
  };

  const resultCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const codeStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F9B8E'
  };

  const chapterLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '0.5px'
  };

  const copyBtnStyle: React.CSSProperties = {
    border: '1px solid #0F9B8E',
    color: '#0F9B8E',
    background: 'transparent',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer'
  };

  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#1a2a40',
    height: '120px',
    borderRadius: '16px',
    marginBottom: '12px',
    animation: 'pulse 1.5s infinite'
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255,255,255,0.6)'
  };

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#0F9B8E',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <DoktorNav />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>ICD-10 Kodlayici</div>
          <div style={subtitleStyle}>Turkce tani girisi ile anlik ICD-10 kodu</div>
        </div>

        <div style={searchWrapperStyle}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tani giriniz..."
            style={inputStyle}
          />
          <button onClick={handleSearch} style={buttonStyle}>Ara</button>
        </div>

        {recentSearches.length > 0 && (
          <div style={recentStyle}>
            {recentSearches.map((term, idx) => (
              <div key={idx} style={pillStyle} onClick={() => handleRecentClick(term)}>
                {term}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ marginTop: '32px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={skeletonStyle} />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={resultCardStyle}
                onClick={() => copyToClipboard(result.code)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={codeStyle}>{result.code}</div>
                    <div style={chapterLabelStyle}>{result.chapter}</div>
                  </div>
                  <button
                    style={copyBtnStyle}
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(result.code); }}
                  >
                    Kopyala
                  </button>
                </div>
                <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600, color: '#111' }}>
                  {result.turkish}
                </div>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#666' }}>
                  {result.english}
                </div>
                <div style={{ marginTop: '10px', display: 'inline-block', background: '#E6F7F5', color: '#0F9B8E', fontSize: '12px', padding: '2px 10px', borderRadius: '20px' }}>
                  {result.chapter}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div style={emptyStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <div>Sonuc bulunamadi</div>
          </div>
        )}
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
