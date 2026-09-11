"use client";

import { useState, useEffect } from "react";

export function LeaderboardList() {
    const [leaderboard, setLeaderboard] = useState<{ name: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const campusId = 1;
        fetch(`/api/leaderboard?campusId=${campusId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setLeaderboard(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-sm text-slate-400 p-4 text-center">読み込み中...</div>;
    }

    if (leaderboard.length === 0) {
        return <div className="text-sm text-slate-400 p-4 text-center">データがありません。</div>;
    }

    return (
        <div className="divide-y divide-slate-50">
            {leaderboard.map((item, index) => (
                <div key={index} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm mr-4 ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-50 text-slate-500'
                        }`}>
                        {index + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-none">
                            {item.name}
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 max-w-[120px]">
                            <div
                                className="bg-indigo-500 h-1.5 rounded-full"
                                style={{ width: `${(item.count / leaderboard[0].count) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="ml-4 font-bold text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {item.count}
                    </div>
                </div>
            ))}
        </div>
    );
}
