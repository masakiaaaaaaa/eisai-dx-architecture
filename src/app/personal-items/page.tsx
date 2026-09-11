"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Megaphone, Clock, AlertTriangle, ChevronDown, ChevronUp, UserCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCampus } from "@/hooks/use-campus";

type TimelineItem = {
    id: number;
    type: 'event' | 'announcement';
    title: string;
    date: string;
    description?: string;
    studentId?: number;
    studentName?: string;
    importance?: 'HIGH' | 'MEDIUM' | 'LOW';
};

export default function PersonalItemsPage() {
    const { campus } = useCampus();
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!campus) return;
            try {
                const [eventsRes, announcementsRes] = await Promise.all([
                    fetch(`/api/events?campusId=${campus.id}`),
                    fetch(`/api/announcements?campusId=${campus.id}`)
                ]);

                const events = await eventsRes.json();
                const announcements = await announcementsRes.json();

                const personalItems: TimelineItem[] = [];

                // Process events
                if (Array.isArray(events)) {
                    events.forEach((e: any) => {
                        if (e.studentId) {
                            personalItems.push({
                                id: e.id,
                                type: 'event',
                                title: e.title,
                                date: e.date,
                                description: e.description,
                                studentId: e.studentId,
                                studentName: e.student?.name
                            });
                        }
                    });
                }

                // Process announcements
                if (Array.isArray(announcements)) {
                    announcements.forEach((a: any) => {
                        if (a.studentId) {
                            personalItems.push({
                                id: a.id,
                                type: 'announcement',
                                title: a.title,
                                date: a.notifyStart || a.createdAt,
                                description: a.detail,
                                importance: a.importance,
                                studentId: a.studentId,
                                studentName: a.student?.name
                            });
                        }
                    });
                }

                // Sort by date desc
                personalItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setItems(personalItems);
            } catch (error) {
                console.error('Failed to fetch personal items', error);
            } finally {
                setLoading(false);
            }
        };

        if (campus) {
            fetchData();
        }
    }, [campus]);

    const now = new Date();
    const activeItems = items.filter(item => new Date(item.date) >= now); // Future or today
    const expiredItems = items.filter(item => new Date(item.date) < now); // Past

    // Sort active items asc (nearest first), expired items desc (newest past first)
    activeItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    expiredItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const renderItemCard = (item: TimelineItem, expired: boolean = false) => (
        <div
            key={`${item.type}-${item.id}`}
            className={`bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3 ${expired ? 'opacity-60 bg-slate-50' : ''}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'event' ? 'bg-amber-50 border border-amber-100' : 'bg-purple-50 border border-purple-100'}`}>
                {item.type === 'event' ? (
                    <User className="w-5 h-5 text-amber-500" />
                ) : (
                    <Megaphone className="w-5 h-5 text-purple-500" />
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
                {item.studentId ? (
                    <Link href={`/students?id=${item.studentId}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-all">
                        {item.studentName}
                    </Link>
                ) : (
                    <span className="font-bold text-slate-800">{item.studentName}</span>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-slate-200 text-slate-500">
                    {item.type === 'event' ? 'イベント' : '連絡'}
                </Badge>
                {expired && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-slate-200 text-slate-400">
                        終了
                    </Badge>
                )}
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-slate-500">
                    {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </p>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">生徒個人の連絡・イベント</h2>
                    <p className="text-sm text-slate-500">生徒ごとのイベントや連絡事項を一覧で確認できます</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">読み込み中...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <UserCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">個人連絡・イベントはありません</p>
                    </div>
                ) : (
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="active" className="text-sm">
                                予定中・有効
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{activeItems.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="expired" className="text-sm">
                                終了・期限切れ
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{expiredItems.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="space-y-4 mt-0">
                            {activeItems.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">予定中のイベントはありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {activeItems.map((item) => renderItemCard(item))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="expired" className="space-y-4 mt-0">
                            {expiredItems.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">終了したイベントはありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {expiredItems.map((item) => renderItemCard(item, true))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </Layout>
    );
}
