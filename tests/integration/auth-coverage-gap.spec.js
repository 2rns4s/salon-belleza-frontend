import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: { get: () => "application/json" },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

function setupAuthContainer() {
    const container = document.createElement("div");
    container.className = "app__content";
    document.body.appendChild(container);
    return container;
}

describe("auth.routes.js route registration", () => {
    it("AUTH-ROUTES-01: routes registered and handler covers renderAuthRoute lines", async () => {
        // Create container before import
        const container = document.createElement("div");
        container.className = "app__content";
        document.body.appendChild(container);
        
        await import("../../src/features/auth/auth.routes.js");
        
        // Verify routes registered
        expect(window.appFeatureRoutes).toBeDefined();
        expect(window.appFeatureRoutes.length).toBeGreaterThanOrEqual(2);
        
        const rootRoute = window.appFeatureRoutes.find(route => route.path === "/");
        expect(rootRoute).toBeDefined();
        expect(typeof rootRoute.handler).toBe("function");
        
        // Call handler to cover renderAuthRoute and initAuth lines
        rootRoute.handler();
        
        // Verify render happened
        expect(container.querySelector("#login-form")).toBeTruthy();
        
        // Cover missing container branch
        document.body.innerHTML = "";
        expect(() => rootRoute.handler()).not.toThrow();
    });
});

describe("auth.service.js login() function", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("AUTH-SERVICE-LOGIN-01: login sends POST with correct payload", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { token: "jwt-token-123" } }),
        );

        const { login } = await import("../../src/features/auth/auth.service.js");
        const result = await login("testuser", "pass123");

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/login",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    nombreUsuario: "testuser",
                    contrasena: "pass123",
                }),
            }),
        );
        expect(result).toEqual({ token: "jwt-token-123" });
    });

    it("AUTH-SERVICE-LOGIN-02: login with different credentials calls correct endpoint", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { token: "jwt-abc" } }),
        );

        const { login } = await import("../../src/features/auth/auth.service.js");
        const result = await login("admin", "secretPass!");

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/login",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    nombreUsuario: "admin",
                    contrasena: "secretPass!",
                }),
            }),
        );
        expect(result).toEqual({ token: "jwt-abc" });
    });
});

describe("auth.service.js verificarMfa() function", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("AUTH-SERVICE-MFA-01: verificarMfa sends POST with token and code", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { token: "final-jwt-token" } }),
        );

        const { verificarMfa } = await import("../../src/features/auth/auth.service.js");
        const result = await verificarMfa("abc123", "456789");

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/verify-mfa",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    preAuthToken: "abc123",
                    totpCode: "456789",
                }),
            }),
        );
        expect(result).toEqual({ token: "final-jwt-token" });
    });

    it("AUTH-SERVICE-MFA-02: verificarMfa includes username when provided", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { token: "jwt" } }),
        );

        const { verificarMfa } = await import("../../src/features/auth/auth.service.js");
        await verificarMfa("token789", "123456", "user1");

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/verify-mfa",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    preAuthToken: "token789",
                    totpCode: "123456",
                    nombreUsuario: "user1",
                }),
            }),
        );
    });

    it("AUTH-SERVICE-MFA-03: verificarMfa omits username when not provided", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { token: "jwt" } }),
        );

        const { verificarMfa } = await import("../../src/features/auth/auth.service.js");
        await verificarMfa("token456", "654321");

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/verify-mfa",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    preAuthToken: "token456",
                    totpCode: "654321",
                }),
            }),
        );
        
        // Verify username is not in the body
        const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
        expect(callBody.nombreUsuario).toBeUndefined();
    });
});

describe("auth.controller.js initAuth() entry point", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("AUTH-CONTROLLER-INIT-01: initAuth sets container and resets state", async () => {
        const container = setupAuthContainer();
        
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        
        // Should not throw
        expect(() => initAuth(container)).not.toThrow();
        
        // After initAuth, container should have rendered content (login form)
        expect(container.innerHTML.length).toBeGreaterThan(0);
        expect(container.innerHTML).toContain("login-form");
    });

    it("AUTH-CONTROLLER-INIT-02: initAuth with different container reinitializes", async () => {
        const container1 = setupAuthContainer();
        const container2 = document.createElement("div");
        container2.className = "app__content";
        document.body.appendChild(container2);
        
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        
        initAuth(container1);
        expect(container1.innerHTML.length).toBeGreaterThan(0);
        
        // Initialize with second container
        initAuth(container2);
        expect(container2.innerHTML.length).toBeGreaterThan(0);
    });
});