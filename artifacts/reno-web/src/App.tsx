import { type ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import {
  ArrowRight, Building2, ChevronDown, ChevronLeft, Download, ExternalLink,
  Heart, Layers3, LayoutDashboard, Menu, Palette, Plus, Search, Send, Sparkles, WandSparkles, Zap
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';

import { Pill } from '@/components/ui/pill';
import { Studio } from '@/pages/Studio';
import { Present } from '@/pages/Present';
import { Concept, SEED_CONCEPTS, getAllConcepts, toggleFavoriteLocally, deleteConceptLocally, clearDemoConceptsLocally } from '@/lib/concepts';

const queryClient = new QueryClient();

function Brand() {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--primary))] text-[hsl(var(--primary))]"><span className="serif text-xl italic">r</span></span>
    <span className="serif text-[21px] tracking-[-.02em]">reno</span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/studio', label: 'Studio', icon: WandSparkles },
    { href: '/projects', label: 'Projects', icon: Layers3 },
  ];
  return <div className="reno-shell">
    <div className="grain" />
    <header className="sticky top-0 z-40 border-b hairline bg-[hsl(var(--background)/.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${location === item.href ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}><Icon size={15} strokeWidth={1.7} />{item.label}</Link>; })}
          <Link href="/for-companies" data-testid="link-for-companies" className="ml-3 flex items-center gap-2 border-l hairline pl-5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"><Building2 size={15} />For companies</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-right sm:block"><span className="block text-xs text-[hsl(var(--foreground))]">Studio account</span><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">free workspace</span></span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--accent-foreground))]">AM</span>
          <button onClick={() => setMobileOpen(v => !v)} className="rounded-md p-2 md:hidden" data-testid="button-mobile-menu"><Menu size={20} /></button>
        </div>
      </div>
      {mobileOpen && <div className="border-t hairline px-5 py-3 md:hidden bg-[hsl(var(--background))]">
        {nav.map(item => <Link key={item.href} onClick={() => setMobileOpen(false)} href={item.href} className="block border-b hairline py-3 text-sm">{item.label}</Link>)}
        <Link onClick={() => setMobileOpen(false)} href="/for-companies" className="block py-3 text-sm">For companies</Link>
      </div>}
    </header>
    <main>{children}</main>
    <footer className="mx-auto mt-24 flex max-w-[1440px] flex-col gap-4 border-t hairline px-5 py-8 text-xs text-[hsl(var(--muted-foreground))] md:flex-row md:items-center md:justify-between md:px-10">
      <span className="serif text-base text-[hsl(var(--foreground))]">reno</span><span>Open-source tools for rooms with a point of view.</span><span className="mono">MIT licensed · 2025</span>
    </footer>
  </div>;
}

function Home() {
  return <div>
    <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_.95fr] md:px-10 md:pb-28 md:pt-24">
      <div className="flex flex-col justify-center">
        <div className="fade-up"><Pill accent><Sparkles size={11} className="mr-1.5" />A calmer way to see what’s possible</Pill></div>
        <h1 className="serif fade-up delay-1 mt-7 max-w-[670px] text-[clamp(3.6rem,8vw,7.7rem)] leading-[.9] tracking-[-.065em]">Make room<br /><em className="text-[hsl(var(--primary))]">for better.</em></h1>
        <p className="fade-up delay-2 mt-8 max-w-[475px] text-[17px] leading-7 text-[hsl(var(--muted-foreground))]">Reno turns a room you have into a direction you can share. Explore considered interiors, one thoughtful brief at a time.</p>
        <div className="fade-up delay-3 mt-9 flex flex-wrap items-center gap-3">
          <Link href="/studio" className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" data-testid="link-start-studio">Open the studio <ArrowRight size={16} /></Link>
          <Link href="/projects" className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm" data-testid="link-browse-projects">Browse projects <Layers3 size={15} /></Link>
        </div>
        <div className="mt-14 flex items-center gap-6 border-t hairline pt-5 text-xs text-[hsl(var(--muted-foreground))]"><span><strong className="mr-1 text-[hsl(var(--foreground))]">01</strong> Photograph</span><span><strong className="mr-1 text-[hsl(var(--foreground))]">02</strong> Describe</span><span><strong className="mr-1 text-[hsl(var(--foreground))]">03</strong> Present</span></div>
      </div>
      <div className="relative min-h-[470px] overflow-hidden rounded-[1.6rem] border hairline bg-[#6d5b4d] soft-shadow md:min-h-[650px]">
        <div className="room-image after absolute inset-0 scale-105 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(22,18,14,.72)] via-transparent to-[rgba(22,18,14,.08)]" />
        <div className="absolute left-5 top-5 flex items-center gap-2"><Pill accent>concept / 104</Pill></div>
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><p className="mono mb-1 text-[10px] uppercase tracking-[.12em] text-[#d8c4a5]">A living room, softened</p><p className="serif text-3xl italic text-[#f0e8da]">The quiet corner</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white"><ArrowRight size={17} /></span></div>
        <div className="absolute -right-10 top-28 h-32 w-32 rounded-full border border-white/20" />
      </div>
    </section>
    <section className="border-y hairline bg-[hsl(var(--secondary)/.35)]">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-14 md:grid-cols-[.75fr_1fr_1fr_1fr] md:px-10 md:py-20">
        <div><Pill>the reno method</Pill><p className="serif mt-4 text-3xl leading-tight">Less guessing.<br />More seeing.</p></div>
        {[['01','A brief with texture','Talk in the language of your actual home: the light, the things you keep, the budget you have.'],['02','A room in its next chapter','Generate concepts that respect the bones of your space — not a generic moodboard.'],['03','A proposal worth sending','Save the direction, shape the story, and walk into a client meeting prepared.']].map(([n,t,d]) => <div key={n} className="border-l hairline pl-5"><span className="mono text-[10px] text-[hsl(var(--primary))]">{n}</span><h3 className="mt-8 text-lg">{t}</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{d}</p></div>)}
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><Pill>for the way you work</Pill><h2 className="serif mt-4 max-w-[650px] text-5xl leading-[.98] tracking-[-.04em] md:text-7xl">Your point of view,<br /><em className="text-[hsl(var(--primary))]">made visible.</em></h2></div><Link href="/for-companies" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))]" data-testid="link-learn-companies">See Reno for teams <ArrowRight size={15} /></Link></div>
      <div className="mt-14 grid gap-5 md:grid-cols-[1.2fr_.8fr]"><div className="relative min-h-[360px] overflow-hidden rounded-2xl border hairline"><div className="room-image loft absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><span className="absolute bottom-5 left-5 text-sm">A kitchen that knows when to be quiet.</span></div><div className="flex flex-col justify-between rounded-2xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.08)] p-7"><Sparkles className="text-[hsl(var(--primary))]" size={22} /><div><p className="serif text-3xl leading-tight">Designed around your decisions, not the algorithm.</p><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Reno is open source, transparent, and made to stay out of the way when the real conversation starts.</p></div><Link href="/studio" className="mt-8 inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))]" data-testid="link-try-brief">Try a brief <ArrowRight size={15} /></Link></div></div>
    </section>
  </div>;
}

function ConceptCard({ concept, onFavorite, onDelete }: { concept: Concept; onFavorite: (id: string) => void; onDelete: (id: string) => void }) {
  const bgStyle = concept.beforeImage ? { backgroundImage: `url(${concept.beforeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  return <div className="group block overflow-hidden rounded-2xl border hairline bg-[hsl(var(--card))] transition-transform duration-300 hover:-translate-y-1 hover:border-[hsl(var(--primary)/.55)]" data-testid={`card-concept-${concept.id}`}>
    <Link href={`/projects/${concept.id}`} className="block relative aspect-[1.32/1] overflow-hidden">
      <div className={concept.image ? `room-image ${concept.image} absolute inset-0 transition-transform duration-500 group-hover:scale-105` : "absolute inset-0 transition-transform duration-500 group-hover:scale-105 bg-black/20"} style={bgStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      <div className="absolute left-4 top-4"><Pill accent>{concept.room}</Pill></div>
      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white drop-shadow-md">
        <span className="mono text-[10px] uppercase tracking-[.1em] font-medium">Concept {concept.id.replace('c-','')}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 backdrop-blur-md transition-transform group-hover:translate-x-1"><ArrowRight size={13} /></span>
      </div>
    </Link>
    <div className="p-4 relative">
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFavorite(concept.id); }} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border hairline bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]" data-testid={`button-favorite-${concept.id}`}>
        <Heart size={14} fill={concept.favorite ? 'currentColor' : 'none'} className={concept.favorite ? 'text-[#ecbf7d]' : ''} />
      </button>
      <Link href={`/projects/${concept.id}`} className="block pr-10">
        <h3 className="serif text-[22px] truncate">{concept.title}</h3>
      </Link>
      <div className="mt-2 flex items-center justify-between text-xs muted">
        <span className="truncate">{concept.client}</span><span className="shrink-0 ml-2">{concept.style}</span>
      </div>
      {concept.rationale && (
        <p className="mt-3 text-[11px] line-clamp-2 muted leading-relaxed">{concept.rationale}</p>
      )}
      <div className="mt-4 flex items-center justify-between border-t hairline pt-3">
        <div className="flex items-center gap-2">
           <Link href={`/present/${concept.id}`} className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))] hover:underline" data-testid={`link-present-${concept.id}`}>Present</Link>
           <span className="text-xs muted">·</span>
           <button onClick={() => onDelete(concept.id)} className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors" data-testid={`button-delete-${concept.id}`}>Delete</button>
        </div>
        <span className="text-[11px] muted">{concept.date}</span>
      </div>
    </div>
  </div>;
}

function Projects({ concepts, onFavorite, onDelete, onClearDemo }: { concepts: Concept[]; onFavorite: (id: string) => void; onDelete: (id: string) => void; onClearDemo: () => void }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All concepts');
  const filtered = concepts.filter(c => `${c.title} ${c.client} ${c.room}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All concepts' || (filter === 'Favorites' ? c.favorite : c.room === filter)));
  
  const handleClearDemo = () => {
    if (confirm('Are you sure you want to clear all non-seed saved concepts?')) {
      onClearDemo();
    }
  };
  
  return <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Pill>your library</Pill><h1 className="serif mt-4 text-6xl tracking-[-.05em]">Projects<span className="text-[hsl(var(--primary))]">.</span></h1><p className="mt-3 max-w-md text-sm leading-6 muted">A visual record of the rooms you’ve imagined, refined, and made ready to share.</p></div><Link href="/studio" className="btn-primary inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" data-testid="link-new-project"><Plus size={17} /> New concept</Link></div>
    <div className="mt-12 flex flex-col justify-between gap-4 border-y hairline py-4 md:flex-row"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-2.5 muted" /><input value={query} onChange={e => setQuery(e.target.value)} className="input-dark w-full rounded-lg py-2 pl-9 pr-3 text-sm" placeholder="Search by project, client, or room" data-testid="input-search-projects" /></div><div className="mobile-scroll flex gap-2">{['All concepts','Favorites','Living room','Kitchen'].map(item => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs transition-colors ${filter === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]' : 'hairline muted hover:border-[hsl(var(--muted-foreground))]'}`} data-testid={`button-filter-${item.toLowerCase().replace(' ','-')}`}>{item}</button>)}</div></div>
    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm muted"><span className="text-[hsl(var(--foreground))]">{filtered.length}</span> saved directions</p>
      <div className="flex items-center gap-4">
        {concepts.length > SEED_CONCEPTS.length && (
           <button onClick={handleClearDemo} className="text-xs text-red-400 hover:text-red-300" data-testid="button-clear-demo">Clear demo concepts</button>
        )}
        <button className="flex items-center gap-1 text-xs muted" data-testid="button-sort-projects">Recently edited <ChevronDown size={13} /></button>
      </div>
    </div>
    {filtered.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map(c => <ConceptCard key={c.id} concept={c} onFavorite={onFavorite} onDelete={onDelete} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed hairline py-20 text-center bg-[hsl(var(--card))]"><Palette className="mx-auto mb-4 text-[hsl(var(--primary))]" size={27} /><p className="serif text-2xl">Nothing in this direction yet.</p><p className="mt-2 text-sm muted">Try another search, or start a fresh concept.</p></div>}
  </div>;
}

function ProjectDetail({ concepts }: { concepts: Concept[] }) {
  const { id } = useParams(); 
  const concept = concepts.find(c => c.id === id) || concepts[0]; 
  const [, setLocation] = useLocation();

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

function ForCompanies() {
  return <div>
    <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-20 pt-14 md:grid-cols-[.9fr_1.1fr] md:px-10 md:pb-28 md:pt-24"><div className="flex flex-col justify-center"><Pill accent><Building2 size={11} className="mr-1.5" />For renovators + studios</Pill><h1 className="serif mt-7 text-6xl leading-[.93] tracking-[-.06em] md:text-8xl">Bring the<br /><em className="text-[hsl(var(--primary))]">room to<br />the table.</em></h1><p className="mt-8 max-w-md text-[17px] leading-7 muted">Reno gives your clients something better than a promise. A shared visual direction, built from the room they already love.</p><Link href="/studio" className="btn-primary mt-9 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" data-testid="link-company-demo">Build a demo concept <ArrowRight size={16} /></Link></div><div className="relative min-h-[530px] overflow-hidden rounded-[1.5rem] border hairline bg-[#655242]"><div className="room-image studio absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" /><div className="absolute left-6 right-6 top-6 flex justify-between"><Pill accent>client review / 09:42</Pill><span className="mono text-[10px] text-white/75">reno studio</span></div><div className="absolute bottom-7 left-7 right-7"><div className="flex items-end justify-between"><div><p className="mono text-[10px] uppercase tracking-[.12em] text-[#ddbd8c]">Oak Street Studio</p><p className="serif mt-2 text-4xl italic text-white">A room that earns its pause.</p></div><span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white"><ArrowRight size={18} /></span></div></div></div></section>
    <section className="border-y hairline bg-[hsl(var(--secondary)/.3)]"><div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-10 md:grid-cols-[.7fr_1.3fr]"><div><Pill>your next client meeting</Pill><h2 className="serif mt-5 text-5xl leading-none">Make the<br />invisible<br /><em className="text-[hsl(var(--primary))]">concrete.</em></h2></div><div className="grid gap-0">{[['01','Show the bones','Upload the existing room and work from what is actually there.'],['02','Shape the brief','Keep the conversation anchored in taste, constraints, and what matters most.'],['03','Leave with a direction','Present a polished concept your client can react to — and remember.']].map(([n,t,d]) => <div key={n} className="grid grid-cols-[55px_1fr] border-b hairline py-6 first:border-t"><span className="mono text-xs text-[hsl(var(--primary))]">{n}</span><div><h3 className="text-lg">{t}</h3><p className="mt-2 max-w-md text-sm leading-6 muted">{d}</p></div></div>)}</div></div></div></section>
    <section className="mx-auto max-w-[1440px] px-5 py-20 text-center md:px-10 md:py-28"><Pill accent><Zap size={11} className="mr-1.5" />Open source, thoughtfully made</Pill><h2 className="serif mx-auto mt-5 max-w-3xl text-5xl leading-[.98] tracking-[-.05em] md:text-7xl">The best client tool is the one that still feels like <em className="text-[hsl(var(--primary))]">you.</em></h2><p className="mx-auto mt-6 max-w-lg text-sm leading-6 muted">Reno is MIT licensed and built for the people doing the real work: homeowners, designers, builders, and the conversations between them.</p><Link href="/studio" className="btn-ghost mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm" data-testid="link-company-studio">Explore the studio <ArrowRight size={15} /></Link></section>
  </div>;
}

export default function App() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  
  // Combine local storage and seeds
  useEffect(() => {
     setConcepts(getAllConcepts());
  }, []);

  const [, setLocation] = useLocation();

  // refresh concepts when path changes (e.g. after save in studio)
  useEffect(() => {
     setConcepts(getAllConcepts());
  }, [useLocation()[0]]);

  const handleFavorite = (id: string) => {
    toggleFavoriteLocally(id);
    setConcepts(getAllConcepts());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this concept?')) {
      deleteConceptLocally(id);
      setConcepts(getAllConcepts());
    }
  };

  const handleClearDemo = () => {
    clearDemoConceptsLocally();
    setConcepts(getAllConcepts());
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Switch>
          <Route path="/present/:id">
            <Present concepts={concepts} />
          </Route>
          <Route>
            <Shell>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/studio">
                  <Studio />
                </Route>
                <Route path="/projects">
                  <Projects concepts={concepts} onFavorite={handleFavorite} onDelete={handleDelete} onClearDemo={handleClearDemo} />
                </Route>
                <Route path="/projects/:id">
                  <ProjectDetail concepts={concepts} />
                </Route>
                <Route path="/for-companies" component={ForCompanies} />
                <Route>
                  <div className="flex h-[70vh] flex-col items-center justify-center text-center"><h1 className="serif text-6xl">404</h1><p className="mt-4 muted">This room doesn't exist.</p><Link href="/" className="btn-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold">Back to Overview</Link></div>
                </Route>
              </Switch>
            </Shell>
          </Route>
        </Switch>
        <Toaster />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}