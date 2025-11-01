import { Router, Request, Response } from "express";

const router = Router();

router.get("/api/error/test", (_req: Request, _res: Response) => {
  throw new Error("Intentional test error from Express");
});

router.get("/api/error/not-found", (_req: Request, res: Response) => {
  res.status(404).json({
    error: "Resource not found",
    message: "This endpoint intentionally returns 404",
  });
});

router.get("/api/error/validation", (_req: Request, res: Response) => {
  res.status(400).json({
    error: "Validation failed",
    message: "This endpoint intentionally returns validation errors",
    errors: [
      { field: "name", message: "Name is required" },
      { field: "email", message: "Email is invalid" },
      { field: "age", message: "Age must be greater than 0" },
    ],
  });
});

router.get("/api/error/server", (_req: Request, res: Response) => {
  res.status(500).json({
    error: "Internal server error",
    message: "This endpoint intentionally returns 500",
  });
});

export default router;
