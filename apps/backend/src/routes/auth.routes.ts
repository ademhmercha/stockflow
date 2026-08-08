import { Router } from "express";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { authRateLimiter } from "../middlewares/rateLimit";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validator";
import { login, logout, refresh, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", authRateLimiter, validate({ body: registerSchema }), register);
router.post("/login", authRateLimiter, validate({ body: loginSchema }), login);
router.post("/refresh", authRateLimiter, validate({ body: refreshSchema }), refresh);
router.post("/logout", requireAuth, logout);

export default router;
