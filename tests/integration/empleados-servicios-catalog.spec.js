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

describe("empleados catalogo de servicios", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });
    });

    it("EMPLEADOS-CATALOG-LOADING: al abrir modal muestra banner de carga", async () => {
        const deferredCatalog = createDeferred();

        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockImplementationOnce(() => deferredCatalog.promise);

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();

        expect(document.querySelector(".employees-catalog__state--loading")?.textContent).toContain("Cargando catalogo");

        deferredCatalog.resolve(createJsonResponse({ ok: true, status: 200, data: [] }));
        await flushPromises();
        await flushPromises();
    });

    it("EMPLEADOS-CATALOG-EMPTY: muestra banner vacio cuando no hay servicios", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".employees-catalog__state--empty")?.textContent).toContain("No hay servicios disponibles");
    });

    it("EMPLEADOS-CATALOG-ERROR: ante fallo del catalogo muestra banner de error", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: false, status: 500, data: { message: "error" } }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".employees-catalog__state--error")?.textContent).toContain("No se pudo cargar");
    });

    it("EMPLEADOS-CATALOG-RETRY: reabre modal tras error y reintenta cargar catalogo", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: false, status: 500, data: { message: "error" } }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [{ idServicio: 9, nombre: "Masaje" }],
            }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();
        expect(document.querySelector(".employees-catalog__state--error")).not.toBeNull();

        document.querySelector("#employees-close-modal-btn")?.click();
        await flushPromises();
        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        const catalogCalls = fetchSpy.mock.calls.filter(([url]) => String(url).includes("/api/v1/servicios"));
        expect(catalogCalls.length).toBe(2);
        expect(document.querySelector("[data-employee-service-checkbox][value='9']")).not.toBeNull();
    });

    it("EMPLEADOS-CATALOG-READY: con catalogo listo, renderiza checkboxes seleccionables", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [
                    { idServicio: 1, nombre: "Corte" },
                    { idServicio: 2, nombre: "Color" },
                ],
            }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        const checkboxes = document.querySelectorAll("[data-employee-service-checkbox]");
        expect(checkboxes.length).toBe(2);

        const labels = Array.from(document.querySelectorAll(".employees-catalog__label")).map((node) => node.textContent || "");
        expect(labels.some((label) => label.includes("Corte"))).toBe(true);
        expect(labels.some((label) => label.includes("Color"))).toBe(true);
    });
});
