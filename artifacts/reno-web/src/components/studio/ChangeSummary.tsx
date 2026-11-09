import { ConceptSummary } from '@/lib/concepts';
import { Sofa, Lightbulb, PaintRoller, Box, Wrench, Lock } from 'lucide-react';

export function ChangeSummary({ summary, scope }: { summary: ConceptSummary; scope: string }) {
  const items = [
    { key: 'furniture', label: 'Furniture & Layout', icon: Sofa, text: summary.furniture },
    { key: 'lighting', label: 'Lighting', icon: Lightbulb, text: summary.lighting },
    { key: 'walls', label: 'Walls & Paint', icon: PaintRoller, text: summary.walls },
    { key: 'flooring', label: 'Flooring', icon: Box, text: summary.flooring },
    { key: 'fixtures', label: 'Fixtures', icon: Wrench, text: summary.fixtures },
    { key: 'keep', label: 'Kept Unchanged', icon: Lock, text: summary.keep },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-6">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="bg-[hsl(var(--card))] border hairline rounded-xl p-4 transition-all hover:border-[hsl(var(--primary)/.4)]">
            <div className="flex items-center gap-2 text-[hsl(var(--primary))] mb-2">
              <Icon size={16} />
              <h4 className="text-xs font-semibold uppercase tracking-wider">{item.label}</h4>
            </div>
            <p className="text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}