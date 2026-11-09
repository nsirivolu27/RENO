import { ReactNode } from 'react';

export function Pill({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span className={`mono inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.1em] ${accent ? 'border-[hsl(var(--primary)/.45)] text-[hsl(var(--primary))]' : 'hairline text-[hsl(var(--muted-foreground))]'}`}>
      {children}
    </span>
  );
}