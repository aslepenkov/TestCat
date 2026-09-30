import { Router } from "express";
import { runAnalyze } from "../controllers/analyzeController";

const router: Router = Router();

router.post("/analyze", runAnalyze);

export default router;
