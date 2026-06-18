import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ListTodo, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { planTasks } from "@/lib/ai.functions";
import { Markdown } from "@/components/Markdown";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { addActivity } from "@/lib/activity";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Task = { name: string; dueDate: string; priority: Priority; durationHours: number };

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Planner — WorkMate AI" },
      { name: "description", content: "Prioritize tasks and build daily/weekly schedules with AI." },
    ],
  }),
  component: TasksPage,
});

const empty = (): Task => ({
  name: "",
  dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  priority: "Medium",
  durationHours: 1,
});

function TasksPage() {
  const plan = useServerFn(planTasks);
  const [tasks, setTasks] = useState<Task[]>([empty()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Task>) =>
    setTasks((t) => t.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => setTasks((t) => t.filter((_, idx) => idx !== i));

  const run = async () => {
    const valid = tasks.filter((t) => t.name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one task.");
      return;
    }
    setLoading(true);
    try {
      const r = await plan({ data: { tasks: valid } });
      setResult(r.markdown);
      addActivity({ module: "tasks", title: `${valid.length} tasks planned` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan tasks");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => result && (navigator.clipboard.writeText(result), toast.success("Copied"));
  const download = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `task-plan-${Date.now()}.md`;
    a.click();
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ListTodo className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">AI Task Planner & Scheduler</h1>
          <p className="text-sm text-muted-foreground">
            Add your tasks — get a prioritized plan, daily blocks, and a weekly schedule.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((t, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Task name</Label>
                    <Input
                      value={t.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="e.g. Finalize Q4 budget"
                    />
                  </div>
                  {tasks.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(i)}
                      className="mt-5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Due date</Label>
                    <Input
                      type="date"
                      value={t.dueDate}
                      onChange={(e) => update(i, { dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={t.priority}
                      onValueChange={(v) => update(i, { priority: v as Priority })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Duration (hrs)</Label>
                    <Input
                      type="number"
                      min={0.25}
                      step={0.25}
                      value={t.durationHours}
                      onChange={(e) =>
                        update(i, { durationHours: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setTasks((t) => [...t, empty()])} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add task
            </Button>
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Planning...</>
              ) : (
                "Generate plan"
              )}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your AI plan</CardTitle>
            {result && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={download}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
                <Button size="sm" variant="outline" onClick={run} disabled={loading}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-sm text-muted-foreground py-12 text-center">
                Add your tasks and we'll generate a prioritized plan with daily and weekly schedules.
              </div>
            ) : (
              <Markdown text={result} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
