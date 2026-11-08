import { Router } from "express";
import { overview } from "../../controllers/admin/stats.controller.js";

const router = Router();

router.get("/", overview);

export default router;
