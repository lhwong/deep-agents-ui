"use client";

import { useState } from "react";
import { MarkdownContent } from "@/app/components/MarkdownContent";

export interface MarkdownReportProps {
  content: string;
  full_content?: string;
}

export function MarkdownReport({ content, full_content }: MarkdownReportProps) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div>
      <MarkdownContent content={showFull && full_content ? full_content : content} />
      {full_content && (
        <button
          onClick={() => setShowFull((v) => !v)}
          style={{
            marginTop: "6px",
            fontSize: "0.75rem",
            color: "var(--color-muted-foreground, #888)",
            background: "none",
            border: "1px solid currentColor",
            borderRadius: "4px",
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          {showFull ? "Hide EOD events" : "Show EOD events"}
        </button>
      )}
    </div>
  );
}
