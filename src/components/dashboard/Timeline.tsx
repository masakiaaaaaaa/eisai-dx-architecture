"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, Megaphone, User, Lock } from "lucide-react";
import { useState, useEffect } from "react";

type TimelineItem = {
    id: number;
    type: 'event' | 'announcement';
    title: string;
    date: string;
    description?: string;
    importance?: string;
    studentId?: number;
    studentName?: string;
};

export function Timeline() {
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchTimelineData();
    }, []);

    const fetchTimelineData = async () => {
        try {
            const [eventsRes, announcementsRes] = await Promise.all([
                fetch('/api/events?campusId=1'),
                fetch('/api/announcements?campusId=1'),
            ]);

            const now = new Date();
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            let timelineItems: TimelineItem[] = [];

            if (eventsRes.ok) {
                const events = await eventsRes.json();
                const upcomingEvents = events
                    .filter((e: any) => {
                        const eventDate = new Date(e.date);
                        return eventDate >= now && eventDate <= nextMonth;
                    })
                    .map((e: any) => ({
                        id: e.id,
                        type: 'event' as const,
                        title: e.title,
                        date: e.date,
                        description: e.description,
                        studentId: e.studentId,
                        studentName: e.student?.name,
                    }));
                timelineItems = [...timelineItems, ...upcomingEvents];
            }

            if (announcementsRes.ok) {
                const announcements = await announcementsRes.json();
                const activeAnnouncements = announcements
                    .filter((a: any) => {
                        const start = a.notifyStart ? new Date(a.notifyStart) : null;
                        const end = a.notifyEnd ? new Date(a.notifyEnd) : null;
                        if (!start) return false;
                        if (start > now) return false;
                        if (end && end < now) return false;
                        return true;
                    })
                    .map((a: any) => ({
                        id: a.id,
                        type: 'announcement' as const,
                        title: a.title,
                        date: a.notifyStart || a.createdAt,
                        description: a.detail,
                        importance: a.importance,
                        studentId: a.studentId,
                        studentName: a.student?.name,
                    }));
                timelineItems = [...timelineItems, ...activeAnnouncements];
            }

            // Sort by date
            timelineItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setItems(timelineItems.slice(0, 10)); // Limit to 10 items
        } catch (error) {
            console.error('Failed to fetch timeline', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: TimelineItem) => {
        if (item.studentId) {
            setSelectedItem(item);
            setIsDetailOpen(true);
        }
    };

    const getDisplayTitle = (item: TimelineItem) => {
        if (item.studentId && item.studentName) {
            return `${item.studentName}さん`;
        }
        return item.title;
    };

    const getDisplaySubtitle = (item: TimelineItem) => {
        if (item.studentId) {
            return item.type === 'event' ? '個人イベントあり' : '個人連絡あり';
        }
        return null;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        タイムライン
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-400">
                        読み込み中...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        タイムライン
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">予定はありません</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        タイムライン
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`flex gap-3 ${item.studentId ? 'cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {item.studentId ? (
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-amber-600" />
                                        </div>
                                    ) : item.type === 'event' ? (
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Megaphone className="w-4 h-4 text-purple-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className={`font-medium text-slate-800 truncate ${item.studentId ? 'text-amber-700' : ''}`}>
                                                {getDisplayTitle(item)}
                                            </p>
                                            {item.studentId && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                                    <Lock className="w-3 h-3" />
                                                    <span>{getDisplaySubtitle(item)}</span>
                                                    <span className="text-slate-400">（クリックで確認）</span>
                                                </div>
                                            )}
                                        </div>
                                        {item.importance === 'HIGH' && (
                                            <Badge className="bg-red-100 text-red-700 text-xs flex-shrink-0">重要</Badge>
                                        )}
                                        {item.studentId && (
                                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs flex-shrink-0">個人</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(item.date).toLocaleDateString('ja-JP', {
                                            month: 'short',
                                            day: 'numeric',
                                            weekday: 'short'
                                        })}
                                    </p>
                                    {/* Only show description for non-personal items */}
                                    {!item.studentId && item.description && (
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Personal Item Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-amber-500" />
                            {selectedItem?.studentName}さんの{selectedItem?.type === 'event' ? 'イベント' : '連絡'}
                        </DialogTitle>
                        <DialogDescription>
                            この内容は個人情報を含むため、LINEには送信されません。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">タイトル</p>
                            <p className="text-lg font-bold text-slate-800">{selectedItem?.title}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">日付</p>
                            <p className="text-slate-700">
                                {selectedItem?.date && new Date(selectedItem.date).toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'long'
                                })}
                            </p>
                        </div>
                        {selectedItem?.description && (
                            <div>
                                <p className="text-sm font-medium text-slate-500">内容</p>
                                <p className="text-slate-700 whitespace-pre-wrap">{selectedItem.description}</p>
                            </div>
                        )}
                        {selectedItem?.importance === 'HIGH' && (
                            <Badge className="bg-red-100 text-red-700">重要</Badge>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsDetailOpen(false)}>閉じる</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
