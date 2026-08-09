import { Router, type IRouter } from "express";
import { GetStudioSummaryResponse } from "@workspace/api-zod";
import { getRecentConcepts, listProjects } from "../lib/gateway-store";

const router: IRouter = Router();

router.get("/studio/summary", (_req, res): void => {
  const projects = listProjects();
  const recentConcepts = getRecentConcepts();
  const data = {
    projectCount: projects.length,
    conceptCount: projects.reduce((total, project) => total + project.conceptCount, 0),
    favoriteCount: projects.reduce(
      (total, project) => total + project.favoriteCount,
      0,
    ),
    recentConcepts,
  };

  res.json(GetStudioSummaryResponse.parse(data));
});

export default router;