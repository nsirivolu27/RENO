import { useState } from 'react';
import { useLocation } from 'wouter';
import { Pill } from '@/components/ui/pill';
import { ChevronLeft, FolderPlus } from 'lucide-react';
import { saveProject } from '@/lib/projects';
import { useToast } from '@/hooks/use-toast';

export function ProjectIntake() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientName: '',
    projectName: '',
    propertyAddress: '',
    roomType: 'Living room',
    goals: '',
    budgetRange: '',
    timeline: '',
    mustKeep: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject = {
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      conceptIds: []
    };
    saveProject(newProject);
    toast({ title: 'Project created', description: 'You can now attach concepts to this project.' });
    setLocation(`/projects/${newProject.id}`);
  };

  return (
    <div className="mx-auto max-w-[800px] px-5 py-8 md:px-10 md:py-12">
      <button onClick={() => setLocation('/projects')} className="mb-8 flex items-center gap-2 text-xs muted hover:text-[hsl(var(--primary))] transition-colors" data-testid="button-back-projects">
        <ChevronLeft size={15} /> All projects
      </button>
      
      <div className="mb-8">
        <Pill>New Project</Pill>
        <h1 className="serif mt-4 text-4xl md:text-5xl">Client brief.</h1>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Define the scope, constraints, and direction before creating concepts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" data-testid="form-project-intake">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Client Name *</span>
            <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="e.g. Maya & Theo" data-testid="input-client-name" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Project Name *</span>
            <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="e.g. Oak Street Renovation" data-testid="input-project-name" />
          </label>
        </div>
        
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Property Address</span>
          <input type="text" value={formData.propertyAddress} onChange={e => setFormData({...formData, propertyAddress: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="e.g. 123 Oak St, Portland" />
        </label>

        <div className="grid gap-6 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Room Type</span>
            <select value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" data-testid="select-room-type">
              <option>Living room</option><option>Kitchen</option><option>Bedroom</option><option>Bathroom</option><option>Sunroom</option><option>Entryway</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Budget Direction</span>
            <input type="text" value={formData.budgetRange} onChange={e => setFormData({...formData, budgetRange: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="e.g. $20k-$30k" data-testid="input-budget" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Timeline</span>
            <input type="text" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="e.g. Fall 2025" />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Project Goals</span>
          <textarea rows={3} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm leading-relaxed" placeholder="What is the primary feeling or function we are trying to achieve?" />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Constraints (Must Keep)</span>
          <textarea rows={2} value={formData.mustKeep} onChange={e => setFormData({...formData, mustKeep: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm leading-relaxed" placeholder="e.g. Keep existing hardwood floors and fireplace." />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Notes</span>
          <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-dark w-full rounded-xl px-4 py-3 text-sm leading-relaxed" placeholder="Additional designer notes..." />
        </label>

        <div className="pt-4 pb-12">
          <button type="submit" className="btn-primary flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold w-full sm:w-auto" data-testid="button-create-project">
            <FolderPlus size={18} /> Create Project
          </button>
        </div>
      </form>
    </div>
  );
}