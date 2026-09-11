"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users } from "lucide-react";

export function MissionList() {
    const [missions, setMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lecturerName, setLecturerName] = useState('');

    useEffect(() => {
        fetchMissions();
        const savedName = localStorage.getItem('lecturerName');
        if (savedName) {
            setLecturerName(savedName);
        }
    }, []);

    const fetchMissions = async () => {
        try {
            const res = await fetch('/api/dashboard/missions');
            if (res.ok) {
                const data = await res.json();
                setMissions(data);
            }
        } catch (error) {
            console.error('Failed to fetch missions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCollect = async (id: number) => {
        if (!lecturerName) {
            alert('講師名を入力してください');
            return;
        }

        localStorage.setItem('lecturerName', lecturerName);

        try {
            const res = await fetch('/api/test-masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: 'COLLECTED',
                    collectedByName: lecturerName,
                    collectedAt: new Date(),
                }),
            });

            if (res.ok) {
                setMissions(missions.filter((m) => m.id !== id));
                window.location.reload();
            } else {
                alert('更新に失敗しました');
            }
        } catch (error) {
            console.error('Error collecting mission', error);
            alert('エラーが発生しました');
        }
    };

    if (loading) {
        return <div className="text-sm text-slate-400 text-center py-8">読み込み中...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
                    <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 block mb-1">担当者名</label>
                    <Input
                        placeholder="名前を入力..."
                        value={lecturerName}
                        onChange={(e) => setLecturerName(e.target.value)}
                        className="border-none shadow-none p-0 h-auto text-slate-800 font-medium placeholder:text-slate-300 focus-visible:ring-0"
                    />
                </div>
            </div>

            {missions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-slate-500 font-medium">全ての回収が完了しました！</p>
                    <p className="text-xs text-slate-400 mt-1">お疲れ様でした</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {missions.map((mission) => (
                        <div key={mission.id} className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-3xl"></div>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{mission.school?.name}</h4>
                                    <div className="flex items-center text-slate-500 text-sm mt-1 space-x-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium">{mission.grade}</span>
                                        <span>•</span>
                                        <span>{mission.subject}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`rounded-full px-3 py-1 border-0 font-medium ${mission.collectionType === 'BOTH' ? 'bg-indigo-50 text-indigo-600' :
                                    mission.collectionType === 'QUESTION_ONLY' ? 'bg-pink-50 text-pink-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {mission.collectionType === 'BOTH' ? '問題・解答' :
                                        mission.collectionType === 'QUESTION_ONLY' ? '問題のみ' : '解答のみ'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center text-xs text-slate-400 space-x-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{mission.year}年 {mission.semester}</span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleCollect(mission.id)}
                                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 px-5"
                                >
                                    回収する
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
