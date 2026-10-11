"use client";

import { useEffect } from "react";

export function ErrorLogger() {
  useEffect(() => {
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}\n${reason.stack ?? ""}`
          : String(reason);
      console.error("[unhandledrejection]", msg, reason);
    };

    const onError = (e: ErrorEvent) => {
      console.error(
        `[window.onerror] ${e.message} (${e.filename}:${e.lineno}:${e.colno})`,
        e.error,
      );
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
