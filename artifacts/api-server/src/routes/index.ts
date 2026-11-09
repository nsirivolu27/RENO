import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studioRouter from "./studio";
import projectsRouter from "./projects";
import conceptsRouter from "./concepts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studioRouter);
router.use(projectsRouter);
router.use(conceptsRouter);

export default router;
