
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const {
  mockFindMany,
  mockCreate,
  mockFindUnique,
  mockUpdate,
  mockDelete,
  mockCount,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    task: {
      findMany: mockFindMany,
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount,
    },
  },
}));

import app from "../src/app.js";

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const sampleTask = {
  id: 1,
  title: "Learn testing",
  completed: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Task API", () => {
  it("GET /api/tasks returns tasks", async () => {
    mockFindMany.mockResolvedValue([sampleTask]);
    mockCount.mockResolvedValue(1);

    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].title).toBe("Learn testing");
  });

  it("supports pagination", async () => {
    mockFindMany.mockResolvedValue([sampleTask]);
    mockCount.mockResolvedValue(25);

    const response = await request(app)
      .get("/api/tasks?page=2&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      skip: 10,
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  });

  it("filters tasks by completion status", async () => {
    mockFindMany.mockResolvedValue([
      { ...sampleTask, completed: true },
    ]);
    mockCount.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/tasks?completed=true");

    expect(response.status).toBe(200);
    expect(response.body.data[0].completed).toBe(true);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { completed: true },
      skip: 0,
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  });

  it("rejects invalid pagination parameters", async () => {
    const response = await request(app)
      .get("/api/tasks?page=0&limit=10");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Page must be a positive integer",
    );
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("GET /api/tasks/:id returns a task", async () => {
    mockFindUnique.mockResolvedValue(sampleTask);

    const response = await request(app).get("/api/tasks/1");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("GET /api/tasks/:id rejects an invalid ID", async () => {
    const response = await request(app).get("/api/tasks/abc");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Task ID must be a positive integer",
    );
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("GET /api/tasks/:id returns 404 when the task does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await request(app).get("/api/tasks/99999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  it("GET /api/tasks/:id forwards database errors to the error handler", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockFindUnique.mockRejectedValue(new Error("Database failure"));

    const response = await request(app).get("/api/tasks/1");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal server error");
  });

  it("POST /api/tasks creates a task", async () => {
    mockCreate.mockResolvedValue({
      ...sampleTask,
      title: "Build automated tests",
    });

    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "Build automated tests" });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Build automated tests");
    expect(mockCreate).toHaveBeenCalledWith({
      data: { title: "Build automated tests" },
    });
  });

  it("rejects an empty title", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "title",
          message: "Title is required",
        }),
      ]),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a title longer than 200 characters", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "A".repeat(201) });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "title",
          message: "Title must not exceed 200 characters",
        }),
      ]),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("PATCH /api/tasks/:id updates a task", async () => {
    mockFindUnique.mockResolvedValue(sampleTask);
    mockUpdate.mockResolvedValue({
      ...sampleTask,
      completed: true,
    });

    const response = await request(app)
      .patch("/api/tasks/1")
      .send({ completed: true });

    expect(response.status).toBe(200);
    expect(response.body.data.completed).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { completed: true },
    });
  });

  it("rejects an invalid task ID", async () => {
    const response = await request(app)
      .patch("/api/tasks/abc")
      .send({ completed: true });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid task ID");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid completed value", async () => {
    const response = await request(app)
      .patch("/api/tasks/1")
      .send({ completed: "yes" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "completed",
          message: "Invalid input: expected boolean, received string",
        }),
      ]),
    );
  });

  it("PATCH /api/tasks/:id rejects an empty update", async () => {
    const response = await request(app)
      .patch("/api/tasks/6")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            "At least one field must be provided for an update",
        }),
      ]),
    );

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a missing task", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .patch("/api/tasks/999999")
      .send({ completed: true });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  it("DELETE /api/tasks/:id deletes a task", async () => {
    mockFindUnique.mockResolvedValue(sampleTask);
    mockDelete.mockResolvedValue(sampleTask);

    const response = await request(app).delete("/api/tasks/1");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("returns 404 when deleting a missing task", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await request(app).delete("/api/tasks/999999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 500 when a database operation fails", async () => {
    mockFindMany.mockRejectedValue(new Error("Simulated database failure"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal server error");
  });
});