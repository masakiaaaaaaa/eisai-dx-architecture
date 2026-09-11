"use client";

import Layout from "@/components/layout";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar as CalendarIcon, Plus, Clock, Info, Bell, Trash2, Edit, AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useCampus } from "@/hooks/use-campus";

type Event = {
    id: number;
    title: string;
    date: string;
    endDate?: string;
    type: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';
    description?: string;
    notifyStart?: string;
    notifyEnd?: string;
};

type EventFormData = {
    title: string;
    startDate: string;
    endDate: string;
    type: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER';
    description: string;
    notifyWeeksBefore: string;
};

export default function EventsPage() {
    const { campus } = useCampus();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        type: 'OTHER',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        notifyWeeksBefore: '2',
    });

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);

    useEffect(() => {
        if (campus) {
            fetchEvents();
        }
    }, [campus]);

    const fetchEvents = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/events?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = (event: Event) => {
        const notifyEndDate = event.notifyEnd || event.endDate || event.date;
        return new Date(notifyEndDate) < new Date();
    };

    const activeEvents = events.filter(e => !isExpired(e));
    const expiredEvents = events.filter(e => isExpired(e));

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


    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventStart = new Date(event.date);
            eventStart.setHours(0, 0, 0, 0);
            const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
            eventEnd.setHours(23, 59, 59, 999);
            const checkDate = new Date(date);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= eventStart && checkDate <= eventEnd;
        });
    };

    const calendarDays = useMemo(() => {
        const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);
        const days: (Date | null)[] = [];

        // Add empty slots for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentMonth]);

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({
            title: '',
            type: 'OTHER',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            description: '',
            notifyWeeksBefore: '2',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (event: Event) => {
        setEditingId(event.id);
        // Calculate notifyWeeksBefore from existing data
        let weeksBefore = '2';
        if (event.notifyStart && event.date) {
            const eventDate = new Date(event.date);
            const notifyStartDate = new Date(event.notifyStart);
            const diffDays = Math.round((eventDate.getTime() - notifyStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.round(diffDays / 7);
            if (diffWeeks >= 4) weeksBefore = '4';
            else if (diffWeeks >= 3) weeksBefore = '3';
            else if (diffWeeks >= 2) weeksBefore = '2';
            else weeksBefore = '1';
        }
        setFormData({
            title: event.title,
            type: event.type,
            startDate: event.date.split('T')[0],
            endDate: event.endDate?.split('T')[0] || '',
            description: event.description || '',
            notifyWeeksBefore: weeksBefore,
        });
        setIsDialogOpen(true);
    };

    const openEventPopup = (event: Event) => {
        setSelectedEvent(event);
        setIsEventPopupOpen(true);
    };

    const handleSave = async () => {
        if (saving) return; // Prevent double-click
        if (!formData.title) {
            alert('タイトルを入力してください');
            return;
        }

        const startDateStr = formData.startDate || new Date().toISOString().split('T')[0];

        setSaving(true);
        try {
            const startDate = new Date(startDateStr);
            if (isNaN(startDate.getTime())) {
                alert('開始日が不正です');
                return;
            }

            const weeksBefore = parseInt(formData.notifyWeeksBefore) || 2;
            const notifyStart = new Date(startDate);
            notifyStart.setDate(notifyStart.getDate() - (weeksBefore * 7));

            const notifyEndDate = formData.endDate || startDateStr;

            const url = editingId ? `/api/events/${editingId}` : '/api/events';
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                campusId: campus?.id,
                title: formData.title,
                date: startDateStr,
                endDate: formData.endDate || null,
                type: formData.type,
                description: formData.description || null,
                notifyStart: notifyStart.toISOString().split('T')[0],
                notifyEnd: notifyEndDate,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                fetchEvents();
                setIsDialogOpen(false);
                setEditingId(null);
            } else {
                const errorText = await res.text();
                let errorMessage = '不明なエラー';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                alert(editingId ? '更新に失敗しました: ' + errorMessage : '作成に失敗しました: ' + errorMessage);
            }
        } catch (error) {
            console.error('Failed to save event', error);
            alert('エラーが発生しました: ' + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (saving) return; // Prevent double-click
        if (!confirm('このイベントを削除しますか？')) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchEvents();
                setIsEventPopupOpen(false);
            }
        } catch (error) {
            console.error('Failed to delete event', error);
        } finally {
            setSaving(false);
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'EXAM': return 'bg-red-100 text-red-700';
            case 'EIKEN': return 'bg-blue-100 text-blue-700';
            case 'SEASONAL_COURSE': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'EXAM': return '入試';
            case 'EIKEN': return '英検';
            case 'SEASONAL_COURSE': return '講習';
            default: return 'その他';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'EXAM': return 'bg-red-500';
            case 'EIKEN': return 'bg-blue-500';
            case 'SEASONAL_COURSE': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    const formatDateRange = (start: string, end?: string) => {
        const startDate = new Date(start).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        if (end && end !== start) {
            const endDate = new Date(end).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
            return `${startDate} 〜 ${endDate}`;
        }
        return startDate;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const renderEventCard = (event: Event, expired: boolean = false, index: number = 0) => {
        const staggerClass = index < 8 ? `stagger-${index + 1}` : '';
        return (
            <div
                key={event.id}
                className={`bg-white border border-slate-200 rounded-xl p-3 shadow-sm card-hover animate-fade-in-up ${staggerClass} cursor-pointer ${expired ? 'opacity-60 bg-slate-50' : ''}`}
                onClick={() => openEventPopup(event)}
            >
                <div className="flex justify-between items-start mb-2">
                    <Badge className={`${getBadgeColor(event.type)} text-xs`}>
                        {getTypeName(event.type)}
                    </Badge>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(event); }}
                            className="p-1 hover:bg-blue-50 rounded text-blue-500 btn-press"
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                            className="p-1 hover:bg-red-50 rounded text-red-500 btn-press"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{event.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarIcon className="w-3 h-3" />
                    {formatDateRange(event.date, event.endDate)}
                </div>
                {event.notifyStart && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.notifyStart).toLocaleDateString('ja-JP')} 〜
                    </div>
                )}
            </div>
        );
    };

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <Layout>
            <div className="flex flex-col space-y-4 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-0.5">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">イベント設定</h2>
                        <p className="text-sm text-slate-500">教室全体のイベントや検定スケジュールを管理します</p>
                    </div>
                </div>

                {/* Note about regular tests */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        定期テストはここには表示されません。<Link href="/test-schedule" className="underline font-medium hover:text-amber-900">テスト日程設定</Link>で確認してください。
                    </p>
                </div>

                {/* Monthly Calendar */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h3 className="font-bold text-lg text-slate-800">
                                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                            </h3>
                            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full">
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2">
                        {/* Week days header */}
                        <div className="grid grid-cols-7 mb-1">
                            {weekDays.map((day, i) => (
                                <div key={day} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Calendar grid - Week by week with spanning event bars */}
                        {(() => {
                            // Group days into weeks
                            const weeks: (Date | null)[][] = [];
                            for (let i = 0; i < calendarDays.length; i += 7) {
                                weeks.push(calendarDays.slice(i, i + 7));
                            }

                            // Get events that appear in a week and calculate their spans
                            const getWeekEvents = (week: (Date | null)[]) => {
                                const weekStart = week.find(d => d !== null);
                                const weekEnd = week.filter(d => d !== null).pop();
                                if (!weekStart || !weekEnd) return [];

                                const weekStartTime = new Date(weekStart);
                                weekStartTime.setHours(0, 0, 0, 0);
                                const weekEndTime = new Date(weekEnd);
                                weekEndTime.setHours(23, 59, 59, 999);

                                return events
                                    .filter(event => {
                                        const eventStart = new Date(event.date);
                                        eventStart.setHours(0, 0, 0, 0);
                                        const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
                                        eventEnd.setHours(23, 59, 59, 999);
                                        return eventStart <= weekEndTime && eventEnd >= weekStartTime;
                                    })
                                    .map(event => {
                                        const eventStart = new Date(event.date);
                                        eventStart.setHours(0, 0, 0, 0);
                                        const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
                                        eventEnd.setHours(0, 0, 0, 0);

                                        // Calculate start column (0-6)
                                        let startCol = 0;
                                        for (let i = 0; i < week.length; i++) {
                                            if (week[i] && week[i]!.getTime() >= eventStart.getTime()) {
                                                startCol = i;
                                                break;
                                            }
                                            if (week[i]) startCol = i;
                                        }
                                        if (week[0] && eventStart < week[0]) startCol = 0;

                                        // Calculate end column (0-6)
                                        let endCol = 6;
                                        for (let i = week.length - 1; i >= 0; i--) {
                                            if (week[i] && week[i]!.getTime() <= eventEnd.getTime()) {
                                                endCol = i;
                                                break;
                                            }
                                        }
                                        if (week[6] && eventEnd > week[6]) endCol = 6;

                                        // Ensure startCol <= endCol
                                        if (startCol > endCol) {
                                            [startCol, endCol] = [endCol, startCol];
                                        }

                                        const span = endCol - startCol + 1;
                                        const isStartOfEvent = week[startCol] && week[startCol]!.getTime() === eventStart.getTime();
                                        const isEndOfEvent = week[endCol] && week[endCol]!.getTime() === eventEnd.getTime();

                                        return { ...event, startCol, span, isStartOfEvent, isEndOfEvent };
                                    })
                                    .sort((a, b) => a.startCol - b.startCol);
                            };

                            return weeks.map((week, weekIdx) => {
                                const weekEvents = getWeekEvents(week);

                                return (
                                    <div key={weekIdx} className="relative">
                                        {/* Day numbers row */}
                                        <div className="grid grid-cols-7 border-b border-slate-100">
                                            {week.map((date, dayIdx) => {
                                                if (!date) {
                                                    return <div key={`empty-${weekIdx}-${dayIdx}`} className="h-6 border-r border-slate-100 bg-slate-50" />;
                                                }
                                                const dayOfWeek = date.getDay();
                                                return (
                                                    <div
                                                        key={date.toISOString()}
                                                        className={`h-6 px-1 flex items-center border-r border-slate-100 ${isToday(date) ? 'bg-indigo-100' : ''}`}
                                                    >
                                                        <span className={`text-xs font-semibold ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-slate-700'} ${isToday(date) ? 'text-indigo-700' : ''}`}>
                                                            {date.getDate()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Event bars row */}
                                        <div className="min-h-[60px] relative border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
                                            {/* Grid lines (visual) */}
                                            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                                {[...Array(7)].map((_, i) => (
                                                    <div key={i} className="border-r border-slate-100" />
                                                ))}
                                            </div>

                                            {/* Stacked event bars */}
                                            <div className="relative p-1 space-y-1">
                                                {weekEvents.slice(0, 4).map((event, eventIdx) => {
                                                    const leftPercent = (event.startCol / 7) * 100;
                                                    const widthPercent = (event.span / 7) * 100;
                                                    const roundedLeft = event.isStartOfEvent ? 'rounded-l-md' : '';
                                                    const roundedRight = event.isEndOfEvent ? 'rounded-r-md' : '';

                                                    return (
                                                        <button
                                                            key={`${event.id}-${weekIdx}`}
                                                            onClick={() => openEventPopup(event)}
                                                            className={`absolute h-5 text-[10px] font-medium text-white px-1.5 truncate shadow-sm hover:shadow-md transition-shadow ${getTypeColor(event.type)} ${roundedLeft} ${roundedRight}`}
                                                            style={{
                                                                left: `calc(${leftPercent}% + 2px)`,
                                                                width: `calc(${widthPercent}% - 4px)`,
                                                                top: `${4 + eventIdx * 24}px`,
                                                            }}
                                                        >
                                                            {event.title}
                                                        </button>
                                                    );
                                                })}
                                                {weekEvents.length > 4 && (
                                                    <div className="absolute bottom-1 right-1 text-[10px] text-slate-500 font-medium">
                                                        +{weekEvents.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </CardContent>
                </Card>

                {/* Add Event Button - Below Calendar */}
                <Button onClick={openCreateDialog} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl py-3">
                    <Plus className="w-4 h-4 mr-2" /> イベントを追加
                </Button>

                {/* Help Card - More compact */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-slate-600">
                            <span className="font-medium text-indigo-700">ヒント: </span>
                            カレンダーの予定をタップすると詳細が表示されます。
                            <span className="text-amber-600 ml-2">⚠️ 個人的な内容は「生徒一覧」から作成してください。</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-fade-in">
                        <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">イベントがまだ登録されていません</p>
                        <p className="text-xs text-slate-400 mt-1">「イベント追加」ボタンから作成してください</p>
                    </div>
                ) : (
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="active" className="text-sm">
                                予定中・開催中
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{activeEvents.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="expired" className="text-sm">
                                終了したイベント
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{expiredEvents.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="mt-0">
                            {activeEvents.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">予定中のイベントはありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {activeEvents.map((event, i) => renderEventCard(event, false, i))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="expired" className="mt-0">
                            {expiredEvents.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">終了したイベントはありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {expiredEvents.map((event) => renderEventCard(event, true))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Event Detail Popup */}
                <Dialog open={isEventPopupOpen} onOpenChange={setIsEventPopupOpen}>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        {selectedEvent && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getBadgeColor(selectedEvent.type)}>{getTypeName(selectedEvent.type)}</Badge>
                                    </div>
                                    <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{formatDateRange(selectedEvent.date, selectedEvent.endDate)}</span>
                                    </div>
                                    {selectedEvent.description && (
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedEvent.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="w-4 h-4" />
                                        共有期間: {selectedEvent.notifyStart
                                            ? `${new Date(selectedEvent.notifyStart).toLocaleDateString('ja-JP')} 〜 ${selectedEvent.notifyEnd ? new Date(selectedEvent.notifyEnd).toLocaleDateString('ja-JP') : ''}`
                                            : '設定なし'}
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => { setIsEventPopupOpen(false); openEditDialog(selectedEvent); }}>
                                        <Edit className="w-4 h-4 mr-1" /> 編集
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDelete(selectedEvent.id)}>
                                        <Trash2 className="w-4 h-4 mr-1" /> 削除
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="w-[95%] md:max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'イベントを編集' : '新規イベント'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'イベントの内容を編集します。' : '教室のイベント・検定スケジュールを登録します。'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="例: 第2回英検、冬期講習"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type">種類</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER') => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="種類を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXAM">入試</SelectItem>
                                        <SelectItem value="EIKEN">英検・検定</SelectItem>
                                        <SelectItem value="SEASONAL_COURSE">講習</SelectItem>
                                        <SelectItem value="OTHER">その他</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">開始日 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">終了日（任意）</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">詳細（任意）</Label>
                                <Textarea
                                    id="description"
                                    placeholder="講師への指示、注意事項など"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Sharing Period Settings */}
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="w-4 h-4" />
                                    共有期間
                                </div>
                                <Select
                                    value={formData.notifyWeeksBefore}
                                    onValueChange={(val) => setFormData({ ...formData, notifyWeeksBefore: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1週間前から</SelectItem>
                                        <SelectItem value="2">2週間前から</SelectItem>
                                        <SelectItem value="3">3週間前から</SelectItem>
                                        <SelectItem value="4">4週間前（1ヶ月前）から</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500">
                                    開始前から終了日まで、ダッシュボードに表示され、定期通知時にLINEグループにも送信されます。
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>キャンセル</Button>
                            <Button type="button" onClick={handleSave} disabled={saving}>
                                {saving ? '保存中...' : (editingId ? '更新' : '作成')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}

