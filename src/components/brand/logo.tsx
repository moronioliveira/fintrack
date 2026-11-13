import Link from "next/link";

/**
 * Marca do FinTrack: um "F" formado por barras de livro-caixa, com um ponto
 * de destaque representando o saldo. Usa `currentColor` para seguir o tema.
 */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="4.5" height="18" rx="1.6" fill="currentColor" />
      <rect x="3" y="3" width="17" height="4.5" rx="1.6" fill="currentColor" />
      <rect x="3" y="10.5" width="10.5" height="4" rx="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="18" cy="12.5" r="2.25" fill="var(--logo-accent, #0d9488)" />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 text-fg ${className}`} aria-label="FinTrack, ir para a visão geral">
      <LogoMark className="size-6 text-primary" />
      <span className="text-[17px] tracking-tight">
        <span className="font-semibold">fin</span>
        <span className="font-normal text-muted">track</span>
      </span>
    </Link>
  );
}

export const SOLID_URL = "https://www.instagram.com/solidsolutionsdigital/";

/** Assinatura discreta: o FinTrack é um produto da Solid Solutions. */
export function MadeBySolid({ className = "" }: { className?: string }) {
  return (
    <a
      href={SOLID_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-fg ${className}`}
    >
      Um produto
      <span className="font-semibold tracking-wide text-fg">
        SOLID <span className="text-[#FF6B00]">SOLUTIONS</span>
      </span>
    </a>
  );
}
