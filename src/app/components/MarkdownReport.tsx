"use client";

import { MarkdownContent } from "@/app/components/MarkdownContent";

export interface MarkdownReportProps {
  content: string;
}

export function MarkdownReport({ content }: MarkdownReportProps) {
  return <MarkdownContent content={content} />;
}
