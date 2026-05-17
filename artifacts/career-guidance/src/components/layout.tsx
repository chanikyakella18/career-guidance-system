import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Brain, Compass, CheckSquare, LineChart, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
    { href: "/predictions", label: "Predictions", icon: Brain },
    { href: "/career-suggestions", label: "Career Suggestions", icon: Compass },
    { href: "/eligibility", label: "Eligibility", icon: CheckSquare },
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/models", label: "ML Models", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            Nexus AI
          </h1>
        </div>
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
