import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, FileText, ListTodo, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { getActivities, getCounts, type Activity } from "@/lib/activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkMate AI — Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "AI-powered assistant for emails, meeting summaries, task planning, and workplace productivity.",
      },
      { property: "og:title", content: "WorkMate AI — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Automate emails, summarize meetings, plan tasks, and chat with an AI productivity coach.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  {
    to: "/email" as const,
    title: "Smart Email Generator",
    desc: "Draft polished emails in seconds.",
    icon: Mail,
    color: "bg-primary/10 text-primary",
  },
  {
    to: "/meetings" as const,
    title: "Meeting Summarizer",
    desc: "Turn notes into decisions & actions.",
    icon: FileText,
    color: "bg-accent/15 text-accent",
  },
  {
    to: "/tasks" as const,
    title: "Task Planner",
    desc: "Prioritize and schedule your week.",
    icon: ListTodo,
    color: "bg-primary/10 text-primary",
  },
  {
    to: "/chat" as const,
    title: "AI Assistant",
    desc: "Ask anything about your workday.",
    icon: MessageSquare,
    color: "bg-accent/15 text-accent",
  },
];

function Dashboard() {
  const [counts, setCounts] = useState({ total: 0, email: 0, meetings: 0, tasks: 0, chat: 0 });
  const [recent, setRecent] = useState<Activity[]>([]);

  useEffect(() => {
    setCounts(getCounts());
    setRecent(getActivities().slice(0, 5));
  }, []);

  const score = Math.min(100, 40 + counts.total * 6);

  return (
    <AppShell>
      <section className="mb-8">
        <div className="rounded-2xl p-6 md:p-8 text-primary-foreground shadow-elegant"
          style={{ background: "var(--gradient-primary)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> AI Skill Accelerator Project
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold">Welcome back to WorkMate AI</h1>
          <p className="mt-2 max-w-2xl text-sm md:text-base opacity-90">
            Your AI co-pilot for emails, meetings, planning, and everyday workplace decisions —
            built to give you back your time.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Productivity score" value={`${score}`} suffix="/100" icon={TrendingUp} />
        <StatCard label="Emails drafted" value={counts.email} icon={Mail} />
        <StatCard label="Meetings summarized" value={counts.meetings} icon={FileText} />
        <StatCard label="Task plans created" value={counts.tasks} icon={ListTodo} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK.map(({ to, title, desc, icon: Icon, color }) => (
            <Link key={to} to={to} className="group">
              <Card className="h-full transition-all hover:shadow-elegant hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
        <Card>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No activity yet — start with the Email Generator or Task Planner.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((a) => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="inline-block text-xs uppercase tracking-wide text-primary mr-2">
                        {a.module}
                      </span>
                      {a.title}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">
          {value}
          {suffix && <span className="text-base text-muted-foreground ml-0.5">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
