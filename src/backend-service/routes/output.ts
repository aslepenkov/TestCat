import { Router } from "express";
import { listOutput, readOutput } from "../controllers/outputController";

const router: Router = Router();

router.get("/output", listOutput);
router.get("/output/:filename", readOutput);

export default router;
