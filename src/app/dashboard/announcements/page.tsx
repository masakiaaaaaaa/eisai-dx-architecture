"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { useCampus } from "@/hooks/use-campus";
import React, { useState, useEffect } from "react";
import { Megaphone, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnnouncementsPage() {
    const { campus } = useCampus();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campus) return;
        fetch(`/api/dashboard/announcements?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => setItems(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, [campus]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-green-500" />
                        Announcement List
                    </h1>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 w-full rounded-xl skeleton-shimmer" />)
                    ) : items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 animate-fade-in">No announcements</div>
                    ) : (
                        items.map((item, i) => (
                            <Card key={item.id} className={`card-hover animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${item.importance === 'HIGH' ? 'border-red-200 bg-red-50/30' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {item.importance === 'HIGH' && (
                                                <AlertCircle className="h-5 w-5 text-red-500 fill-white animate-pulse" />
                                            )}
                                            <CardTitle className={`text-lg font-bold ${item.importance === 'HIGH' ? 'text-red-700' : 'text-blue-600'}`}>
                                                {item.title}
                                            </CardTitle>
                                        </div>
                                        {item.importance === 'HIGH' && (
                                            <Badge variant="destructive" className="flex gap-1 shadow-sm shadow-red-200">
                                                重要
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground gap-2 pl-[28px]">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-6">
                                    <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3 ml-1">
                                        {item.detail}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
