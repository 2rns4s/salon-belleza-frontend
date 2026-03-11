import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/**/*.spec.js"],
        setupFiles: ["tests/setup/test-setup.js"],
        clearMocks: true,
        restoreMocks: true,
    },
});
