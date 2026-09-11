"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, School } from "lucide-react";
import { useCampus } from "@/hooks/use-campus";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlCampusId = searchParams.get("campusId");

    const [campuses, setCampuses] = useState<{ id: number; name: string }[]>([]);
    const [selectedCampusId, setSelectedCampusId] = useState<string>("");
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { setCampus } = useCampus();

    useEffect(() => {
        fetch("/api/campuses")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setCampuses(data);
                    if (urlCampusId) {
                        setSelectedCampusId(urlCampusId);
                    } else if (data.length > 0) {
                        setSelectedCampusId(data[0].id.toString());
                    }
                }
            })
            .catch((err) => console.error("Failed to fetch campuses", err));
    }, [urlCampusId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campusId: parseInt(selectedCampusId), passcode }),
            });

            if (res.ok) {
                // Save campus info to localStorage via hook
                const campusName = campuses.find(c => c.id.toString() === selectedCampusId)?.name || "";
                setCampus(parseInt(selectedCampusId), campusName);

                // Setup full navigation to clear Next.js flight caches
                window.location.href = "/dashboard";
            } else {
                const data = await res.json();
                setError(data.error || "ログインに失敗しました");
            }
        } catch (err) {
            setError("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    const selectedCampusName = campuses.find(c => c.id.toString() === selectedCampusId)?.name;

    return (
        <Card className="w-full max-w-md shadow-lg border-slate-100">
            <CardHeader className="space-y-1 text-center">
                <div className="mx-auto bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                    <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                    {urlCampusId && selectedCampusName ? `${selectedCampusName}にログイン` : "講師ログイン"}
                </CardTitle>
                <CardDescription>
                    {urlCampusId ? "合言葉を入力してください" : "所属校舎を選択し、合言葉を入力してください"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    {!urlCampusId && (
                        <div className="space-y-2">
                            <Label htmlFor="campus">校舎</Label>
                            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="校舎を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {campuses.map((campus) => (
                                        <SelectItem key={campus.id} value={campus.id.toString()}>
                                            {campus.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="passcode">合言葉</Label>
                        <Input
                            id="passcode"
                            type="password"
                            placeholder="4桁の数字など"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading ? "確認中..." : "ログイン"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="w-full max-w-md h-64 bg-white rounded-lg shadow-lg animate-pulse flex items-center justify-center">
                    <div className="text-slate-400">読み込み中...</div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
