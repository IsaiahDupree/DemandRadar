"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  { id: "summary", label: "Executive Summary" },
  { id: "market", label: "Market Snapshot" },
  { id: "pain", label: "Pain Map" },
  { id: "platform", label: "Platform Gap" },
  { id: "gaps", label: "Gap Opportunities" },
  { id: "economics", label: "Economics" },
  { id: "buildability", label: "Buildability" },
  { id: "ugc", label: "UGC Pack" },
  { id: "action", label: "Action Plan" },
];

interface ReportNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ReportNav({ activeSection, onSectionChange }: ReportNavProps) {
  return (
    <div className="border-b">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant="ghost"
            size="sm"
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "shrink-0 whitespace-nowrap",
              activeSection === section.id &&
                "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            )}
          >
            {section.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
