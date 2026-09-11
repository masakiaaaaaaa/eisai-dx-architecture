"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { useCampus } from "@/hooks/use-campus";
import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
    const { campus } = useCampus();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campus) return;
        // Re-using the widget API for consistency as it processes events well
        fetch(`/api/widget?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => setItems(Array.isArray(data.events) ? data.events : []))
            .finally(() => setLoading(false));
    }, [campus]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-500" />
                        Events & Tests
                    </h1>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 w-full rounded-xl skeleton-shimmer" />)
                    ) : items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 animate-fade-in">No events</div>
                    ) : (
                        items.map((item, i) => (
                            <Card key={i} className={`card-hover animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold text-blue-400">
                                            {item.title}
                                        </CardTitle>
                                        <div className="flex items-center text-sm font-medium bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {item.date}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
