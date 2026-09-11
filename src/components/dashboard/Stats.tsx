import { Card, CardContent } from "@/components/ui/card";

interface StatsProps {
    collectedThisMonthCount: number;
    collectionRate?: number;
}

export function Stats({ collectedThisMonthCount, collectionRate = 0 }: StatsProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">今月の実績</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">{collectedThisMonthCount}</div>
                    <div className="text-xs text-slate-400 font-medium">回収済み</div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold text-slate-700 mb-1">{collectionRate}<span className="text-sm">%</span></div>
                    <div className="text-xs text-slate-400 font-medium">回収率</div>
                </div>
            </div>
        </div>
    );
}
