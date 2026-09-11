import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from '../content/api';
import '../content/style.css';

const Options = () => {
    const [apiUrl, setApiUrl] = useState('https://eisai-api.vercel.app');
    const [debugMode, setDebugMode] = useState(false);
    const [status, setStatus] = useState('');
    const [campusName, setCampusName] = useState<string | null>(null);
    const [isLoadingCampus, setIsLoadingCampus] = useState(true);

    useEffect(() => {
        // Restore options
        chrome.storage.local.get(['jukmane_api_url', 'debug_mode'], (items) => {
            // Enforce fixed URL
            setApiUrl('https://eisai-api.vercel.app');
            setDebugMode(items.debug_mode || false);
        });

        // Check campus login status
        checkCampusStatus();
    }, []);

    const checkCampusStatus = async () => {
        setIsLoadingCampus(true);
        try {
            const data = await api.getStudentStatus({});
            if (data && data._campus && data._campus.name) {
                setCampusName(data._campus.name);
            } else {
                setCampusName(null);
            }
        } catch (error) {
            console.error("Failed to fetch campus", error);
            setCampusName(null);
        } finally {
            setIsLoadingCampus(false);
        }
    };

    const saveOptions = () => {
        // Always save the fixed URL
        const url = 'https://eisai-api.vercel.app';

        chrome.storage.local.set({
            jukmane_api_url: url,
            debug_mode: debugMode
        }, () => {
            setStatus('Options saved.');
            setTimeout(() => {
                setStatus('');
            }, 2000);
        });
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', color: '#1f2937' }}>拡張機能の初期設定</h2>

            {/* Campus Status Section */}
            <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                border: campusName ? '1px solid #10b981' : '1px solid #f59e0b', 
                borderRadius: '8px',
                backgroundColor: campusName ? '#ecfdf5' : '#fffbeb'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: campusName ? '#047857' : '#b45309' }}>
                    1. 校舎へのログイン状態
                </h3>
                
                {isLoadingCampus ? (
                    <p style={{ color: '#6b7280' }}>確認中...</p>
                ) : campusName ? (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '20px', marginRight: '8px' }}>✅</span>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
                                現在「{campusName}」として連携中です
                            </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 12px 0' }}>
                            このブラウザで拡張機能が正常に動作します。別の校舎に切り替える場合は本体サイトで設定し直してください。
                        </p>
                        <button 
                            onClick={checkCampusStatus}
                            style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white' }}
                        >
                            状態を再チェック
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#b45309' }}>
                                校舎が設定されていません
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#78350f', margin: '0 0 16px 0' }}>
                            拡張機能を利用するには、まず本体サイトでログインし、担当校舎を選択する必要があります。
                        </p>
                        <a 
                            href="https://eisai-api.vercel.app/login" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                                display: 'inline-block',
                                padding: '10px 16px', 
                                backgroundColor: '#f59e0b', 
                                color: 'white', 
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            Jukmane 本体サイトを開いてログインする
                        </a>
                        <button 
                            onClick={checkCampusStatus}
                            style={{ marginLeft: '12px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', fontWeight: 'bold' }}
                        >
                            完了したら再チェック
                        </button>
                    </div>
                )}
            </div>

            <h3 style={{ margin: '24px 0 12px 0', fontSize: '16px', color: '#1f2937' }}>
                2. 詳細設定
            </h3>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
                    API 接続先 (固定)
                </label>
                <input
                    type="text"
                    value={apiUrl}
                    readOnly
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        cursor: 'not-allowed',
                        fontFamily: 'monospace'
                    }}
                />
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={debugMode}
                        onChange={(e) => setDebugMode(e.target.checked)}
                        style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>デバッグモードを有効にする</span>
                </label>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', marginLeft: '28px', lineHeight: '1.5' }}>
                    開発用：すべてのページに強制的に共有ノートパネル（テストデータ）を表示します。<br/>
                    <strong>通常利用時は必ずオフにしてください。</strong>
                </p>
            </div>

            <button
                onClick={saveOptions}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    width: '100%',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
                設定を保存する
            </button>

            {status && (
                <div style={{ 
                    marginTop: '16px', 
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: status.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                    color: status.startsWith('Error') ? '#b91c1c' : '#15803d',
                    border: status.startsWith('Error') ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {status}
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
