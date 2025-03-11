import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
const router = Router();
router.get("/get-role", RoleController.getRole);
router.get("/get-role-by-id/:id", RoleController.getRoleById);
router.post("/create-role", RoleController.createRole);
router.put("/update-role/:id", RoleController.updateRole);
router.delete("/delete-role/:id", RoleController.deleteRole);
export default router;
