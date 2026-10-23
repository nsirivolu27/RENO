import { useParams, Link } from 'wouter';
import { Project } from '@/lib/projects';
import { Concept } from '@/lib/concepts';
import { generateEstimate, formatCurrency } from '@/lib/estimates';
import { Printer, Copy, Download, ChevronLeft, Calendar, Target, PiggyBank, PenTool } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { useToast } from '@/hooks/use-toast';
import { ComparisonView } from '@/components/studio/ComparisonView';
import { DemoAfterVisual } from '@/components/studio/DemoAfterVisual';
import { PaletteStrip } from '@/components/studio/PaletteStrip';
import { ChangeSummary } from '@/components/studio/ChangeSummary';

export function Proposal({ projects, concepts }: { projects: Project[], concepts: Concept[] }) {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  const { toast } = useToast();

  if (!project) return <div className="p-20 text-center"><h1 className="text-3xl">Project not found</h1></div>;

  const projectConcepts = concepts.filter(c => project.conceptIds.includes(c.id));
  const sortedConcepts = [...projectConcepts.filter(c => c.favorite), ...projectConcepts.filter(c => !c.favorite)];

  const handleCopyLink = () => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const url = `${window.location.origin}${baseUrl}proposal/${project.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Proposal link copied to clipboard.' });
  };

  const handleDownloadJson = () => {
    const payload = { project, concepts: projectConcepts };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `reno-proposal-${project.projectName.replace(/\s+/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] pb-32 print:bg-white print:text-black">
      {/* Top Bar - Hidden in Print */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b hairline bg-[hsl(var(--background)/.9)] px-5 py-3 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${project.id}`} className="flex items-center justify-center h-8 w-8 rounded-full border hairline hover:bg-[hsl(var(--secondary))] transition-colors" data-testid="button-back">
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
          <button onClick={() => window.print()} className="btn-primary flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium" data-testid="button-print">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pt-12 md:px-10 md:pt-20 print:pt-0">
        {/* Cover Page */}
        <div className="print:h-[90vh] print:flex print:flex-col print:justify-center">
           <div className="flex items-center gap-3 mb-6">
             <Pill accent>Project Proposal</Pill>
           </div>
           <h1 className="serif text-6xl md:text-8xl leading-[0.9] italic print:text-black mb-8">{project.projectName}</h1>
           
           <div className="grid sm:grid-cols-2 gap-8 border-t hairline pt-8 mt-8 print:border-gray-200">
             <div>
                <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-4 print:text-black">Client & Property</h3>
                <p className="text-xl font-medium">{project.clientName}</p>
                {project.propertyAddress && <p className="text-sm muted mt-1">{project.propertyAddress}</p>}
                <p className="text-sm muted mt-1">Prepared on {new Date().toLocaleDateString()}</p>
             </div>
             <div>
                <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-4 print:text-black">Project Brief</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm"><Target size={16} className="text-[hsl(var(--primary))] shrink-0 mt-0.5" /> <span className="leading-relaxed">{project.goals || 'No specific goals provided.'}</span></li>
                  <li className="flex items-start gap-3 text-sm"><PenTool size={16} className="text-[hsl(var(--primary))] shrink-0 mt-0.5" /> <span className="leading-relaxed">Keep: {project.mustKeep || 'Standard constraints.'}</span></li>
                  <li className="flex items-center gap-3 text-sm"><PiggyBank size={16} className="text-[hsl(var(--primary))] shrink-0" /> <span>Budget: {project.budgetRange || 'TBD'}</span></li>
                  <li className="flex items-center gap-3 text-sm"><Calendar size={16} className="text-[hsl(var(--primary))] shrink-0" /> <span>Timeline: {project.timeline || 'TBD'}</span></li>
                </ul>
             </div>
           </div>
        </div>

        {/* Concepts Loop */}
        {sortedConcepts.map((concept, idx) => {
          const estimate = generateEstimate(concept);
          return (
            <div key={concept.id} className="mt-32 pt-20 border-t hairline print:mt-0 print:pt-8 print:border-none print:break-before-page">
              <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Pill accent>Concept {idx + 1}</Pill>
                    {concept.favorite && <span className="bg-[#ecbf7d] text-black px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md">Favorite</span>}
                  </div>
                  <h2 className="serif text-5xl md:text-6xl leading-[0.9] italic print:text-black">{concept.title}</h2>
                  <p className="mt-4 text-sm muted print:text-gray-600">{concept.room} · {concept.style} · {concept.scope}</p>
                </div>
              </div>

              <div className="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden rounded-2xl border hairline shadow-xl print:shadow-none print:break-inside-avoid">
                  <ComparisonView beforeImage={concept.beforeImage} afterImage={concept.afterImage} afterComponent={concept.render?.isDemo ? <DemoAfterVisual concept={concept} /> : undefined} />
              </div>

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

              <div className="mt-12 pt-12 border-t hairline print:break-inside-avoid">
                 <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-6 print:text-black">Proposed Changes</h3>
                 <ChangeSummary summary={concept.summary} scope={concept.scope} />
              </div>

              {/* Estimate Preview */}
              <div className="mt-12 pt-12 border-t hairline print:break-inside-avoid">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
                   <div>
                     <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-2 print:text-black">Early Planning Estimate</h3>
                     <h4 className="serif text-4xl leading-none">{formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}</h4>
                   </div>
                   <p className="text-xs text-[hsl(var(--accent))] max-w-[200px] leading-relaxed bg-[hsl(var(--accent)/0.1)] p-3 rounded-lg border border-[hsl(var(--accent)/0.2)]">
                     Final pricing requires contractor verification.
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {[
                     { label: 'Furniture & Decor', range: estimate.categories.furniture },
                     { label: 'Lighting', range: estimate.categories.lighting },
                     { label: 'Flooring', range: estimate.categories.flooring, skipRestyle: true },
                     { label: 'Wall Treatments', range: estimate.categories.walls },
                     { label: 'Fixtures & Built-ins', range: estimate.categories.fixtures, skipRestyle: true },
                     { label: 'Labor & Installation', range: estimate.categories.labor },
                   ].map(cat => (
                     <div key={cat.label} className="bg-[hsl(var(--card))] border hairline p-4 rounded-xl print:border-gray-200 print:bg-white print:shadow-sm">
                       <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 print:text-gray-500">{cat.label}</p>
                       {(estimate.isRestyle && cat.skipRestyle) ? (
                         <p className="text-sm font-medium opacity-50 italic">Kept existing</p>
                       ) : (
                         <p className="text-sm font-medium">{formatCurrency(cat.range[0])} - {formatCurrency(cat.range[1])}</p>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <footer className="mt-32 border-t hairline pt-12 text-center print:mt-12 print:break-inside-avoid">
           <div className="max-w-2xl mx-auto space-y-4">
             <p className="text-sm font-medium print:text-black">Next Steps</p>
             <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed print:text-gray-500">
               This proposal represents a conceptual design direction. Upon approval, we will proceed to detailed space planning, material sourcing, and formal contractor bidding. All estimates shown are preliminary placeholders meant to guide the budget conversation.
             </p>
           </div>
           <div className="mt-12 flex items-center justify-center gap-2 opacity-50">
             <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--foreground))] text-[hsl(var(--foreground))] print:border-black print:text-black"><span className="serif text-[12px] italic">r</span></span>
             <span className="serif text-sm tracking-[-.02em] print:text-black">reno interior studio</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
