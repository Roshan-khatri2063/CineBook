import { Router } from "express";
import * as controller from "../controllers/movie.controller.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import { listMoviesQuerySchema } from "../validators/movie.validator.js";

// Public: anyone can browse movies without logging in.
const router = Router();

router.get("/", validate(listMoviesQuerySchema, "query"), controller.list);
router.get("/genres", controller.genres); // must come before "/:id"
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);
router.get("/:id/showtimes", validate(idParamSchema, "params"), controller.showtimes);

export default router;
