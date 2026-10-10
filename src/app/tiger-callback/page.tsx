"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TigerCallbackInner() {
  const params = useSearchParams();

  useEffect(() => {
    const code  = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (window.opener) {
      window.opener.postMessage(
        { type: "tiger_oauth2_callback", code, state, error },
        window.location.origin,
      );
      window.close();
    }
  }, [params]);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", paddingTop: "80px" }}>
      <p>Connecting to Tiger Brokers…</p>
    </div>
  );
}

export default function TigerCallbackPage() {
  return (
    <Suspense>
      <TigerCallbackInner />
    </Suspense>
  );
}
