import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const completedParam = req.query.completed;

    if (
      (pageParam !== undefined && typeof pageParam !== "string") ||
      (limitParam !== undefined && typeof limitParam !== "string") ||
      (completedParam !== undefined &&
        typeof completedParam !== "string")
    ) {
      res.status(400).json({
        error: "Invalid query parameters",
      });
      return;
    }

    const page = pageParam === undefined ? 1 : Number(pageParam);
    const limit = limitParam === undefined ? 10 : Number(limitParam);

    if (!Number.isInteger(page) || page < 1) {
      res.status(400).json({
        error: "Page must be a positive integer",
      });
      return;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      res.status(400).json({
        error: "Limit must be an integer between 1 and 100",
      });
      return;
    }

    if (
      completedParam !== undefined &&
      completedParam !== "true" &&
      completedParam !== "false"
    ) {
      res.status(400).json({
        error: "Completed must be true or false",
      });
      return;
    }

    const where =
      completedParam === undefined
        ? {}
        : { completed: completedParam === "true" };

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      count: total,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({
        error: "Task ID must be a positive integer",
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({
        error: "Task not found",
      });
      return;
    }

    res.status(200).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { title } = req.body as { title: string };

    const task = await prisma.task.create({
      data: { title },
    });

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const { title, completed } = req.body as {
      title?: string;
      completed?: boolean;
    };

    const existingTask = await prisma.task.findUnique({ where: { id } });

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(completed !== undefined ? { completed } : {}),
      },
    });

    res.json({ message: "Task updated successfully", data: task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const task = await prisma.task.delete({ where: { id } });

    res.json({ message: "Task deleted successfully", data: task });
  } catch (error) {
    next(error);
  }
}
