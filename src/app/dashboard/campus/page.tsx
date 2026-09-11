"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { useCampus } from "@/hooks/use-campus";
import React, { useState, useEffect } from "react";
import { ClipboardList, School, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function CampusPage() {
    const { campus } = useCampus();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campus) return;
        fetch(`/api/widget?campusId=${campus.id}`)
            .then(r => r.json())
            .then(data => setItems(Array.isArray(data.missions) ? data.missions : []))
            .finally(() => setLoading(false));
    }, [campus]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-orange-500" />
                        Test Collections Pending
                    </h1>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 w-full rounded-xl skeleton-shimmer" />)
                    ) : items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 animate-fade-in">No pending collections</div>
                    ) : (
                        items.map((item, i) => (
                            <Card key={i} className={`border-l-4 border-l-orange-400 card-hover animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <School className="h-5 w-5" />
                                            {item.school} {item.grade}
                                        </CardTitle>
                                        <Badge variant="outline">{item.semester}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-medium text-orange-500 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Uncollected: {item.subjects}
                                    </div>
                                    {item.assignedStudent && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Assigned to: {item.assignedStudent}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
