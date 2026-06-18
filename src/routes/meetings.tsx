import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Loader2, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { summarizeMeeting } from "@/lib/ai.functions";
import { Markdown } from "@/components/Markdown";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { addActivity } from "@/lib/activity";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — WorkMate AI" },
      { name: "description", content: "Turn meeting notes into summaries, decisions, and action items." },
    ],
  }),
  component: MeetingsPage,
});

const SAMPLE = `Q3 Planning Sync - Aug 12
- Alex presented revenue update: $1.2M, 8% above target.
- Marketing requested $40k extra for paid social. Decision: approved by Priya, effective Sep 1.
- Risk flagged: vendor delays could push product launch by 2 weeks.
- Action: Sam to finalize launch timeline by Aug 20.
- Action: Jordan to draft customer comms by Aug 25.
- Next meeting: Aug 26.`;

function MeetingsPage() {
  const summarize = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    if (notes.trim().length < 10) {
      toast.error("Please paste meeting notes (at least a few sentences).");
      return;
    }
    setLoading(true);
    try {
      const r = await summarize({ data: { notes } });
      setResult(r.markdown);
      addActivity({ module: "meetings", title: notes.split("\n")[0].slice(0, 60) || "Meeting summary" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Copied summary");
  };
  const download = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-summary-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Meeting Notes Summarizer</h1>
          <p className="text-sm text-muted-foreground">
            Paste raw notes or a transcript — get a structured executive summary.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meeting notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setNotes(SAMPLE)}>
              Load sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={16}
              placeholder="Paste your meeting notes or transcript here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Summarizing...</>
              ) : (
                "Summarize meeting"
              )}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Summary</CardTitle>
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
                Your structured meeting summary will appear here.
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
