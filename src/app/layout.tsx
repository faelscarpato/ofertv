import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "OferTV — Digital Signage & TV de Ofertas PWA",
  description: "Sistema de sinalização digital, mídia indoor e geração automatizada de cartazes promocionais para varejo e supermercados.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OferTV — Digital Signage & TV de Ofertas PWA",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "OferTV — Digital Signage & TV de Ofertas PWA",
    description: "Sistema de sinalização digital, mídia indoor e geração automatizada de cartazes promocionais para varejo e supermercados.",
    url: "https://ofertv.pages.dev",
    siteName: "OferTV — Digital Signage & TV de Ofertas PWA",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OferTV — Digital Signage & TV de Ofertas PWA",
      }
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OferTV — Digital Signage & TV de Ofertas PWA",
    description: "Sistema de sinalização digital, mídia indoor e geração automatizada de cartazes promocionais para varejo e supermercados.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
