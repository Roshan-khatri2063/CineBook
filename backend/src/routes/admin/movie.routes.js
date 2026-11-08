import { Router } from "express";
import * as controller from "../../controllers/admin/movie.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import {
  createMovieSchema,
  listMoviesQuerySchema,
  updateMovieSchema,
} from "../../validators/admin/movie.validator.js";

const router = Router();

router.get("/", validate(listMoviesQuerySchema, "query"), controller.list);
router.post("/", validate(createMovieSchema), controller.create);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);
router.patch("/:id", validate(idParamSchema, "params"), validate(updateMovieSchema), controller.update);
router.delete("/:id", validate(idParamSchema, "params"), controller.remove);

export default router;
