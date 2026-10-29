import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Navigation } from "@/components/header/navigation";
import { TransactionsProvider } from "@/contexts/transactions-context";


export const metadata: Metadata = {
  title: "FinTrack",
  description: "Controle suas finanças pessoais com clareza",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen w-full">
        <TransactionsProvider>
          <Header />
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:px-8 lg:py-8">
            <aside className="shrink-0 lg:w-56">
              <Navigation />
            </aside>
            <main className="min-w-0 flex-1">
              {children}
            </main>
          </div>
        </TransactionsProvider>
      </body>
    </html>
  );
}
