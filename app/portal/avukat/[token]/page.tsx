'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetcher } from '@/lib/fetcher'; // Assume you have a fetcher utility for API calls

const styles = `
    body {
        background-color: white;
        font-family: Arial, sans-serif;
    }
    header {
        background-color: #1e3a5f;
        color: white;
        padding: 20px;
        text-align: center;
    }
    .greeting {
        margin-top: 20px;
        text-align: center;
    }
    .sureler-list {
        list-style-type: none;
        padding: 0;
    }
    .sure-item {
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 5px;
    }
    .red { background-color: #ffcccc; }
    .amber { background-color: #ffff99; }
    .green { background-color: #ccffcc; }
    .chat-container {
        margin-top: 20px;
    }
    .messages-list {
        list-style-type: none;
        padding: 0;
    }
    .message-item {
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 5px;
    }
    .user-message { background-color: #e0f7fa; }
    .assistant-message { background-color: #ffecb3; }
`;

export default function AvukatPortalPage() {
    const router = useRouter();
    const params = useParams();
    const [token] = useState(params.token as string);
    const [muvekkilInfo, setMuvekkilInfo] = useState<any | null>(null);
    const [messages, setMessages] = useState<{ sender: 'user' | 'assistant', content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMuvekkilInfo() {
            try {
                const response = await fetcher(`/api/avukat/portal?token=${token}`);
                if (response.success) {
                    setMuvekkilInfo(response.data);
                } else {
                    setError('Failed to load muvekkil info');
                }
            } catch (err) {
                setError('An error occurred while fetching data');
            }
        }

        fetchMuvekkilInfo();
    }, [token]);

    const handleSendMessage = async () => {
        if (!messages[messages.length - 1] || messages[messages.length - 1].sender !== 'user') {
            setMessages([...messages, { sender: 'user', content: '' }]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetcher('/api/avukat/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, message: messages[messages.length - 1].content, history: messages.map(msg => msg.content) })
            });

            if (response.success) {
                setMessages([...messages, { sender: 'assistant', content: response.data.speech }]);
            } else {
                setError('Failed to send message');
            }
        } catch (err) {
            setError('An error occurred while sending the message');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessages([...messages.slice(0, -1), { ...messages[messages.length - 1], content: e.target.value }]);
    };

    return (
        <>
            <style>{styles}</style>
            <header>
                <h1>Avukat Portal</h1>
            </header>
            <div className="greeting">
                <p>Welcome, {muvekkilInfo?.avukatAdi}!</p>
                <p>Your client: {muvekkilInfo?.muvekkilAdi}</p>
                <p>Case Type: {muvekkilInfo?.davaTuru}</p>
            </div>
            <ul className="sureler-list">
                {(muvekkilInfo?.sureler || []).map((sure: any) => (
                    <li 
                        key={sure.id} 
                        className={`sure-item ${new Date(sure.son_gun).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 ? 'red' : new Date(sure.son_gun).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 ? 'amber' : 'green'}`}
                    >
                        <strong>Case:</strong> {sure.sure_turu} <br />
                        <strong>Deadline:</strong> {new Date(sure.son_gun).toLocaleDateString()}<br />
                        <strong>Description:</strong> {sure.aciklama}
                    </li>
                ))}
            </ul>
            <div className="chat-container">
                <ul className="messages-list">
                    {messages.map((msg, index) => (
                        <li key={index} className={`message-item ${msg.sender === 'user' ? 'user-message' : 'assistant-message'}`}>
                            {msg.content}
                        </li>
                    ))}
                </ul>
                <input 
                    type="text" 
                    placeholder="Type your message here..." 
                    value={messages[messages.length - 1]?.content || ''}
                    onChange={handleInputChange} 
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </>
    );
}