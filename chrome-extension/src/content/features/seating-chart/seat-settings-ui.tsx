import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export interface SeatSettingsModalProps {
    onClose: () => void;
    onSaveSuccess: () => void;
}

interface LecturerConfig {
    id: number;
    name: string;
    fabocKoushiId: string | null;
    seatPreferences: number[];
}

export const SeatSettingsModal: React.FC<SeatSettingsModalProps> = ({ onClose, onSaveSuccess }) => {
    const [lecturers, setLecturers] = useState<LecturerConfig[]>([]);
    const [originalLecturers, setOriginalLecturers] = useState<LecturerConfig[]>([]);
    const [defaultOrder, setDefaultOrder] = useState<string>('1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13');
    const [originalDefaultOrder, setOriginalDefaultOrder] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [savingDefault, setSavingDefault] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const config = await api.getSeatConfig();
                if (config && config.lecturers) {
                    setLecturers(config.lecturers);
                    setOriginalLecturers(config.lecturers);
                }
                if (config?.seatConfig?.defaultOrder) {
                    const orderStr = config.seatConfig.defaultOrder.join(', ');
                    setDefaultOrder(orderStr);
                    setOriginalDefaultOrder(orderStr);
                }
            } catch (error) {
                console.error("Failed to load seat config:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const checkUnsavedAndClose = () => {
        let hasUnsaved = false;
        if (defaultOrder !== originalDefaultOrder) hasUnsaved = true;
        
        for (const l of lecturers) {
            const orig = originalLecturers.find(o => o.id === l.id);
            if (orig && orig.seatPreferences.join(',') !== l.seatPreferences.join(',')) {
                hasUnsaved = true;
                break;
            }
        }

        if (hasUnsaved) {
            if (!confirm('保存されていない変更があります。破棄して閉じますか？')) {
                return;
            }
        }
        onClose();
    };

    const handleSave = async (lecturerId: number, currentPreferences: number[]) => {
        setSaving(lecturerId);
        try {
            const success = await api.updateLecturerSeatPreference(lecturerId, currentPreferences);
            if (success) {
                setOriginalLecturers(prev => prev.map(l => 
                    l.id === lecturerId ? { ...l, seatPreferences: currentPreferences } : l
                ));
                onSaveSuccess(); 
            }
        } catch (error) {
            console.error("Failed to save seat preferences:", error);
            alert("保存に失敗しました。");
        } finally {
            setSaving(null);
        }
    };

    const handlePreferenceChange = (lecturerId: number, newValueStr: string) => {
        // Parse comma-separated string to number[]
        const newPrefs = newValueStr
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));

        setLecturers(prev => prev.map(l => 
            l.id === lecturerId ? { ...l, seatPreferences: newPrefs } : l
        ));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            fontFamily: 'sans-serif'
        }} onClick={checkUnsavedAndClose}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                width: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚙️</span> 講師別 優先座席設定
                    </h2>
                    <button 
                        type="button"
                        onClick={checkUnsavedAndClose}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
                    >
                        ✕
                    </button>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: 0 }}>
                    各講師が優先して使用する座番をカンマ区切り（例: <code>1, 2, 3</code>）で入力してください。空欄の場合は自動的に空いている座席が提案されます。
                </p>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                    {/* Default order section */}
                    <div style={{ 
                        marginBottom: '16px', padding: '12px', 
                        backgroundColor: '#f0f4ff', borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#4338ca', marginBottom: '6px' }}>
                            📋 デフォルト座席順序
                        </div>
                        <p style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 8px 0' }}>
                            講師ごとの優先設定がない場合に使用される順序です。先に入力した番号から優先的に割り振られます。
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={defaultOrder}
                                onChange={(e) => setDefaultOrder(e.target.value.replace(/[^0-9,\s]/g, ''))}
                                placeholder="例: 1, 3, 5, 2, 4, 6"
                                style={{
                                    flex: 1, padding: '6px 8px',
                                    border: '1px solid #a5b4fc', borderRadius: '4px',
                                    fontSize: '14px', fontFamily: 'monospace'
                                }}
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    setSavingDefault(true);
                                    try {
                                        const parsed = defaultOrder.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                        const success = await api.updateDefaultOrder(parsed);
                                        if (success) {
                                            setDefaultOrder(parsed.join(', '));
                                        } else {
                                            alert('保存に失敗しました。');
                                        }
                                    } catch { alert('保存に失敗しました。'); }
                                    finally { setSavingDefault(false); }
                                }}
                                disabled={savingDefault}
                                style={{
                                    backgroundColor: savingDefault ? '#9ca3af' : '#4f46e5',
                                    color: 'white', border: 'none',
                                    padding: '6px 16px', borderRadius: '4px',
                                    cursor: savingDefault ? 'not-allowed' : 'pointer',
                                    fontSize: '12px', fontWeight: 'bold'
                                }}
                            >
                                {savingDefault ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>

                    {/* Lecturer section */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>読み込み中...</div>
                    ) : lecturers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>講師データがありません。<br/>（座席表ページを何度か閲覧すると自動登録されます）</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#374151' }}>
                                    <th style={{ padding: '8px 4px', width: '30%' }}>講師名</th>
                                    <th style={{ padding: '8px 4px', width: '50%' }}>優先座番 (カンマ区切り)</th>
                                    <th style={{ padding: '8px 4px', width: '20%' }}>アクション</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lecturers.map(lecturer => (
                                    <tr key={lecturer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 4px', fontWeight: 'bold', color: '#1f2937' }}>
                                            {lecturer.name}
                                        </td>
                                        <td style={{ padding: '12px 4px' }}>
                                            <input 
                                                type="text" 
                                                value={lecturer.seatPreferences.join(', ')}
                                                onChange={(e) => handlePreferenceChange(lecturer.id, e.target.value)}
                                                placeholder="例: 1, 2, 3"
                                                style={{
                                                    width: '90%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px 4px', display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleSave(lecturer.id, lecturer.seatPreferences)}
                                                disabled={saving === lecturer.id}
                                                style={{
                                                    backgroundColor: saving === lecturer.id ? '#9ca3af' : '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: saving === lecturer.id ? 'not-allowed' : 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                {saving === lecturer.id ? '保存中...' : '保存'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (confirm(`${lecturer.name}をリストから削除しますか？`)) {
                                                        await api.removeLecturerPreference(lecturer.id);
                                                        setLecturers(lecturers.filter(l => l.id !== lecturer.id));
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
};
