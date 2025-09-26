import { testDb, setupTestDb, teardownTestDb, clearTestDb } from "./test-db";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })),
  },
  NextRequest: jest.fn(),
}));

// Mock the db import to use testDb
jest.mock("@/lib/db", () => ({
  db: testDb,
}));

import { POST } from "@/app/api/register/route";
import { NextRequest } from "next/server";

// Mock NextRequest
const createMockNextRequest = (
  url: string,
  options: RequestInit & { jsonBody?: unknown }
) => {
  const request = new Request(url, {
    ...options,
    body: options.jsonBody ? JSON.stringify(options.jsonBody) : options.body,
  });
  const mockRequest = Object.assign(request, {
    cookies: {
      get: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    nextUrl: new URL(url),
    page: {},
    ua: {},
    json: () => Promise.resolve(options.jsonBody || {}),
  });
  return mockRequest as unknown as NextRequest;
};

describe("POST /api/register", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("successful registration", () => {
    it("should create a user without name", async () => {
      const request = createMockNextRequest(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          jsonBody: {
            email: "test2@example.com",
            password: "password123",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBeNull();
    });
  });

  describe("duplicate email", () => {});

  describe("validation errors", () => {
    it("should return 400 when email is missing", async () => {
      const request = createMockNextRequest(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          jsonBody: {
            password: "password123",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 400 when password is missing", async () => {
      const request = createMockNextRequest(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          jsonBody: {
            email: "test@example.com",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 500 on database error", async () => {
      // Mock db.insert to throw error
      const originalInsert = testDb.insert;
      testDb.insert = jest.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const request = createMockNextRequest(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          jsonBody: {
            email: "test@example.com",
            password: "password123",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");

      // Restore original
      testDb.insert = originalInsert;
    });
  });
});
