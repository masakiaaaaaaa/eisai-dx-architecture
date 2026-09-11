/**
 * seat-assignment.ts
 * 
 * Core logic for automatic seat number suggestion on supersheet.php
 * Parses the seating chart DOM, applies assignment rules, and provides
 * one-click bulk entry functionality.
 */

import { api } from '../../api';

// --- Types ---

export interface SeatingSlot {
    jyugyouId: string;      // 講師授業ID (e.g. "15346545")
    koushiId: string;        // 講師ID from faboc (e.g. "15925")
    koushiName: string;      // 講師名 (e.g. "佐々木雅也")
    dayIndex: number;        // 曜日インデックス (column position, 0-based)
    komaIndex: number;       // コマ番号 (row position, 0-based)
    currentZaban: number | null;   // 現在入力済みの座番
    suggestedZaban: number | null; // 提案座番
    zabanElement: HTMLElement | null; // DOM reference for input
}

export interface LecturerPreference {
    id: number;
    name: string;
    fabocKoushiId: string | null;
    seatPreferences: number[];
}

export interface SeatAssignmentResult {
    slots: SeatingSlot[];
    unassignedCount: number;
    lecturersSynced: boolean;
}

// Names that look like lecturers in the DOM but are actually class types / facilities
const EXCLUDED_LECTURER_PATTERNS = [
    'ラクスピ',
    '５教科',
    '5教科',
    '自習',
    'クスピ',  // partial match for ラクスピ variants like "18:00ラクスピ"
];

// --- DOM Parsing ---

/**
 * Parse the supersheet DOM to extract all seating slots.
 * The DOM structure is a table where:
 * - Rows = コマ (time slots): 1限, 2限, ..., 講習, etc.
 * - Columns = 曜日 (days): 月, 火, 水, ...
 * - Each cell contains div.teacher elements with lecturer info
 */
export function parseSeatingDOM(): SeatingSlot[] {
    const slots: SeatingSlot[] = [];

    // Find all teacher blocks
    const teacherDivs = document.querySelectorAll('div.teacher[id^="koushijyugyouid_"]');

    teacherDivs.forEach(teacherDiv => {
        const el = teacherDiv as HTMLElement;
        const idMatch = el.id.match(/koushijyugyouid_(\d+)/);
        if (!idMatch) return;

        const jyugyouId = idMatch[1];

        // Extract teacher name and ID
        const nameLink = el.querySelector('a[href*="koushi_id="]');
        if (!nameLink) return;

        const koushiName = nameLink.textContent?.trim() || '';
        const hrefMatch = nameLink.getAttribute('href')?.match(/koushi_id=(\d+)/);
        const koushiId = hrefMatch ? hrefMatch[1] : '';

        if (!koushiName || !koushiId) return;

        // Skip non-lecturer entries (class types, facilities)
        if (EXCLUDED_LECTURER_PATTERNS.some(p => koushiName.includes(p))) return;

        // Get current zaban
        const zabanSpan = document.getElementById(`zasekino_${jyugyouId}`);
        const currentZabanText = zabanSpan?.textContent?.trim() || '';
        const currentZaban = currentZabanText ? parseInt(currentZabanText) : null;

        // Determine position in the grid
        const { dayIndex, komaIndex } = findGridPosition(el);

        // Skip if this slot has no students assigned (no .seito and no [id^="new_"])
        // We must check this specific teacher's droppable areas (dp_JYUGYOUID_*)
        // because multiple teachers share the same td.
        const droppables = document.querySelectorAll(`[id^="dp_${jyugyouId}_"]`);
        let hasStudents = false;
        droppables.forEach(dp => {
            if (dp.querySelector('.seito') !== null || dp.querySelector('[id^="new_"]') !== null) {
                hasStudents = true;
            }
        });

        if (!hasStudents) return;

        slots.push({
            jyugyouId,
            koushiId,
            koushiName,
            dayIndex,
            komaIndex,
            currentZaban: isNaN(currentZaban as number) ? null : currentZaban,
            suggestedZaban: null,
            zabanElement: zabanSpan,
        });
    });

    return slots;
}

/**
 * Find the grid position (day column, koma row) of a teacher element.
 */
function findGridPosition(el: HTMLElement): { dayIndex: number; komaIndex: number; td: Element | null } {
    // Walk up to find the containing td.komawaku
    let td = el.closest('td.komawaku') || el.closest('td');
    if (!td) return { dayIndex: 0, komaIndex: 0, td: null };

    // The komawaku td and its preceding td.koma are paired
    // Walk up to the tr containing this td
    const tr = td.closest('tr');
    if (!tr) return { dayIndex: 0, komaIndex: 0, td };

    // Find dayIndex: count the position of this td pair within the row
    // Each "slot" in the row is a pair of (td.koma + td.komawaku), so we count td.komawaku elements
    const komawakuCells = tr.querySelectorAll('td.komawaku');
    let dayIndex = 0;
    for (let i = 0; i < komawakuCells.length; i++) {
        if (komawakuCells[i] === td || komawakuCells[i].contains(el)) {
            dayIndex = i;
            break;
        }
    }

    // Find komaIndex: count the row position within the table body
    // Each koma row is a <tr> containing multiple td.koma cells
    const table = tr.closest('table.viewboxarea');
    if (!table) return { dayIndex, komaIndex: 0, td };

    // Get all data rows (skip header rows that contain day names, memos)
    const allRows = table.querySelectorAll('tr');
    let komaIndex = 0;
    for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].querySelector('td.koma')) {
            // Check if this row is an actual teaching period (has droppables) vs a break row (夕休み, 休憩)
            const hasDroppables = allRows[i].querySelector('[id^="dp_"]') !== null;
            
            if (allRows[i] === tr) {
                // If somehow this is a break row, give it a negative index so it doesn't link
                if (!hasDroppables) komaIndex = -1;
                break;
            }
            
            if (hasDroppables) {
                komaIndex++;
            }
        }
    }

    return { dayIndex, komaIndex, td };
}

// --- Assignment Algorithm ---

export function assignSeats(
    slots: SeatingSlot[],
    lecturerPrefs: Map<string, number[]>,
    availableSeats: number[],
    defaultOrder: number[]
): SeatingSlot[] {
    // Group slots by Day
    const dayGroups = new Map<number, SeatingSlot[]>();
    slots.forEach(s => {
        if (!dayGroups.has(s.dayIndex)) dayGroups.set(s.dayIndex, []);
        dayGroups.get(s.dayIndex)!.push(s);
    });

    for (const [_, daySlots] of dayGroups.entries()) {
        // Track used seats per koma
        const usedSeatsPerKoma = new Map<number, Set<number>>();
        const getUsed = (koma: number) => {
            if (!usedSeatsPerKoma.has(koma)) usedSeatsPerKoma.set(koma, new Set<number>());
            return usedSeatsPerKoma.get(koma)!;
        };

        // Pre-fill manual assignments (already entered seats)
        daySlots.forEach(s => {
            if (s.currentZaban !== null) {
                s.suggestedZaban = s.currentZaban;
                getUsed(s.komaIndex).add(s.currentZaban);
            }
        });

        // Group by komaIndex to process chronologically
        const komaGroups = new Map<number, SeatingSlot[]>();
        daySlots.forEach(s => {
            if (!komaGroups.has(s.komaIndex)) komaGroups.set(s.komaIndex, []);
            komaGroups.get(s.komaIndex)!.push(s);
        });

        const sortedKomas = Array.from(komaGroups.keys()).sort((a, b) => a - b);

        for (const koma of sortedKomas) {
            const group = komaGroups.get(koma)!;

            // Sort group so that lecturers continuing from the previous koma are processed first
            const sortedGroup = [...group].sort((a, b) => {
                // 1. Continuing from STRICTLY the previous koma
                const aPrev = daySlots.some(x => x.koushiId === a.koushiId && x.komaIndex === koma - 1);
                const bPrev = daySlots.some(x => x.koushiId === b.koushiId && x.komaIndex === koma - 1);
                if (aPrev && !bPrev) return -1;
                if (!aPrev && bPrev) return 1;

                // 2. Lecturers with explicitly configured preferences get next priority
                const aPrefs = lecturerPrefs.get(a.koushiId)?.length || 0;
                const bPrefs = lecturerPrefs.get(b.koushiId)?.length || 0;
                if (aPrefs > 0 && bPrefs === 0) return -1;
                if (bPrefs > 0 && aPrefs === 0) return 1;

                // 3. Lecturers with MORE total slots today get priority
                const aTotal = daySlots.filter(x => x.koushiId === a.koushiId).length;
                const bTotal = daySlots.filter(x => x.koushiId === b.koushiId).length;
                if (aTotal > bTotal) return -1;
                if (bTotal > aTotal) return 1;

                return 0; // Keep original order otherwise
            });

            for (const s of sortedGroup) {
                if (s.suggestedZaban !== null) continue; // Already assigned

                // Determine the FULL continuous block for this teacher around this koma
                // Look backwards
                const prevSlots: SeatingSlot[] = [];
                let prevKoma = koma - 1;
                while (true) {
                    const prevSlot = daySlots.find(
                        x => x.koushiId === s.koushiId && x.komaIndex === prevKoma
                    );
                    if (prevSlot) {
                        prevSlots.unshift(prevSlot); // add to front
                        prevKoma--;
                    } else {
                        break;
                    }
                }

                // Look forwards
                const nextSlots: SeatingSlot[] = [];
                let nextKoma = koma + 1;
                while (true) {
                    const nextSlot = daySlots.find(
                        x => x.koushiId === s.koushiId && x.komaIndex === nextKoma
                    );
                    if (nextSlot) {
                        nextSlots.push(nextSlot);
                        nextKoma++;
                    } else {
                        break;
                    }
                }

                const blockSlots: SeatingSlot[] = [...prevSlots, s, ...nextSlots];

                // Check if any slot in this continuous block is already assigned (e.g. manual entry)
                const assignedSeatsInBlock = new Set<number>();
                blockSlots.forEach(bs => {
                    if (bs.suggestedZaban !== null) {
                        assignedSeatsInBlock.add(bs.suggestedZaban);
                    }
                });

                let chosenSeat: number | null = null;
                const unassignedSlots = blockSlots.filter(bs => bs.suggestedZaban === null);

                // Helper to check if a seat is free for all UNASSIGNED slots in the block
                const isFreeForUnassigned = (seat: number) => {
                    return unassignedSlots.every(bs => !getUsed(bs.komaIndex).has(seat));
                };

                // Priority 1: If part of the block is manually assigned, try to match it for continuity
                if (assignedSeatsInBlock.size === 1) {
                    const targetSeat = Array.from(assignedSeatsInBlock)[0];
                    if (isFreeForUnassigned(targetSeat) && availableSeats.includes(targetSeat)) {
                        chosenSeat = targetSeat;
                    }
                }

                // Priority 2 & 3: Try lecturer preferences, then default order
                if (chosenSeat === null && assignedSeatsInBlock.size === 0) {
                    const prefs = lecturerPrefs.get(s.koushiId) || [];
                    for (const pref of prefs) {
                        if (availableSeats.includes(pref) && isFreeForUnassigned(pref)) {
                            chosenSeat = pref;
                            break;
                        }
                    }
                    if (chosenSeat === null) {
                        for (const seat of defaultOrder) {
                            if (availableSeats.includes(seat) && isFreeForUnassigned(seat)) {
                                chosenSeat = seat;
                                break;
                            }
                        }
                    }
                }

                // Apply assignment
                if (chosenSeat !== null) {
                    // Success: Assign the seat to all unassigned slots in the continuous block
                    unassignedSlots.forEach(bs => {
                        bs.suggestedZaban = chosenSeat;
                        getUsed(bs.komaIndex).add(chosenSeat as number);
                    });
                } else {
                    // Continuity is impossible (e.g. conflicts with other manual assignments).
                    // Fallback: Assign a seat ONLY for the current slot (s).
                    let fallbackSeat: number | null = null;
                    const prefs = lecturerPrefs.get(s.koushiId) || [];
                    for (const pref of prefs) {
                        if (availableSeats.includes(pref) && !getUsed(koma).has(pref)) {
                            fallbackSeat = pref;
                            break;
                        }
                    }
                    if (fallbackSeat === null) {
                        for (const seat of defaultOrder) {
                            if (availableSeats.includes(seat) && !getUsed(koma).has(seat)) {
                                fallbackSeat = seat;
                                break;
                            }
                        }
                    }
                    if (fallbackSeat !== null) {
                        s.suggestedZaban = fallbackSeat;
                        getUsed(koma).add(fallbackSeat);
                    }
                }
            }
        }
    }

    return slots;
}

// --- Bulk Apply ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Apply a suggested seat number to a single slot by triggering
 * faboc's jQuery click-to-edit UI on the zaban span.
 */
export async function applyZaban(slot: SeatingSlot): Promise<boolean> {
    if (slot.suggestedZaban === null || !slot.zabanElement) return false;
    if (slot.currentZaban === slot.suggestedZaban) return true; // Already correct

    try {
        // 1. Click the zaban span to enter edit mode
        slot.zabanElement.click();
        await sleep(300);

        // 2. Find the generated input element
        const input = slot.zabanElement.querySelector('input') as HTMLInputElement
            || slot.zabanElement.closest('div')?.querySelector('input') as HTMLInputElement;

        if (!input) {
            console.warn(`Jukmane: Could not find input for jyugyouId ${slot.jyugyouId}`);
            return false;
        }

        // 3. Set value
        input.value = String(slot.suggestedZaban);

        // 4. Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // 5. Press Enter to confirm (triggers faboc's AJAX to zasekinoupdate.php)
        input.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        }));
        input.dispatchEvent(new KeyboardEvent('keypress', {
            key: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        }));
        input.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        }));

        await sleep(500); // Wait for AJAX response

        return true;
    } catch (e) {
        console.error(`Jukmane: Failed to apply zaban for ${slot.jyugyouId}:`, e);
        return false;
    }
}

/**
 * Apply all suggested seat numbers sequentially.
 */
export async function bulkApplyZaban(
    slots: SeatingSlot[],
    onProgress?: (current: number, total: number, name: string) => void
): Promise<{ success: number; failed: number }> {
    const toApply = slots.filter(s =>
        s.suggestedZaban !== null &&
        s.currentZaban !== s.suggestedZaban
    );

    let success = 0;
    let failed = 0;

    for (let i = 0; i < toApply.length; i++) {
        const slot = toApply[i];
        onProgress?.(i + 1, toApply.length, slot.koushiName);

        const ok = await applyZaban(slot);
        if (ok) {
            success++;
            slot.currentZaban = slot.suggestedZaban;
        } else {
            failed++;
        }
    }

    return { success, failed };
}

// --- Main Entry Point ---

/**
 * Full flow: parse DOM → sync lecturers → fetch config → assign seats
 */
export async function runSeatAssignment(): Promise<SeatAssignmentResult> {
    // 1. Parse DOM
    const slots = parseSeatingDOM();
    if (slots.length === 0) {
        return { slots: [], unassignedCount: 0, lecturersSynced: false };
    }

    // 2. Sync lecturers to DB (background, non-blocking for suggestions)
    const uniqueLecturers = new Map<string, string>();
    slots.forEach(s => {
        if (s.koushiId && !uniqueLecturers.has(s.koushiId)) {
            uniqueLecturers.set(s.koushiId, s.koushiName);
        }
    });

    const lecturerList = Array.from(uniqueLecturers.entries()).map(
        ([fabocKoushiId, name]) => ({ fabocKoushiId, name })
    );

    // Fire sync in parallel (don't block suggestion calculation)
    const syncPromise = api.syncLecturers(lecturerList).catch(e => {
        console.warn('Jukmane: Lecturer sync failed:', e);
        return false;
    });

    // 3. Fetch seat config
    const config = await api.getSeatConfig();
    const availableSeats = config?.seatConfig?.availableSeats || [1,2,3,4,5,6,7,8,9,10,11,12,13];
    const defaultOrder = config?.seatConfig?.defaultOrder || [1,2,3,4,5,6,7,8,9,10,11,12,13];

    // Build lecturer preference map
    const lecturerPrefs = new Map<string, number[]>();
    if (config?.lecturers) {
        config.lecturers.forEach(l => {
            if (l.fabocKoushiId && l.seatPreferences.length > 0) {
                lecturerPrefs.set(l.fabocKoushiId, l.seatPreferences);
            }
        });
    }

    // 4. Run assignment algorithm
    assignSeats(slots, lecturerPrefs, availableSeats, defaultOrder);

    const unassignedCount = slots.filter(s =>
        s.suggestedZaban !== null &&
        s.currentZaban !== s.suggestedZaban
    ).length;

    const lecturersSynced = await syncPromise;

    return { slots, unassignedCount, lecturersSynced: !!lecturersSynced };
}
