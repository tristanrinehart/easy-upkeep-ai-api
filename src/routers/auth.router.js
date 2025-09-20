/**
 * auth.router.js
 */
import { Router } from "express";
import { signIn, signOut, signUp, googleStart, appleStart } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/ajv.js";

const emailPassSchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 2 }
  }
};

export const authRouter = Router();
authRouter.post("/signup", validateBody(emailPassSchema), signUp);
authRouter.post("/signin", validateBody(emailPassSchema), signIn);
authRouter.post("/signout", signOut);

// OAuth stubs
authRouter.get("/google", googleStart);
authRouter.get("/apple", appleStart);