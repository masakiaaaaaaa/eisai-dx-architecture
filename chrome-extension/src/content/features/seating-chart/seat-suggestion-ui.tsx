import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { runSeatAssignment, bulkApplyZaban, SeatingSlot } from './seat-assignment';
import { SeatSettingsModal } from './seat-settings-ui';

// --- UI Components ---

interface ConfirmSeatAssignmentModalProps {
    slots: SeatingSlot[];
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmSeatAssignmentModal: React.FC<ConfirmSeatAssignmentModalProps> = ({ slots, onConfirm, onCancel }) => {
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
        }} onClick={onCancel}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                width: '400px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1f2937' }}>
                    座席自動設定の確認
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: 0 }}>
                    以下の座席を割り当てます。よろしいですか？
                </p>
                <div style={{ overflowY: 'auto', flex: 1, marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#374151' }}>
                                <th style={{ padding: '8px 4px' }}>コマ順</th>
                                <th style={{ padding: '8px 4px' }}>講師名</th>
                                <th style={{ padding: '8px 4px' }}>提案座番</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px 4px' }}>{s.komaIndex + 1}</td>
                                    <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{s.koushiName}</td>
                                    <td style={{ padding: '8px 4px', color: '#059669', fontWeight: 'bold' }}>{s.suggestedZaban}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>
                        キャンセル
                    </button>
                    <button type="button" onClick={onConfirm} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                        適用する
                    </button>
                </div>
            </div>
        </div>
    );
};

// The per-day apply button
interface DaySeatSuggestionProps {
    dayIndex: number;
    slots: SeatingSlot[];
    onApplyAll: () => Promise<void>;
}

const DaySeatSuggestionButton: React.FC<DaySeatSuggestionProps> = ({ dayIndex, slots, onApplyAll }) => {
    const [isApplying, setIsApplying] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // Filter slots for this specific day
    const daySlots = slots.filter(s => s.dayIndex === dayIndex);
    const unassignedSlots = daySlots.filter(s => s.suggestedZaban !== null && s.currentZaban !== s.suggestedZaban);
    const dayUnassignedCount = unassignedSlots.length;

    if (dayUnassignedCount === 0) return null;

    const [needsReload, setNeedsReload] = useState(false);

    const handleApply = async () => {
        setShowConfirm(false);
        setIsApplying(true);
        await bulkApplyZaban(unassignedSlots);
        setIsApplying(false);
        onApplyAll();
    };

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px', gap: '4px' }}>
            {isApplying ? (
                <span style={{ fontSize: '11px', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                    入力中...
                </span>
            ) : (
                <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                >
                    座席自動設定 ({dayUnassignedCount}件)
                </button>
            )}
            <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                title="優先座席の設定"
            >
                ⚙️
            </button>

            {showConfirm && createPortal(
                <ConfirmSeatAssignmentModal
                    slots={unassignedSlots}
                    onConfirm={handleApply}
                    onCancel={() => setShowConfirm(false)}
                />,
                document.body
            )}

            {showSettings && createPortal(
                <SeatSettingsModal 
                    onClose={() => {
                        setShowSettings(false);
                        if (needsReload) window.location.reload();
                    }} 
                    onSaveSuccess={() => {
                        setNeedsReload(true);
                    }} 
                />,
                document.body
            )}
        </div>
    );
};

// --- Mount Function ---

export const mountSeatSuggestionOverlay = async () => {
    // 0. Inject fixed headers via JS scroll listener
    if (!document.getElementById('jukmane-sticky-css')) {
        const style = document.createElement('style');
        style.id = 'jukmane-sticky-css';
        style.textContent = `
            /* When main header is fixed */
            #header.jukmane-fixed {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 10000 !important;
                background-color: #fff !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
            }
            /* Day-level headers: apply sticky to the cells, not the row */
            tr:has(td.day-zaseki) > td, tr:has(td.day-zaseki) > th {
                position: sticky !important;
                top: var(--jukmane-header-height, 0px) !important;
                z-index: 100 !important;
                background-color: #e0e7ff !important; /* Slightly blue to stand out */
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            }
            /* Ensure sticky works: parent containers must not have overflow:hidden */
            table, tbody, thead, .table-responsive, #content, #main {
                overflow: visible !important;
            }
        `;
        document.head.appendChild(style);

        // --- Main header: fixed on scroll ---
        const headerEl = document.getElementById('header');
        let headerHeight = 0;
        let headerTop = 0;

        if (headerEl) {
            headerHeight = headerEl.offsetHeight;
            headerTop = headerEl.getBoundingClientRect().top + window.scrollY;

            const spacer = document.createElement('div');
            spacer.id = 'jukmane-header-spacer';
            spacer.style.cssText = 'height:0;display:none';
            headerEl.parentNode?.insertBefore(spacer, headerEl.nextSibling);

            const onHeaderScroll = () => {
                if (window.scrollY > headerTop) {
                    headerEl.classList.add('jukmane-fixed');
                    spacer.style.height = `${headerHeight}px`;
                    spacer.style.display = 'block';
                    document.documentElement.style.setProperty('--jukmane-header-height', `${headerHeight}px`);
                } else {
                    headerEl.classList.remove('jukmane-fixed');
                    spacer.style.cssText = 'height:0;display:none';
                    document.documentElement.style.setProperty('--jukmane-header-height', '0px');
                }
            };
            window.addEventListener('scroll', onHeaderScroll, { passive: true });
            onHeaderScroll();
        }
    }

    // 1. Run assignment logic
    const { slots, unassignedCount } = await runSeatAssignment();
    
    if (slots.length === 0 || unassignedCount === 0) return;

    // 2. Inject per-day buttons into sticky headers
    const dayHeaders = document.querySelectorAll('td.day-zaseki');
    dayHeaders.forEach((header, index) => {
        // Create a container for the React component
        let host = header.querySelector('.jukmane-day-suggestion-host');
        if (!host) {
            host = document.createElement('span');
            host.className = 'jukmane-day-suggestion-host';
            header.appendChild(host);
        }

        const handleApplyAll = async () => {
            // Only update local state, badges are removed
        };

        let root = (host as any)._reactRoot;
        if (!root) {
            root = createRoot(host);
            (host as any)._reactRoot = root;
        }
        root.render(<DaySeatSuggestionButton dayIndex={index} slots={slots} onApplyAll={handleApplyAll} />);
    });
};
