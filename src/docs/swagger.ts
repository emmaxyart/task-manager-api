import swaggerUi from "swagger-ui-express";
import type { OpenAPIV3 } from "openapi-types";

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "Task Manager API",
    version: "1.0.0",
    description:
      "REST API for managing tasks with pagination and filtering.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],

  tags: [
    { name: "Health", description: "Health checks" },
    { name: "Tasks", description: "Task management" },
  ],

  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Get API welcome message",
        responses: {
          "200": { description: "Welcome message returned" },
        },
      },
    },

    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": { description: "API is running" },
        },
      },
    },

    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        description:
          "Returns tasks ordered by creation date, newest first.",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
          },
          {
            name: "completed",
            in: "query",
            description: "Filter tasks by completion status",
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": { description: "Tasks returned successfully" },
          "400": { description: "Invalid query parameters" },
          "500": { description: "Internal server error" },
        },
      },

      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    example: "Learn TypeScript",
                  },
                  completed: {
                    type: "boolean",
                    default: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Task created successfully" },
          "400": { description: "Invalid task data" },
          "500": { description: "Internal server error" },
        },
      },
    },

    "/api/tasks/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Task ID",
          schema: { type: "integer", minimum: 1 },
        },
      ],

      get: {
        tags: ["Tasks"],
        summary: "Get a task by ID",
        responses: {
          "200": { description: "Task returned successfully" },
          "400": { description: "Invalid task ID" },
          "404": { description: "Task not found" },
          "500": { description: "Internal server error" },
        },
      },

      patch: {
        tags: ["Tasks"],
        summary: "Update a task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                minProperties: 1,
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                  },
                  completed: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Task updated successfully" },
          "400": { description: "Invalid task ID or update data" },
          "404": { description: "Task not found" },
          "500": { description: "Internal server error" },
        },
      },

      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        responses: {
          "200": { description: "Task deleted successfully" },
          "400": { description: "Invalid task ID" },
          "404": { description: "Task not found" },
          "500": { description: "Internal server error" },
        },
      },
    },
  },
};

export { swaggerUi };
