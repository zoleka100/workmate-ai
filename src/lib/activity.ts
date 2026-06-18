// Tracks recent activity across modules in localStorage.
export type Activity = {
  id: string;
  module: "email" | "meetings" | "tasks" | "chat";
  title: string;
  timestamp: number;
};

const KEY = "workmate-activities";

export function getActivities(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addActivity(a: Omit<Activity, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const list = getActivities();
  list.unshift({ ...a, id: crypto.randomUUID(), timestamp: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}

export function getCounts() {
  const list = getActivities();
  return {
    total: list.length,
    email: list.filter((a) => a.module === "email").length,
    meetings: list.filter((a) => a.module === "meetings").length,
    tasks: list.filter((a) => a.module === "tasks").length,
    chat: list.filter((a) => a.module === "chat").length,
  };
}
