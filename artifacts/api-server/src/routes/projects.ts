import { Router, type IRouter } from "express";
import {
  CreateProjectBody,
  CreateProjectResponse,
  GenerateProjectConceptBody,
  GenerateProjectConceptParams,
  GenerateProjectConceptResponse,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsQueryParams,
  ListProjectsResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import { generateDemoConcept } from "../lib/demo-provider";
import {
  addConcept,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../lib/gateway-store";

const router: IRouter = Router();

router.get("/projects", (req, res): void => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const search = parsed.data.search?.trim().toLowerCase();
  const filtered = listProjects().filter((project) => {
    const matchesSearch =
      !search ||
      [project.name, project.clientName, project.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));
    const matchesFavorite =
      parsed.data.favorite === undefined ||
      (parsed.data.favorite ? project.favoriteCount > 0 : project.favoriteCount === 0);
    return matchesSearch && matchesFavorite;
  });

  res.json(ListProjectsResponse.parse(filtered));
});

router.post("/projects", (req, res): void => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.status(201).json(CreateProjectResponse.parse(createProject(parsed.data)));
});

router.get("/projects/:projectId", (req, res): void => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const project = getProject(params.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:projectId", (req, res): void => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateProjectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const project = updateProject(params.data.projectId, body.data);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateProjectResponse.parse(project));
});

router.post("/projects/:projectId/concepts", (req, res): void => {
  const params = GenerateProjectConceptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = GenerateProjectConceptBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (!getProject(params.data.projectId)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const concept = generateDemoConcept(body.data, params.data.projectId, Date.now());
  addConcept(params.data.projectId, concept);
  res.status(201).json(GenerateProjectConceptResponse.parse(concept));
});

export default router;