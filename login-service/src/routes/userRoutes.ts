import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
const router = Router();
router.get("/get-user-by-id/:id", UserController.getOneUser);
router.get(
  "/get-user-from-token",
  authMiddleware.verifyToken,
  UserController.getOneFromToken
);
router.get("/get-user-info-ezV4/:code", UserController.getInfoUserFromCode);
router.get("/get-all-user", UserController.getAllUser);
router.post("/create-user", UserController.createUser);
router.put("/update-user/:id", UserController.updateUser);
router.delete("/delete-user/:id", UserController.deleteUser);
export default router;
