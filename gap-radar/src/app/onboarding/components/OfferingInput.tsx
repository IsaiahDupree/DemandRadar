"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface OfferingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function OfferingInput({ value, onChange, onSubmit }: OfferingInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="offering">What do you sell?</Label>
      <Textarea
        id="offering"
        placeholder="Examples:
• BlankLogo - AI-powered logo design tool for startups
• Email newsletter course teaching founders how to grow their list
• Mobile car audio installation service in Los Angeles"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={6}
        className="resize-none"
      />
      <p className="text-sm text-muted-foreground">
        Be as specific as you'd like. Include your target audience, key features, or differentiators.
      </p>

      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h4 className="text-sm font-semibold">Good Examples:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• "Canva for podcast cover art"</li>
          <li>• "Project management tool for creative agencies"</li>
          <li>• "Online course teaching React to beginners"</li>
          <li>• "Dog training service in Austin, Texas"</li>
        </ul>
      </div>
    </div>
  );
}
