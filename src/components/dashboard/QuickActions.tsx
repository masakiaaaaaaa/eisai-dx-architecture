import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function QuickActions() {
    return (
        <div className="flex flex-wrap gap-2">
            <Link href="/test-schedule">
                <Button size="sm" variant="outline" className="rounded-full bg-white border-slate-200 text-slate-600">
                    <Plus className="w-4 h-4 mr-1" /> テスト日程
                </Button>
            </Link>
            <Link href="/events">
                <Button size="sm" variant="outline" className="rounded-full bg-white border-slate-200 text-slate-600">
                    <Plus className="w-4 h-4 mr-1" /> イベント
                </Button>
            </Link>
            <Link href="/announcements">
                <Button size="sm" variant="outline" className="rounded-full bg-white border-slate-200 text-slate-600">
                    <Plus className="w-4 h-4 mr-1" /> 連絡事項
                </Button>
            </Link>
        </div>
    );
}
