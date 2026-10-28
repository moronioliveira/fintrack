import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Navigation } from "@/components/header/navigation";


export const metadata: Metadata = {
  title: "FinTrack",
  description: "Seu app de finanças pessoais",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen flex flex-col w-full bg-[#121212] text-white">
        
        {/* Contêiner mestre que centraliza e limita a largura de TUDO na tela uniformemente */}
        <div className="w-full max-w-7xl mx-auto px-4">
          
          {/* O Header agora vai herdar o alinhamento exato das bordas */}
          <Header />
          
          {/* Estrutura inferior lado a lado */}
          <div className="flex w-full mt-8 gap-10 items-start">
            
            {/* Menu com tamanho fixo ideal */}
            <aside className="min-w-60 shrink-0">
              <Navigation />
            </aside>

            {/* Conteúdo do dashboard esticando até colar na ponta direita do Header */}
            <main className="flex-1">
              {children}
            </main>

          </div>
        </div>

      </body>
    </html>
  );
}
