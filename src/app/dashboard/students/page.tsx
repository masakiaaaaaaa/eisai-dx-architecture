"use client";

import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout";
import { useCampus } from "@/hooks/use-campus";
import React, { useState, useEffect } from "react";
import { Users, User, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
    const { campus } = useCampus();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campus) return;
        fetch(`/api/widget?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => setItems(Array.isArray(data.individualItems) ? data.individualItems : []))
            .finally(() => setLoading(false));
    }, [campus]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-purple-500" />
                        Individual Notifications
                    </h1>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-xl skeleton-shimmer" />)
                    ) : items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 animate-fade-in">No personal items</div>
                    ) : (
                        items.map((item, i) => (
                            <Card key={i} className={`card-hover animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{item.studentName}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                To: {item.studentName}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={item.type === 'event' ? "bg-blue-500" : "bg-purple-500"}>
                                        {item.type === 'event' ? 'Event' : 'Notice'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
