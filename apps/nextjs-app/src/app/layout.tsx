import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getRuntimeEnv } from "@obs-playground/env";
import "./globals.css";

// Force all pages to be dynamically rendered at runtime
// This ensures GraphQL/API requests happen during runtime for proper tracing
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Enable distributed tracing for App Router on Next.js 14+
// This connects client-side traces with server-side OTEL traces
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Obs Playground",
    description: "A playground for experimenting with observability and instrumentation",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeEnv = getRuntimeEnv();

  return (
    <html lang="en">
      <head>
        <script
          // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml -- runtime env injection requires raw script content
          dangerouslySetInnerHTML={{
            __html: `window.__ENV=${JSON.stringify(runtimeEnv)}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
