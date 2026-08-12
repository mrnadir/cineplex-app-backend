import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/workers/**"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testTimeout: 15000,
  clearMocks: true,
};

export default config;
