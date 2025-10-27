import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express API server is running!" });
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

export default router;
