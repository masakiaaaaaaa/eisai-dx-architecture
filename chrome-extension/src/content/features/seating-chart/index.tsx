import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, StudentStatus, getAppUrl } from '../../api';

// --- LINE Notification Logic Helper ---
const isActiveForLine = (item: any, type: 'announcement' | 'event') => {
    if (item.resolvedAt) return false;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'announcement') {
        const start = item.notifyStart ? new Date(item.notifyStart) : null;
        let end = item.notifyEnd ? new Date(item.notifyEnd) : null;
        if (end) end.setHours(23, 59, 59, 999); // Set to end of the day

        if (!start && !end) return true;
        if (start && !end) return now >= start;
        if (!start && end) return now <= end;
        return now >= start! && now <= end!;
    } else {
        const start = item.notifyStart ? new Date(item.notifyStart) : null;
        let end = item.notifyEnd ? new Date(item.notifyEnd) : null;
        if (end) end.setHours(23, 59, 59, 999); // Set to end of the day

        if (start || end) {
            if (!start && end) return now <= end;
            if (start && !end) return now >= start;
            if (start && end) return now >= start && now <= end;
        }
        const eventDate = new Date(item.date);
        return eventDate >= today;
    }
};

interface StudentStatusOverlayProps {
    studentId?: string;
    studentName?: string;
    initialStatus?: StudentStatus;
}

// @ts-ignore TS6133 - Kept for future use; currently rendered via pure CSS
const StudentStatusOverlay: React.FC<StudentStatusOverlayProps> = ({ studentId, studentName, initialStatus }) => {
    const [status, setStatus] = useState<StudentStatus | null>(initialStatus || null);
    const [loading, setLoading] = useState(!initialStatus);

    useEffect(() => {
        if (initialStatus) return;

        let mounted = true;

        const load = async () => {
            try {
                let data: Record<string, StudentStatus> = {};
                if (studentId) {
                    data = await api.getStudentStatus({ studentIds: [studentId] });
                } else if (studentName) {
                    data = await api.getStudentStatus({ studentNames: [studentName] });
                }

                const key = studentId || studentName;
                if (mounted && key && data[key]) {
                    setStatus(data[key]);
                }
            } catch (e) {
                console.error('Failed to load status', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [studentId, studentName, initialStatus]);

    if (loading) return null;
    if (!status) return null;

    const { hasSharedNote, hasEvents, hasTestSchedules, hasCollectionTask } = status;

    const dots = [];

    if (hasCollectionTask) {
        dots.push(
            <div key="collection" className="w-3 h-3 bg-fuchsia-500 rounded-full animate-pulse shadow-sm border border-white" title="テスト回収タスクあり" />
        );
    }

    if (hasTestSchedules) {
        dots.push(
            <div key="test" className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm border border-white" title="定期テスト通知期間（1ヶ月以内）" />
        );
    }

    if (hasSharedNote || hasEvents) {
        dots.push(
            <div key="note" className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm border border-white" title="特記事項・共有事項・イベントあり" />
        );
    }

    if (dots.length === 0) return null;

    return (
        <div className="absolute top-0 right-0 p-1 pointer-events-none z-10 flex gap-1">
            {dots}
        </div>
    );
};

// --- Shared Icons ---
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

// --- Global Info Panel for Seating Chart ---

interface GlobalPanelProps {
    unmatchedNames: string[];
    studentNotes: { name: string; items: { type: 'note' | 'announcement' | 'event'; title: string; detail: string; date?: string; sortKey: number }[] }[];
}

const GlobalInfoPanel: React.FC<GlobalPanelProps> = ({ unmatchedNames, studentNotes }) => {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [fetchError, setFetchError] = useState(false);
    const [appUrl, setAppUrl] = useState<string>('');

    // Modal & Dropdown States
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [showResolvedAnnouncements, setShowResolvedAnnouncements] = useState(false);
    const [showResolvedEvents, setShowResolvedEvents] = useState(false);

    // Announcement Modal variables
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
    const [newAnnouncement, setNewAnnouncement] = useState<{
        title: string; detail: string; importance: 'HIGH' | 'MEDIUM' | 'LOW'; notifyStart: string; notifyEnd: string;
    }>({ title: '', detail: '', importance: 'MEDIUM', notifyStart: '', notifyEnd: '' });

    // Event Modal variables
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [newEvent, setNewEvent] = useState<{
        title: string; date: string; endDate: string; type: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER'; description: string; notifyStart: string; notifyEnd: string;
    }>({ title: '', date: new Date().toISOString().split('T')[0], endDate: '', type: 'OTHER', description: '', notifyStart: '', notifyEnd: '' });

    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        getAppUrl().then(url => setAppUrl(url));
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId && !(event.target as Element).closest('.global-dropdown-trigger')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdownId]);

    const loadOverview = async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const result = await api.getCampusOverview();
            if (result) {
                setData(result);
            } else {
                setFetchError(true);
            }
        } catch (e) {
            console.error('Failed to load campus overview:', e);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    // Load immediately on mount so campus name is available
    useEffect(() => {
        loadOverview();
    }, []);

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
        try {
            if (editingAnnouncementId) {
                await api.updateAnnouncement({
                    id: editingAnnouncementId,
                    title: newAnnouncement.title,
                    detail: newAnnouncement.detail,
                    importance: newAnnouncement.importance,
                    notifyStart: newAnnouncement.notifyStart || undefined,
                    notifyEnd: newAnnouncement.notifyEnd || undefined
                });
            } else {
                await api.createAnnouncement({
                    // No studentId -> Global
                    title: newAnnouncement.title,
                    detail: newAnnouncement.detail,
                    importance: newAnnouncement.importance,
                    notifyStart: newAnnouncement.notifyStart || undefined,
                    notifyEnd: newAnnouncement.notifyEnd || undefined
                });
            }
            setShowAnnouncementModal(false);
            await loadOverview();
        } catch (e) {
            alert('保存に失敗しました');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await api.deleteAnnouncement(id);
            await loadOverview();
        } catch (e) {
            alert('削除に失敗しました');
        }
    };

    const handleResolveAnnouncement = async (ann: any) => {
        try {
            await api.updateAnnouncement({
                id: ann.id,
                title: ann.title,
                detail: ann.detail,
                importance: ann.importance,
                resolvedAt: ann.resolvedAt ? null : new Date().toISOString()
            } as any);
            await loadOverview();
        } catch (e) {
            alert('更新に失敗しました');
        }
    };

    // --- EVENT HANDLERS ---
    const openEventModal = (evt?: any) => {
        if (evt) {
            setEditingEventId(evt.id);
            setNewEvent({
                title: evt.title,
                date: new Date(evt.date).toISOString().split('T')[0],
                endDate: evt.endDate ? new Date(evt.endDate).toISOString().split('T')[0] : '',
                type: evt.type,
                description: evt.description || '',
                notifyStart: evt.notifyStart ? new Date(evt.notifyStart).toISOString().split('T')[0] : '',
                notifyEnd: evt.notifyEnd ? new Date(evt.notifyEnd).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingEventId(null);
            setNewEvent({
                title: '', date: new Date().toISOString().split('T')[0], endDate: '', type: 'OTHER', description: '', notifyStart: '', notifyEnd: ''
            });
        }
        setShowEventModal(true);
    };

    const handleSaveEvent = async () => {
        setModalLoading(true);
        try {
            if (editingEventId) {
                await api.updateEvent({
                    id: editingEventId,
                    title: newEvent.title,
                    date: newEvent.date,
                    endDate: newEvent.endDate || undefined,
                    type: newEvent.type,
                    description: newEvent.description,
                    notifyStart: newEvent.notifyStart || undefined,
                    notifyEnd: newEvent.notifyEnd || undefined
                });
            } else {
                await api.createEvent({
                    title: newEvent.title,
                    date: newEvent.date,
                    endDate: newEvent.endDate || undefined,
                    type: newEvent.type,
                    description: newEvent.description,
                    notifyStart: newEvent.notifyStart || undefined,
                    notifyEnd: newEvent.notifyEnd || undefined
                });
            }
            setShowEventModal(false);
            await loadOverview();
        } catch (e) {
            alert('保存に失敗しました');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await api.deleteEvent(id);
            await loadOverview();
        } catch (e) {
            alert('削除に失敗しました');
        }
    };

    const handleResolveEvent = async (evt: any) => {
        try {
            await api.updateEvent({
                id: evt.id,
                title: evt.title,
                date: evt.date,
                type: evt.type,
                resolvedAt: evt.resolvedAt ? null : new Date().toISOString()
            } as any);
            await loadOverview();
        } catch (e) {
            alert('更新に失敗しました');
        }
    };

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 10001,
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
            fontSize: '13px'
        }}>
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                style={{
                    padding: '8px 16px',
                    backgroundColor: expanded ? '#1f2937' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 10002
                }}
            >
                📋 {data?.campusName ? `${data.campusName} 教室情報` : '教室情報'}
                {!expanded && unmatchedNames.length > 0 && (
                    <span style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold', marginLeft: '4px'
                    }}>!</span>
                )}
                <span style={{ fontSize: '12px' }}>{expanded ? '▼ 閉じる' : '▲'}</span>
            </button>

            {/* Panel Content */}
            {expanded && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: '0',
                    width: '400px',
                    maxHeight: 'calc(100vh - 100px)',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    zIndex: 10001,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '2px solid transparent', borderImage: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7) 1', backgroundColor: '#fafbff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>📋</span>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                                {data?.campusName ? `${data.campusName} 教室情報` : '教室情報'}
                            </h3>
                        </div>
                        <button
                            onClick={() => setExpanded(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', transition: 'background-color 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ×
                        </button>
                    </div>

                    {/* Legend for Seating Chart Marks */}
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc', fontSize: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#d946ef', borderRadius: '50%' }} />
                            <span style={{ color: '#475569', fontWeight: '600' }}>回収対象</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
                            <span style={{ color: '#475569', fontWeight: '600' }}>定期テスト</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#facc15', borderRadius: '50%' }} />
                            <span style={{ color: '#475569', fontWeight: '600' }}>特記/共有/イベント</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '14px', height: '10px', backgroundColor: 'transparent', borderRadius: '2px', border: '2px solid #3b82f6', boxSizing: 'border-box' }} />
                            <span style={{ color: '#475569', fontWeight: '600', fontSize: '11px' }}>最近の入会(声掛け推奨)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px' }}>⚠️</span>
                            <span style={{ color: '#475569', fontWeight: '600', fontSize: '11px' }}>退塾懸念</span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0' }}>

                        {loading && (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                読み込み中...
                            </div>
                        )}

                        {!loading && fetchError && (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#ef4444', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>情報の取得に失敗しました</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                                    管理画面にログインしてください。<br />
                                    <a href={appUrl || 'https://eisai-api.vercel.app'} target="_blank" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                                        管理画面を開く
                                    </a>
                                </div>
                                <button
                                    onClick={loadOverview}
                                    type="button"
                                    style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                >
                                    再試行
                                </button>
                            </div>
                        )}

                        {data && (() => {
                            const activeAnnouncements = showResolvedAnnouncements
                                ? data.globalAnnouncements
                                : data.globalAnnouncements?.filter((a: any) => !a.resolvedAt && isActiveForLine(a, 'announcement')) || [];
                            const activeEvents = showResolvedEvents
                                ? data.globalEvents
                                : data.globalEvents?.filter((e: any) => !e.resolvedAt && isActiveForLine(e, 'event')) || [];

                            return (
                                <>
                                    {/* ── Section 1: 全体共有事項 ── */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>📢</span>
                                                <span>全体共有事項 ({activeAnnouncements?.length || 0})</span>
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <button
                                                    onClick={() => setShowResolvedAnnouncements(!showResolvedAnnouncements)}
                                                    style={{ background: 'none', border: 'none', fontSize: '11px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    {showResolvedAnnouncements ? '解決済みを隠す' : '解決済みを表示'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {activeAnnouncements?.length > 0 ? activeAnnouncements.map((ann: any) => {
                                                const isResolved = !!ann.resolvedAt;
                                                const impColors = {
                                                    'HIGH': { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
                                                    'MEDIUM': { bg: '#eff6ff', text: '#3b82f6', border: '#93c5fd' },
                                                    'LOW': { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
                                                };
                                                const style = impColors[ann.importance as keyof typeof impColors] || impColors['MEDIUM'];

                                                return (
                                                    <div key={ann.id} style={{
                                                        position: 'relative',
                                                        padding: '16px',
                                                        backgroundColor: isResolved ? '#f9fafb' : '#ffffff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        opacity: isResolved ? 0.5 : 1,
                                                        transition: 'opacity 0.2s',
                                                        zIndex: openDropdownId === `global-ann-${ann.id}` ? 50 : 'auto'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: '40px' }}>
                                                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: isResolved ? '#9ca3af' : '#111827', wordBreak: 'break-all', textDecoration: isResolved ? 'line-through' : 'none' }}>
                                                                {ann.title}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                                <span style={{
                                                                    fontSize: '11px', padding: '2px 8px', borderRadius: '9999px',
                                                                    backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}`,
                                                                    fontWeight: '600', whiteSpace: 'nowrap'
                                                                }}>
                                                                    {ann.importance === 'HIGH' ? '重要' : ann.importance === 'MEDIUM' ? '通常' : '軽微'}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                                    {new Date(ann.date).toLocaleDateString('ja-JP')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {ann.detail && <div style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{ann.detail}</div>}

                                                        {/* Dropdown Menu */}
                                                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                                            <button
                                                                className="global-dropdown-trigger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenDropdownId(openDropdownId === `global-ann-${ann.id}` ? null : `global-ann-${ann.id}`);
                                                                }}
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <MoreIcon />
                                                            </button>
                                                            {openDropdownId === `global-ann-${ann.id}` && (
                                                                <div style={{
                                                                    position: 'absolute', top: '100%', right: '0', marginTop: '4px', backgroundColor: '#ffffff',
                                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                                                    borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '120px', zIndex: 100, overflow: 'hidden', padding: '4px'
                                                                }}>
                                                                    <button
                                                                        onClick={() => { handleResolveAnnouncement(ann); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: isResolved ? '#6b7280' : '#059669', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        {isResolved ? <CircleIcon /> : <CheckCircleIcon />} {isResolved ? '未解決に戻す' : '解決済みにする'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { openAnnouncementModal(ann); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: '#374151', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <EditIcon /> 編集する
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { handleDeleteAnnouncement(ann.id); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: '#dc2626', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <TrashIcon /> 削除する
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>全体共有事項はありません</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
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
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                        >
                                            <span>📢</span> 共有事項を追加
                                        </button>
                                    </div>

                                    {/* Global Events */}
                                    <div style={{ marginBottom: '24px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>📅</span>
                                                <span>全体イベント ({activeEvents?.length || 0})</span>
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <button
                                                    onClick={() => setShowResolvedEvents(!showResolvedEvents)}
                                                    style={{ background: 'none', border: 'none', fontSize: '11px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    {showResolvedEvents ? '終了済みを隠す' : '終了済みを表示'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {activeEvents?.length > 0 ? activeEvents.map((evt: any) => {
                                                const isResolved = !!evt.resolvedAt;
                                                const d = new Date(evt.date);
                                                return (
                                                    <div key={evt.id} style={{
                                                        position: 'relative',
                                                        padding: '16px',
                                                        backgroundColor: isResolved ? '#f9fafb' : '#ffffff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        opacity: isResolved ? 0.5 : 1,
                                                        transition: 'opacity 0.2s',
                                                        zIndex: openDropdownId === `global-evt-${evt.id}` ? 50 : 'auto'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: '40px' }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: isResolved ? '#9ca3af' : '#111827', textDecoration: isResolved ? 'line-through' : 'none' }}>{evt.title}</span>
                                                            <span style={{ fontSize: '11px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '9999px', fontWeight: '600' }}>
                                                                {d.getMonth() + 1}/{d.getDate()}
                                                            </span>
                                                        </div>
                                                        {evt.description && <div style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{evt.description}</div>}

                                                        {/* Dropdown Menu */}
                                                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                                            <button
                                                                className="global-dropdown-trigger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenDropdownId(openDropdownId === `global-evt-${evt.id}` ? null : `global-evt-${evt.id}`);
                                                                }}
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <MoreIcon />
                                                            </button>
                                                            {openDropdownId === `global-evt-${evt.id}` && (
                                                                <div style={{
                                                                    position: 'absolute', top: '100%', right: '0', marginTop: '4px', backgroundColor: '#ffffff',
                                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                                                    borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '120px', zIndex: 100, overflow: 'hidden', padding: '4px'
                                                                }}>
                                                                    <button
                                                                        onClick={() => { handleResolveEvent(evt); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: isResolved ? '#6b7280' : '#059669', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        {isResolved ? <CircleIcon /> : <CheckCircleIcon />} {isResolved ? '未終了に戻す' : '終了済みにする'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { openEventModal(evt); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: '#374151', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <EditIcon /> 編集する
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { handleDeleteEvent(evt.id); setOpenDropdownId(null); }}
                                                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', color: '#dc2626', borderRadius: '4px' }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <TrashIcon /> 削除する
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>全体イベントはありません</div>
                                            )}
                                        </div>
                                    </div>
                                    {/* ── Section 3: テスト回収リンク ── */}
                                    {appUrl && (
                                        <a href={`${appUrl}/collection`} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', marginTop: '8px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '10px',
                                            textDecoration: 'none', color: 'white', fontSize: '13px', fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)', transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'; }}
                                        >
                                            <span style={{ fontSize: '16px' }}>📋</span>
                                            <span>テスト回収ページ</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>→</span>
                                        </a>
                                    )}

                                    {/* Announcement Modal */}
                                    {showAnnouncementModal && (
                                        <div style={{
                                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
                                        }}>
                                            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                                                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 'bold' }}>{editingAnnouncementId ? '全体共有事項を編集' : '全体共有事項を追加'}</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>タイトル <span style={{ color: '#ef4444' }}>*</span></label>
                                                        <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} placeholder="例：冬期講習のお知らせ" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>重要度</label>
                                                        <select value={newAnnouncement.importance} onChange={e => setNewAnnouncement({ ...newAnnouncement, importance: e.target.value as any })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                                            <option value="LOW">軽微</option>
                                                            <option value="MEDIUM">通常</option>
                                                            <option value="HIGH">重要</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>LINE通知開始日</label>
                                                            <input type="date" value={newAnnouncement.notifyStart} onChange={e => setNewAnnouncement({ ...newAnnouncement, notifyStart: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>LINE通知終了日</label>
                                                            <input type="date" value={newAnnouncement.notifyEnd} onChange={e => setNewAnnouncement({ ...newAnnouncement, notifyEnd: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>詳細 <span style={{ color: '#ef4444' }}>*</span></label>
                                                        <textarea value={newAnnouncement.detail} onChange={e => setNewAnnouncement({ ...newAnnouncement, detail: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical' }} placeholder="お知らせの詳細を入力..." />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                                    <button onClick={() => setShowAnnouncementModal(false)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>キャンセル</button>
                                                    <button onClick={handleSaveAnnouncement} disabled={modalLoading || !newAnnouncement.title || !newAnnouncement.detail} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: (modalLoading || !newAnnouncement.title || !newAnnouncement.detail) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                                        {modalLoading ? '保存中...' : '保存'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Event Modal */}
                                    {showEventModal && (
                                        <div style={{
                                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
                                        }}>
                                            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                                                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 'bold' }}>{editingEventId ? '全体イベントを編集' : '全体イベントを追加'}</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>タイトル <span style={{ color: '#ef4444' }}>*</span></label>
                                                        <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} placeholder="例：全統模試" />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>開始日 <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>終了日 (任意)</label>
                                                            <input type="date" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>LINE通知開始</label>
                                                            <input type="date" value={newEvent.notifyStart} onChange={e => setNewEvent({ ...newEvent, notifyStart: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>LINE通知終了</label>
                                                            <input type="date" value={newEvent.notifyEnd} onChange={e => setNewEvent({ ...newEvent, notifyEnd: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>タイプ</label>
                                                        <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                                            <option value="OTHER">その他</option>
                                                            <option value="EXAM">模試・テスト</option>
                                                            <option value="EIKEN">英検・漢検</option>
                                                            <option value="SEASONAL_COURSE">講習</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>詳細メモ</label>
                                                        <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '60px', boxSizing: 'border-box', resize: 'vertical' }} placeholder="持ち物や注意事項など..." />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                                    <button onClick={() => setShowEventModal(false)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>キャンセル</button>
                                                    <button onClick={handleSaveEvent} disabled={modalLoading || !newEvent.title || !newEvent.date} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: (modalLoading || !newEvent.title || !newEvent.date) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                                        {modalLoading ? '保存中...' : '保存'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* ── Section 4: 生徒個別の共有事項 ── */}
                        {studentNotes.length > 0 && (
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.01em' }}>
                                    <span style={{ fontSize: '14px' }}>📝</span> 生徒個別メモ ({studentNotes.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {studentNotes.map((note, i) => (
                                        <details key={i} style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <summary style={{
                                                padding: '10px 14px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                color: '#1e293b',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                backgroundColor: '#f8fafc',
                                                borderBottom: '1px solid transparent'
                                            }}>
                                                <span style={{ flex: 1 }}>{note.name}</span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {note.items.some(item => item.type === 'note') && <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: 'bold' }}>特記</span>}
                                                    {note.items.some(item => item.type === 'announcement') && <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: 'bold' }}>共有</span>}
                                                    {note.items.some(item => item.type === 'event') && <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fce7f3', color: '#be185d', fontSize: '10px', fontWeight: 'bold' }}>予定</span>}
                                                </div>
                                            </summary>
                                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: '#f1f5f9' }}>
                                                {note.items.map((item, j) => (
                                                    <div key={j} style={{ padding: '12px 14px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span style={{
                                                                padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', marginTop: '1px',
                                                                backgroundColor: item.type === 'note' ? '#fef3c7' : item.type === 'announcement' ? '#dbeafe' : '#fce7f3',
                                                                color: item.type === 'note' ? '#b45309' : item.type === 'announcement' ? '#1d4ed8' : '#be185d'
                                                            }}>
                                                                {item.type === 'note' ? '特記事項' : item.type === 'announcement' ? '共有事項' : '予定'}
                                                            </span>
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', lineHeight: '1.4' }}>{item.title}</span>
                                                            {item.date && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: '500' }}>{new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>}
                                                        </div>
                                                        {item.detail && (
                                                            <div style={{ fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.5', paddingLeft: '2px' }}>
                                                                {item.detail}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Section 5: DB未登録の生徒 ── */}
                        {unmatchedNames.length > 0 && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                borderTop: '1px solid #f1f5f9',
                                marginTop: '12px'
                            }}>
                                <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontSize: '13px' }}>⚠️</span> DB未登録 ({unmatchedNames.length}名)
                                </div>
                                <div style={{ fontSize: '11px', color: '#991b1b', marginBottom: '8px', lineHeight: '1.4' }}>
                                    座席表にいるがDBに未登録の生徒です
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {unmatchedNames.map((name, i) => (
                                        <span key={i} style={{
                                            padding: '4px 10px',
                                            backgroundColor: '#fee2e2',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: '#991b1b',
                                            fontWeight: '500'
                                        }}>{name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

// Module-level cache to prevent redundant fetches
const statusCache = new Map<string, StudentStatus>();

export const mountStudentStatusOverlay = async (styleSheet: string) => {
    const SEAT_SELECTOR = '.seito';
    const NAME_SELECTOR = '.stude, .stude_saki, .stude-name, span[class^="stude"]';

    const students = document.querySelectorAll(SEAT_SELECTOR);
    const studentNames: string[] = [];

    // 1. Collect all student names
    students.forEach((student) => {
        let nameElement = student.querySelector(NAME_SELECTOR);
        let name = '';

        if (nameElement && nameElement.textContent) {
            name = nameElement.textContent.trim().replace(/\s+/g, '').replace(/[さんくん]$/, '');
        } else {
            const text = student.textContent || '';
            const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);

            for (const line of lines) {
                if (line.match(/^\d{1,2}:\d{2}/)) continue;
                if (['出席', '欠席', '振替', '休塾', '遅刻', '早退'].includes(line)) continue;
                if (line.length < 2) continue;
                name = line.replace(/\s+/g, '').replace(/[さんくん]$/, '');
                break;
            }
        }

        if (name) {
            (student as HTMLElement).dataset.studentName = name;
            studentNames.push(name);
        }
    });

    if (studentNames.length === 0) return;

    // 2. Filter names that need fetching
    const uniqueNames = Array.from(new Set(studentNames));
    const queryNames = uniqueNames.filter(name => !statusCache.has(name));

    try {
        if (queryNames.length > 0) {
            const statusMap = await api.getStudentStatus({ studentNames: queryNames });

            Object.entries(statusMap).forEach(([name, status]) => {
                if (name.startsWith('_')) return; // skip _campus, _debug, etc
                statusCache.set(name, status as StudentStatus);
            });

            queryNames.forEach(name => {
                if (!statusCache.has(name)) {
                    statusCache.set(name, undefined as any);
                }
            });
        }

        // Detect unmatched names and collect individual shared notes
        const unmatchedNames: string[] = [];
        const studentNotes: { name: string; items: { type: 'note' | 'announcement' | 'event'; title: string; detail: string; date?: string; sortKey: number }[] }[] = [];

        uniqueNames.forEach(name => {
            const cached = statusCache.get(name);
            if (!cached || !cached.studentId) {
                unmatchedNames.push(name);
            } else if (cached.hasSharedNote || cached.hasEvents) {
                const items: { type: 'note' | 'announcement' | 'event'; title: string; detail: string; date?: string; sortKey: number }[] = [];

                const activeAnns = (cached.announcements || []).filter(a => isActiveForLine(a, 'announcement'));

                let isNoteDuplicated = false;
                if (cached.sharedNoteContent) {
                    const cleanNote = cached.sharedNoteContent.replace(/\s+/g, '');
                    isNoteDuplicated = activeAnns.some(a => {
                        const cleanAnn = (a.detail || '').replace(/\s+/g, '');
                        if (!cleanAnn || !cleanNote) return false;
                        return cleanAnn.includes(cleanNote) || cleanNote.includes(cleanAnn);
                    });
                }

                if (cached.sharedNoteContent && !isNoteDuplicated) {
                    items.push({
                        type: 'note',
                        title: '特記事項',
                        detail: cached.sharedNoteContent,
                        sortKey: 3
                    });
                }

                activeAnns.forEach(a => {
                    items.push({
                        type: 'announcement',
                        title: a.title,
                        detail: a.detail || '',
                        date: a.date,
                        sortKey: 1
                    });
                });
                const activeEvts = (cached.events || []).filter(e => isActiveForLine(e, 'event'));
                activeEvts.forEach(e => {
                    items.push({
                        type: 'event',
                        title: e.title,
                        detail: e.description || '',
                        date: e.date,
                        sortKey: 2
                    });
                });

                if (items.length > 0) {
                    items.sort((a, b) => a.sortKey - b.sortKey);
                    studentNotes.push({ name, items });
                }
            }
        });

        // 3. Mount Global Info Panel (once)
        if (!document.getElementById('jukmane-global-panel-host')) {
            const panelHost = document.createElement('div');
            panelHost.id = 'jukmane-global-panel-host';
            document.body.appendChild(panelHost);

            const panelShadow = panelHost.attachShadow({ mode: 'open' });
            const panelStyle = document.createElement('style');
            panelStyle.textContent = styleSheet;
            panelShadow.appendChild(panelStyle);

            const panelContainer = document.createElement('div');
            panelShadow.appendChild(panelContainer);

            const panelRoot = createRoot(panelContainer);
            panelRoot.render(<GlobalInfoPanel unmatchedNames={unmatchedNames} studentNotes={studentNotes} />);

        }

        // 4. Inject global CSS for seat styling (once)
        // Pure CSS approach: uses classes and data-attributes with ::before/::after pseudo-elements
        // instead of DOM injection, to avoid conflicts with jQuery UI drag-and-drop
        if (!document.getElementById('jukmane-global-styles')) {
            const globalStyle = document.createElement('style');
            globalStyle.id = 'jukmane-global-styles';
            globalStyle.textContent = `
                /* Force .seito to act as a containing block for absolute pseudo-elements 
                 * without breaking jQuery UI's draggable top/left calculation or flow */
                .seito:not(.ui-draggable-dragging) {
                    transform: translate(0px, 0px) !important;
                }
                /* New student blue border */
                .jukmane-new-student:not(.ui-draggable-dragging) {
                    box-shadow: 0 0 0 3px #3b82f6 !important;
                    border-radius: 4px;
                }

                /* Churn risk warning icon via ::before pseudo-element */
                .seito[data-jukmane-churn]:not(.ui-draggable-dragging)::before {
                    content: '⚠️';
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    z-index: 1000;
                    font-size: 14px;
                    line-height: 1;
                    pointer-events: none;
                }

                /* Status dots base via ::after pseudo-element */
                .seito[data-jukmane-dots]:not(.ui-draggable-dragging)::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10;
                }

                @keyframes jukmane-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Single dot: Collection (purple, pulsing) */
                .seito[data-jukmane-dots="C"]:not(.ui-draggable-dragging)::after {
                    background-color: #d946ef;
                    animation: jukmane-pulse 2s infinite;
                }
                /* Single dot: Test (green, pulsing) */
                .seito[data-jukmane-dots="T"]:not(.ui-draggable-dragging)::after {
                    background-color: #22c55e;
                    animation: jukmane-pulse 2s infinite;
                }
                /* Single dot: Note/Event (yellow) */
                .seito[data-jukmane-dots="N"]:not(.ui-draggable-dragging)::after {
                    background-color: #facc15;
                }

                /* Two dots: Collection + Test */
                .seito[data-jukmane-dots="CT"]:not(.ui-draggable-dragging)::after {
                    background-color: #d946ef;
                    box-shadow: -10px 0 0 0 #22c55e;
                    animation: jukmane-pulse 2s infinite;
                }
                /* Two dots: Collection + Note */
                .seito[data-jukmane-dots="CN"]:not(.ui-draggable-dragging)::after {
                    background-color: #d946ef;
                    box-shadow: -10px 0 0 0 #facc15;
                    animation: jukmane-pulse 2s infinite;
                }
                /* Two dots: Test + Note */
                .seito[data-jukmane-dots="TN"]:not(.ui-draggable-dragging)::after {
                    background-color: #22c55e;
                    box-shadow: -10px 0 0 0 #facc15;
                    animation: jukmane-pulse 2s infinite;
                }

                /* Three dots: Collection + Test + Note */
                .seito[data-jukmane-dots="CTN"]:not(.ui-draggable-dragging)::after {
                    background-color: #d946ef;
                    box-shadow: -10px 0 0 0 #22c55e, -20px 0 0 0 #facc15;
                    animation: jukmane-pulse 2s infinite;
                }
            `;
            document.head.appendChild(globalStyle);
        }

        // 5. Clean up legacy DOM elements from previous extension versions
        document.querySelectorAll('.jukmane-extension-overlay-host').forEach(el => el.remove());
        document.querySelectorAll('.jukmane-churn-icon').forEach(el => el.remove());

        students.forEach((student) => {
            const el = student as HTMLElement;

            // Re-detect student name if dataset was lost after drag
            if (!el.dataset.studentName) {
                const NAME_SEL = '.stude, .stude_saki, .stude-name, span[class^="stude"]';
                let nameElement = el.querySelector(NAME_SEL);
                let detectedName = '';

                if (nameElement && nameElement.textContent) {
                    detectedName = nameElement.textContent.trim().replace(/\s+/g, '').replace(/[さんくん]$/, '');
                } else {
                    const text = el.textContent || '';
                    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
                    for (const line of lines) {
                        if (line.match(/^\d{1,2}:\d{2}/)) continue;
                        if (['出席', '欠席', '振替', '休塾', '遅刻', '早退'].includes(line)) continue;
                        if (line.length < 2) continue;
                        detectedName = line.replace(/\s+/g, '').replace(/[さんくん]$/, '');
                        break;
                    }
                }
                if (detectedName) {
                    el.dataset.studentName = detectedName;
                }
            }

            const name = el.dataset.studentName;
            const status = name ? statusCache.get(name) : undefined;

            const isNew = status && status.isNewStudent;
            const isChurn = status && status.isChurnRisk;
            
            // Cleanly toggle CSS class instead of mutating inline styles that conflict with drag/drop
            if (isNew) {
                el.classList.add('jukmane-new-student');
            } else {
                el.classList.remove('jukmane-new-student');
            }

            // Churn risk: toggle data attribute (renders via CSS ::before pseudo-element)
            if (isChurn) {
                el.dataset.jukmaneChurn = '1';
            } else {
                delete el.dataset.jukmaneChurn;
            }

            // Status dots: set data attribute (renders via CSS ::after pseudo-element)
            if (name && status) {
                let dots = '';
                if (status.hasCollectionTask) dots += 'C';
                if (status.hasTestSchedules) dots += 'T';
                if (status.hasSharedNote || status.hasEvents) dots += 'N';

                if (dots) {
                    el.dataset.jukmaneDots = dots;
                } else {
                    delete el.dataset.jukmaneDots;
                }
            } else {
                delete el.dataset.jukmaneDots;
            }

        });
    } catch (e) {
        console.error('Failed to update seating chart:', e);
    }
};
