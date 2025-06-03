module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/frontend/tests"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  coveragePathIgnorePatterns: ["src/middleware/autenticacion.js"],
  testPathIgnorePatterns: ["/e2e/"],
};
