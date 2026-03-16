import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/**/*.spec.js"],
        setupFiles: ["tests/setup/test-setup.js"],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
            },
        },
    },
});
