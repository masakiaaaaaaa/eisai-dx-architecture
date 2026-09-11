"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Trash2, Edit2, Bell, BellOff, Info, FileText, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useCampus } from "@/hooks/use-campus";
import React, { useState, useEffect, useMemo } from "react";

// Test name options (3-semester and 2-semester systems)
const TEST_NAME_OPTIONS = [
    // 3学期制
    { value: '1学期中間', label: '1学期 中間テスト（3学期制）' },
    { value: '1学期期末', label: '1学期 期末テスト（3学期制）' },
    { value: '2学期中間', label: '2学期 中間テスト（3学期制）' },
    { value: '2学期期末', label: '2学期 期末テスト（3学期制）' },
    { value: '学年末', label: '学年末テスト' },
    // 2学期制
    { value: '前期中間', label: '前期 中間テスト（2学期制）' },
    { value: '前期期末', label: '前期 期末テスト（2学期制）' },
    { value: '後期中間', label: '後期 中間テスト（2学期制）' },
    { value: '後期期末', label: '後期 期末テスト（2学期制）' },
];


type TestDate = {
    id: string;
    name: string;
    start: string;
    end: string;
    notifyEnabled: boolean;
    notifyWeeksBefore: number;
    collectEnabled: boolean; // 回収対象かどうか
    collectGrades: string[]; // 回収対象学年
};

// 学年選択肢
const GRADE_OPTIONS = [
    { value: '中1', label: '中学1年' },
    { value: '中2', label: '中学2年' },
    { value: '中3', label: '中学3年' },
    { value: '高1', label: '高校1年' },
    { value: '高2', label: '高校2年' },
    { value: '高3', label: '高校3年' },
];

type School = {
    id: number;
    name: string;
    testDates: string | TestDate[]; // JSON string or parsed array
};

type StudentGrade = {
    grade: string;
    count: number;
};

export default function TestSchedulePage() {
    const { campus } = useCampus();
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddSchoolMode, setIsAddSchoolMode] = useState(false);
    const [formData, setFormData] = useState<Partial<TestDate>>({
        notifyEnabled: true,
        notifyWeeksBefore: 4, // Default to 1 month
        collectEnabled: false, // デフォルトはOFF
        collectGrades: [],
    });
    const [availableGrades, setAvailableGrades] = useState<StudentGrade[]>([]);
    const [schoolFilter, setSchoolFilter] = useState<'ALL' | 'ELEMENTARY' | 'JUNIOR' | 'HIGH'>('ALL');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getSchoolType = (name: string) => {
        if (name.includes('小')) return 'ELEMENTARY';
        if (name.includes('中')) return 'JUNIOR';
        if (name.includes('高')) return 'HIGH';
        return 'OTHER';
    };

    const filterSchools = (schools: School[]) => {
        if (schoolFilter === 'ALL') return schools;
        return schools.filter(s => {
            const type = getSchoolType(s.name);
            return type === schoolFilter || (schoolFilter === 'HIGH' && type === 'OTHER'); // Fallback for others to High or just show in ALL
        });
    };

    const [allStudents, setAllStudents] = useState<any[]>([]);

    useEffect(() => {
        if (campus) {
            fetchSchedules();
        }
    }, [campus]);

    const fetchSchedules = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/test-schedule?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                setSchools(data);
            }
            // 生徒一覧を取得して保持
            const studentsRes = await fetch(`/api/students?campusId=${campus.id}`);
            if (studentsRes.ok) {
                const students = await studentsRes.json();
                setAllStudents(students);
            }
        } catch (error) {
            console.error('Failed to fetch schedules', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (school: School, testDate?: TestDate) => {
        setSelectedSchool(school);
        setIsAddSchoolMode(false);

        // Calculate available grades for this school
        const schoolStudents = allStudents.filter(s => s.schoolId === school.id);
        const gradeCounts: { [key: string]: number } = {};
        schoolStudents.forEach((s: any) => {
            if (s.grade) {
                gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
            }
        });
        const grades = Object.entries(gradeCounts).map(([grade, count]) => ({
            grade,
            count,
        }));
        setAvailableGrades(grades);

        if (testDate) {
            setFormData({
                ...testDate,
                collectEnabled: testDate.collectEnabled === true,
                collectGrades: testDate.collectGrades || [],
            });
        } else {
            setFormData({
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                start: '',
                end: '',
                notifyEnabled: true,
                notifyWeeksBefore: 4,
                collectEnabled: false, // デフォルトOFF
                collectGrades: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleOpenAddSchoolDialog = () => {
        setSelectedSchool(null);
        setIsAddSchoolMode(true);
        setFormData({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            start: '',
            end: '',
            notifyEnabled: true,
            notifyWeeksBefore: 4,
            collectEnabled: false, // デフォルトOFF
            collectGrades: [],
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.start || !formData.end) {
            alert('テスト名、開始日、終了日は必須です');
            return;
        }

        if (!selectedSchool && !isAddSchoolMode) {
            alert('学校を選択してください');
            return;
        }

        const targetSchool = selectedSchool || schools[0];
        if (!targetSchool) {
            alert('学校が登録されていません。まず生徒データをCSVからインポートしてください。');
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let currentDates: TestDate[] = parseTestDates(targetSchool.testDates || '[]');

            const existingIndex = currentDates.findIndex(d => d.id === formData.id);
            if (existingIndex >= 0) {
                currentDates[existingIndex] = formData as TestDate;
            } else {
                currentDates.push(formData as TestDate);
            }

            const res = await fetch('/api/test-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: targetSchool.id,
                    testDates: currentDates,
                }),
            });

            if (res.ok) {
                fetchSchedules();
                setIsDialogOpen(false);
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save schedule', error);
            alert('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (school: School, testId: string) => {
        if (!window.confirm('このテスト日程を削除しますか？\n※この操作は取り消せません。')) return;

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let currentDates: TestDate[] = parseTestDates(school.testDates || '[]');

            const newDates = currentDates.filter(d => d.id !== testId);

            const res = await fetch('/api/test-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: school.id,
                    testDates: newDates,
                }),
            });

            if (res.ok) {
                fetchSchedules();
                alert('削除しました');
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete schedule', error);
            alert('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseTestDates = (json: string | TestDate[]): TestDate[] => {
        if (Array.isArray(json)) return json;
        if (!json) return [];
        try {
            const parsed = JSON.parse(json);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse testDates:', e);
            return [];
        }
    };

    const getTestLabel = (name: string) => {
        const option = TEST_NAME_OPTIONS.find(o => o.value === name);
        return option ? option.label : name;
    };

    // Calendar helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        return { daysInMonth, startDayOfWeek, year, month };
    };

    const calendarDays = useMemo(() => {
        const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);
        const days: (Date | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    }, [currentMonth]);

    const allTestEvents = useMemo(() => {
        const events: any[] = [];
        schools.forEach(school => {
            const testDates = parseTestDates(school.testDates);
            testDates.forEach(td => {
                events.push({
                    id: `${school.id}-${td.id}`,
                    title: `${school.name} ${getTestLabel(td.name)}`,
                    shortTitle: `${school.name.slice(0, 4)} ${getTestLabel(td.name).replace('学期', '').replace('中間', '中').replace('期末', '末')}`,
                    start: new Date(td.start),
                    end: new Date(td.end),
                    type: 'TEST',
                    schoolName: school.name,
                    testName: getTestLabel(td.name)
                });
            });
        });
        return events;
    }, [schools]);

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">テスト日程設定</h2>
                        <p className="text-sm text-slate-500">各学校の定期テスト期間と回収・通知設定を管理します</p>
                    </div>
                </div>

                {/* Calendar */}
                <Card className="border-slate-200 shadow-sm animate-fade-in-up stagger-1">
                    <CardContent className="p-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h3 className="text-lg font-bold text-slate-800 min-w-[140px] text-center">
                                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                                </h3>
                                <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-8">
                                    今日
                                </Button>
                            </div>
                        </div>

                        {/* Calendar Grid - Week by week */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {/* Week days header */}
                            <div className="grid grid-cols-7 border-b border-slate-100">
                                {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                                    <div key={day} className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Weeks */}
                            {(() => {
                                const weeks: (Date | null)[][] = [];
                                for (let i = 0; i < calendarDays.length; i += 7) {
                                    weeks.push(calendarDays.slice(i, i + 7));
                                }

                                return weeks.map((week, weekIdx) => {
                                    // Get events for this week
                                    const weekStart = week.find(d => d !== null);
                                    const weekEnd = week.filter(d => d !== null).pop();

                                    let weekEvents: any[] = [];
                                    if (weekStart && weekEnd) {
                                        const weekStartTime = new Date(weekStart);
                                        weekStartTime.setHours(0, 0, 0, 0);
                                        const weekEndTime = new Date(weekEnd);
                                        weekEndTime.setHours(23, 59, 59, 999);

                                        weekEvents = allTestEvents
                                            .filter(event => {
                                                const eventStart = new Date(event.start);
                                                eventStart.setHours(0, 0, 0, 0);
                                                const eventEnd = event.end ? new Date(event.end) : new Date(event.start);
                                                eventEnd.setHours(23, 59, 59, 999);
                                                return eventStart <= weekEndTime && eventEnd >= weekStartTime;
                                            })
                                            .map(event => {
                                                // Calculate positioning
                                                const eventStart = new Date(event.start);
                                                eventStart.setHours(0, 0, 0, 0);
                                                const eventEnd = event.end ? new Date(event.end) : new Date(event.start);
                                                eventEnd.setHours(0, 0, 0, 0);

                                                let startCol = 0;
                                                for (let i = 0; i < week.length; i++) {
                                                    if (week[i] && week[i]!.getTime() >= eventStart.getTime()) {
                                                        startCol = i;
                                                        break;
                                                    }
                                                    if (week[i]) startCol = i;
                                                }
                                                // Handle edge case where event starts before week
                                                if (week[0] && eventStart < week[0]) startCol = 0;

                                                let endCol = 6;
                                                for (let i = week.length - 1; i >= 0; i--) {
                                                    if (week[i] && week[i]!.getTime() <= eventEnd.getTime()) {
                                                        endCol = i;
                                                        break;
                                                    }
                                                }
                                                // Handle edge case where event ends after week
                                                if (week[6] && eventEnd > week[6]) endCol = 6;

                                                if (startCol > endCol) [startCol, endCol] = [endCol, startCol];

                                                const span = endCol - startCol + 1;
                                                const isStartOfEvent = week[startCol] && week[startCol]!.getTime() === eventStart.getTime();
                                                const isEndOfEvent = week[endCol] && week[endCol]!.getTime() === eventEnd.getTime();

                                                return { ...event, startCol, endCol, span, isStartOfEvent, isEndOfEvent };
                                            })
                                            .sort((a, b) => a.startCol - b.startCol);
                                    }

                                    return (
                                        <div key={weekIdx} className="relative border-b border-slate-100 last:border-0">
                                            {/* Days grid background */}
                                            <div className="grid grid-cols-7 h-full absolute inset-0">
                                                {week.map((date, dayIdx) => (
                                                    <div
                                                        key={dayIdx}
                                                        className={`border-r border-slate-50 last:border-0 ${date && isToday(date) ? 'bg-indigo-50/30' : ''}`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Days Row */}
                                            <div className="grid grid-cols-7 relative sticky z-10">
                                                {week.map((date, dayIdx) => (
                                                    <div key={dayIdx} className="h-6 px-2 flex items-center justify-end">
                                                        {date && (
                                                            <span className={`text-xs font-semibold ${dayIdx === 0 ? 'text-red-500' : dayIdx === 6 ? 'text-blue-500' : 'text-slate-700'
                                                                } ${isToday(date) ? 'text-indigo-600 bg-indigo-100 rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                                                {date.getDate()}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Events Row */}
                                            <div className="relative pb-1" style={{ minHeight: `${Math.max(weekEvents.length * 24 + 4, 32)}px` }}>
                                                {weekEvents.map((event, eventIdx) => {
                                                    const leftPercent = (event.startCol / 7) * 100;
                                                    const widthPercent = (event.span / 7) * 100;

                                                    return (
                                                        <div
                                                            key={`${event.id}-${weekIdx}`}
                                                            className={`absolute h-5 px-1.5 text-[10px] font-medium text-white flex items-center
                                                                bg-orange-500 shadow-sm hover:bg-orange-600 transition-colors cursor-pointer
                                                                ${event.isStartOfEvent ? 'rounded-l-md' : ''} ${event.isEndOfEvent ? 'rounded-r-md' : ''}
                                                            `}
                                                            style={{
                                                                left: `calc(${leftPercent}% + 2px)`,
                                                                width: `calc(${widthPercent}% - 4px)`,
                                                                top: `${eventIdx * 24}px`,
                                                                zIndex: 20
                                                            }}
                                                            title={`${event.fullTitle} (${new Date(event.start).toLocaleDateString()} - ${new Date(event.end).toLocaleDateString()})`}
                                                            onClick={() => {
                                                                const school = schools.find(s => s.name === event.schoolName);
                                                                const testDate = schools
                                                                    .flatMap(s => parseTestDates(s.testDates) as any[])
                                                                    .find(td => td.id === event.id.split('-')[1]);
                                                                if (school && testDate) {
                                                                    handleOpenDialog(school, testDate);
                                                                }
                                                            }}
                                                        >
                                                            <span className="truncate">{event.title}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* Help Card */}
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100 animate-fade-in-up stagger-2">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-slate-600 space-y-2">
                                <p className="font-medium text-amber-700">テスト日程設定について</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-500">
                                    <li><strong>学校名</strong>：CSVから生徒をインポートすると、学校が自動的に登録されます</li>
                                    <li><strong>テスト名</strong>：1学期中間・期末、2学期中間・期末、学年末の5種類から選択します</li>
                                    <li><strong>回収対象</strong>：有効にするとテスト問題・解答の回収対象になります（ダッシュボードに表示）</li>
                                    <li><strong>LINE通知</strong>：有効にすると、設定した週数前からダッシュボードに表示され、教室のLINEグループにテスト期間が自動共有されます</li>
                                    <li><strong>通知内容</strong>：「〇〇高校のテスト期間が近づいています（△月△日〜△月△日）」のように送信されます</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : schools.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-fade-in">
                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">学校が登録されていません</p>
                        <p className="text-xs text-slate-400 mt-1">まず「生徒一覧」ページからCSVをインポートしてください</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Configured Schools */}
                        <div className="space-y-3">
                            {(() => {
                                const now = new Date();
                                const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                                const academicYearStart = new Date(currentYear, 3, 1);

                                return (
                                    <Tabs defaultValue="current" className="w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Check className="w-5 h-5 text-green-500" />
                                                設定済みの学校
                                            </h3>
                                            <TabsList>
                                                <TabsTrigger value="current">今年度</TabsTrigger>
                                                <TabsTrigger value="previous">前年度以前</TabsTrigger>
                                            </TabsList>
                                        </div>
                                        
                                        {['current', 'previous'].map((tab) => (
                                            <TabsContent key={tab} value={tab} className="mt-0">
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    {schools.filter(school => {
                                                        const dates = parseTestDates(school.testDates);
                                                        return dates.some(d => {
                                                            const endDate = new Date(d.end || d.start);
                                                            return tab === 'current' ? endDate >= academicYearStart : endDate < academicYearStart;
                                                        });
                                                    }).map((school) => {
                                                        const allDates = parseTestDates(school.testDates);
                                                        const testDates = allDates.filter(d => {
                                                            const endDate = new Date(d.end || d.start);
                                                            return tab === 'current' ? endDate >= academicYearStart : endDate < academicYearStart;
                                                        });
                                                        
                                                        return (
                                                            <Card key={school.id} className="border-slate-200 shadow-sm card-hover animate-fade-in-up" style={{ animationDelay: `${0.05 * schools.indexOf(school)}s` }}>
                                                                <CardHeader className="py-3 px-4 border-b border-slate-50 bg-slate-50/50 rounded-t-xl">
                                                                    <div className="flex justify-between items-center">
                                                                        <CardTitle className="text-base font-bold text-slate-800">{school.name}</CardTitle>
                                                                        {tab === 'current' && (
                                                                            <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(school)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-200">
                                                                                <Plus className="w-5 h-5 text-indigo-600" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="p-3">
                                                                    <div className="space-y-3">
                                                                        {testDates.map((date) => (
                                                                            <div key={date.id} className="group bg-white border border-slate-100 rounded-lg p-3 shadow-sm relative hover:border-indigo-100 transition-colors">
                                                                                <div className="flex justify-between items-start mb-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-slate-700 text-sm">{getTestLabel(date.name)}</span>
                                                                                        <div className="flex items-center gap-1">
                                                                                            {date.notifyEnabled ? (
                                                                                                <Bell className="w-3 h-3 text-green-500" />
                                                                                            ) : (
                                                                                                <BellOff className="w-3 h-3 text-slate-300" />
                                                                                            )}
                                                                                            {date.collectEnabled !== false && (
                                                                                                <FileText className="w-3 h-3 text-blue-500" />
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex space-x-1">
                                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenDialog(school, date); }} className="text-blue-500 hover:text-blue-700 p-1">
                                                                                            <Edit2 className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(school, date.id); }} className="text-red-500 hover:text-red-700 p-1">
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                                                                                    <div className="flex items-center">
                                                                                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                                                                        {new Date(date.start).toLocaleDateString('ja-JP')} 〜 {new Date(date.end).toLocaleDateString('ja-JP')}
                                                                                    </div>
                                                                                    {date.notifyEnabled && (
                                                                                        <span className="text-green-600">共有期間: {date.notifyWeeksBefore}週間前〜</span>
                                                                                    )}
                                                                                    {date.collectEnabled !== false && (
                                                                                        <span className="text-blue-600">回収対象</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                    {schools.filter(school => {
                                                        const dates = parseTestDates(school.testDates);
                                                        return dates.some(d => {
                                                            const endDate = new Date(d.end || d.start);
                                                            return tab === 'current' ? endDate >= academicYearStart : endDate < academicYearStart;
                                                        });
                                                    }).length === 0 && (
                                                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                            {tab === 'current' ? '今年度のテスト日程はまだ登録されていません' : '前年度以前のテスト日程はありません'}
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                );
                            })()}
                        </div>

                        {/* Unconfigured Schools - schools with no test dates in the CURRENT academic year */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-slate-400" />
                                    今年度未設定の学校
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                                    {(['ALL', 'ELEMENTARY', 'JUNIOR', 'HIGH'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSchoolFilter(type)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${schoolFilter === type
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {type === 'ALL' && 'すべて'}
                                            {type === 'ELEMENTARY' && '小学校'}
                                            {type === 'JUNIOR' && '中学校'}
                                            {type === 'HIGH' && '高校'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(() => {
                                    const now = new Date();
                                    const cy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                                    const ays = new Date(cy, 3, 1);
                                    const unconfigured = filterSchools(schools.filter(s => {
                                        const dates = parseTestDates(s.testDates);
                                        // Show if NO dates exist at all, or if none are in the current academic year
                                        return !dates.some(d => {
                                            const endDate = new Date(d.end || d.start);
                                            return endDate >= ays;
                                        });
                                    }));
                                    return unconfigured.length === 0 ? (
                                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                                            該当する未設定の学校はありません
                                        </div>
                                    ) : unconfigured.map((school) => (
                                        <div key={school.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{school.name}</span>
                                                {parseTestDates(school.testDates).length > 0 && (
                                                    <span className="text-xs text-slate-400">前年度の日程あり</span>
                                                )}
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(school)} className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                追加
                                            </Button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedSchool ? `${selectedSchool.name} - テスト登録` : 'テスト日程登録'}
                            </DialogTitle>
                            <DialogDescription>
                                定期テストの期間、回収対象、共有期間を設定します。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* School Selection (if adding from scratch) */}
                            {isAddSchoolMode && schools.length > 0 && (
                                <div className="grid gap-2">
                                    <Label>学校 <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={selectedSchool?.id?.toString() || ''}
                                        onValueChange={(val) => setSelectedSchool(schools.find(s => s.id === parseInt(val)) || null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="学校を選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schools.map((school) => (
                                                <SelectItem key={school.id} value={school.id.toString()}>
                                                    {school.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Test Name Selection */}
                            <div className="grid gap-2">
                                <Label>テスト名 <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.name || ''}
                                    onValueChange={(val) => setFormData({ ...formData, name: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="テストを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEST_NAME_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">開始日 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="start"
                                        type="date"
                                        value={formData.start || ''}
                                        onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">終了日 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="end"
                                        type="date"
                                        value={formData.end || ''}
                                        onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Collection Settings */}
                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        テスト問題・解答の回収
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, collectEnabled: !formData.collectEnabled })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.collectEnabled ? 'bg-blue-500' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.collectEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {formData.collectEnabled && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">回収対象の学年を選択</Label>
                                        {availableGrades.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {availableGrades.map((gradeInfo) => {
                                                    const isSelected = formData.collectGrades?.includes(gradeInfo.grade);
                                                    const gradeLabel = GRADE_OPTIONS.find(g => g.value === gradeInfo.grade)?.label || gradeInfo.grade;
                                                    return (
                                                        <button
                                                            key={gradeInfo.grade}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = formData.collectGrades || [];
                                                                const updated = isSelected
                                                                    ? current.filter(g => g !== gradeInfo.grade)
                                                                    : [...current, gradeInfo.grade];
                                                                setFormData({ ...formData, collectGrades: updated });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            {gradeLabel}
                                                            <span className="ml-1 text-xs opacity-70">({gradeInfo.count}名)</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">
                                                生徒が登録されていません。先に「生徒一覧」から生徒を登録してください。
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500">
                                            選択した学年の生徒からテストを回収します
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-slate-500">
                                    {formData.collectEnabled
                                        ? '有効にすると、この学校・テストがダッシュボードの「回収リスト」に表示されます。'
                                        : '回収対象外です。このテストは回収リストには表示されません。'}
                                </p>
                            </div>


                            {/* LINE Notification Settings */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Clock className="w-4 h-4" />
                                        共有期間
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, notifyEnabled: !formData.notifyEnabled })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notifyEnabled ? 'bg-green-500' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notifyEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {formData.notifyEnabled && (
                                    <div className="grid gap-2">
                                        <Label>何週間前から通知を開始しますか？</Label>
                                        <Select
                                            value={formData.notifyWeeksBefore?.toString() || '4'}
                                            onValueChange={(val) => setFormData({ ...formData, notifyWeeksBefore: parseInt(val) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2">2週間前から</SelectItem>
                                                <SelectItem value="3">3週間前から</SelectItem>
                                                <SelectItem value="4">4週間前から（1ヶ月前）【推奨】</SelectItem>
                                                <SelectItem value="6">6週間前から（1.5ヶ月前）</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <p className="text-xs text-slate-500">
                                    {formData.notifyEnabled
                                        ? 'ダッシュボードに表示され、教室のLINEグループにも自動で共有されます。「〇〇高校の△△テストが近づいています」という形式で共有されます。'
                                        : '共有はオフです。このテスト日程についてダッシュボード・LINEへの共有は行われません。'}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        保存中...
                                    </>
                                ) : '保存'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
