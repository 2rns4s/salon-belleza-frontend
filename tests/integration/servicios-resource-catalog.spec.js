import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarSesion, limpiarSesion } from "../../src/shared/state/authStore.js";

function encodeBase64Url(value) {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createOwnerJwt() {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify({ rol: "OWNER", nombreUsuario: "owner", exp: Math.floor(Date.now() / 1000) + 3600 }));
    return `${header}.${body}.signature`;
}

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
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

function createDeferred() {
    let resolvePromise;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });
    return { promise, resolve: resolvePromise };
}

describe("servicios catálogo de recursos", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });
    });

    it("SERVICIOS-CATALOG-LOADING: al abrir el modal muestra estado de carga del catálogo", async () => {
        const deferredCatalog = createDeferred();

        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockImplementationOnce(() => deferredCatalog.promise);

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();

        expect(document.querySelector(".service-catalog-banner--loading")?.textContent).toContain("Cargando catálogo");

        deferredCatalog.resolve(createJsonResponse({ ok: true, status: 200, data: [] }));
        await flushPromises();
        await flushPromises();
    });

    it("SERVICIOS-CATALOG-EMPTY: si no hay recursos, muestra banner de catálogo vacío", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".service-catalog-banner--empty")?.textContent).toContain("No hay recursos disponibles");
    });

    it("SERVICIOS-CATALOG-ERROR: ante error de catálogo, muestra banner de error", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: false, status: 500, data: { mensaje: "error" } }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".service-catalog-banner--error")?.textContent).toContain("No se pudo cargar");
    });

    it("SERVICIOS-CATALOG-REFRESH: si falla y se vuelve a abrir, reintenta cargar catálogo", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: false, status: 500, data: { mensaje: "error" } }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [{ idRecurso: 9, nombre: "Brocha", cantidadTotal: 2 }] }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();
        expect(document.querySelector(".service-catalog-banner--error")).not.toBeNull();

        document.querySelector("#services-close-modal-btn")?.click();
        await flushPromises();
        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes("/api/v1/recursos")).length).toBe(2);

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();
        const options = document.querySelectorAll("[data-required-resource-field='resourceId'] option");
        expect(Array.from(options).some((o) => o.textContent.includes("Brocha"))).toBe(true);
    });

    it("SERVICIOS-CATALOG-READY: con catálogo disponible, las filas muestran opciones seleccionables", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [
                    { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
                    { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
                ],
            }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        const options = document.querySelectorAll("[data-required-resource-field='resourceId'] option");
        expect(Array.from(options).some((o) => o.textContent.includes("Tijeras"))).toBe(true);
        expect(Array.from(options).some((o) => o.textContent.includes("Tinte"))).toBe(true);
    });
});
