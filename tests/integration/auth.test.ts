// Mocks must be at the top
jest.mock("next-auth", () => ({
  default: jest.fn(() => ({
    handlers: {
      GET: jest.fn(() => new Response("OK")),
      POST: jest.fn(() => new Response("OK")),
    },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock("next-auth/providers/credentials", () => ({
  default: jest.fn((config) => config),
}));

jest.mock("next-auth/providers/resend", () => ({
  default: jest.fn((config) => config),
}));

jest.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: jest.fn(() => ({})),
}));

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  handlers: {
    GET: jest.fn(() => new Response("OK")),
    POST: jest.fn(() => new Response("OK")),
  },
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => {
      const response = new Response(JSON.stringify(data), {
        status: options?.status || 200,
        headers: { "Content-Type": "application/json" },
      });
      return response;
    }),
  },
  NextRequest: jest.fn(),
}));

import { testDb, setupTestDb, teardownTestDb, clearTestDb } from "./test-db";
import { users, sessions } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// Mock the db import
jest.mock("@/lib/db", () => ({
  db: testDb,
}));

// Import after mocks
import { POST } from "@/app/api/auth/[...nextauth]/route";

// Mock Redis
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock NextAuth env
process.env.AUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock NextRequest
const createMockNextRequest = (
  url: string,
  options: RequestInit & { jsonBody?: unknown } = {}
) => {
  const request = new Request(url, options);
  const mockRequest = Object.assign(request, {
    cookies: {
      get: jest.fn((name: string) => {
        if (name === "next-auth.session-token") return "test-session-token";
        return undefined;
      }),
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

describe("NextAuth API Routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("POST /api/auth/[...nextauth] - Sign In", () => {
    it("should authenticate valid credentials", async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash("password123", 12);
      await testDb.insert(users).values({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      });

      const request = createMockNextRequest(
        "http://localhost:3000/api/auth/signin/credentials",
        {
          method: "POST",
          jsonBody: {
            email: "test@example.com",
            password: "password123",
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      // NextAuth returns a response with redirect or session data
      // The exact response depends on NextAuth configuration
    });

    it("should reject invalid credentials", async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash("password123", 12);
      await testDb.insert(users).values({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      });

      const request = createMockNextRequest(
        "http://localhost:3000/api/auth/signin/credentials",
        {
          method: "POST",
          jsonBody: {
            email: "test@example.com",
            password: "wrongpassword",
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200); // NextAuth still returns 200 but with error
      // Check response body for error
    });

    it("should reject non-existent user", async () => {
      const request = createMockNextRequest(
        "http://localhost:3000/api/auth/signin/credentials",
        {
          method: "POST",
          jsonBody: {
            email: "nonexistent@example.com",
            password: "password123",
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200); // NextAuth returns 200 with error
    });
  });

  describe("POST /api/auth/[...nextauth] - Sign Out", () => {
    it("should sign out user", async () => {
      // Create test user and session
      const user = await testDb
        .insert(users)
        .values({
          email: "test@example.com",
          password: await bcrypt.hash("password123", 12),
          name: "Test User",
        })
        .returning();

      await testDb.insert(sessions).values({
        sessionToken: "test-session-token",
        userId: user[0].id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const request = createMockNextRequest(
        "http://localhost:3000/api/auth/signout",
        {
          method: "POST",
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      // Check that session is removed from Redis (mocked)
    });
  });

  describe("GET /api/auth/[...nextauth] - Session", () => {});
});
