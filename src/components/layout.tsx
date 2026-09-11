"use client";

import React, { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { FloatingQRButton } from "@/components/floating-qr-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Home,
  FileCheck,
  CalendarDays,
  Calendar,
  Megaphone,
  Users,
  Menu,
  Settings,
  X,
  ChevronRight,
  Puzzle,
  BookOpen,
  GraduationCap, // Added for training
  Command, // Added for sleek app logo
  Zap, // Added for onboarding
  LayoutGrid // Added for seating configuration
} from "lucide-react";
import { useCampus } from "@/hooks/use-campus";

// Bottom Navigation for Mobile
function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "ホーム", icon: Home, href: "/dashboard" },
    { label: "回収", icon: FileCheck, href: "/collection" },
    { label: "テスト", icon: CalendarDays, href: "/test-schedule" },
    { label: "生徒", icon: Users, href: "/students" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-4 rounded-xl transition-all relative touch-target no-select mobile-tap-feedback",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "text-indigo-600")} />
              <span className={cn(
                "text-[11px] mt-0.5 font-medium",
                isActive && "text-indigo-600"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Header
function MobileHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { campus } = useCampus();

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/dashboard": "ホーム",
      "/collection": "テスト回収",
      "/test-schedule": "テスト日程",
      "/events": "イベント",
      "/announcements": "連絡事項",
      "/students": "生徒一覧",
      "/admin": "設定",
    };
    return titles[pathname] || "教室サポート";
  };

  const menuItems = [
    { label: "イベント", icon: Calendar, href: "/events" },
    { label: "連絡事項", icon: Megaphone, href: "/announcements" },
    { label: "座席表設定", icon: LayoutGrid, href: "/admin/seating" },
    { label: "導入・運用ガイド", icon: Zap, href: "/help" },
    { label: "設定", icon: Settings, href: "/admin" },
  ];

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-100 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center shadow-sm border border-slate-700/50">
            <Command className="w-3.5 h-3.5 text-white/90 stroke-[2.5px]" />
          </div>
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{campus?.name || getPageTitle()}</h1>
        </div>

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-100">
                <SheetTitle className="font-bold text-slate-800">メニュー</SheetTitle>
              </div>

              <div className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all",
                      pathname === item.href
                        ? "bg-indigo-50 text-indigo-600"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100">
                <a
                  href="mailto:sutasaku.app@gmail.com?subject=お問い合わせ"
                  className="block text-center text-sm text-slate-400 py-2"
                >
                  ヘルプ・お問い合わせ
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

// Desktop Sidebar
function DesktopSidebar() {
  const pathname = usePathname();
  const { campus } = useCampus();

  const mainRoutes = [
    { label: "ホーム", icon: Home, href: "/dashboard" },
    { label: "テスト回収", icon: FileCheck, href: "/collection" },
  ];

  const settingRoutes = [
    { label: "テスト日程", icon: CalendarDays, href: "/test-schedule" },
    { label: "イベント", icon: Calendar, href: "/events" },
    { label: "連絡事項", icon: Megaphone, href: "/announcements" },
  ];

  const otherRoutes = [
    { label: "生徒一覧", icon: Users, href: "/students" },
    { label: "座席表設定", icon: LayoutGrid, href: "/admin/seating" },
    { label: "設定", icon: Settings, href: "/admin" },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-0 w-64 h-screen border-r bg-white">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center shadow-md border border-slate-700/50">
              <Command className="w-4 h-4 text-white/90 stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight leading-tight">{campus?.name || "教室サポート"}</h2>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">日程・連絡・回収を一括</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {mainRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  pathname === route.href
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </div>

          <div>
            <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              設定
            </h3>
            <div className="space-y-1">
              {settingRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    pathname === route.href
                      ? "bg-indigo-50 text-indigo-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              その他
            </h3>
            <div className="space-y-1">
              {otherRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    pathname === route.href
                      ? "bg-indigo-50 text-indigo-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Help Section */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all",
              pathname === "/help"
                ? "text-indigo-600 bg-indigo-50"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <Zap className="w-4 h-4" />
            導入・運用ガイド
          </Link>
          <Link
            href="/training"
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all",
              pathname === "/training"
                ? "text-indigo-600 bg-indigo-50"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            完全版マニュアル
          </Link>
          <Link
            href="/help/extension"
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all",
              pathname === "/help/extension"
                ? "text-indigo-600 bg-indigo-50"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <Puzzle className="w-4 h-4" />
            Chrome拡張機能
          </Link>
          <a
            href="mailto:sutasaku.app@gmail.com?subject=教室運営サポートへのお問い合わせ"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            お問い合わせ
          </a>
        </div>
      </div>
    </aside>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // Enable keyboard shortcuts for navigation
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <main className="md:ml-64">
        <div className="pt-20 pb-24 md:pt-8 md:pb-8 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Floating QR Button (Desktop only - mobile has bottom nav) */}
      <div className="hidden md:block">
        <FloatingQRButton />
      </div>
    </div>
  );
}

// Re-export Sidebar for backward compatibility
export function Sidebar() {
  return <DesktopSidebar />;
}
