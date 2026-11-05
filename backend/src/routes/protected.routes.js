import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";

// TEMPORARY routes that only exist to test authentication and roles.
// Delete this file (and its line in routes/index.js) once real customer and
// admin modules exist.
const router = Router();

router.get("/customer", authenticate, authorize("CUSTOMER"), (req, res) => {
  res.json({
    success: true,
    message: "Customer area reached",
    data: { user: req.user },
  });
});

router.get("/admin", authenticate, authorize("ADMIN"), (req, res) => {
  res.json({
    success: true,
    message: "Admin area reached",
    data: { user: req.user },
  });
});

export default router;
