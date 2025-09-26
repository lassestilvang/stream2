import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();

// Mock console.error for component tests
global.console.error = jest.fn();

// Mock better-sqlite3 for tests
jest.mock("better-sqlite3", () =>
  jest.fn(() => ({
    exec: jest.fn(),
    prepare: jest.fn(() => ({
      raw: jest.fn(),
      run: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
    })),
    close: jest.fn(),
  }))
);

// Mock NextAuth and related packages
jest.mock("next-auth", () => ({
  default: jest.fn(() => ({
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
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
