import { Router, type IRouter } from "express";
import { db, mlModelsTable } from "@workspace/db";
import { CreateModelBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/models", async (_req, res): Promise<void> => {
  const models = await db.select().from(mlModelsTable);
  res.json(models);
});

router.post("/models", async (req, res): Promise<void> => {
  const parsed = CreateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [model] = await db.insert(mlModelsTable).values(parsed.data).returning();
  res.status(201).json(model);
});

export default router;
