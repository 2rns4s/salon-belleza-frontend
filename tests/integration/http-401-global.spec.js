import { beforeEach, describe, expect, it, vi } from "vitest";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: {
            get: () => "application/json",
        },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

function wait(ms = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe("http 401 global handling", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("executes unauthorized callback only once while handling concurrent 401 errors", async () => {
        const { httpClient, setUnauthorizedHandler } = await import("../../src/shared/services/httpClient.js");

        let callbackExecutions = 0;
        setUnauthorizedHandler(async () => {
            callbackExecutions += 1;
            await wait(30);
        });

        vi.spyOn(globalThis, "fetch").mockImplementation(() => (
            Promise.resolve(createJsonResponse({
                ok: false,
                status: 401,
                data: { message: "Token expirado" },
            }))
        ));

        await Promise.allSettled([
            httpClient("/api/v1/citas"),
            httpClient("/api/v1/disponibilidad"),
        ]);

        expect(callbackExecutions).toBe(1);
    });

    it("executes unauthorized callback for 403 responses too", async () => {
        const { httpClient, setUnauthorizedHandler } = await import("../../src/shared/services/httpClient.js");

        let callbackExecutions = 0;
        setUnauthorizedHandler(async () => {
            callbackExecutions += 1;
        });

        vi.spyOn(globalThis, "fetch").mockImplementation(() => (
            Promise.resolve(createJsonResponse({
                ok: false,
                status: 403,
                data: { message: "Acceso denegado" },
            }))
        ));

        await expect(httpClient("/api/v1/citas?fecha=2026-03-11")).rejects.toMatchObject({ status: 403 });
        expect(callbackExecutions).toBe(1);
    });

    it("clears session and redirects to /auth when bootstrap global callback handles 401", async () => {
        const { guardarSesion, obtenerEstadoAuth, obtenerToken } = await import("../../src/shared/state/authStore.js");
        const { httpClient } = await import("../../src/shared/services/httpClient.js");
        const { initializeApp } = await import("../../src/app/bootstrap.js");

        document.body.innerHTML = "<main class=\"app__content\"></main>";
        window.appFeatureRoutes = [
            {
                path: "/auth",
                handler: () => {},
            },
        ];

        initializeApp();

        guardarSesion({
            usuario: "recepcion",
            rol: "RECEPTIONIST",
            token: "jwt-token",
        });

        expect(obtenerEstadoAuth().sesionIniciada).toBe(true);

        vi.spyOn(globalThis, "fetch").mockImplementation(() => (
            Promise.resolve(createJsonResponse({
                ok: false,
                status: 401,
                data: { message: "Token expirado" },
            }))
        ));

        await expect(httpClient("/api/v1/citas")).rejects.toMatchObject({ status: 401 });

        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
        expect(obtenerToken()).toBeNull();
        expect(window.location.hash).toBe("#/auth");
    });
});
