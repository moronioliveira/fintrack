import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa/pwa-register";

// Tipografia da Solid Solutions: Manrope (texto), Space Grotesk (títulos), IBM Plex Mono (rótulos).
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FinTrack", template: "%s · FinTrack" },
  description: "Gestão financeira para você e para sua empresa: contas, fluxo de caixa, contas a pagar e receber, orçamentos e relatórios.",
  applicationName: "FinTrack",
  creator: "Solid Solutions",
  publisher: "Solid Solutions",
  authors: [{ name: "Solid Solutions", url: "https://www.instagram.com/solidsolutionsdigital/" }],
  appleWebApp: { capable: true, title: "FinTrack", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
};

// Aplica o tema antes da pintura para evitar "flash" de tema incorreto.
const themeScript = `(function(){try{var t=localStorage.getItem('fintrack-theme');if(!t){t='dark'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${spaceGrotesk.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
        <PwaRegister />
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </body>
    </html>
  );
}
