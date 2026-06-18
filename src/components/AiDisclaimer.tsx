import { Info } from "lucide-react";

export function AiDisclaimer() {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 border border-border rounded-md px-3 py-2">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>
        AI-generated outputs may contain inaccuracies. Please review before using in professional environments.
      </span>
    </div>
  );
}
