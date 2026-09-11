import { FlexMessage, FlexBubble, FlexComponent } from '@line/bot-sdk';

interface WeeklyData {
    missions: any[];
    events: any[];
    announcements: any[];
    individualItems: { type: 'event' | 'announcement', studentName: string }[];
    individualTestSchedules?: { studentName: string; grade?: string; testName: string; schoolName: string; start: string; end: string }[];
    schoolsNeedingScoreCollection?: string[];
    passcode?: string;
    campusId?: number;
}

// Helper to sanitize text for LINE Flex Message
function sanitizeText(text: string | null | undefined, maxLength: number = 300, fallback: string = '(なし)'): string {
    if (!text || typeof text !== 'string') return fallback;
    const trimmed = text.trim();
    if (trimmed === '') return fallback;
    const chars = Array.from(trimmed);
    if (chars.length > maxLength) {
        return chars.slice(0, maxLength).join('') + '...';
    }
    return trimmed;
}

// Base URL for links - Helper to append campusId
const getUrl = (path: string, campusId?: number) => {
    const baseUrl = 'https://eisai-api.vercel.app';
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${path}${campusId ? `${separator}campusId=${campusId}` : ''}`;
};

// Modern color palette
const COLORS = {
    primary: '#1a73e8',      // Modern blue
    success: '#00c853',      // Vibrant green  
    warning: '#ff9100',      // Orange
    danger: '#dc3545',       // Red
    info: '#17a2b8',         // Teal
    text: '#1f2937',         // Dark gray
    textSecondary: '#6b7280', // Medium gray
    textMuted: '#9ca3af',    // Light gray
    white: '#ffffff',
    headerBg: '#f8fafc',     // Light background
};

export function buildWeeklyFlexMessage(data: WeeklyData): FlexMessage {
    const { missions, events, announcements, individualItems, individualTestSchedules = [], schoolsNeedingScoreCollection = [], passcode, campusId } = data;

    const bubbles: FlexBubble[] = [];

    // === CARD 1: お知らせ (Announcements) ===
    if (announcements.length > 0) {
        const announcementContents: FlexComponent[] = [];

        // Sort by importance: HIGH first, then MEDIUM, then LOW
        const sortedAnnouncements = [...announcements].sort((a, b) => {
            const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return (order[a.importance as keyof typeof order] ?? 2) - (order[b.importance as keyof typeof order] ?? 2);
        });

        const displayAnnouncements = sortedAnnouncements.slice(0, 3); // Max 3 items
        const remainingCount = announcements.length - displayAnnouncements.length;

        displayAnnouncements.forEach((announcement, index) => {
            const isHigh = announcement.importance === 'HIGH';
            const icon = isHigh ? '🔴' : '📢';

            announcementContents.push({
                type: 'box',
                layout: 'vertical',
                margin: index === 0 ? undefined : 'lg',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: icon, size: 'sm', flex: 0 },
                            {
                                type: 'text',
                                text: sanitizeText(announcement.title, 40, '無題'),
                                size: 'sm',
                                weight: 'bold',
                                color: isHigh ? COLORS.danger : COLORS.text,
                                wrap: true,
                                flex: 1,
                                margin: 'sm'
                            }
                        ],
                        alignItems: 'center'
                    },
                    {
                        type: 'text',
                        text: sanitizeText(announcement.detail, 150),
                        size: 'xs',
                        color: COLORS.textSecondary,
                        wrap: true,
                        maxLines: 2,
                        margin: 'sm'
                    },
                ],
            });
        });

        // Show "他○件" if more than 3
        if (remainingCount > 0) {
            announcementContents.push({
                type: 'text',
                text: `...他${remainingCount}件のお知らせ`,
                size: 'xs',
                color: COLORS.textMuted,
                margin: 'lg',
                align: 'center'
            });
        }

        // 重要メッセージ: 学校名リスト形式
        if (schoolsNeedingScoreCollection.length > 0) {
            announcementContents.push({ type: 'separator', margin: 'xl' });

            // Header line
            announcementContents.push({
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                    { type: 'text', text: '⚠️', size: 'sm', flex: 0 },
                    {
                        type: 'text',
                        text: '重要　以下の学校のテストの点数を記入してください。',
                        size: 'xs',
                        color: COLORS.danger,
                        wrap: true,
                        weight: 'bold',
                        flex: 1,
                        margin: 'sm'
                    }
                ],
                alignItems: 'flex-start'
            });

            // School list
            announcementContents.push({
                type: 'text',
                text: schoolsNeedingScoreCollection.join(', '),
                size: 'xs',
                color: COLORS.text,
                wrap: true,
                margin: 'sm'
            });
        }

        bubbles.push({
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '📋', size: 'xl', flex: 0 },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: 'NEWS', weight: 'bold', size: 'xxs', color: COLORS.success },
                                    { type: 'text', text: 'お知らせ', weight: 'bold', size: 'lg', color: COLORS.text },
                                ],
                                margin: 'md',
                                flex: 1
                            }
                        ],
                        alignItems: 'center'
                    }
                ],
                backgroundColor: COLORS.headerBg,
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: announcementContents,
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: `確認する (🔑${passcode || '----'})`,
                            uri: getUrl('/announcements', campusId),
                        },
                        style: 'primary',
                        color: COLORS.success,
                        height: 'sm'
                    }
                ],
                paddingAll: '15px'
            }
        });
    }

    // === CARD 2: イベント (Events) ===
    if (events.length > 0) {
        const eventContents: FlexComponent[] = [];

        // Event type icons
        const getEventIcon = (type: string) => {
            switch (type) {
                case 'EXAM': return '📚';
                case 'EIKEN': return '✏️';
                case 'COURSE': return '📖';
                case 'OTHER': return '📌';
                default: return '📅';
            }
        };

        events.slice(0, 6).forEach((event, index) => {
            let dateStr = '日時未定';
            let endDateStr = '';
            try {
                const d = new Date(event.date);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
                }
                // Check for endDate
                if ((event as any).endDate) {
                    const ed = new Date((event as any).endDate);
                    if (!isNaN(ed.getTime()) && ed.getTime() !== d.getTime()) {
                        endDateStr = ed.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                    }
                }
            } catch (e) { /* ignore */ }

            const dateDisplay = endDateStr ? `${dateStr}〜${endDateStr}` : dateStr;
            const eventIcon = getEventIcon((event as any).type || 'OTHER');

            eventContents.push({
                type: 'box',
                layout: 'horizontal',
                margin: index === 0 ? undefined : 'md',
                contents: [
                    {
                        type: 'box',
                        layout: 'vertical',
                        width: endDateStr ? '90px' : '70px',
                        flex: 0,
                        contents: [
                            {
                                type: 'text',
                                text: dateDisplay,
                                size: 'xxs',
                                color: COLORS.primary,
                                weight: 'bold',
                                align: 'center'
                            }
                        ],
                        backgroundColor: '#e8f4fd',
                        cornerRadius: 'md',
                        paddingAll: '6px'
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: eventIcon, size: 'sm', flex: 0 },
                            {
                                type: 'text',
                                text: sanitizeText(event.title, 30, '無題'),
                                size: 'sm',
                                color: COLORS.text,
                                wrap: true,
                                weight: 'bold',
                                margin: 'sm'
                            }
                        ],
                        flex: 1,
                        margin: 'md',
                        alignItems: 'center'
                    }
                ],
                alignItems: 'center'
            });
        });

        if (events.length > 6) {
            eventContents.push({
                type: 'text',
                text: `他 ${events.length - 6}件のイベント`,
                size: 'xxs',
                color: COLORS.textMuted,
                align: 'end',
                margin: 'md'
            });
        }

        bubbles.push({
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '📅', size: 'xl', flex: 0 },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: 'SCHEDULE', weight: 'bold', size: 'xxs', color: COLORS.primary },
                                    { type: 'text', text: '直近の予定', weight: 'bold', size: 'lg', color: COLORS.text },
                                ],
                                margin: 'md',
                                flex: 1
                            }
                        ],
                        alignItems: 'center'
                    }
                ],
                backgroundColor: COLORS.headerBg,
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: eventContents,
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: '予定を確認',
                            uri: getUrl('/events', campusId),
                        },
                        style: 'primary',
                        color: COLORS.primary,
                        height: 'sm'
                    }
                ],
                paddingAll: '15px'
            }
        });
    }

    // === CARD 2.5: テスト予定 (Test Schedules) ===
    if (individualTestSchedules && individualTestSchedules.length > 0) {
        // Group by school and test name
        const groupedTests = new Map<string, {
            schoolName: string;
            testName: string;
            start: string;
            end: string;
            students: { name: string; grade?: string }[];
        }>();

        individualTestSchedules.forEach(schedule => {
            const key = `${schedule.schoolName}-${schedule.testName}`;
            if (!groupedTests.has(key)) {
                groupedTests.set(key, {
                    schoolName: schedule.schoolName,
                    testName: schedule.testName,
                    start: schedule.start,
                    end: schedule.end,
                    students: []
                });
            }
            groupedTests.get(key)!.students.push({
                name: schedule.studentName,
                grade: schedule.grade
            });
        });

        const testContents: FlexComponent[] = [];

        const GRADE_ORDER: Record<string, number> = {
            '中1': 1, '中2': 2, '中3': 3,
            '高1': 4, '高2': 5, '高3': 6,
            '小1': -6, '小2': -5, '小3': -4, '小4': -3, '小5': -2, '小6': -1
        };

        Array.from(groupedTests.values()).slice(0, 5).forEach((test, index) => {
            // Format date range
            let dateStr = '日程未定';
            try {
                const startDate = new Date(test.start);
                const endDate = new Date(test.end);
                const startStr = startDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                const endStr = endDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                dateStr = startStr === endStr ? startStr : `${startStr}〜${endStr}`;
            } catch (e) { /* ignore */ }

            // Check if test is ongoing
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startDate = new Date(test.start);
            const endDate = new Date(test.end);
            const isOngoing = startDate <= today && endDate >= today;

            // Group students by grade
            const gradeGroups = new Map<string, string[]>();
            test.students.forEach(s => {
                const g = s.grade || '学年未設定';
                const list = gradeGroups.get(g) || [];
                list.push(s.name);
                gradeGroups.set(g, list);
            });

            const sortedGrades = Array.from(gradeGroups.keys()).sort((a, b) => {
                return (GRADE_ORDER[a] ?? 99) - (GRADE_ORDER[b] ?? 99);
            });

            const studentComponents: FlexComponent[] = sortedGrades.map(grade => {
                const names = gradeGroups.get(grade)!;
                const count = names.length;
                const displayNames = names.slice(0, 3).join('、');
                const suffix = count > 3 ? ` 他${count - 3}名` : '';
                return {
                    type: 'text',
                    text: `👤 ${grade}: ${displayNames}${suffix}`,
                    size: 'xs',
                    color: COLORS.textSecondary,
                    wrap: true,
                    margin: 'xs'
                };
            });

            testContents.push({
                type: 'box',
                layout: 'vertical',
                margin: index === 0 ? undefined : 'lg',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '🏫', size: 'sm', flex: 0 },
                            {
                                type: 'text',
                                text: `${test.schoolName}`,
                                size: 'sm',
                                weight: 'bold',
                                color: COLORS.text,
                                flex: 1,
                                margin: 'sm'
                            },
                            ...(isOngoing ? [{
                                type: 'box' as const,
                                layout: 'vertical' as const,
                                backgroundColor: COLORS.danger,
                                cornerRadius: 'sm' as const,
                                paddingAll: '4px',
                                flex: 0,
                                margin: 'sm' as const,
                                contents: [{
                                    type: 'text' as const,
                                    text: '実施中',
                                    size: 'xxs' as const,
                                    color: COLORS.white,
                                    align: 'center' as const
                                }]
                            }] : [])
                        ],
                        alignItems: 'center'
                    },
                    {
                        type: 'text',
                        text: `${test.testName} | 📅 ${dateStr}`,
                        size: 'xs',
                        color: COLORS.textSecondary,
                        margin: 'xs'
                    },
                    ...studentComponents
                ]
            });
        });

        const remainingTestCount = groupedTests.size - 5;
        if (remainingTestCount > 0) {
            testContents.push({
                type: 'text',
                text: `他 ${remainingTestCount} 件のテスト予定`,
                size: 'xs',
                color: COLORS.textMuted,
                margin: 'lg',
                align: 'center'
            });
        }

        bubbles.push({
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '📚', size: 'xl', flex: 0 },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: 'EXAM', weight: 'bold', size: 'xxs', color: COLORS.warning },
                                    { type: 'text', text: 'テスト予定', weight: 'bold', size: 'lg', color: COLORS.text },
                                ],
                                margin: 'md',
                                flex: 1
                            }
                        ],
                        alignItems: 'center'
                    }
                ],
                backgroundColor: COLORS.headerBg,
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: testContents,
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: 'テスト日程を確認',
                            uri: getUrl('/test-schedule', campusId),
                        },
                        style: 'primary',
                        color: COLORS.warning,
                        height: 'sm'
                    }
                ],
                paddingAll: '15px'
            }
        });
    }

    // === CARD 3: 個別連絡 (Individual Items) ===
    if (individualItems.length > 0) {
        const uniqueNames = Array.from(new Set(individualItems.map(item => item.studentName)));

        const individualContents: FlexComponent[] = [
            {
                type: 'text',
                text: '以下の生徒に個別の連絡事項があります',
                size: 'xs',
                color: COLORS.textSecondary,
                wrap: true
            },
            { type: 'separator', margin: 'lg' }
        ];

        uniqueNames.slice(0, 8).forEach((name, index) => {
            // Get items for this student to show type summary
            const studentItems = individualItems.filter(item => item.studentName === name);
            const typeSummary = studentItems.map(item => item.type === 'event' ? '予定' : '連絡').join('・');

            individualContents.push({
                type: 'box',
                layout: 'horizontal',
                margin: index === 0 ? 'lg' : 'sm',
                contents: [
                    { type: 'text', text: '👤', size: 'sm', flex: 0 },
                    {
                        type: 'text',
                        text: `${name} さん`,
                        size: 'sm',
                        color: COLORS.text,
                        weight: 'bold',
                        flex: 0,
                        margin: 'sm'
                    },
                    {
                        type: 'text',
                        text: `(${typeSummary})`,
                        size: 'xs',
                        color: COLORS.textMuted,
                        flex: 1,
                        margin: 'sm'
                    }
                ],
                alignItems: 'center'
            });
        });

        if (uniqueNames.length > 8) {
            individualContents.push({
                type: 'text',
                text: `他 ${uniqueNames.length - 8}名`,
                size: 'xxs',
                color: COLORS.textMuted,
                align: 'end',
                margin: 'sm'
            });
        }

        bubbles.push({
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '💬', size: 'xl', flex: 0 },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: 'PERSONAL', weight: 'bold', size: 'xxs', color: COLORS.info },
                                    { type: 'text', text: '個別連絡', weight: 'bold', size: 'lg', color: COLORS.text },
                                ],
                                margin: 'md',
                                flex: 1
                            }
                        ],
                        alignItems: 'center'
                    }
                ],
                backgroundColor: COLORS.headerBg,
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: individualContents,
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: `生徒を確認 (🔑${passcode || '----'})`,
                            uri: getUrl('/students', campusId),
                        },
                        style: 'primary',
                        color: COLORS.info,
                        height: 'sm'
                    }
                ],
                paddingAll: '15px'
            }
        });
    }

    // === CARD 4: テスト回収依頼 (Test Collection) ===
    if (missions.length > 0) {
        const collectionContents: FlexComponent[] = [
            {
                type: 'text',
                text: '以下のテストの回収をお願いします',
                size: 'xs',
                color: COLORS.textSecondary,
                wrap: true
            },
            { type: 'separator', margin: 'lg' }
        ];

        // Group by school and grade
        const groupedMissions: { [key: string]: any[] } = {};
        missions.forEach((m: any) => {
            const key = `${m.school?.name || '不明'} ${m.grade || ''}`;
            if (!groupedMissions[key]) groupedMissions[key] = [];
            groupedMissions[key].push(m);
        });

        const groups = Object.entries(groupedMissions).slice(0, 4);
        groups.forEach(([key, items], index) => {
            // School/Grade header
            collectionContents.push({
                type: 'box',
                layout: 'horizontal',
                margin: index === 0 ? 'md' : 'lg',
                contents: [
                    { type: 'text', text: '🏫', size: 'sm', flex: 0 },
                    {
                        type: 'text',
                        text: key,
                        size: 'sm',
                        color: COLORS.text,
                        weight: 'bold',
                        flex: 1,
                        margin: 'sm'
                    }
                ],
                alignItems: 'center'
            });

            // Show available students instead of subjects
            const allStudents: string[] = [];
            items.forEach((m: any) => {
                if (m.availableStudents && Array.isArray(m.availableStudents)) {
                    m.availableStudents.forEach((s: string) => {
                        if (!allStudents.includes(s)) allStudents.push(s);
                    });
                }
            });

            if (allStudents.length > 0) {
                const displayStudents = allStudents.slice(0, 3);
                const remainingCount = allStudents.length - 3;
                collectionContents.push({
                    type: 'text',
                    text: `👤 ${displayStudents.join('、')}${remainingCount > 0 ? ` 他${remainingCount}名` : ''}`,
                    size: 'xxs',
                    color: COLORS.textSecondary,
                    wrap: true,
                    margin: 'xs'
                });
            }
        });

        if (Object.keys(groupedMissions).length > 4) {
            collectionContents.push({
                type: 'text',
                text: `他 ${Object.keys(groupedMissions).length - 4}件`,
                size: 'xxs',
                color: COLORS.textMuted,
                align: 'end',
                margin: 'sm'
            });
        }

        bubbles.push({
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'text', text: '📝', size: 'xl', flex: 0 },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: 'COLLECTION', weight: 'bold', size: 'xxs', color: COLORS.danger },
                                    { type: 'text', text: 'テスト回収', weight: 'bold', size: 'lg', color: COLORS.text },
                                ],
                                margin: 'md',
                                flex: 1
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    {
                                        type: 'text',
                                        text: `${missions.length}件`,
                                        size: 'sm',
                                        color: COLORS.white,
                                        weight: 'bold',
                                        align: 'center'
                                    }
                                ],
                                backgroundColor: COLORS.danger,
                                cornerRadius: 'xl',
                                paddingAll: '6px',
                                width: '45px'
                            }
                        ],
                        alignItems: 'center'
                    }
                ],
                backgroundColor: COLORS.headerBg,
                paddingAll: '12px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: collectionContents,
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: `回収する (🔑${passcode || '----'})`,
                            uri: getUrl('/collection', campusId),
                        },
                        style: 'primary',
                        color: COLORS.danger,
                        height: 'sm'
                    }
                ],
                paddingAll: '15px'
            }
        });
    }

    // Fallback if nothing
    if (bubbles.length === 0) {
        bubbles.push({
            type: 'bubble',
            size: 'mega',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: '✨', size: '3xl', align: 'center' },
                    { type: 'text', text: '新しい通知はありません', size: 'md', align: 'center', color: COLORS.textSecondary, margin: 'lg' },
                    { type: 'text', text: '引き続きよろしくお願いします！', size: 'xs', align: 'center', color: COLORS.textMuted, margin: 'sm' }
                ],
                paddingAll: '40px',
                justifyContent: 'center'
            }
        });
    }

    return {
        type: 'flex',
        altText: `📢 Eisai通知: お知らせ${announcements.length}件、予定${events.length}件、回収${missions.length}件`,
        contents: {
            type: 'carousel',
            contents: bubbles
        },
    };
}
