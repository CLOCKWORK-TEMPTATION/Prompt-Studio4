import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, BookOpen, History, Settings, Sparkles, ArrowLeftRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "المحرر", icon: LayoutDashboard, href: "/studio" },
  { label: "القوالب", icon: Library, href: "/templates" },
  { label: "التقنيات", icon: BookOpen, href: "/techniques" },
  { label: "مقارنة A/B", icon: ArrowLeftRight, href: "/compare" },
  { label: "التحليلات", icon: BarChart3, href: "/analytics" },
  { label: "السجلات", icon: History, href: "/runs" },
  { label: "الإعدادات", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-l bg-sidebar h-screen flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-sidebar-foreground">Prompt Studio</h1>
          <p className="text-xs text-muted-foreground">الإصدار 1.0</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium text-sidebar-foreground mb-1">حالة النظام</p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span>متصل بالخادم</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
