import { PaletteSwatch } from '@/lib/concepts';

export function PaletteStrip({ palette }: { palette: PaletteSwatch[] }) {
  if (!palette || palette.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3 mt-5">
      {palette.map((swatch, i) => (
        <div key={i} className="flex items-center gap-2 bg-[hsl(var(--card))] border hairline px-2 py-1.5 rounded-full pr-3">
          <div 
            className="w-5 h-5 rounded-full border border-white/10 shadow-inner" 
            style={{ backgroundColor: swatch.color }} 
          />
          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{swatch.name}</span>
        </div>
      ))}
    </div>
  );
}