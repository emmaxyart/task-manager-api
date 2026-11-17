import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../schemas/task.schema.js";

const router = Router();

router.get("/", getTasks);
router.get("/:id", getTaskById);

router.post("/", validateBody(createTaskSchema), createTask);

router.patch(
  "/:id",
  validateBody(updateTaskSchema),
  updateTask,
);

router.delete("/:id", deleteTask);

export default router;
