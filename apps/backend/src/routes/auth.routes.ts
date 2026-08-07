import { Router } from "express";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validator";
import { login, logout, refresh, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);
router.post("/logout", requireAuth, logout);

export default router;
