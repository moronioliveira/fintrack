import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

// Aplica o tema antes da pintura para evitar "flash" de tema incorreto.
const themeScript = `(function(){try{var t=localStorage.getItem('fintrack-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
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
