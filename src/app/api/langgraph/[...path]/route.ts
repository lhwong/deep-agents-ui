import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // support long-running SSE streams

const BACKEND = process.env.LANGGRAPH_API_URL?.replace(/\/$/, "") ?? "";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!BACKEND) {
    return NextResponse.json(
      { error: "LANGGRAPH_API_URL is not configured on the server" },
      { status: 500 },
    );
  }

  const { path } = await params;
  let upstream: URL;
  try {
    upstream = new URL(`${BACKEND}/${path.join("/")}`);
  } catch {
    return NextResponse.json(
      { error: `LANGGRAPH_API_URL is not a valid absolute URL: "${BACKEND}" — must start with https://` },
      { status: 500 },
    );
  }
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    // Drop hop-by-hop headers that must not be forwarded
    if (k !== "host" && k !== "connection" && k !== "keep-alive") {
      headers.set(k, v);
    }
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upstreamRes = await fetch(upstream.toString(), {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    duplex: "half",
  } as any);

  const resHeaders = new Headers(upstreamRes.headers);
  // Avoid double-decompression when Next.js re-encodes the body
  resHeaders.delete("content-encoding");
  // Let the browser handle content-length based on actual body
  resHeaders.delete("content-length");
  // Strip Next.js-internal control headers the backend may accidentally echo back.
  // If x-middleware-rewrite reaches Next.js's route processor with a non-absolute
  // URL it throws "TypeError: Invalid URL" inside tp() (Next.js internals).
  resHeaders.delete("x-middleware-rewrite");
  resHeaders.delete("x-middleware-next");
  resHeaders.delete("x-middleware-override-headers");
  resHeaders.delete("x-nextjs-rewrite");
  resHeaders.delete("x-nextjs-redirect");

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const DELETE = proxy;
export const PATCH  = proxy;
