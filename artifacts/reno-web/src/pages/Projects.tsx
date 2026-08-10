import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Plus, Palette, Heart, ArrowRight, Layers3, Folder, ArrowUpRight } from 'lucide-react';
import { Concept, SEED_CONCEPTS } from '@/lib/concepts';
import { Project } from '@/lib/projects';
import { Pill } from '@/components/ui/pill';

export function ConceptCard({ concept, projects, onFavorite, onDelete, onAttach }: { concept: Concept, projects: Project[], onFavorite: (id: string) => void, onDelete: (id: string) => void, onAttach: (projectId: string, conceptId: string) => void }) {
  const bgStyle = concept.beforeImage ? { backgroundImage: `url(${concept.beforeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  const currentProject = projects.find(p => p.conceptIds.includes(concept.id));
  const [, setLocation] = useLocation();

  return <div className="group block overflow-hidden flex flex-col rounded-2xl border hairline bg-[hsl(var(--card))] transition-transform duration-300 hover:-translate-y-1 hover:border-[hsl(var(--primary)/.55)]" data-testid={`card-concept-${concept.id}`}>
    <Link href={`/concepts/${concept.id}`} className="block relative aspect-[1.32/1] overflow-hidden shrink-0">
      <div className={concept.image ? `room-image ${concept.image} absolute inset-0 transition-transform duration-500 group-hover:scale-105` : "absolute inset-0 transition-transform duration-500 group-hover:scale-105 bg-black/20"} style={bgStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      <div className="absolute left-4 top-4"><Pill accent>{concept.room}</Pill></div>
      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white drop-shadow-md">
        <span className="mono text-[10px] uppercase tracking-[.1em] font-medium">Concept {concept.id.replace('c-','')}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 backdrop-blur-md transition-transform group-hover:translate-x-1"><ArrowRight size={13} /></span>
      </div>
    </Link>
    <div className="p-4 relative flex flex-col flex-1">
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFavorite(concept.id); }} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border hairline bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]" data-testid={`button-favorite-${concept.id}`}>
        <Heart size={14} fill={concept.favorite ? 'currentColor' : 'none'} className={concept.favorite ? 'text-[#ecbf7d]' : ''} />
      </button>
      <Link href={`/concepts/${concept.id}`} className="block pr-10">
        <h3 className="serif text-[22px] truncate">{concept.title}</h3>
      </Link>
      <div className="mt-2 flex items-center justify-between text-xs muted">
        <span className="truncate">{concept.client}</span><span className="shrink-0 ml-2">{concept.style}</span>
      </div>
      
      <div className="mt-auto pt-5">
        <div className="mb-4 text-[11px]">
          {currentProject ? (
            <Link href={`/projects/${currentProject.id}`} className="flex items-center gap-1.5 text-[hsl(var(--primary))] hover:underline"><Folder size={12}/> {currentProject.projectName}</Link>
          ) : (
            <select 
              className="w-full bg-transparent border border-dashed hairline rounded-md px-2 py-1.5 text-[hsl(var(--muted-foreground))] outline-none focus:border-[hsl(var(--primary))]" 
              value=""
              onChange={(e) => {
                if (e.target.value === 'new') setLocation('/projects/new');
                else if (e.target.value) onAttach(e.target.value, concept.id);
              }}
              data-testid={`select-attach-${concept.id}`}
            >
              <option value="" disabled>Attach to project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
              <option value="new">+ Create new project</option>
            </select>
          )}
        </div>

        <div className="flex items-center justify-between border-t hairline pt-3">
          <div className="flex items-center gap-2">
             <Link href={`/present/${concept.id}`} className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))] hover:underline" data-testid={`link-present-${concept.id}`}>Present</Link>
             <span className="text-xs muted">·</span>
             <button onClick={() => onDelete(concept.id)} className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors" data-testid={`button-delete-${concept.id}`}>Delete</button>
          </div>
          <span className="text-[11px] muted">{concept.date}</span>
        </div>
      </div>
    </div>
  </div>;
}

export function Projects({ concepts, projects, onFavorite, onDelete, onAttach, onClearDemo }: { concepts: Concept[], projects: Project[], onFavorite: (id: string) => void, onDelete: (id: string) => void, onAttach: (pId: string, cId: string) => void, onClearDemo: () => void }) {
  const [query, setQuery] = useState(''); 
  const [filter, setFilter] = useState('Projects'); 

  const filteredConcepts = concepts.filter(c => `${c.title} ${c.client} ${c.room}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All concepts' || (filter === 'Favorites' ? c.favorite : true)));
  const filteredProjects = projects.filter(p => `${p.projectName} ${p.clientName}`.toLowerCase().includes(query.toLowerCase()));

  const handleClearDemo = () => {
    if (confirm('Are you sure you want to clear all non-seed saved concepts?')) {
      onClearDemo();
    }
  };

  return <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
       <div>
         <Pill>your library</Pill>
         <h1 className="serif mt-4 text-6xl tracking-[-.05em]">Projects<span className="text-[hsl(var(--primary))]">.</span></h1>
         <p className="mt-3 max-w-md text-sm leading-6 muted">A visual record of the rooms you’ve imagined, refined, and made ready to share.</p>
       </div>
       <div className="flex items-center flex-wrap gap-3">
         <Link href="/studio" className="btn-ghost flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" data-testid="link-new-concept"><Plus size={17} /> New concept</Link>
         <Link href="/projects/new" className="btn-primary flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" data-testid="link-new-project"><Folder size={17} /> New project</Link>
       </div>
    </div>
    
    <div className="mt-12 flex flex-col justify-between gap-4 border-y hairline py-4 md:flex-row">
       <div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-2.5 muted" /><input value={query} onChange={e => setQuery(e.target.value)} className="input-dark w-full rounded-lg py-2 pl-9 pr-3 text-sm" placeholder="Search by name or client" data-testid="input-search-projects" /></div>
       <div className="mobile-scroll flex gap-2">{['Projects','All concepts','Favorites'].map(item => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-colors font-medium ${filter === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]' : 'hairline muted hover:border-[hsl(var(--muted-foreground))]'}`} data-testid={`button-filter-${item.toLowerCase().replace(' ','-')}`}>{item}</button>)}</div>
    </div>

    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm muted"><span className="text-[hsl(var(--foreground))]">{filter === 'Projects' ? filteredProjects.length : filteredConcepts.length}</span> {filter.toLowerCase()}</p>
      <div className="flex items-center gap-4">
        {filter !== 'Projects' && concepts.length > SEED_CONCEPTS.length && (
           <button onClick={handleClearDemo} className="text-xs text-red-400 hover:text-red-300" data-testid="button-clear-demo">Clear demo concepts</button>
        )}
      </div>
    </div>

    {filter === 'Projects' ? (
      filteredProjects.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map(project => (
            <Link href={`/projects/${project.id}`} key={project.id} className="group block rounded-2xl border hairline bg-[hsl(var(--card))] p-6 hover:border-[hsl(var(--primary)/.5)] transition-colors" data-testid={`card-project-${project.id}`}>
               <div className="flex items-center justify-between mb-4">
                 <Pill accent>{project.roomType}</Pill>
                 <ArrowUpRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
               </div>
               <h3 className="serif text-2xl truncate">{project.projectName}</h3>
               <p className="text-sm muted mt-1 truncate">{project.clientName}</p>
               <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[hsl(var(--primary))] uppercase tracking-wider">
                  <Layers3 size={14} /> {project.conceptIds.length} Concepts
               </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed hairline py-20 text-center bg-[hsl(var(--card))]">
           <Folder className="mx-auto mb-4 text-[hsl(var(--primary))]" size={27} />
           <p className="serif text-2xl">No projects yet.</p>
           <p className="mt-2 text-sm muted">Create a project to organize your concepts.</p>
           <Link href="/projects/new" className="mt-6 btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium">Create project</Link>
        </div>
      )
    ) : (
      filteredConcepts.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredConcepts.map(c => <ConceptCard key={c.id} concept={c} projects={projects} onFavorite={onFavorite} onDelete={onDelete} onAttach={onAttach} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed hairline py-20 text-center bg-[hsl(var(--card))]">
           <Palette className="mx-auto mb-4 text-[hsl(var(--primary))]" size={27} />
           <p className="serif text-2xl">Nothing in this direction yet.</p>
           <p className="mt-2 text-sm muted">Try another search, or start a fresh concept.</p>
        </div>
      )
    )}
  </div>;
}