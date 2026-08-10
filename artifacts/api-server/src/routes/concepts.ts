import { Router, type IRouter } from "express";
import {
  GenerateConceptBody,
  GenerateConceptResponse,
  GetConceptParams,
  GetConceptResponse,
  ToggleConceptFavoriteBody,
  ToggleConceptFavoriteParams,
  ToggleConceptFavoriteResponse,
} from "@workspace/api-zod";
import { generateDemoConcept } from "../lib/demo-provider";
import {
  addConcept,
  getConcept,
  updateConceptFavorite,
} from "../lib/gateway-store";
import { renderRenovationAfterImage } from "../lib/renovation-renderer";

const router: IRouter = Router();

router.post("/concepts", async (req, res): Promise<void> => {
  const body = GenerateConceptBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const concept = generateDemoConcept(body.data, null, Date.now());
  const resultImageUrl = await renderRenovationAfterImage(body.data);
  if (resultImageUrl) {
    concept.resultImageUrl = resultImageUrl;
  }
  addConcept(null, concept);
  res.status(201).json(GenerateConceptResponse.parse(concept));
});

router.get("/concepts/:conceptId", (req, res): void => {
  const params = GetConceptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const concept = getConcept(params.data.conceptId);
  if (!concept) {
    res.status(404).json({ error: "Concept not found" });
    return;
  }
  res.json(GetConceptResponse.parse(concept));
});

router.patch("/concepts/:conceptId/favorite", (req, res): void => {
  const params = ToggleConceptFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ToggleConceptFavoriteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const concept = updateConceptFavorite(
    params.data.conceptId,
    body.data.isFavorite,
  );
  if (!concept) {
    res.status(404).json({ error: "Concept not found" });
    return;
  }
  res.json(ToggleConceptFavoriteResponse.parse(concept));
});

export default router;
