"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, User, GraduationCap } from "lucide-react";
import Link from "next/link";

type Mission = {
    id: number;
    school: { id: number; name: string };
    grade: string;
    subject: string;
    year: number;
    semester: string;
    collectionType: string;
    student?: { id: number; name: string };
};

export default function CollectionDetail() {
    const params = useParams();
    const router = useRouter();
    const { schoolId, grade } = params;
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!schoolId || !grade) return;

        fetch('/api/missions?campusId=1')
            .then(res => res.json())
            .then((data: Mission[]) => {
                const filtered = data.filter(m =>
                    m.school.id.toString() === schoolId &&
                    m.grade === decodeURIComponent(grade as string)
                );
                setMissions(filtered);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [schoolId, grade]);

    const handleCollect = async (mission: Mission) => {
        try {
            const res = await fetch('/api/test-masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: 1,
                    schoolId: mission.school.id,
                    grade: mission.grade,
                    year: mission.year,
                    semester: mission.semester,
                    subject: mission.subject,
                    collectionType: mission.collectionType,
                    collectedFromId: mission.student?.id,
                    collectedByName: 'Admin', // 仮
                }),
            });

            if (res.ok) {
                setMissions(prev => prev.filter(m => m !== mission));
            }
        } catch (error) {
            console.error('Failed to collect', error);
        }
    };

    if (loading) return <Layout><div className="p-8 text-center text-slate-500">読み込み中...</div></Layout>;

    const schoolName = missions[0]?.school.name || '学校';
    const gradeName = decodeURIComponent(grade as string);

    return (
        <Layout>
            <div className="space-y-6 pb-12">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                            <ChevronLeft className="w-6 h-6 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {schoolName} <Badge variant="secondary" className="text-lg px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-100">{gradeName}</Badge>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">未回収テスト一覧</p>
                    </div>
                </div>

                {missions.length === 0 ? (
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-sm">
                        <CardContent className="py-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <p className="text-xl font-bold text-emerald-800 mb-2">全ての回収が完了しています！</p>
                            <p className="text-emerald-600">このクラスの未回収テストはありません。</p>
                            <Link href="/dashboard">
                                <Button className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 rounded-full px-8">
                                    ダッシュボードに戻る
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {missions.map((mission, index) => (
                            <Card key={index} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                                <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between">
                                    <div className="p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                                            <User className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-slate-800">{mission.student?.name}</p>
                                            <div className="flex gap-2 mt-1.5">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{mission.subject}</Badge>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{mission.semester}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-50/50 sm:bg-transparent sm:border-l border-slate-100 flex items-center justify-end sm:justify-center min-w-[140px]">
                                        <Button
                                            onClick={() => handleCollect(mission)}
                                            className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 rounded-xl transition-all active:scale-95"
                                        >
                                            回収する
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
