import { describe, expect, it, vi } from "vitest";
import { guardarSesion } from "../../src/shared/state/authStore.js";

function encodeBase64Url(value) {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createOwnerJwt() {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify({ rol: "OWNER", nombreUsuario: "owner", exp: Math.floor(Date.now() / 1000) + 3600 }));
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

describe("servicios module smoke", () => {
    it("registra la ruta /servicios y renderiza el shell del módulo para OWNER", async () => {
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });

        vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve(createJsonResponse({ ok: true, status: 200, data: [] })),
        );

        await import("../../src/features/servicios/servicios.routes.js");

        const serviciosRoute = window.appFeatureRoutes?.find((r) => r?.path === "/servicios");
        expect(serviciosRoute).toBeTruthy();

        serviciosRoute.handler();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".service-list__title")?.textContent).toContain("Gestión de Servicios");
    });
});
