import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string({
      error: "Title must be a string",
    })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),

  completed: z.boolean().optional().default(false),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string({
        error: "Title must be a string",
      })
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters")
      .optional(),

    completed: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined || data.completed !== undefined,
    {
      message: "At least one field must be provided for an update",
    },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
