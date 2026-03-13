import { beforeEach, describe, expect, it, vi } from "vitest";

function encodeBase64Url(value) {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwtWithRole(role = "OWNER", username = "owner") {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify({ rol: role, nombreUsuario: username, exp: Math.floor(Date.now() / 1000) + 3600 }));
    return `${header}.${body}.signature`;
}

function createJsonResponse({ ok = true, status = 200, data = [] } = {}) {
    return {
        ok,
        status,
        headers: { get: () => "application/json" },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function saveSession(role = "OWNER", username = "owner") {
    const { guardarSesion } = await import("../../src/shared/state/authStore.js");

    guardarSesion({ usuario: username, rol: role, token: createJwtWithRole(role, username) });
}

async function clearSession() {
    const { limpiarSesion } = await import("../../src/shared/state/authStore.js");

    limpiarSesion();
}

describe("empleados module smoke", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.restoreAllMocks();
        localStorage.clear();
        await clearSession();
        window.appFeatureRoutes = [];
        window.location.hash = "";
        document.body.innerHTML = "<main class=\"app__content\"></main>";
    });

    it("registra la ruta /empleados y renderiza el shell del modulo para OWNER", async () => {
        await saveSession("OWNER", "owner");

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve(createJsonResponse({ ok: true, status: 200, data: [] })),
        );

        await import("../../src/features/empleados/empleados.routes.js");

        const empleadosRoute = window.appFeatureRoutes?.find((r) => r?.path === "/empleados");
        expect(empleadosRoute).toBeTruthy();

        empleadosRoute.handler(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".employees__title")?.textContent).toContain("Gestion de Empleados");
        expect(fetchSpy).toHaveBeenCalled();
    });

    it("RECEPTIONIST es redirigido a /dashboard al intentar abrir /empleados", async () => {
        await saveSession("RECEPTIONIST", "recep");
        window.location.hash = "#/empleados";

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve(createJsonResponse({ ok: true, status: 200, data: [] })),
        );

        await import("../../src/features/empleados/empleados.routes.js");

        const empleadosRoute = window.appFeatureRoutes?.find((r) => r?.path === "/empleados");
        expect(empleadosRoute).toBeTruthy();

        empleadosRoute.handler(document.querySelector(".app__content"));
        await flushPromises();

        expect(window.location.hash).toBe("#/dashboard");
        expect(document.querySelector(".employees__title")).toBeNull();
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
