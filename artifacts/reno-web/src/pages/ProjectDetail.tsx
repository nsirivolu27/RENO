import { Link, useLocation, useParams } from 'wouter';
import { ChevronLeft, Plus, ExternalLink, Trash2, Folder, Zap } from 'lucide-react';
import { Concept } from '@/lib/concepts';
import { Project, deleteProject } from '@/lib/projects';
import { Pill } from '@/components/ui/pill';

export function ProjectDetail({ concepts, projects, onRemoveConcept }: { concepts: Concept[], projects: Project[], onRemoveConcept: (projectId: string, conceptId: string) => void }) {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const project = projects.find(p => p.id === id);

  if (!project) return <div className="p-20 text-center"><h1 className="text-3xl">Project not found</h1></div>;

  const projectConcepts = concepts.filter(c => project.conceptIds.includes(c.id));
  const favorites = projectConcepts.filter(c => c.favorite);
  const others = projectConcepts.filter(c => !c.favorite);
  const sortedConcepts = [...favorites, ...others];

  const handleDelete = () => {
    if (confirm('Delete this project?')) {
      deleteProject(project.id);
      setLocation('/projects');
    }
  };

  const handleGenerateConcept = () => {
    sessionStorage.setItem('reno_studio_project', project.id);
    setLocation('/studio');
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button onClick={() => setLocation('/projects')} className="flex items-center gap-2 text-xs muted hover:text-[hsl(var(--primary))] transition-colors" data-testid="button-back-projects">
          <ChevronLeft size={15} /> All projects
        </button>
        <div className="flex items-center gap-3">
           <Link href={`/proposal/${project.id}`} className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" data-testid="button-open-proposal"><ExternalLink size={14}/> View Proposal</Link>
           <button onClick={handleDelete} className="flex h-8 w-8 items-center justify-center rounded-full border hairline hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-colors" data-testid="button-delete-project"><Trash2 size={14}/></button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main Content: Concepts */}
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6 border-b hairline pb-4">
             <h2 className="serif text-3xl">Concepts ({projectConcepts.length})</h2>
             <button onClick={handleGenerateConcept} className="btn-ghost flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"><Plus size={14}/> Generate concept</button>
          </div>

          {projectConcepts.length === 0 ? (
            <div className="rounded-2xl border border-dashed hairline p-12 text-center bg-[hsl(var(--card))]">
               <Zap className="mx-auto mb-4 text-[hsl(var(--primary))]" size={28} />
               <h3 className="serif text-2xl mb-2">Generate the first concept for this project.</h3>
               <p className="text-sm muted mb-6">Head to the studio to explore styles and directions.</p>
               <button onClick={handleGenerateConcept} className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium">Open Studio</button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {sortedConcepts.map(concept => (
                 <div key={concept.id} className="group overflow-hidden rounded-2xl border hairline bg-[hsl(var(--card))] flex flex-col">
                    <Link href={`/concepts/${concept.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                       {concept.beforeImage && <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80" style={{ backgroundImage: `url(${concept.beforeImage})` }} />}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute left-4 top-4 flex items-center gap-2">
                          {concept.render?.isDemo && <span className="rounded-md border border-white/30 bg-black/35 px-2 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">Demo preview</span>}
                          {concept.favorite && <span className="bg-[#ecbf7d] text-black px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md shadow-md">Favorite</span>}
                       </div>
                       <div className="absolute bottom-4 left-4 right-4 text-white">
                         <span className="mono text-[10px] uppercase tracking-[0.1em]">{concept.style}</span>
                         <h3 className="serif text-2xl mt-1 truncate">{concept.title}</h3>
                       </div>
                    </Link>
                    <div className="p-4 flex items-center justify-between mt-auto">
                       <Link href={`/present/${concept.id}`} className="text-xs text-[hsl(var(--primary))] font-medium hover:underline">Present Concept</Link>
                       <button onClick={() => onRemoveConcept(project.id, concept.id)} className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300" data-testid={`button-remove-concept-${concept.id}`}>Remove</button>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Project Details */}
        <div className="order-1 lg:order-2">
           <div className="rounded-2xl border hairline bg-[hsl(var(--card))] p-6 top-24 sticky">
              <div className="mb-4">
                <Pill><Folder size={12} className="mr-1 inline-block" /> {project.roomType}</Pill>
              </div>
              <h1 className="serif text-4xl leading-tight mb-2">{project.projectName}</h1>
              <p className="text-sm font-medium">{project.clientName}</p>
              {project.propertyAddress && <p className="text-xs muted mt-1">{project.propertyAddress}</p>}

              <dl className="mt-8 space-y-4">
                 {[
                   ['Budget', project.budgetRange],
                   ['Timeline', project.timeline],
                   ['Goals', project.goals],
                   ['Must Keep', project.mustKeep],
                   ['Notes', project.notes]
                 ].filter(([_, v]) => v).map(([label, val]) => (
                   <div key={label} className="border-t hairline pt-4">
                      <dt className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--primary))] mb-2">{label}</dt>
                      <dd className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed whitespace-pre-wrap">{val}</dd>
                   </div>
                 ))}
              </dl>
           </div>
        </div>
      </div>
    </div>
  );
}