import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, RefreshCw, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { generateEmail } from "@/lib/ai.functions";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { addActivity } from "@/lib/activity";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — WorkMate AI" },
      { name: "description", content: "Generate polished, professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState<"Client" | "Manager" | "Team Member">("Client");
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Persuasive" | "Professional">(
    "Professional",
  );
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; email: string; cta: string } | null>(null);

  const run = async () => {
    if (!purpose.trim() || !details.trim()) {
      toast.error("Please fill in purpose and key points.");
      return;
    }
    setLoading(true);
    try {
      const r = await gen({ data: { purpose, recipient, tone, details } });
      setResult(r);
      addActivity({ module: "email", title: r.subject || purpose });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const txt = `Subject: ${result.subject}\n\n${result.email}\n\nSuggested CTA: ${result.cta}`;
    navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard");
  };

  const download = () => {
    if (!result) return;
    const txt = `Subject: ${result.subject}\n\n${result.email}\n\nSuggested CTA: ${result.cta}`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        subtitle="Generate clear, professional emails in seconds."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="purpose">Email purpose</Label>
              <Input
                id="purpose"
                placeholder="e.g. Follow up on Q3 proposal"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recipient</Label>
                <Select value={recipient} onValueChange={(v) => setRecipient(v as typeof recipient)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Team Member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Persuasive">Persuasive</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="details">Key points</Label>
              <Textarea
                id="details"
                rows={6}
                placeholder="Bullet points or notes to include..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                "Generate email"
              )}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated email</CardTitle>
            {result && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyAll}>
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
                Fill in the form and your AI-drafted email will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Subject
                  </div>
                  <div className="font-medium">{result.subject}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Email
                  </div>
                  <Textarea
                    value={result.email}
                    onChange={(e) => setResult({ ...result, email: e.target.value })}
                    rows={14}
                    className="font-sans"
                  />
                </div>
                <div className="rounded-md bg-accent/10 border border-accent/30 p-3">
                  <div className="text-xs font-medium text-accent uppercase mb-1">
                    Suggested CTA
                  </div>
                  <div className="text-sm">{result.cta}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
