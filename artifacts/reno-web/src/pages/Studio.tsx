import { useState, useRef, ChangeEvent } from 'react';
import { ImagePlus, MoreHorizontal, Check, WandSparkles, Bookmark, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { Concept, ConceptBrief, generateDemoConcept, STYLE_OPTIONS, StyleOption, saveConceptLocally } from '@/lib/concepts';
import { ComparisonView } from '@/components/studio/ComparisonView';
import { DemoAfterVisual } from '@/components/studio/DemoAfterVisual';
import { PaletteStrip } from '@/components/studio/PaletteStrip';
import { ChangeSummary } from '@/components/studio/ChangeSummary';
import { Pill } from '@/components/ui/pill';
import { useToast } from '@/hooks/use-toast';

export function Studio() {
  const [room, setRoom] = useState('Living room');
  const [style, setStyle] = useState<StyleOption>('Warm minimal');
  const [mode, setMode] = useState<'Restyle' | 'Renovate'>('Restyle');
  
  const [beforeImage, setBeforeImage] = useState<string>('https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brief, setBrief] = useState<Partial<ConceptBrief>>({});
  
  const [generating, setGenerating] = useState(false);
  const [concept, setConcept] = useState<Concept | null>(null);
  
  const [view, setView] = useState<'compare' | 'before' | 'after'>('compare');
  const [presentation, setPresentation] = useState(false);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setBeforeImage(dataUrl);
        setConcept(null);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      const result = generateDemoConcept({ style, scope: mode, brief });
      const newConcept: Concept = {
        id: `c-${Math.floor(Math.random()*10000)}`,
        title: `${style} ${room}`,
        client: 'Demo Client',
        room,
        style,
        scope: mode,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: Date.now(),
        favorite: false,
        budget: brief.budget || 'TBD',
        beforeImage,
        brief: brief as ConceptBrief,
        summary: result.summary,
        palette: result.palette,
        rationale: result.rationale
      };
      setConcept(newConcept);
      setGenerating(false);
      setView('compare');
    }, 1200);
  };

  const save = () => {
    if (concept) {
      saveConceptLocally(concept);
      toast({ title: 'Concept saved', description: 'Available in your Projects.' });
      setLocation('/projects');
    }
  };

  const present = () => {
    if (concept) {
      saveConceptLocally(concept);
      setLocation(`/present/${concept.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--primary))]">studio / new concept</div>
          <h1 className="serif mt-2 text-5xl tracking-[-.04em] md:text-6xl">Give the room a direction.</h1>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Start with a photograph, then make the brief unmistakably yours.</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill>{concept ? 'concept ready' : 'draft brief'}</Pill>
          <span className={`h-2 w-2 rounded-full ${concept ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary))]'}`} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
        {/* Left Side - Result Panel */}
        <section className="order-2 lg:order-1 flex flex-col gap-8">
          <div className="relative aspect-[4/3] sm:min-h-[500px] overflow-hidden rounded-2xl border hairline bg-[#776657] shadow-xl">
            {concept ? (
              <>
                {view === 'compare' && <ComparisonView beforeImage={concept.beforeImage} afterComponent={<DemoAfterVisual concept={concept} />} />}
                {view === 'before' && <img src={concept.beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" />}
                {view === 'after' && <div className="absolute inset-0"><DemoAfterVisual concept={concept} /></div>}
                
                <div className="absolute bottom-4 left-4 flex gap-1 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-md z-10">
                  {(['compare', 'before', 'after'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} data-testid={`button-view-${v}`} className={`rounded-full px-3 py-1.5 text-xs capitalize transition-colors ${view === v ? 'bg-[#f0e8da] text-[#2d241d] font-medium' : 'text-white hover:bg-white/20'}`}>{v}</button>
                  ))}
                </div>
                
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                   <button onClick={present} className="flex h-9 px-4 items-center gap-2 justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md text-xs hover:bg-white/20 transition-colors" data-testid="button-present"><ExternalLink size={14}/> Present</button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0">
                <img src={beforeImage} alt="Before upload" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                  <div className="text-center p-6">
                    <WandSparkles className="mx-auto mb-4 text-white" size={32} />
                    <p className="serif text-3xl text-white">Your next chapter is waiting</p>
                    <p className="mt-3 text-sm text-white/80 max-w-sm mx-auto">Upload a room, define your style, and generate a visual direction.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute left-4 top-4 z-10">
              <Pill accent>{view === 'compare' ? 'before / after' : view}</Pill>
            </div>
          </div>

          {concept && (
            <div className="fade-up">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start border-b hairline pb-6">
                <div>
                  <h2 className="serif text-3xl">Proposed Concept</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Scope: {concept.scope} · Style: {concept.style}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={save} className="btn-primary text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium" data-testid="button-save-concept"><Bookmark size={14}/> Save to projects</button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-3">Design Rationale</h3>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{concept.rationale}</p>
              </div>
              <PaletteStrip palette={concept.palette} />
              <ChangeSummary summary={concept.summary} scope={concept.scope} />
            </div>
          )}
        </section>

        {/* Right Side - Form */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border hairline bg-[hsl(var(--card))] p-5 shadow-sm sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">The canvas</h2>
              <button className="muted" data-testid="button-brief-menu"><MoreHorizontal size={18} /></button>
            </div>
            
            <div className="mt-6">
              <label className="mono text-[10px] uppercase tracking-[.1em] muted">Room photograph</label>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 mobile-scroll">
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                 <button onClick={() => fileInputRef.current?.click()} className="flex h-16 min-w-[82px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed hairline text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] transition-colors" data-testid="button-upload-room">
                   <ImagePlus size={17} />
                   <span className="text-[10px]">Upload</span>
                 </button>
                 <div className="relative h-16 min-w-[82px] overflow-hidden rounded-lg border border-[hsl(var(--primary))]">
                    <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover" alt="Selected room" />
                 </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <label className="mono text-[10px] uppercase tracking-[.1em] muted">Room type</label>
                <select className="input-dark mt-2 w-full rounded-lg px-3 py-2.5 text-sm" value={room} onChange={e => setRoom(e.target.value)} data-testid="select-room-type">
                  <option>Living room</option><option>Kitchen</option><option>Bedroom</option><option>Sunroom</option><option>Bathroom</option>
                </select>
              </div>
              <div>
                <label className="mono text-[10px] uppercase tracking-[.1em] muted">Style</label>
                <select className="input-dark mt-2 w-full rounded-lg px-3 py-2.5 text-sm" value={style} onChange={e => setStyle(e.target.value as StyleOption)} data-testid="select-style">
                  {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="mono text-[10px] uppercase tracking-[.1em] mb-2 block muted">Renovation scope</label>
              <div className="flex rounded-lg border hairline p-1 bg-black/10">
                {(['Restyle', 'Renovate'] as const).map(item => (
                  <button key={item} onClick={() => setMode(item)} data-testid={`button-mode-${item.toLowerCase()}`} className={`flex-1 rounded-md py-1.5 text-xs transition-colors font-medium ${mode === item ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm' : 'muted hover:text-[hsl(var(--foreground))]'}`}>{item}</button>
                ))}
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2.5 leading-relaxed bg-[hsl(var(--secondary)/.3)] p-2 rounded-md">
                {mode === 'Restyle' ? 'Updates furniture, decor, lighting, and art. Keeps walls, flooring, and fixtures unchanged.' : 'Full update including flooring, walls, fixtures, cabinetry, and furniture.'}
              </p>
            </div>

            <div className="my-6 border-t hairline" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Designer brief</h3>
                <p className="mt-1 text-xs muted">Specific beats perfect. (Optional)</p>
              </div>
            </div>
            
            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {[
                ['furniture','Furniture + layout'],
                ['lighting','Lighting design'],
                ['walls','Paint / walls / treatments'],
                ['flooring','Flooring + rugs'],
                ['fixtures','Fixtures + built-ins'],
                ['budget','Budget direction'],
                ['keep','Must keep']
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
                  <textarea 
                    rows={2} 
                    value={(brief as any)[key] || ''} 
                    onChange={e => setBrief(prev => ({ ...prev, [key]: e.target.value }))} 
                    className="input-dark w-full resize-none rounded-lg px-3 py-2.5 text-xs leading-relaxed" 
                    placeholder="Leave blank for automatic suggestions..."
                    data-testid={`textarea-brief-${key}`} 
                  />
                </label>
              ))}
            </div>
            
            <button onClick={generate} disabled={generating} className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md" data-testid="button-generate">
              <WandSparkles size={16} className={generating ? "animate-pulse" : ""} />
              {generating ? 'Composing your room...' : concept ? 'Regenerate concept' : 'Generate concept'}
            </button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-[11px] muted">
            <Check size={13} className="text-[hsl(var(--accent))]" />
            Your brief stays in this browser until you save it.
          </p>
        </aside>
      </div>
    </div>
  );
}