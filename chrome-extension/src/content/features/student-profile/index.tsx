import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, StudentStatus } from '../../api';

interface StudentInfoPanelProps {
    studentName?: string;
    studentId: string;
    onClose?: () => void;
}

// Embedded Design
type EventType = 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';

const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const CircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const RichTextEditor = ({ value, onChange, placeholder, minHeight = '100px' }: { value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: string }) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML && editorRef.current.innerHTML !== '<br>') {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);
    const execCmd = (cmd: string, arg?: string) => {
        document.execCommand(cmd, false, arg);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };
    const handleToolbarClick = (e: React.MouseEvent, cmd: string, arg?: string) => {
        e.preventDefault(); // Prevents losing focus!
        execCmd(cmd, arg);
    };
    const btnStyle = {
        padding: '4px 8px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '13px',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '28px'
    };
    return (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '6px', borderBottom: '1px solid #d1d5db', backgroundColor: '#f8fafc' }}>
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'bold')} style={btnStyle} title="太字 (Ctrl+B)">B</button>
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'italic')} style={{...btnStyle, fontStyle: 'italic', fontWeight: 'normal'}} title="斜体 (Ctrl+I)">I</button>
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'underline')} style={{...btnStyle, textDecoration: 'underline', fontWeight: 'normal'}} title="下線 (Ctrl+U)">U</button>
                <div style={{ width: '1px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'insertUnorderedList')} style={{...btnStyle, fontWeight: 'normal'}} title="箇条書きリスト">≡</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
                style={{
                    minHeight,
                    padding: '12px',
                    outline: 'none',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    color: '#374151'
                }}
                data-placeholder={placeholder}
            />
        </div>
    );
};

const StudentInfoPanel: React.FC<StudentInfoPanelProps> = ({ studentId, studentName, onClose }) => {
    const [note, setNote] = useState('');
    const [originalNote, setOriginalNote] = useState('');
    const [campusName, setCampusName] = useState<string | null>(null);
    const [status, setStatus] = useState<StudentStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Churn Risk state
    const [isChurnRisk, setIsChurnRisk] = useState(false);
    const [churnRiskReason, setChurnRiskReason] = useState('');
    const [churnRiskSaving, setChurnRiskSaving] = useState(false);
    const [churnRiskMessage, setChurnRiskMessage] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);

    // QR Code Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [newEvent, setNewEvent] = useState<{
        title: string;
        date: string;
        endDate: string;
        type: EventType;
        description: string;
        notifyWeeksBefore: string;
    }>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        endDate: '',
        type: 'OTHER',
        description: '',
        notifyWeeksBefore: '1'
    });

    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
    const [newAnnouncement, setNewAnnouncement] = useState<{
        title: string;
        detail: string;
        importance: 'HIGH' | 'MEDIUM' | 'LOW';
        notifyStart: string;
        notifyEnd: string;
    }>({
        title: '',
        detail: '',
        importance: 'MEDIUM',
        notifyStart: '',
        notifyEnd: ''
    });

    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // 'ann-1', 'evt-99'
    const [showResolvedAnnouncements, setShowResolvedAnnouncements] = useState(false);
    const [showResolvedEvents, setShowResolvedEvents] = useState(false);

    // Test Schedule Modal State
    const [showTestModal, setShowTestModal] = useState(false);
    const [testModalLoading, setTestModalLoading] = useState(false);
    const [showAllSchoolTests, setShowAllSchoolTests] = useState(false);
    const [newTestSchedule, setNewTestSchedule] = useState<{
        name: string;
        customName: string;
        start: string;
        end: string;
    }>({
        name: '中間テスト',
        customName: '',
        start: '',
        end: ''
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId && !(event.target as Element).closest('.jukmane-dropdown-trigger')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdownId]);

    const loadData = async () => {
        // Debug Mock Data Injection
        if (studentId === 'debug-student-001') {
            const mockNote = `志望校: 東京大学 理科一類

【現状と課題】
英語: 過去問で安定して8割得点できています。リスニングの強化を継続中。
数学: 数IIIの微積分分野で計算ミスが目立つため、毎日の計算練習を徹底させています。
物理: 電磁気分野の理解が深まり、模試での偏差値が65→72に向上しました。

【指導方針】
次回の面談（11/15予定）で、共通テスト対策の具体的なスケジュールを決定します。
冬期講習では「東大数学チャレンジ」の受講を推奨します。`;
            setNote(mockNote);
            setOriginalNote(mockNote);

            setStatus(prev => prev || {
                hasUnreadLine: false,
                hasSharedNote: true,
                sharedNoteContent: mockNote,
                events: [
                    { id: 991, title: '第3回 全統記述模試', date: '2026-02-02', type: 'EXAM', endDate: '', description: 'E判定からの脱却を目指す' },
                    { id: 992, title: '三者面談', date: '2026-02-09', type: 'OTHER', endDate: '', description: '' },
                    { id: 993, title: '英検準1級 2次試験', date: '2026-02-22', type: 'EIKEN', endDate: '', description: 'S-CBT受験' }
                ],
                announcements: [
                    { id: 101, title: '宿題について', detail: '来週までの宿題はP.40-45です。必ずやってくること。', importance: 'HIGH', date: '2026-01-20' },
                    { id: 102, title: '授業振替のお知らせ', detail: '2/11の授業は祝日のためお休みです。', importance: 'MEDIUM', date: '2026-01-25' }
                ]
            });
            setLoading(false);
            return;
        }

        try {
            // Try fetching by ID first
            let data = await api.getStudentStatus({ studentIds: [studentId] });

            if (data._campus) {
                setCampusName(data._campus.name);
            }

            // Priority 2: Name (if provided and ID failed)
            if (!data[studentId] && studentName) {
                console.log('Jukmane: ID lookup failed, trying Name:', studentName);
                const nameData = await api.getStudentStatus({ studentNames: [studentName] });

                // Check if name lookup returned valid data
                const matchingKey = Object.keys(nameData).find(k => k === studentName || k === studentName.replace(/\s+/g, ''));

                if (nameData._campus) {
                    setCampusName(nameData._campus.name);
                }

                if (matchingKey && nameData[matchingKey]) {
                    setStatus(nameData[matchingKey]);
                    const content = nameData[matchingKey].sharedNoteContent || '';
                    setNote(content);
                    setOriginalNote(content);
                    setLoading(false);
                    return;
                }
            }

            if (data[studentId]) {
                setStatus(data[studentId]);
                const content = data[studentId].sharedNoteContent || '';
                setNote(content);
                setOriginalNote(content);
                // Initialize churn risk state
                setIsChurnRisk(!!data[studentId].isChurnRisk);
                setChurnRiskReason(data[studentId].churnRiskReason || '');
            } else {
                console.warn('Jukmane: Student Not Found in DB.', { studentId, studentName });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [studentId]);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        if (studentId === 'debug-student-001') {
            setTimeout(() => {
                setOriginalNote(note);
                setMessage('保存しました (Debug) ✅');
                setSaving(false);
                setTimeout(() => setMessage(''), 3000);
            }, 800);
            return;
        }

        try {
            const success = await api.updateStudentNote(studentId, note);
            if (success) {
                setOriginalNote(note);
                setMessage('保存しました ✅');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('保存に失敗しました ❌');
            }
        } catch (e) {
            setMessage('エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    // --- ANNOUNCEMENT HANDLERS ---
    const openAnnouncementModal = (ann?: any) => {
        if (ann) {
            setEditingAnnouncementId(ann.id);
            setNewAnnouncement({
                title: ann.title,
                detail: ann.detail,
                importance: ann.importance,
                notifyStart: ann.notifyStart ? new Date(ann.notifyStart).toISOString().split('T')[0] : '',
                notifyEnd: ann.notifyEnd ? new Date(ann.notifyEnd).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingAnnouncementId(null);
            setNewAnnouncement({ title: '', detail: '', importance: 'MEDIUM', notifyStart: '', notifyEnd: '' });
        }
        setShowAnnouncementModal(true);
    };

    const handleSaveAnnouncement = async () => {
        setModalLoading(true);

        // Default notify period: today → today + 2 weeks (for new announcements only)
        let effectiveNotifyStart = newAnnouncement.notifyStart || undefined;
        let effectiveNotifyEnd = newAnnouncement.notifyEnd || undefined;
        if (!editingAnnouncementId && !effectiveNotifyStart && !effectiveNotifyEnd) {
            const today = new Date();
            effectiveNotifyStart = today.toISOString().split('T')[0];
            const twoWeeksLater = new Date(today);
            twoWeeksLater.setDate(today.getDate() + 14);
            effectiveNotifyEnd = twoWeeksLater.toISOString().split('T')[0];
        }

        const payload = {
            studentId,
            title: newAnnouncement.title,
            detail: newAnnouncement.detail,
            importance: newAnnouncement.importance,
            notifyStart: effectiveNotifyStart,
            notifyEnd: effectiveNotifyEnd
        };

        if (studentId === 'debug-student-001') {
            await new Promise(r => setTimeout(r, 500));
            setShowAnnouncementModal(false);
            setModalLoading(false);
            if (editingAnnouncementId) {
                setStatus(prev => prev ? { ...prev, announcements: prev.announcements?.map(a => a.id === editingAnnouncementId ? { ...a, ...payload, id: a.id } as any : a) } : null);
            } else {
                setStatus(prev => prev ? { ...prev, announcements: [...(prev.announcements || []), { id: Math.random(), ...payload, date: new Date().toISOString() } as any] } : null);
            }
            alert('保存しました (Debug) ✅');
            return;
        }

        try {
            if (editingAnnouncementId) {
                await api.updateAnnouncement({ id: editingAnnouncementId, ...payload });
            } else {
                await api.createAnnouncement(payload);
            }
            setShowAnnouncementModal(false);
            await loadData(); // Refresh
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました ❌');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        if (studentId === 'debug-student-001') {
            setStatus(prev => prev ? { ...prev, announcements: prev.announcements?.filter(a => a.id !== id) } : null);
            return;
        }
        try {
            await api.deleteAnnouncement(id);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('削除に失敗しました ❌');
        }
    };

    const handleToggleResolvedAnnouncement = async (id: number, currentlyResolved: boolean) => {
        if (studentId === 'debug-student-001') {
            setStatus(prev => prev ? {
                ...prev,
                announcements: prev.announcements?.map(a => a.id === id
                    ? { ...a, resolvedAt: currentlyResolved ? null : new Date().toISOString() } as any
                    : a
                )
            } : null);
            return;
        }
        try {
            const success = await api.toggleResolvedAnnouncement(id, !currentlyResolved);
            if (success) await loadData();
            else alert('更新に失敗しました');
        } catch (e) {
            alert('エラーが発生しました');
        }
    };


    // --- EVENT HANDLERS ---
    const openEventModal = (evt?: any) => {
        if (evt) {
            setEditingEventId(evt.id);
            setNewEvent({
                title: evt.title,
                date: evt.date ? new Date(evt.date).toISOString().split('T')[0] : '',
                endDate: evt.endDate ? new Date(evt.endDate).toISOString().split('T')[0] : '',
                type: evt.type,
                description: evt.description || '',
                notifyWeeksBefore: '1' // Default or calc
            });
        } else {
            setEditingEventId(null);
            setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], endDate: '', type: 'OTHER', description: '', notifyWeeksBefore: '1' });
        }
        setShowModal(true);
    };

    const handleSaveEvent = async () => {
        setModalLoading(true);

        const notifyStart = new Date(newEvent.date);
        notifyStart.setDate(notifyStart.getDate() - (parseInt(newEvent.notifyWeeksBefore) * 7));

        const eventPayload = {
            title: newEvent.title,
            date: newEvent.date,
            endDate: newEvent.endDate || undefined,
            type: newEvent.type,
            description: newEvent.description,
            notifyStart: notifyStart.toISOString(),
            notifyEnd: newEvent.endDate ? new Date(newEvent.endDate).toISOString() : new Date(newEvent.date).toISOString()
        };

        if (studentId === 'debug-student-001') {
            setTimeout(() => {
                setShowModal(false);
                setModalLoading(false);
                if (editingEventId) {
                    setStatus(prev => prev ? { ...prev, events: prev.events?.map(e => e.id === editingEventId ? { ...e, ...eventPayload, id: e.id } : e).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) } : null);
                } else {
                    setStatus(prev => prev ? { ...prev, events: [...(prev.events || []), { id: Math.random(), ...eventPayload }].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) } : null);
                }
            }, 800);
            return;
        }

        try {
            if (editingEventId) {
                await api.updateEvent({ id: editingEventId, ...eventPayload });
            } else {
                await api.createEvent({ studentId, ...eventPayload });
            }
            setShowModal(false);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        if (studentId === 'debug-student-001') {
            setStatus(prev => prev ? { ...prev, events: prev.events?.filter(e => e.id !== id) } : null);
            return;
        }
        try {
            await api.deleteEvent(id);
            await loadData();
        } catch (e) {
            alert('削除に失敗しました ❌');
        }
    };

    const handleToggleResolvedEvent = async (id: number, currentlyResolved: boolean) => {
        if (studentId === 'debug-student-001') {
            setStatus(prev => prev ? {
                ...prev,
                events: prev.events?.map(e => e.id === id
                    ? { ...e, resolvedAt: currentlyResolved ? null : new Date().toISOString() } as any
                    : e
                )
            } : null);
            return;
        }
        try {
            const success = await api.toggleResolvedEvent(id, !currentlyResolved);
            if (success) await loadData();
            else alert('更新に失敗しました');
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    // --- TEST SCHEDULE HANDLERS ---
    const handleSaveTestSchedule = async () => {
        const schoolId = status?.schoolId;
        if (!schoolId) {
            alert('この生徒の学校情報が見つかりません');
            return;
        }

        const testName = newTestSchedule.name === 'その他'
            ? newTestSchedule.customName
            : newTestSchedule.name;

        if (!testName || !newTestSchedule.start || !newTestSchedule.end) {
            alert('テスト名、開始日、終了日は必須です');
            return;
        }

        setTestModalLoading(true);
        try {
            const result = await api.addTestSchedule(schoolId, {
                name: testName,
                start: newTestSchedule.start,
                end: newTestSchedule.end
            });
            if (result) {
                setShowTestModal(false);
                setNewTestSchedule({ name: '中間テスト', customName: '', start: '', end: '' });
                await loadData();
            } else {
                alert('保存に失敗しました');
            }
        } catch (e: any) {
            alert(e?.message || '保存に失敗しました');
        } finally {
            setTestModalLoading(false);
        }
    };

    const handleDeleteTestSchedule = async (schoolId: number, testName: string) => {
        if (!confirm(`「${testName}」を削除しますか？`)) return;
        try {
            const success = await api.deleteTestSchedule(schoolId, testName);
            if (success) await loadData();
            else alert('削除に失敗しました');
        } catch (e) {
            alert('削除に失敗しました');
        }
    };

    if (loading) {
        return (
            <div className="font-sans text-gray-800" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!status || !status.studentId) {
        return (
            <div className="font-sans text-gray-800" style={{ fontFamily: '"Inter", sans-serif', maxWidth: '400px' }}>
                <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1d4ed8' }}>
                        📋 未登録の生徒です
                    </h3>
                    <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '12px', lineHeight: '1.6' }}>
                        この生徒はまだシステムに登録されていません。体験生、または生徒データのインポート忘れの可能性があります。
                    </p>
                    <div style={{ fontSize: '12px', color: '#1e3a5f', backgroundColor: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                        <div style={{ marginBottom: '4px' }}><strong>名前:</strong> {studentName || '(不明)'}</div>
                        <div><strong>塾マネID:</strong> {studentId || '(不明)'}</div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '10px', lineHeight: '1.5' }}>
                        共有事項やイベントを記録するには、管理画面から生徒データをインポートしてください。
                    </p>
                    <button
                        onClick={() => {
                            const baseUrl = window.location.origin.includes('eisai-api.vercel.app')
                                ? 'https://eisai-api.vercel.app'
                                : (document.querySelector<HTMLInputElement>('#eisai-api-base')?.value || 'https://eisai-api.vercel.app');
                            window.open(`${baseUrl}/students`, '_blank');
                        }}
                        style={{
                            display: 'block', width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600',
                            color: '#fff', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', textAlign: 'center',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    >
                        📥 管理画面で生徒を登録する
                    </button>
                </div>
            </div>
        );
    }

    // Sync note state when editing starts
    const startEditing = () => {
        setNote(originalNote);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setNote(originalNote);
        setIsEditing(false);
    };

    const handleSaveAndClose = async () => {
        await handleSave();
        setIsEditing(false);
    };

    // --- Churn Risk Handlers ---
    const handleChurnRiskToggle = async () => {
        const newValue = !isChurnRisk;
        setIsChurnRisk(newValue);
        setChurnRiskSaving(true);
        setChurnRiskMessage('');
        try {
            const dbId = status?.dbId;
            if (!dbId) {
                setChurnRiskMessage('生徒IDが見つかりません ❌');
                setIsChurnRisk(!newValue);
                return;
            }
            const success = await api.updateChurnRisk(dbId, newValue, newValue ? churnRiskReason : '');
            if (success) {
                setChurnRiskMessage(newValue ? '退塾懸念を設定しました ⚠️' : '退塾懸念を解除しました ✅');
                setTimeout(() => setChurnRiskMessage(''), 3000);
            } else {
                setChurnRiskMessage('保存に失敗しました ❌');
                setIsChurnRisk(!newValue);
            }
        } catch (e) {
            setChurnRiskMessage('エラーが発生しました ❌');
            setIsChurnRisk(!newValue);
        } finally {
            setChurnRiskSaving(false);
        }
    };

    const handleChurnRiskReasonSave = async () => {
        if (!isChurnRisk) return;
        const dbId = status?.dbId;
        if (!dbId) return;
        setChurnRiskSaving(true);
        try {
            const success = await api.updateChurnRisk(dbId, true, churnRiskReason);
            if (success) {
                setChurnRiskMessage('理由を保存しました ✅');
                setTimeout(() => setChurnRiskMessage(''), 3000);
            }
        } catch (e) {
            setChurnRiskMessage('保存に失敗しました ❌');
        } finally {
            setChurnRiskSaving(false);
        }
    };



    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column' as const,
            maxHeight: 'calc(100vh - 40px)',
            overflow: 'hidden',
            fontFamily: '"Inter", "Noto Sans JP", sans-serif',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: loading ? '#cbd5e1' : status ? '#22c55e' : '#94a3b8'
                    }} />
                    <h2 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: 0
                    }}>
                        {studentName || '生徒情報'}
                    </h2>
                    {campusName && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginLeft: '4px',
                            border: '1px solid #e2e8f0'
                        }}>
                            🏢 {campusName}
                        </div>
                    )}
                    {/* Dashboard Link */}
                    <a
                        href="https://eisai-api.vercel.app/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            textDecoration: 'none',
                            marginLeft: '8px',
                            transition: 'all 0.2s',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #c7d2fe'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#4f46e5';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#eef2ff';
                            e.currentTarget.style.color = '#4f46e5';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="14" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                        ダッシュボード
                    </a>
                    {/* QR Code Button */}
                    <button
                        onClick={() => setShowQRModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fcd34d',
                            cursor: 'pointer',
                            marginLeft: '4px',
                            transition: 'all 0.2s',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fbbf24';
                            e.currentTarget.style.color = '#78350f';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef3c7';
                            e.currentTarget.style.color = '#92400e';
                        }}
                        title="スマホでスキャン"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="5" height="5" x="3" y="3" rx="1" />
                            <rect width="5" height="5" x="16" y="3" rx="1" />
                            <rect width="5" height="5" x="3" y="16" rx="1" />
                            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                            <path d="M21 21v.01" />
                            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                            <path d="M3 12h.01" />
                            <path d="M12 3h.01" />
                            <path d="M12 16v.01" />
                            <path d="M16 12h1" />
                            <path d="M21 12v.01" />
                            <path d="M12 21v-1" />
                        </svg>
                        QR
                    </button>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        ✕
                    </button>
                )}
            </div>
            {/* Churn Risk Toggle Bar */}
            {!loading && status?.studentId && (
                <div style={{
                    padding: '12px 20px',
                    backgroundColor: isChurnRisk ? '#fef2f2' : '#f8fafc',
                    borderBottom: '1px solid',
                    borderColor: isChurnRisk ? '#fecaca' : '#e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flexShrink: 0,
                    transition: 'background-color 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{isChurnRisk ? '⚠️' : '🟢'}</span>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: isChurnRisk ? '#dc2626' : '#374151'
                            }}>
                                退塾懸念
                            </span>
                        </div>
                        {/* Toggle Switch */}
                        <button
                            onClick={handleChurnRiskToggle}
                            disabled={churnRiskSaving}
                            style={{
                                position: 'relative',
                                width: '44px',
                                height: '24px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: isChurnRisk ? '#dc2626' : '#d1d5db',
                                cursor: churnRiskSaving ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s ease',
                                padding: 0,
                                flexShrink: 0
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: isChurnRisk ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                transition: 'left 0.3s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>
                    {/* Churn Risk Reason (shown when ON) */}
                    {isChurnRisk && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                                type="text"
                                value={churnRiskReason}
                                onChange={(e) => setChurnRiskReason(e.target.value)}
                                onBlur={handleChurnRiskReasonSave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleChurnRiskReasonSave(); }}
                                placeholder="退塾懸念の理由を入力..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    )}
                    {churnRiskMessage && (
                        <div style={{ fontSize: '11px', fontWeight: '600', color: churnRiskMessage.includes('❌') ? '#ef4444' : churnRiskMessage.includes('⚠️') ? '#dc2626' : '#10b981' }}>
                            {churnRiskMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Scrollable Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>

                {/* Note Section (View/Edit Mode) */}
                <div style={{
                    marginBottom: '20px',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: isEditing ? '#ffffff' : '#eef2ff',
                    border: '1px solid',
                    borderColor: isEditing ? '#d1d5db' : '#e0e7ff'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
                                <path d="M2 6h4" />
                                <path d="M16 2v4" />
                                <path d="M6 10h5" />
                                <path d="m14 10 7.5-7.5L25 6l-7.5 7.5V14h3.5v-3.5" />
                                <path d="M18.8 4.8 22.8 8.8" />
                            </svg>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#312e81' }}>
                                指導共有事項・特記事項
                            </label>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={startEditing}
                                style={{
                                    fontSize: '12px',
                                    color: '#4f46e5',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                編集する
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <>
                            <div style={{ marginBottom: '10px' }}>
                                <RichTextEditor value={note} onChange={setNote} minHeight="120px" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    onClick={cancelEditing}
                                    style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveAndClose}
                                    disabled={saving}
                                    style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: saving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {saving ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div
                            onClick={startEditing}
                            style={{
                                fontSize: '14px',
                                color: originalNote ? '#312e81' : '#9ca3af',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                minHeight: '60px',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: originalNote || '（クリックして入力してください）'
                            }}
                        />
                    )}
                </div>

                {message && (
                    <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: message.includes('❌') ? '#ef4444' : '#10b981' }}>
                        {message}
                    </div>
                )}


                {/* Announcements List Section (with Edit/Delete) */}
                {status?.announcements && status.announcements.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px' }}>📢</span>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                                    共有事項 ({status.announcements.filter(a => !a.resolvedAt).length}/{status.announcements.length})
                                </h4>
                            </div>
                            <button
                                onClick={() => setShowResolvedAnnouncements(!showResolvedAnnouncements)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                {showResolvedAnnouncements ? '解決済みを隠す' : '解決済みを表示'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {status.announcements
                                .filter(ann => showResolvedAnnouncements || !ann.resolvedAt)
                                .map((ann) => {
                                    const impColors = {
                                        'HIGH': { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
                                        'MEDIUM': { bg: '#eff6ff', text: '#3b82f6', border: '#93c5fd' },
                                        'LOW': { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
                                    };
                                    const style = impColors[ann.importance] || impColors['MEDIUM'];
                                    const isResolved = !!(ann as any).resolvedAt;

                                    return (
                                        <div key={ann.id} style={{
                                            position: 'relative',
                                            padding: '16px',
                                            backgroundColor: isResolved ? '#f9fafb' : '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            fontSize: '13px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            marginBottom: '10px',
                                            zIndex: openDropdownId === `ann-${ann.id}` ? 50 : 'auto',
                                            opacity: isResolved ? 0.5 : 1,
                                            transition: 'opacity 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: '40px' }}>
                                                <div style={{ fontWeight: 'bold', color: isResolved ? '#9ca3af' : '#111827', fontSize: '14px', wordBreak: 'break-all', textDecoration: isResolved ? 'line-through' : 'none' }}>{ann.title}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px',
                                                        backgroundColor: style.bg,
                                                        color: style.text,
                                                        border: `1px solid ${style.border}`,
                                                        fontWeight: '600',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {ann.importance === 'HIGH' ? '重要' : ann.importance === 'MEDIUM' ? '通常' : '軽微'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                        {new Date(ann.date).toLocaleDateString('ja-JP')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div 
                                                style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                                                dangerouslySetInnerHTML={{ __html: ann.detail || '' }}
                                            />

                                            {/* Dropdown Menu */}
                                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                                <button
                                                    className="jukmane-dropdown-trigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === `ann-${ann.id}` ? null : `ann-${ann.id}`);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <MoreIcon />
                                                </button>

                                                {openDropdownId === `ann-${ann.id}` && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: '0',
                                                        marginTop: '4px',
                                                        backgroundColor: '#ffffff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                        zIndex: 50,
                                                        minWidth: '120px',
                                                        padding: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); openAnnouncementModal(ann); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <EditIcon />
                                                            編集
                                                        </button>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); handleDeleteAnnouncement(ann.id); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: '#dc2626',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <TrashIcon />
                                                            削除
                                                        </button>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); handleToggleResolvedAnnouncement(ann.id, isResolved); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: isResolved ? '#6b7280' : '#059669',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            {isResolved ? <CircleIcon /> : <CheckCircleIcon />}
                                                            {isResolved ? '未解決に戻す' : '解決済みにする'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Test Schedule Section (from School) */}
                {status?.schoolId && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px' }}>📝</span>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                                    テスト予定 {status?.testSchedules && status.testSchedules.length > 0 ? `(${status.testSchedules.length})` : ''}
                                </h4>
                                {status?.schoolName && (
                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>- {status.schoolName}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowTestModal(true)}
                                style={{
                                    background: 'none',
                                    border: '1px dashed #d1d5db',
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    padding: '2px 8px'
                                }}
                            >
                                + 追加
                            </button>
                        </div>
                        {status?.testSchedules && status.testSchedules.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {status.testSchedules.map((test) => {
                                    const startDate = new Date(test.start);
                                    const endDate = new Date(test.end);
                                    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
                                    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
                                    const isOngoing = startDate <= new Date() && endDate >= new Date();

                                    return (
                                        <div key={test.id} style={{
                                            padding: '14px 16px',
                                            backgroundColor: isOngoing ? '#fef3c7' : '#f0fdf4',
                                            border: '1px solid',
                                            borderColor: isOngoing ? '#fcd34d' : '#86efac',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                                                        {test.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {test.schoolName}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            color: isOngoing ? '#b45309' : '#166534'
                                                        }}>
                                                            {startStr} ~ {endStr}
                                                        </div>
                                                        {isOngoing && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                marginTop: '4px',
                                                                padding: '2px 8px',
                                                                backgroundColor: '#f59e0b',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                テスト期間中
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteTestSchedule(test.schoolId, test.name)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            color: '#9ca3af',
                                                            fontSize: '12px'
                                                        }}
                                                        title="削除"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '12px' }}>
                                表示期間内のテスト予定はありません
                            </div>
                        )}

                        {/* All School Test Schedules Toggle */}
                        {status?.allSchoolTestSchedules && status.allSchoolTestSchedules.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <button
                                    onClick={() => setShowAllSchoolTests(!showAllSchoolTests)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '11px',
                                        color: '#6b7280',
                                        cursor: 'pointer',
                                        padding: '4px 0',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {showAllSchoolTests ? '▼ この学校の全テスト予定を隠す' : '▶ この学校の全テスト予定を表示 (' + status.allSchoolTestSchedules.length + '件)'}
                                </button>
                                {showAllSchoolTests && (
                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {status.allSchoolTestSchedules.map((test, idx) => {
                                            const s = new Date(test.start);
                                            const e = new Date(test.end);
                                            const isPast = e < new Date();

                                            // 進行中の場合は上のactive listに出るので、ここではハイライトしないか控えめにする
                                            return (
                                                <div key={`all-${idx}`} style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: isPast ? '#f3f4f6' : '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    opacity: isPast ? 0.7 : 1
                                                }}>
                                                    <div>
                                                        <span style={{ fontWeight: '600', color: '#374151' }}>{test.name}</span>
                                                    </div>
                                                    <span style={{ color: '#6b7280' }}>
                                                        {s.getFullYear()}/{s.getMonth() + 1}/{s.getDate()} ~ {e.getMonth() + 1}/{e.getDate()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                        onClick={() => openEventModal()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <span>📅</span> イベントを追加
                    </button>
                    <button
                        onClick={() => openAnnouncementModal()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <span>📢</span> 共有事項を追加
                    </button>
                </div>

                {/* Schedule Section */}
                <div style={{ paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📅</span>
                            <span>今後のスケジュール</span>
                        </h4>
                        <button
                            onClick={() => setShowResolvedEvents(!showResolvedEvents)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '11px',
                                color: '#6b7280',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {showResolvedEvents ? '解決済みを隠す' : '解決済みを表示'}
                        </button>
                    </div>

                    {status?.events && status.events.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '100px' }}>
                            {status.events
                                .filter(e => showResolvedEvents || !e.resolvedAt)
                                .map((event) => {
                                    const dateObj = new Date(event.date);
                                    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                                    const weekDay = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];

                                    const typeMap: any = {
                                        'EXAM': { label: '定期テスト/模試', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
                                        'EIKEN': { label: '英検/検定', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
                                        'SEASONAL_COURSE': { label: '季節講習', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
                                        'OTHER': { label: 'その他', bg: '#f8fafc', text: '#334155', border: '#e2e8f0' }
                                    };
                                    const style = typeMap[event.type] || typeMap['OTHER'];
                                    const isResolved = !!(event as any).resolvedAt;

                                    return (
                                        <div key={event.id} style={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            backgroundColor: isResolved ? '#f9fafb' : '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            marginBottom: '0',
                                            zIndex: openDropdownId === `evt-${event.id}` ? 50 : 'auto',
                                            opacity: isResolved ? 0.5 : 1,
                                            transition: 'opacity 0.2s'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                marginRight: '16px',
                                                minWidth: '60px',
                                                borderRight: '1px solid #f3f4f6',
                                                paddingRight: '16px'
                                            }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{dateStr}</span>
                                                <span style={{ fontSize: '11px', color: '#6b7280' }}>({weekDay})</span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, marginRight: '40px' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 8px',
                                                        backgroundColor: style.bg,
                                                        borderRadius: '12px',
                                                        color: style.text,
                                                        border: `1px solid ${style.border}`,
                                                        whiteSpace: 'nowrap',
                                                        fontWeight: '500',
                                                        marginTop: '2px'
                                                    }}>
                                                        {style.label}
                                                    </span>
                                                    <span style={{ fontWeight: 'bold', color: isResolved ? '#9ca3af' : '#1f2937', fontSize: '14px', wordBreak: 'break-word', lineHeight: '1.4', textDecoration: isResolved ? 'line-through' : 'none' }}>
                                                        {event.title}
                                                    </span>
                                                </div>
                                                {event.description && (
                                                    <div 
                                                        style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: '1.4', wordBreak: 'break-word' }}
                                                        dangerouslySetInnerHTML={{ __html: event.description || '' }}
                                                    />
                                                )}
                                            </div>

                                            {/* Dropdown Menu */}
                                            <div style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }}>
                                                <button
                                                    className="jukmane-dropdown-trigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === `evt-${event.id}` ? null : `evt-${event.id}`);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <MoreIcon />
                                                </button>

                                                {openDropdownId === `evt-${event.id}` && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: '0',
                                                        marginTop: '4px',
                                                        backgroundColor: '#ffffff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                        zIndex: 9999,
                                                        minWidth: '120px',
                                                        padding: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); openEventModal(event); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <EditIcon />
                                                            編集
                                                        </button>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); handleDeleteEvent(event.id); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: '#dc2626',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <TrashIcon />
                                                            削除
                                                        </button>
                                                        <button
                                                            onClick={() => { setOpenDropdownId(null); handleToggleResolvedEvent(event.id, isResolved); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                background: 'none',
                                                                textAlign: 'left',
                                                                fontSize: '13px',
                                                                color: isResolved ? '#6b7280' : '#059669',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            {isResolved ? <CircleIcon /> : <CheckCircleIcon />}
                                                            {isResolved ? '未解決に戻す' : '解決済みにする'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📅</div>
                            登録された予定はありません
                        </div>
                    )}
                </div>

                {/* Test Schedule Registration Modal */}
                {showTestModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(2px)'
                    }} onClick={() => setShowTestModal(false)}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            width: '360px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                                📝 テスト期間を登録
                            </h3>
                            {status?.schoolName && (
                                <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '12px', color: '#166534' }}>
                                    🏫 {status.schoolName} の全生徒に自動共有されます
                                </div>
                            )}

                            {/* Test Name */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>テスト名</label>
                                <select
                                    value={newTestSchedule.name}
                                    onChange={e => setNewTestSchedule(p => ({ ...p, name: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="1学期中間テスト">1学期中間テスト</option>
                                    <option value="1学期期末テスト">1学期期末テスト</option>
                                    <option value="2学期中間テスト">2学期中間テスト</option>
                                    <option value="2学期期末テスト">2学期期末テスト</option>
                                    <option value="学年末テスト">学年末テスト</option>
                                    <option value="実力テスト">実力テスト</option>
                                    <option value="その他">その他（自由入力）</option>
                                </select>
                                {newTestSchedule.name === 'その他' && (
                                    <input
                                        type="text"
                                        value={newTestSchedule.customName}
                                        onChange={e => setNewTestSchedule(p => ({ ...p, customName: e.target.value }))}
                                        placeholder="テスト名を入力"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            marginTop: '8px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Date Fields */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>開始日</label>
                                    <input
                                        type="date"
                                        value={newTestSchedule.start}
                                        onChange={e => setNewTestSchedule(p => ({ ...p, start: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>終了日</label>
                                    <input
                                        type="date"
                                        value={newTestSchedule.end}
                                        onChange={e => setNewTestSchedule(p => ({ ...p, end: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowTestModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        background: 'white',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveTestSchedule}
                                    disabled={testModalLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: testModalLoading ? '#9ca3af' : '#059669',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        cursor: testModalLoading ? 'default' : 'pointer'
                                    }}
                                >
                                    {testModalLoading ? '保存中...' : '登録'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcement Creation/Edit Modal */}
                {showAnnouncementModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(2px)'
                    }} onClick={() => setShowAnnouncementModal(false)}>
                        <div style={{
                            width: '400px',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'fadeIn 0.2s ease-out',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            color: '#374151',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                                {editingAnnouncementId ? '共有事項を編集' : '共有事項を追加'}
                            </h3>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        タイトル <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newAnnouncement.title}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                        placeholder="例: 宿題について"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', height: '42px', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        重要度
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={newAnnouncement.importance}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, importance: e.target.value as any })}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                appearance: 'none',
                                                backgroundColor: 'white',
                                                color: '#374151',
                                                boxSizing: 'border-box',
                                                height: '42px',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            <option value="HIGH">重要</option>
                                            <option value="MEDIUM">通常</option>
                                            <option value="LOW">軽微</option>
                                        </select>
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        内容 <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <RichTextEditor 
                                        value={newAnnouncement.detail}
                                        onChange={v => setNewAnnouncement({ ...newAnnouncement, detail: v })}
                                        placeholder="詳細を入力してください"
                                        minHeight="100px"
                                    />
                                </div>

                                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                                        <span>🔔</span> LINE通知設定
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                                通知開始日
                                            </label>
                                            <input
                                                type="date"
                                                value={newAnnouncement.notifyStart}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, notifyStart: e.target.value })}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                                通知終了日
                                            </label>
                                            <input
                                                type="date"
                                                value={newAnnouncement.notifyEnd}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, notifyEnd: e.target.value })}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                                <button
                                    onClick={() => setShowAnnouncementModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveAnnouncement}
                                    disabled={!newAnnouncement.title || !newAnnouncement.detail || modalLoading}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4f46e5',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: (!newAnnouncement.title || !newAnnouncement.detail || modalLoading) ? 'not-allowed' : 'pointer',
                                        opacity: (!newAnnouncement.title || !newAnnouncement.detail || modalLoading) ? 0.7 : 1
                                    }}
                                >
                                    {modalLoading ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Creation/Edit Modal */}
                {showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(2px)'
                    }} onClick={() => setShowModal(false)}>
                        <div style={{
                            width: '400px',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'fadeIn 0.2s ease-out',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            color: '#374151',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                                {editingEventId ? '予定を編集' : '予定を追加'}
                            </h3>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        タイトル <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="例: 第2回 模擬試験"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', height: '42px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                            開始日 <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', height: '42px', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                            終了日 (任意)
                                        </label>
                                        <input
                                            type="date"
                                            value={newEvent.endDate}
                                            onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', height: '42px', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        種別
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={newEvent.type}
                                            onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                appearance: 'none',
                                                backgroundColor: 'white',
                                                color: '#374151'
                                            }}
                                        >
                                            <option value="EVENT">イベント/通常</option>
                                            <option value="EXAM">定期テスト/模試</option>
                                            <option value="EIKEN">英検/検定</option>
                                            <option value="SEASONAL_COURSE">季節講習</option>
                                            <option value="OTHER">その他</option>
                                        </select>
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        詳細
                                    </label>
                                    <RichTextEditor 
                                        value={newEvent.description}
                                        onChange={v => setNewEvent({ ...newEvent, description: v })}
                                        placeholder="メモや詳細などを入力..."
                                        minHeight="80px"
                                    />
                                </div>

                                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                                        <span>🔔</span> 通知設定
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <select
                                            value={newEvent.notifyWeeksBefore}
                                            onChange={e => setNewEvent({ ...newEvent, notifyWeeksBefore: e.target.value })}
                                            style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                        >
                                            <option value="1">1週間前</option>
                                            <option value="2">2週間前</option>
                                            <option value="3">3週間前</option>
                                            <option value="4">4週間前</option>
                                        </select>
                                        <span style={{ fontSize: '13px', color: '#475569' }}>からLINE通知を開始</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={!newEvent.title || !newEvent.date || modalLoading}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4f46e5',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: (!newEvent.title || !newEvent.date || modalLoading) ? 'not-allowed' : 'pointer',
                                        opacity: (!newEvent.title || !newEvent.date || modalLoading) ? 0.7 : 1
                                    }}
                                >
                                    {modalLoading ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={() => setShowQRModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            maxWidth: '320px',
                            width: '90%',
                            textAlign: 'center',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '12px',
                                marginBottom: '16px'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="5" height="5" x="3" y="3" rx="1" />
                                    <rect width="5" height="5" x="16" y="3" rx="1" />
                                    <rect width="5" height="5" x="3" y="16" rx="1" />
                                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                                    <path d="M21 21v.01" />
                                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                                    <path d="M3 12h.01" />
                                    <path d="M12 3h.01" />
                                    <path d="M12 16v.01" />
                                    <path d="M16 12h1" />
                                    <path d="M21 12v.01" />
                                    <path d="M12 21v-1" />
                                </svg>
                            </div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#1e293b',
                                margin: '0 0 4px 0'
                            }}>
                                📱 スマホでスキャン
                            </h3>
                            <p style={{
                                fontSize: '13px',
                                color: '#64748b',
                                margin: 0
                            }}>
                                {studentName}の詳細ページへ
                            </p>
                        </div>

                        {/* QR Code */}
                        <div style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '20px',
                            border: '2px dashed #e2e8f0'
                        }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://eisai-api.vercel.app/students?studentId=${encodeURIComponent(studentId || '')}`)}&color=1e293b&bgcolor=f8fafc`}
                                alt="QR Code"
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>

                        {/* Instructions */}
                        <div style={{
                            backgroundColor: '#fffbeb',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '20px',
                            border: '1px solid #fef3c7'
                        }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#92400e',
                                margin: 0,
                                lineHeight: '1.5'
                            }}>
                                💡 スキャン後、「ホーム画面に追加」で<br />
                                いつでもワンタップでアクセス可能！
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowQRModal(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#f1f5f9',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#475569',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DiagnosticOverlay: React.FC<{ studentId?: string; studentName?: string; normalizedName?: string; resolvedId?: string; apiStatus?: string; receivedName?: string; onClose: () => void }> = ({ studentId, studentName, normalizedName, resolvedId, apiStatus, receivedName, onClose }) => {
    const [visible, setVisible] = useState(false);

    if (!visible) {
        return (
            <div
                onClick={() => setVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    width: '30px',
                    height: '30px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    opacity: 0.5
                }}
                title="Jukmane Extension Diagnostics"
            >
                🔧
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 10000,
            maxWidth: '350px',
            fontFamily: 'monospace',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #4b5563', paddingBottom: '4px' }}>
                <strong>Jukmane Diag v1.3.38</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }} title="Minimize">_</button>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }} title="Close Debugger">✕</button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '4px' }}>
                <div style={{ color: '#9ca3af' }}>Raw ID:</div><div>{studentId || '(None)'}</div>
                <div style={{ color: '#9ca3af' }}>Raw Name:</div><div>{studentName || '(None)'}</div>
                <div style={{ color: '#9ca3af' }}>Norm Name:</div><div>{normalizedName || '(None)'}</div>
                <div style={{ color: '#9ca3af' }}>Recv Name:</div><div style={{ wordBreak: 'break-all' }}>{receivedName || '(None)'}</div>
                <div style={{ color: '#9ca3af' }}>Res. ID:</div><div style={{ color: resolvedId ? '#4ade80' : '#f87171' }}>{resolvedId || '(Match Failed)'}</div>
                <div style={{ color: '#9ca3af' }}>API status:</div><div>{apiStatus || 'Waiting...'}</div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
                Status: {resolvedId ? 'Connected' : 'Looking for match...'}
            </div>
        </div>
    );
};

// --- Module Level State for Stability ---
let cachedCandidateId: string | null = null;
let cachedCandidateName: string | null = null;
let diagRoot: any = null;

const mountDiagnostics = (props: any, styleSheet: string) => {
    let host = document.getElementById('jukmane-diag-overlay-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'jukmane-diag-overlay-host';
        // fixed position for host
        host.style.position = 'fixed';
        host.style.bottom = '10px';
        host.style.right = '10px';
        host.style.zIndex = '10000';
        // Click-through for host unless interacting? 
        // Actually, the overlay needs pointer events.

        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: 'open' });

        // Inject styles
        const style = document.createElement('style');
        style.textContent = styleSheet;
        shadow.appendChild(style);

        const div = document.createElement('div');
        shadow.appendChild(div);

        diagRoot = createRoot(div);
    }

    if (!diagRoot) {
        // Should not happen if logic above is correct, but safe guard
        const hostEl = document.getElementById('jukmane-diag-overlay-host');
        if (hostEl && hostEl.shadowRoot) {
            const container = hostEl.shadowRoot.querySelector('div');
            if (container) diagRoot = createRoot(container);
        }
    }

    if (diagRoot) {
        diagRoot.render(<DiagnosticOverlay {...props} onClose={() => {
            const h = document.getElementById('jukmane-diag-overlay-host');
            if (h) {
                h.remove();
                diagRoot = null;
            }
        }} />);
    }
};

export const mountStudentInfoPanel = async (styleSheet: string) => {
    // URL check: Only mount on student-related pages, NOT on seating chart
    const href = window.location.href;
    const isStudentPage = href.includes('seitoview.php') || href.includes('jyugyouadd.php');
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isStudentPage && !isDev) {
        return;
    }

    // Only query active student if not already explicitly open
    if (document.getElementById('jukmane-extension-panel-host')) return;

    // Strategy: We want to find the "Current Student" being viewed/edited.
    let candidateId = '';

    // Strategy 1: URL Parameter (Most reliable on detail pages)
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('seito_id') || params.get('student_id') || params.get('id');
    if (urlId) candidateId = urlId;

    // Strategy 2: Hidden Input Fields (Common in edit forms)
    if (!candidateId) {
        const inputs = document.querySelectorAll('input[type="hidden"]');
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i] as HTMLInputElement;
            if (input.name === 'seito_id' || input.name === 'student_id' || input.name === 'id') {
                if (input.value) {
                    candidateId = input.value;
                    break;
                }
            }
        }
    }

    // Strategy 3: "Edit" Links on the page (If we are on a list view but clicked a row... rare for floating panel but good fallback)
    if (!candidateId) {
        // e.g. <a href="seitoview.php?seito_id=12345">
        const links = document.querySelectorAll('a[href*="seito_id="]');
        // This is dangerous if there are multiple. We only want "The Main One".
        // Let's assume if there is exactly one unique ID in all links, use it.
        const ids = new Set<string>();
        links.forEach(link => {
            const href = link.getAttribute('href');
            const match = href?.match(/seito_id=(\d+)/);
            if (match) ids.add(match[1]);
        });

        if (ids.size === 1) {
            const val = ids.values().next().value;
            if (val) candidateId = val;
        }
    }

    // NEW Strategy: Extract ID from "Delete" forms or "Update" forms
    if (!candidateId) {
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const action = form.getAttribute('action');
            if (action && action.includes('seito_id=')) {
                const match = action.match(/seito_id=(\d+)/);
                if (match) candidateId = match[1];
                break;
            }
            // Check inputs inside form
            const val = (form.querySelector('input[name="seito_id"]') as HTMLInputElement)?.value;
            if (val) {
                candidateId = val;
                break;
            }
        }
    }

    // Helper to extract student name from the page
    const extractNameFromPage = (): string | null => {
        let name: string | null = null;

        // Strategy 0: seitoview.php specific (.seitoname)
        // Structure: <div class="seitoname"><div class="furigana">...</div> NAME <span class="midashismall">ID...</span> ... </div>
        const seitonameDiv = document.querySelector('.seitoname');
        if (seitonameDiv) {
            const furiganaEl = seitonameDiv.querySelector('.furigana');
            const midashiEl = seitonameDiv.querySelector('.midashismall');

            if (furiganaEl && midashiEl) {
                // Name is the text node between furigana and midashismall
                let targetNode = furiganaEl.nextSibling;
                while (targetNode && targetNode !== midashiEl) {
                    if (targetNode.nodeType === Node.TEXT_NODE && targetNode.textContent?.trim()) {
                        name = targetNode.textContent.trim();
                        break;
                    }
                    targetNode = targetNode.nextSibling;
                }
            } else if (furiganaEl) {
                // Fallback: text after furigana
                let targetNode = furiganaEl.nextSibling;
                while (targetNode) {
                    if (targetNode.nodeType === Node.TEXT_NODE && targetNode.textContent?.trim()) {
                        name = targetNode.textContent.trim();
                        break;
                    }
                    targetNode = targetNode.nextSibling;
                }
            }
        }

        if (name) {
            // Validate name isn't junk
            name = name.replace(/\s+/g, ''); // Remove spaces
            return name;
        }

        // Strategy 0: Link Link Text (Matches Strategy used for ID)
        // If we found the ID via this link, the name is likely inside it.
        const seitoLink = document.querySelector('a[href*="seitoview.php"]');
        if (seitoLink && seitoLink.textContent) {
            name = seitoLink.textContent.trim();
        }

        if (!name) {
            // Strategy 1: Hidden Inputs (Most reliable on Jukmane if link missing)
            const familyName = (document.querySelector('input[name="seito_familyname"]') as HTMLInputElement)?.value;
            const firstName = (document.querySelector('input[name="seito_name"]') as HTMLInputElement)?.value;

            if (familyName && firstName) {
                name = `${familyName}${firstName}`;
            } else if (familyName) {
                name = familyName;
            }
        }

        if (!name) {
            // Strategy 2: Common header patterns
            const headers = Array.from(document.querySelectorAll('h1, h2, h3, .title'));
            for (const h of headers) {
                const text = h.textContent || '';
                const match = text.match(/([^\s]+)さん/);
                if (match) { name = match[1]; break; }
            }
        }

        if (!name) {
            // Strategy 3: Table cells
            const cells = Array.from(document.querySelectorAll('th, td'));
            for (let i = 0; i < cells.length; i++) {
                const text = cells[i].textContent?.trim();
                // Check for "Name" label
                if (text === '生徒氏名' || text === '氏名') {
                    const next = cells[i].nextElementSibling;
                    if (next && next.tagName === 'TD') { name = next.textContent?.trim() || null; break; }
                }
                // Check anchor tags inside cells (seitoview.php link)
                if (cells[i].querySelector('a[href*="seitoview.php"]')) {
                    name = cells[i].querySelector('a')?.textContent?.trim() || null;
                    break;
                }
            }
        }

        if (!name) {
            // Strategy 4: Generic inputs
            const nameInput = document.querySelector('input[name="name"], input[name="sei"], input[name="student_name"]') as HTMLInputElement;
            if (nameInput?.value) name = nameInput.value;
        }

        if (name) {
            // Normalize: Remove spaces, remove 'さん'/'くん' suffixes
            return name.replace(/\s+/g, '').replace(/[さんくん]$/, '');
        }
        return null;
    };

    const currentName = extractNameFromPage();

    // Stability Check: If we found nothing this run, BUT we have a cached value, keep the cached value.
    // This prevents "flickering" to None during partial DOM updates.
    if (!candidateId && cachedCandidateId) candidateId = cachedCandidateId;
    if (!currentName && cachedCandidateName) {
        // use cached name
    } else if (currentName) {
        // found new name (or same name)
        cachedCandidateName = currentName;
    }

    const effectiveName = currentName || cachedCandidateName;
    const normalizedName = effectiveName ? effectiveName.replace(/\s+/g, '').replace(/[さんくん]$/, '') : undefined;

    // Update Cache
    if (candidateId) cachedCandidateId = candidateId;

    // Optimization: If ID and Name haven't changed since last successful resolve, DO NOT refetch.
    // However, for Diag updates, we might want to re-render.
    // But we don't want to spam API.
    // Let's rely on just caching extraction for now.

    // Initial Diag Mount
    mountDiagnostics({ studentId: candidateId, studentName: effectiveName, normalizedName, apiStatus: 'Resolving...' }, styleSheet);

    if (!candidateId && !effectiveName) {
        // Still nothing? Then we really have nothing. 
        return;
    }

    // Resolve Real Student ID via API
    try {
        // Try fetching by Name ONLY (User Request directly: Jukmane IDs don't match DB)
        // We still extract candidateId for UI keys/debug, but don't query it.
        const statusMap = await api.getStudentStatus({
            studentIds: [],
            studentNames: effectiveName ? [effectiveName] : []
        });

        // Check for hit (Name Only)
        const hit = effectiveName && statusMap[effectiveName];
        const resolvedId = (hit && hit.studentId) ? hit.studentId : candidateId;

        // Extract Debug Info (it's mixed in the response object)
        const debugInfo = (statusMap as any)._debug;

        // Update Diag
        mountDiagnostics({
            studentId: candidateId,
            studentName: effectiveName,
            normalizedName,
            resolvedId: hit ? hit.studentId : undefined,
            receivedName: debugInfo ? debugInfo.receivedQuery : undefined,
            apiStatus: debugInfo
                ? `OK (C:${debugInfo.campusId}, N:${debugInfo.studentCount})`
                : (hit ? 'SUCCESS' : 'NO MATCH')
        }, styleSheet);

        if (hit) console.log('Jukmane: API Hit:', hit);
        // else console.warn('Jukmane: API Miss for', candidateId, effectiveName);

        if (resolvedId || effectiveName) {
            mountPanel(resolvedId || 'unknown', effectiveName || '', false, styleSheet);
        } else {
            mountPanel(candidateId || 'unknown', effectiveName || '', false, styleSheet);
        }

    } catch (e: any) {
        console.error('Jukmane: Failed to resolve student.', e);
        mountDiagnostics({
            studentId: candidateId,
            studentName: effectiveName,
            normalizedName,
            apiStatus: `ERROR: ${e.message || 'Unknown'}`
        }, styleSheet);
        if (candidateId) mountPanel(candidateId, effectiveName || '', false, styleSheet);
    }
};

const mountPanel = (studentId: string, studentName: string, _isDebug: boolean, styleSheet: string) => {
    if (document.getElementById('jukmane-extension-panel-host')) return;

    const host = document.createElement('div');
    host.id = 'jukmane-extension-panel-host';

    // Host styling (minimal to position the shadow root container)
    host.style.position = 'fixed';
    host.style.bottom = '20px';
    host.style.right = '20px';
    host.style.zIndex = '9999';
    // No width on host, let shadow content decide

    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const styleEl = document.createElement('style');
    styleEl.textContent = styleSheet;
    shadow.appendChild(styleEl);

    // Container inside shadow
    const panelContainer = document.createElement('div');
    panelContainer.id = 'jukmane-extension-panel';
    // Move layout styles to this container or Keep them on host?
    // Tailwind classes will apply here.
    // For fixed positioning relative to viewport, it's safer if host is fixed.

    // However, tailwind classes might need a wrapper.
    const wrapper = document.createElement('div');
    wrapper.style.width = '350px';
    wrapper.style.maxHeight = 'calc(100vh - 40px)';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    shadow.appendChild(wrapper);

    const root = createRoot(wrapper);
    root.render(
        <StudentInfoPanel
            studentId={studentId}
            studentName={studentName}
            onClose={() => {
                host.remove();
            }}
        />
    );
};
