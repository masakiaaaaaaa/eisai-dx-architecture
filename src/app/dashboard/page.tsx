"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
    Target,
    Calendar,
    Megaphone,
    ChevronRight,
    CheckCircle2,
    TrendingUp,
    Bell,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    FileText,
    Users,
    School,
    ClipboardList
} from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import { useCampus } from "@/hooks/use-campus";

type Mission = {
    id: number;
    school: { id: number; name: string };
    grade: string;
    subject: string;
    year: number;
    semester: string;
    collectionType: string;
    student?: { name: string };
    studentNames?: string[];
};

type TimelineItem = {
    id: number;
    type: 'event' | 'announcement';
    eventType?: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';
    title: string;
    date: string;
    endDate?: string;
    description?: string;
    importance?: string;
    studentId?: number;
    studentName?: string;
};

export default function Dashboard() {
    const { campus, isLoading: isCampusLoading } = useCampus();
    const [stats, setStats] = useState({ activeMissionsCount: 0, collectedThisMonthCount: 0 });
    const [missions, setMissions] = useState<Mission[]>([]);
    const [announcements, setAnnouncements] = useState<TimelineItem[]>([]);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [personalItems, setPersonalItems] = useState<TimelineItem[]>([]);


    // Independent loading states
    const [statsLoading, setStatsLoading] = useState(true);
    const [missionsLoading, setMissionsLoading] = useState(true);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [timelineLoading, setTimelineLoading] = useState(true);
    const [personalItemsLoading, setPersonalItemsLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        announcements: false,
        timeline: false,
        missions: false,
        personal: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // 1. Fetch Stats (Fast)
    useEffect(() => {
        if (!campus) return;
        fetch(`/api/dashboard/stats?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => {
                if (!data.error) setStats(data);
            })
            .catch(e => console.error(e))
            .finally(() => setStatsLoading(false));
    }, [campus]);

    // 2. Fetch Missions (Historically slow)
    useEffect(() => {
        if (!campus) return;
        fetch(`/api/dashboard/missions?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => {
                setMissions(Array.isArray(data) ? data : []);
            })
            .catch(() => setMissions([]))
            .finally(() => setMissionsLoading(false));
    }, [campus]);

    // 3. Fetch Announcements (Fast)
    useEffect(() => {
        if (!campus) return;
        fetch(`/api/announcements?campusId=${campus.id}&scope=all&active=true`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    data.sort((a: any, b: any) => {
                        if (a.importance === 'HIGH' && b.importance !== 'HIGH') return -1;
                        if (a.importance !== 'HIGH' && b.importance === 'HIGH') return 1;
                        return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
                    });

                    const items: TimelineItem[] = data.map((a: any) => ({
                        id: a.id, type: 'announcement', title: a.title, date: a.createdAt,
                        description: a.detail, importance: a.importance, studentId: a.studentId, studentName: a.student?.name
                    }));

                    const general: TimelineItem[] = [];

                    items.forEach(item => {
                        if (!item.studentId) general.push(item);
                    });

                    setAnnouncements(general);
                }
            })
            .catch(() => setAnnouncements([]))
            .finally(() => setAnnouncementsLoading(false));
    }, [campus]);

    // 3.5 Fetch Personal Items (Same as "確認・通知が必要な生徒")
    useEffect(() => {
        if (!campus) return;
        fetch(`/api/students/active-items?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => {
                const items: TimelineItem[] = [];
                
                if (data.events && Array.isArray(data.events)) {
                    data.events.forEach((e: any) => {
                        if (e.student) {
                            items.push({
                                id: e.id, type: 'event', eventType: e.type, title: e.title, date: e.date,
                                endDate: e.endDate || undefined,
                                description: e.description, studentId: e.studentId, studentName: e.student.name
                            });
                        }
                    });
                }
                
                if (data.announcements && Array.isArray(data.announcements)) {
                    data.announcements.forEach((a: any) => {
                        if (a.student) {
                            items.push({
                                id: a.id, type: 'announcement', title: a.title, date: a.createdAt,
                                description: a.detail, importance: a.importance, studentId: a.studentId, studentName: a.student.name
                            });
                        }
                    });
                }
                
                items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setPersonalItems(items);
            })
            .catch(() => setPersonalItems([]))
            .finally(() => setPersonalItemsLoading(false));
    }, [campus]);

    // 4. Fetch Timeline & Events (Mixed)
    useEffect(() => {
        if (!campus) return;
        Promise.all([
            fetch(`/api/events?campusId=${campus.id}&scope=all`).then(r => r.json()),
            fetch(`/api/test-schedule?campusId=${campus.id}`).then(r => r.json())
        ]).then(([eventsData, schoolsData]) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const eventsList: TimelineItem[] = [];

            if (Array.isArray(eventsData)) {
                eventsData.forEach((e: any) => {
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);

                    const notifyStart = e.notifyStart ? new Date(e.notifyStart) : null;
                    if (notifyStart) notifyStart.setHours(0, 0, 0, 0);

                    const notifyEnd = e.notifyEnd ? new Date(e.notifyEnd) : (e.endDate ? new Date(e.endDate) : new Date(e.date));
                    notifyEnd.setHours(23, 59, 59, 999);

                    const eventStartDate = new Date(e.date);
                    eventStartDate.setHours(0, 0, 0, 0);

                    const eventEndDate = e.endDate ? new Date(e.endDate) : new Date(e.date);
                    eventEndDate.setHours(23, 59, 59, 999);

                    const isEventActive = eventStartDate >= today || eventEndDate >= today;
                    const isInNotifyPeriod = notifyStart && today >= notifyStart && today <= notifyEnd;

                    if (isEventActive || isInNotifyPeriod) {
                        if (!e.studentId) {
                            eventsList.push({
                                id: e.id, type: 'event', eventType: e.type, title: e.title, date: e.date,
                                endDate: e.endDate || undefined,
                                description: e.description, studentId: e.studentId, studentName: e.student?.name
                            });
                        }
                    }
                });
            }

            if (Array.isArray(schoolsData)) {
                const today = new Date(now);
                schoolsData.forEach((school: any) => {
                    try {
                        const testDates = JSON.parse(school.testDates || '[]');
                        if (Array.isArray(testDates)) {
                            testDates.forEach((test: any) => {
                                if (!test.notifyEnabled) return;
                                const testStart = new Date(test.start);
                                testStart.setHours(0, 0, 0, 0);
                                const testEnd = new Date(test.end);
                                testEnd.setHours(23, 59, 59, 999);
                                const notifyWeeks = test.notifyWeeksBefore || 4;
                                const notifyStartDate = new Date(testStart);
                                notifyStartDate.setDate(notifyStartDate.getDate() - (notifyWeeks * 7));

                                if (today >= notifyStartDate && today <= testEnd) {
                                    const testName = test.name || 'テスト';
                                    eventsList.push({
                                        id: -school.id * 1000 - testDates.indexOf(test),
                                        type: 'event',
                                        title: `${school.name} ${testName}`,
                                        date: test.start,
                                        description: `${new Date(test.start).toLocaleDateString('ja-JP')} 〜 ${new Date(test.end).toLocaleDateString('ja-JP')}`
                                    });
                                }
                            });
                        }
                    } catch (e) { }
                });
            }

            eventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setTimeline(eventsList);

        }).finally(() => setTimelineLoading(false));
    }, [campus]);

    // Initial Loading State for Campus
    if (isCampusLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Skeleton className="w-12 h-12 rounded-full" />
                </div>
            </Layout>
        );
    }

    // Explicit check for when loading is done but no campus is selected (e.g. direct access without login)
    // Though practically, they should probably be redirected. For now, we just protect the render.
    if (!campus) {
        return (
            <Layout>
                <div className="p-8 text-center">
                    <p className="text-slate-500">校舎情報が見つかりません。ログインし直してください。</p>
                    <Link href="/login" className="text-indigo-600 underline mt-2 block">ログイン画面へ</Link>
                </div>
            </Layout>
        );
    }

    const missionsBySchool = missions.reduce((acc, m) => {
        const key = `${m.school?.name || '未設定'}|${m.grade || '未設定'}|${m.school?.id || 0}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {} as Record<string, Mission[]>);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[date.getDay()];
        return `${month}/${day}(${weekday})`;
    };

    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Event type color helper
    const getEventTypeColors = (eventType?: string) => {
        switch (eventType) {
            case 'EXAM': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' };
            case 'EIKEN': return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' };
            case 'SEASONAL_COURSE': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
        }
    };



    return (
        <Layout>
            <div className="space-y-6 pb-24">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Uncollected Tests */}
                    {statsLoading ? (
                        <Skeleton className="h-[120px] rounded-2xl skeleton-shimmer" />
                    ) : (
                        <Link href="/collection" className="block animate-fade-in-up stagger-1">
                            <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl p-4 md:p-5 text-white shadow-lg shadow-rose-200/50 card-hover btn-press">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 opacity-60" />
                                </div>
                                <p className="text-3xl md:text-4xl font-bold tracking-tight animate-count-up">{stats.activeMissionsCount}</p>
                                <p className="text-rose-100 text-sm font-medium mt-1">未回収テスト</p>
                            </div>
                        </Link>
                    )}

                    {/* Collected This Month */}
                    {statsLoading ? (
                        <Skeleton className="h-[120px] rounded-2xl skeleton-shimmer" />
                    ) : (
                        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 card-hover animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight animate-count-up">{stats.collectedThisMonthCount}</p>
                            <p className="text-slate-400 text-sm font-medium mt-1">今月の回収</p>
                        </div>
                    )}

                    {/* Upcoming Events */}
                    {timelineLoading ? (
                        <Skeleton className="h-[120px] rounded-2xl skeleton-shimmer" />
                    ) : (
                        <Link href="/events" className="block animate-fade-in-up stagger-3">
                            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 card-hover btn-press">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <p className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight animate-count-up">{timeline.length}</p>
                                <p className="text-slate-400 text-sm font-medium mt-1">今後の予定</p>
                            </div>
                        </Link>
                    )}

                    {/* Announcements */}
                    {announcementsLoading ? (
                        <Skeleton className="h-[120px] rounded-2xl skeleton-shimmer" />
                    ) : (
                        <Link href="/announcements" className="block animate-fade-in-up stagger-4">
                            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 card-hover btn-press">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                        <Megaphone className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                                <p className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight animate-count-up">{announcements.length}</p>
                                <p className="text-slate-400 text-sm font-medium mt-1">連絡事項</p>
                            </div>
                        </Link>
                    )}
                </div>

                {/* 2 Column Layout for wide screens */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column - Announcements + Test Collection Tasks */}
                    <div className="space-y-6">
                        {/* Announcements Section */}
                        {announcementsLoading ? (
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        ) : announcements.length > 0 && (
                            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-purple-500" />
                                        連絡事項
                                    </h2>
                                    <Link href="/announcements" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                        すべて見る<ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {/* Score Reminder based on missions */}
                                    {missions.length > 0 && (() => {
                                        const schoolNames = Array.from(new Set(missions.map((m: any) => m.school?.name).filter(Boolean)));
                                        if (schoolNames.length === 0) return null;
                                        return (
                                            <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-100">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-amber-800">点数記入のお願い</p>
                                                            <Badge className="bg-amber-500 text-white border-0 text-xs">重要</Badge>
                                                        </div>
                                                        <p className="text-sm text-amber-700 mt-1">
                                                            以下の学校のテストの点数を引き継ぎ書に記入してください: <strong>{schoolNames.join('、')}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {(expandedSections.announcements ? announcements : announcements.slice(0, 5)).map(item => (
                                        <div key={`ann-${item.id}`} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.importance === 'HIGH' ? 'bg-red-100 text-red-500' : 'bg-purple-100 text-purple-500'}`}>
                                                    {item.importance === 'HIGH' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-slate-800">{item.title}</p>
                                                        {item.importance === 'HIGH' && (
                                                            <Badge className="bg-red-500 text-white border-0 text-xs">重要</Badge>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {announcements.length > 5 && (
                                    <button
                                        onClick={() => toggleSection('announcements')}
                                        className="w-full py-3 text-sm text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-50"
                                    >
                                        {expandedSections.announcements ? (
                                            <><ChevronUp className="w-4 h-4" />閉じる</>
                                        ) : (
                                            <><ChevronDown className="w-4 h-4" />他 {announcements.length - 5} 件を表示</>
                                        )}
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Test Collection Tasks */}
                        {missionsLoading ? (
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        ) : missions.length > 0 && (
                            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-orange-500" />
                                        テスト回収タスク
                                    </h2>
                                    <Link href="/collection" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                        回収する<ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {Object.entries(missionsBySchool).slice(0, expandedSections.missions ? undefined : 5).map(([key, schoolMissions]) => {
                                        const [schoolName, grade] = key.split('|');
                                        const studentNames = schoolMissions[0]?.studentNames || [];
                                        return (
                                            <Link href="/collection" key={key} className="block px-5 py-4 hover:bg-orange-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <School className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-slate-800">{schoolName}</span>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-xs">{grade}</Badge>
                                                        </div>
                                                        {studentNames.length > 0 && (
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                <Users className="w-3 h-3 inline mr-1" />
                                                                {studentNames.slice(0, 3).join('、')}
                                                                {studentNames.length > 3 && ` 他${studentNames.length - 3}名`}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                {Object.keys(missionsBySchool).length > 5 && (
                                    <button
                                        onClick={() => toggleSection('missions')}
                                        className="w-full py-3 text-sm text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-50"
                                    >
                                        {expandedSections.missions ? (
                                            <><ChevronUp className="w-4 h-4" />閉じる</>
                                        ) : (
                                            <><ChevronDown className="w-4 h-4" />他 {Object.keys(missionsBySchool).length - 5} 件を表示</>
                                        )}
                                    </button>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Upcoming Events */}
                        {timelineLoading ? (
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        ) : timeline.length > 0 && (
                            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        今後の予定
                                    </h2>
                                    <Link href="/events" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                        すべて見る<ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {(expandedSections.timeline ? timeline : timeline.slice(0, 5)).map(item => {
                                        const daysUntil = getDaysUntil(item.date);
                                        const isToday = daysUntil === 0;
                                        const isTomorrow = daysUntil === 1;
                                        const isPast = daysUntil < 0;
                                        const typeColors = getEventTypeColors(item.eventType);

                                        return (
                                            <div key={`event-${item.id}`} className="px-5 py-4 hover:bg-blue-50/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${isToday ? 'bg-blue-500 text-white border-blue-500' :
                                                        isPast ? `${typeColors.bg} ${typeColors.text} ${typeColors.border}` :
                                                            `${typeColors.bg} ${typeColors.text} ${typeColors.border}`
                                                        }`}>
                                                        <span className="text-xs font-medium">{new Date(item.date).getMonth() + 1}月</span>
                                                        <span className="text-lg font-bold leading-none">{new Date(item.date).getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-800">{item.title}</p>
                                                        {item.endDate && item.endDate !== item.date && (
                                                            <p className="text-xs text-blue-500 mt-0.5">
                                                                〜 {new Date(item.endDate).getMonth() + 1}/{new Date(item.endDate).getDate()}まで
                                                            </p>
                                                        )}
                                                        {item.description && (
                                                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        {isToday ? (
                                                            <Badge className="bg-blue-500 text-white border-0">今日</Badge>
                                                        ) : isTomorrow ? (
                                                            <Badge className="bg-blue-100 text-blue-600 border-0">明日</Badge>
                                                        ) : isPast ? (
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-0">開催中</Badge>
                                                        ) : daysUntil <= 7 ? (
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-600 border-0">{daysUntil}日後</Badge>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {timeline.length > 5 && (
                                    <button
                                        onClick={() => toggleSection('timeline')}
                                        className="w-full py-3 text-sm text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-50"
                                    >
                                        {expandedSections.timeline ? (
                                            <><ChevronUp className="w-4 h-4" />閉じる</>
                                        ) : (
                                            <><ChevronDown className="w-4 h-4" />他 {timeline.length - 5} 件を表示</>
                                        )}
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Personal Items - Grouped by Student */}
                        {personalItemsLoading ? (
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        ) : personalItems.length > 0 && (() => {
                            // Group items by student
                            const groupedByStudent = personalItems.reduce((acc, item) => {
                                const studentId = item.studentId ?? 0;
                                const studentName = item.studentName ?? '不明';
                                const key = `${studentId}-${studentName}`;
                                if (!acc[key]) {
                                    acc[key] = { studentId, studentName, items: [] as typeof personalItems };
                                }
                                acc[key].items.push(item);
                                return acc;
                            }, {} as Record<string, { studentId: number; studentName: string; items: typeof personalItems }>);
                            const studentGroups = Object.values(groupedByStudent);

                            return (
                                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-500" />
                                            個別対応
                                        </h2>
                                        <Link href="/students" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                            生徒一覧<ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {(expandedSections.personal ? studentGroups : studentGroups.slice(0, 5)).map(group => (
                                            <Link
                                                key={`student-${group.studentId}`}
                                                href={`/students?id=${group.studentId}`}
                                                className="block px-5 py-3 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                        {group.studentName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-semibold text-slate-800">{group.studentName}</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {group.items.slice(0, 2).map(item => (
                                                                <Badge
                                                                    key={`${item.type}-${item.id}`}
                                                                    variant="outline"
                                                                    className={`text-[10px] ${item.type === 'event' ? 'text-blue-600 border-blue-200' : 'text-purple-600 border-purple-200'}`}
                                                                >
                                                                    {item.title}
                                                                </Badge>
                                                            ))}
                                                            {group.items.length > 2 && (
                                                                <Badge variant="outline" className="text-[10px] text-slate-400">+{group.items.length - 2}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {studentGroups.length > 5 && (
                                        <button
                                            onClick={() => toggleSection('personal')}
                                            className="w-full py-3 text-sm text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-50"
                                        >
                                            {expandedSections.personal ? (
                                                <><ChevronUp className="w-4 h-4" />閉じる</>
                                            ) : (
                                                <><ChevronDown className="w-4 h-4" />他 {personalItems.length - 5} 件を表示</>
                                            )}
                                        </button>
                                    )}
                                </section>
                            );
                        })()}
                    </div>
                </div>

                {/* Empty State */}
                {!statsLoading && !missionsLoading && !announcementsLoading && !timelineLoading &&
                    announcements.length === 0 && missions.length === 0 && timeline.length === 0 && personalItems.length === 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">すべて完了！</h3>
                            <p className="text-slate-500 mt-2">タスクはありません</p>
                        </div>
                    )}

                {/* Quick Actions */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href="/students" className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="font-medium text-slate-700">生徒一覧</span>
                    </Link>
                    <Link href="/test-schedule" className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="font-medium text-slate-700">テスト日程</span>
                    </Link>
                    <Link href="/events" className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="font-medium text-slate-700">イベント</span>
                    </Link>
                    <Link href="/announcements" className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="font-medium text-slate-700">連絡事項</span>
                    </Link>
                </section>
            </div>
        </Layout>
    );
}

