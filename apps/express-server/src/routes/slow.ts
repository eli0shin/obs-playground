import { Router, Request, Response } from "express";

const router = Router();

router.get("/api/slow/timeout", async (_req: Request, res: Response) => {
  await new Promise((resolve) => setTimeout(resolve, 30000));

  res.json({
    message: "This response took 30 seconds",
    delayed: true,
  });
});

router.get("/api/slow/5s", async (_req: Request, res: Response) => {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  res.json({
    message: "This response took 5 seconds",
    delayed: true,
  });
});

router.get("/api/slow/variable", async (_req: Request, res: Response) => {
  const delay = Math.floor(Math.random() * 10000) + 1000;

  await new Promise((resolve) => setTimeout(resolve, delay));

  res.json({
    message: `This response took ${delay}ms`,
    delayed: true,
    delayMs: delay,
  });
});

export default router;
