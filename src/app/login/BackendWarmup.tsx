"use client";

import { useEffect } from "react";

export function BackendWarmup() {
  useEffect(() => {
    fetch("/api/warmup").catch(() => {});
  }, []);
  return null;
}
