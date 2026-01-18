import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import AuthProvider from "@/providers/AuthProvider";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={inter.className}
        suppressHydrationWarning
      >
        <AuthProvider session={session}>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
