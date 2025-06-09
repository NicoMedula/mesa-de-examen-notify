module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/backend"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts", "**/*.spec.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Thresholds específicos para archivos críticos
    "./backend/controllers/": {
      branches: 80,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "./backend/services/": {
      branches: 80,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "./backend/repositories/": {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/backend/$1",
  },
  coveragePathIgnorePatterns: [
    "node_modules/",
    "dist/",
    "coverage/",
    "\\*.test\\.ts$",
    "e2e/",
    "frontend/",
    "playwright-report/",
    "test-results/",
    "backend/index.ts", // Archivo de entrada
    "backend/config/supabase.ts", // Configuración
    "backend/routes/", // Rutas (se testean indirectamente)
  ],
  testPathIgnorePatterns: [
    "/e2e/",
    "/frontend/",
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "playwright-report/",
    "test-results/",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "backend/**/*.ts",
    "!backend/**/*.test.ts",
    "!backend/**/*.spec.ts",
    "!backend/**/node_modules/**",
    "!backend/dist/**",
    "!backend/index.ts",
    "!backend/config/supabase.ts",
    "!backend/routes/**",
  ],
};
