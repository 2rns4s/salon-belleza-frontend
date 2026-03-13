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

const SAMPLE_RESOURCES = [
    { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
    { idRecurso: 2, nombre: "Tinte", cantidadTotal: 10 },
];

describe("recursos CRUD integration", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });
    });

    it("RECURSOS-LIST-01: carga y muestra la lista de recursos al inicializar", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: SAMPLE_RESOURCES }),
        );

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        expect(document.querySelector("[data-resource-edit-id='1']")).not.toBeNull();
        expect(document.querySelector("[data-resource-edit-id='2']")).not.toBeNull();
        expect(document.querySelector(".resource-list__table-cell--name")?.textContent).toContain("Tijeras");
    });

    it("RECURSOS-CREATE-01: el botón 'Nuevo recurso' abre el modal de creación", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: [] }),
        );

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#resources-open-create-btn")?.click();

        expect(document.querySelector("#resources-form")).not.toBeNull();
        expect(document.querySelector("#resources-name")).not.toBeNull();
        expect(document.querySelector("#resources-total-quantity")).not.toBeNull();
    });

    it("RECURSOS-CREATE-02: el formulario envía CrearRecursoRequest y refresca la lista", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 201, data: { idRecurso: 3, nombre: "Gel", cantidadTotal: 20 } }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [{ idRecurso: 3, nombre: "Gel", cantidadTotal: 20 }] }));

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#resources-open-create-btn")?.click();

        const nameInput = document.querySelector("#resources-name");
        const qtyInput = document.querySelector("#resources-total-quantity");
        nameInput.value = "Gel";
        qtyInput.value = "20";

        const form = document.querySelector("#resources-form");
        form.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();

        const postCall = fetchSpy.mock.calls.find(([url, opts]) => opts?.method === "POST");
        expect(postCall).toBeTruthy();
        expect(JSON.parse(postCall[1].body)).toEqual({ nombre: "Gel", cantidadTotal: 20 });
        expect(document.querySelector("[data-resource-edit-id='3']")).not.toBeNull();
    });

    it("RECURSOS-CREATE-03: muestra errores de validación cuando el nombre es corto", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: [] }),
        );

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#resources-open-create-btn")?.click();

        document.querySelector("#resources-name").value = "ab";
        document.querySelector("#resources-total-quantity").value = "5";

        document.querySelector("#resources-form").dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expect(document.querySelector(".resource-form__field-error")).not.toBeNull();
    });

    it("RECURSOS-EDIT-01: el botón de editar precarga el formulario con los datos del recurso", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: SAMPLE_RESOURCES }),
        );

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-resource-edit-id='1']")?.click();

        const nameInput = document.querySelector("#resources-name");
        expect(nameInput?.value).toBe("Tijeras");
        expect(document.querySelector("#resources-total-quantity")?.value).toBe("5");
    });

    it("RECURSOS-DELETE-01: el botón de eliminar abre el diálogo de confirmación", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: SAMPLE_RESOURCES }),
        );

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-resource-delete-id='1']")?.click();

        expect(document.querySelector("#resources-confirm-delete-btn")).not.toBeNull();
        expect(document.querySelector("#resources-cancel-delete-btn")).not.toBeNull();
    });

    it("RECURSOS-DELETE-02: confirmar eliminación llama a DELETE y refresca la lista", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: SAMPLE_RESOURCES }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 204, data: null }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [SAMPLE_RESOURCES[1]] }));

        const { initRecursos } = await import("../../src/features/recursos/recursos.controller.js");
        initRecursos(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-resource-delete-id='1']")?.click();
        document.querySelector("#resources-confirm-delete-btn")?.click();
        await flushPromises();
        await flushPromises();

        const deleteCall = fetchSpy.mock.calls.find(([url, opts]) => opts?.method === "DELETE");
        expect(deleteCall).toBeTruthy();
        expect(deleteCall[0]).toContain("/api/v1/recursos/1");
        expect(document.querySelector("[data-resource-edit-id='1']")).toBeNull();
    });

    it("RECURSOS-ACCESS-01: un RECEPTIONIST es redirigido a /dashboard al intentar abrir /recursos", async () => {
        vi.resetModules();
        limpiarSesion();

        const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const body = encodeBase64Url(JSON.stringify({ rol: "RECEPTIONIST", nombreUsuario: "recep", exp: Math.floor(Date.now() / 1000) + 3600 }));
        guardarSesion({ usuario: "recep", rol: "RECEPTIONIST", token: `${header}.${body}.signature` });

        window.appFeatureRoutes = [];
        window.location.hash = "#/recursos";

        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: [] }),
        );

        await import("../../src/features/recursos/recursos.routes.js");
        const recursosRoute = window.appFeatureRoutes.find((r) => r?.path === "/recursos");
        expect(recursosRoute).toBeTruthy();

        recursosRoute.handler(document.querySelector(".app__content"));

        expect(window.location.hash).toBe("#/dashboard");
        expect(document.querySelector(".resource-list__title")).toBeNull();
    });
});
