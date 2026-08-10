import { useParams, useLocation, Link } from 'wouter';
import { ChevronLeft, ExternalLink, Download, Send } from 'lucide-react';
import { Concept } from '@/lib/concepts';
import { Pill } from '@/components/ui/pill';

export function ConceptDetail({ concepts }: { concepts: Concept[] }) {
  const { id } = useParams(); 
  const concept = concepts.find(c => c.id === id) || concepts[0]; 
  const [, setLocation] = useLocation();

  if (!concept) return null;
  const bgStyle = concept.beforeImage ? { backgroundImage: `url(${concept.beforeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};

  return <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-12">
    <button onClick={() => setLocation('/projects')} className="mb-8 flex items-center gap-2 text-xs muted hover:text-[hsl(var(--primary))] transition-colors" data-testid="button-back-projects"><ChevronLeft size={15} />All projects</button>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_360px]">
      <div>
        <div className="relative aspect-[1.3/1] overflow-hidden rounded-2xl border hairline bg-[#776657]">
          <div className={concept.image ? `room-image ${concept.image} absolute inset-0` : "absolute inset-0"} style={bgStyle} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <div className="absolute left-5 top-5"><Pill accent>client presentation · {concept.id}</Pill></div>
          <div className="absolute bottom-6 left-6 text-white drop-shadow-md">
            <p className="mono text-[10px] uppercase tracking-[.12em] text-[#e1bf8e]">After / concept direction</p>
            <h1 className="serif mt-2 text-4xl sm:text-5xl italic">{concept.title}</h1>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {concept.palette.map((swatch, i) => (
             <div key={i} className="flex items-center gap-2 bg-[hsl(var(--card))] border hairline px-3 py-2 rounded-xl pr-4">
               <div className="w-6 h-6 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: swatch.color }} />
               <span className="text-xs text-[hsl(var(--muted-foreground))]">{swatch.name}</span>
             </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
           {Object.entries(concept.summary).map(([key, value]) => (
             <div key={key} className="bg-[hsl(var(--card))] border hairline rounded-xl p-5">
                <h4 className="text-[10px] text-[hsl(var(--primary))] font-mono uppercase tracking-widest mb-3">{key}</h4>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{value}</p>
             </div>
           ))}
        </div>
      </div>
      <aside>
        <div className="border-b hairline pb-6">
          <Pill>{concept.room}</Pill>
          <h2 className="serif mt-4 text-4xl leading-none">{concept.title}</h2>
          <p className="mt-3 text-sm muted">{concept.client} · {concept.date}</p>
        </div>
        <dl className="space-y-0 py-3">
          {[
            ['Direction',concept.style],
            ['Budget guide',concept.budget],
            ['Scope',concept.scope],
            ['Status','Ready to share']
          ].map(([term,val]) => (
            <div key={term} className="flex justify-between border-b hairline py-4 text-sm">
              <dt className="muted">{term}</dt>
              <dd className="font-medium">{val}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 rounded-xl border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.07)] p-5">
          <p className="mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--primary))]">Designer’s note</p>
          <p className="serif mt-3 text-xl leading-snug">{concept.rationale}</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Link href={`/present/${concept.id}`} className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold" data-testid="button-present-proposal"><ExternalLink size={14} /> Open Presentation</Link>
          <button onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(concept, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = `reno-concept-${concept.room.toLowerCase().replace(/\s+/g, '-')}.json`;
            a.click();
          }} className="btn-ghost flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:text-[hsl(var(--primary))]" data-testid="button-download-json"><Download size={15} /></button>
          <button onClick={() => {
             const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
             navigator.clipboard.writeText(`${window.location.origin}${baseUrl}present/${concept.id}`);
             alert('Link copied to clipboard!');
          }} className="btn-ghost flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:text-[hsl(var(--primary))]" data-testid="button-share-proposal"><Send size={15} /></button>
        </div>
      </aside>
    </div>
  </div>;
}