import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const BACKEND = process.env.LANGGRAPH_API_URL?.replace(/\/$/, "") ?? "";
const { auth } = NextAuth(authConfig);

async function proxyToBackend(req: NextRequest): Promise<Response> {
  if (!BACKEND) {
    return NextResponse.json(
      { error: "LANGGRAPH_API_URL is not configured" },
      { status: 500 },
    );
  }
  const path = req.nextUrl.pathname.slice("/api/langgraph".length);
  let upstream: URL;
  try {
    upstream = new URL(`${BACKEND}${path}`);
  } catch {
    return NextResponse.json(
      { error: `LANGGRAPH_API_URL is not a valid absolute URL: "${BACKEND}" — must start with https://` },
      { status: 500 },
    );
  }
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  const fwdHeaders = new Headers();
  req.headers.forEach((v, k) => {
    if (k !== "host" && k !== "connection" && k !== "keep-alive") {
      fwdHeaders.set(k, v);
    }
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upstreamRes = await fetch(upstream.toString(), {
    method: req.method,
    headers: fwdHeaders,
    body: hasBody ? req.body : undefined,
    duplex: "half",
  } as any);

  // Strip Next.js-internal control headers — if x-middleware-rewrite reaches
  // Next.js's middleware processor with a non-absolute URL it throws
  // "TypeError: Invalid URL" inside Next.js internals (tp() in the server chunk).
  const STRIP_HEADERS = new Set([
    "content-encoding", "content-length",
    "x-middleware-rewrite", "x-middleware-next", "x-middleware-override-headers",
    "x-nextjs-rewrite", "x-nextjs-redirect",
  ]);
  const resHeaders = new Headers();
  upstreamRes.headers.forEach((v, k) => {
    if (!STRIP_HEADERS.has(k)) {
      resHeaders.set(k, v);
    }
  });

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/langgraph/")) {
    return proxyToBackend(req);
  }

  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = pathname.startsWith("/login");
  const isLandingPage = pathname === "/";
  const isPublicPage = isLoginPage || isLandingPage;

  if (!isPublicPage && !isLoggedIn) {
    const signInUrl = new URL("/login", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  if (isPublicPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/chat", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/api/langgraph/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
