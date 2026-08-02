import { NextResponse } from "next/server";

const BACKEND = process.env.LANGGRAPH_API_URL?.replace(/\/$/, "") ?? "";

export async function GET() {
  if (!BACKEND) {
    return NextResponse.json({ ok: false, error: "LANGGRAPH_API_URL not set" }, { status: 200 });
  }
  try {
    const res = await fetch(`${BACKEND}/ok`, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
