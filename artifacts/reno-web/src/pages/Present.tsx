import { useParams, Link } from 'wouter';
import { Concept } from '@/lib/concepts';
import { ComparisonView } from '@/components/studio/ComparisonView';
import { DemoAfterVisual } from '@/components/studio/DemoAfterVisual';
import { PaletteStrip } from '@/components/studio/PaletteStrip';
import { ChangeSummary } from '@/components/studio/ChangeSummary';
import { Printer, Copy, Download, ChevronLeft } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { useToast } from '@/hooks/use-toast';

export function Present({ concepts }: { concepts: Concept[] }) {
  const { id } = useParams();
  const concept = concepts.find(c => c.id === id);
  const { toast } = useToast();

  if (!concept) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <h1 className="serif text-4xl">Concept not found</h1>
        <Link href="/projects" className="btn-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold">Back to Projects</Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const url = `${window.location.origin}${baseUrl}present/${concept.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Presentation link copied to clipboard.' });
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(concept, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `reno-concept-${concept.room.toLowerCase().replace(/\s+/g, '-')}-${concept.style.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDownloadImage = () => {
    if (!concept.afterImage) {
      toast({ title: 'No after image available', description: 'Generate a photoreal concept before downloading an image.' });
      return;
    }
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = concept.afterImage;
    downloadAnchorNode.download = `reno-after-${concept.room.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] pb-20 print:bg-white print:text-black">
      {/* Top Bar - Hidden in Print */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b hairline bg-[hsl(var(--background)/.9)] px-5 py-3 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${concept.id}`} className="flex items-center justify-center h-8 w-8 rounded-full border hairline hover:bg-[hsl(var(--secondary))] transition-colors" data-testid="button-back">
            <ChevronLeft size={16} />
          </Link>
          <div className="flex items-center gap-2.5">
             <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--primary))] text-[hsl(var(--primary))]"><span className="serif text-sm italic">r</span></span>
             <span className="serif text-base tracking-[-.02em]">reno</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink} className="flex h-8 items-center gap-2 rounded-md border hairline px-3 text-xs hover:bg-[hsl(var(--secondary))] transition-colors" data-testid="button-copy-link">
            <Copy size={13} /> <span className="hidden sm:inline">Copy link</span>
          </button>
          <button onClick={handleDownloadJson} className="flex h-8 items-center gap-2 rounded-md border hairline px-3 text-xs hover:bg-[hsl(var(--secondary))] transition-colors" data-testid="button-download-json">
            <Download size={13} /> <span className="hidden sm:inline">Data</span>
          </button>
          <button onClick={handleDownloadImage} disabled={!concept.afterImage} className="flex h-8 items-center gap-2 rounded-md border hairline px-3 text-xs hover:bg-[hsl(var(--secondary))] transition-colors disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-download-after">
            <Download size={13} /> <span className="hidden sm:inline">After image</span>
          </button>
          <button onClick={() => window.print()} className="btn-primary flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium" data-testid="button-print">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pt-12 md:px-10 md:pt-16 print:pt-4">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Pill accent>Concept Direction</Pill>
               <span className="text-xs font-mono uppercase tracking-widest text-[hsl(var(--primary))] print:text-black">{concept.render?.isDemo ? 'Demo preview' : 'Photoreal Gemini render'}</span>
            </div>
            <h1 className="serif text-5xl md:text-7xl leading-[0.9] italic print:text-black">{concept.title}</h1>
            <p className="mt-4 text-sm muted print:text-gray-600">
              {concept.room} · {concept.style} · {concept.scope}
            </p>
          </div>
          <div className="text-left md:text-right">
             <p className="text-sm font-medium">{concept.client}</p>
             <p className="text-xs muted mt-1 print:text-gray-500">{concept.date}</p>
          </div>
        </header>

        {/* Large Before/After */}
        <div className="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden rounded-2xl border hairline bg-[#776657] shadow-xl print:shadow-none print:break-inside-avoid">
           <ComparisonView beforeImage={concept.beforeImage} afterImage={concept.afterImage} afterComponent={concept.render?.isDemo ? <DemoAfterVisual concept={concept} /> : undefined} />
        </div>

        {/* Rationale & Palette */}
        <div className="mt-12 grid gap-10 md:grid-cols-[1.5fr_1fr] print:break-inside-avoid">
           <div>
              <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-4 print:text-black">Design Rationale</h3>
              <p className="serif text-2xl leading-relaxed print:text-black">"{concept.rationale}"</p>
           </div>
           <div>
              <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-4 print:text-black">Materials & Finish</h3>
              <PaletteStrip palette={concept.palette} />
           </div>
        </div>

        <div className="mt-12 border-t hairline pt-12 print:break-inside-avoid">
           <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-6 print:text-black">Proposed Changes</h3>
           <ChangeSummary summary={concept.summary} scope={concept.scope} />
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t hairline pt-8 text-center print:mt-12">
           <p className="text-xs text-[hsl(var(--muted-foreground))] print:text-gray-500">
             Concept preview for discussion. Final scope, dimensions, materials, and pricing require contractor verification.
           </p>
           <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
             <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[hsl(var(--foreground))] text-[hsl(var(--foreground))] print:border-black print:text-black"><span className="serif text-[10px] italic">r</span></span>
             <span className="serif text-xs tracking-[-.02em] print:text-black">reno interior studio</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
