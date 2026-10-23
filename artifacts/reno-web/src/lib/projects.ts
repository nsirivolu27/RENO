export interface Project {
  id: string;
  clientName: string;
  projectName: string;
  propertyAddress: string;
  roomType: string;
  goals: string;
  budgetRange: string;
  timeline: string;
  mustKeep: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
  conceptIds: string[];
}

const STORAGE_KEY = 'reno_projects';

export function getProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: Project) {
  const existing = getProjects();
  const idx = existing.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    existing[idx] = project;
  } else {
    existing.unshift(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteProject(id: string) {
  const existing = getProjects();
  const updated = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function attachConceptToProject(projectId: string, conceptId: string) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  if (project && !project.conceptIds.includes(conceptId)) {
    // Remove from other projects to ensure concepts belong to one project at a time
    projects.forEach(p => {
      p.conceptIds = p.conceptIds.filter(id => id !== conceptId);
    });
    project.conceptIds.push(conceptId);
    project.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
}

export function removeConceptFromProject(projectId: string, conceptId: string) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.conceptIds = project.conceptIds.filter(id => id !== conceptId);
    project.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
}