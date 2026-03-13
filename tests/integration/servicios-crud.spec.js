import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarSesion, limpiarSesion } from "../../src/shared/state/authStore.js";

function encodeBase64Url(value) {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwtWithRole(role = "OWNER", username = "owner") {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify({ rol: role, nombreUsuario: username, exp: Math.floor(Date.now() / 1000) + 3600 }));
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

const SAMPLE_SERVICES = [
    {
        idServicio: 1,
        nombre: "Corte",
        duracion: 30,
        recursos: [{ idRecurso: 1, nombre: "Tijeras", cantidadRequerida: 1 }],
    },
    {
        idServicio: 2,
        nombre: "Peinado",
        duracion: 45,
        recursos: [],
    },
];

const RESOURCE_CATALOG = [
    { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 4 },
    { idRecurso: 2, nombre: "Spray", cantidadTotal: 10 },
];

describe("servicios CRUD integration", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createJwtWithRole("OWNER", "owner") });
    });

    it("SERVICIOS-LIST-01: carga y muestra la lista de servicios al inicializar", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: SAMPLE_SERVICES }),
        );

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        expect(document.querySelector("[data-service-edit-id='1']")).not.toBeNull();
        expect(document.querySelector("[data-service-edit-id='2']")).not.toBeNull();
        expect(document.querySelector(".service-list__table-cell--name")?.textContent).toContain("Corte");
    });

    it("SERVICIOS-CREATE-01: crear servicio serializa recursos requeridos y refresca lista", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: RESOURCE_CATALOG }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 201,
                data: {
                    idServicio: 3,
                    nombre: "Tinte",
                    duracion: 60,
                    recursos: [{ idRecurso: 2, nombre: "Spray", cantidadRequerida: 2 }],
                },
            }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [{ idServicio: 3, nombre: "Tinte", duracion: 60, recursos: [{ idRecurso: 2, nombre: "Spray", cantidadRequerida: 2 }] }],
            }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        document.querySelector("#services-add-resource-btn")?.click();
        const nameInput = document.querySelector("#services-name");
        const durationInput = document.querySelector("#services-duration");
        const resourceSelect = document.querySelector("[data-required-resource-field='resourceId']");
        const quantityInput = document.querySelector("[data-required-resource-field='quantity']");

        nameInput.value = "Tinte";
        durationInput.value = "60";
        resourceSelect.value = "2";
        quantityInput.value = "2";

        document.querySelector("#services-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();

        const postCall = fetchSpy.mock.calls.find(([url, options]) => options?.method === "POST" && String(url).includes("/api/v1/servicios"));
        expect(postCall).toBeTruthy();

        const postBody = JSON.parse(postCall[1].body);
        expect(postBody).toEqual({
            nombre: "Tinte",
            duracion: 60,
            recursos: [{ idRecurso: 2, cantidadRequerida: 2 }],
        });
        expect(JSON.stringify(postBody)).not.toContain("rowId");
        expect(document.querySelector("[data-service-edit-id='3']")).not.toBeNull();
    });

    it("SERVICIOS-EDIT-01: editar servicio precarga nombre, duración y recursos requeridos", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: SAMPLE_SERVICES }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: RESOURCE_CATALOG }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-service-edit-id='1']")?.click();
        await flushPromises();

        expect(document.querySelector("#services-name")?.value).toBe("Corte");
        expect(document.querySelector("#services-duration")?.value).toBe("30");
        expect(document.querySelectorAll("[data-required-resource-row-id]").length).toBe(1);
    });

    it("SERVICIOS-DELETE-01: confirmar eliminación llama DELETE y quita el servicio del listado", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: SAMPLE_SERVICES }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 204, data: null }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [SAMPLE_SERVICES[1]] }));

        const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
        initServicios(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-service-delete-id='1']")?.click();
        document.querySelector("#services-confirm-delete-btn")?.click();
        await flushPromises();
        await flushPromises();

        const deleteCall = fetchSpy.mock.calls.find(([url, options]) => options?.method === "DELETE" && String(url).includes("/api/v1/servicios/1"));
        expect(deleteCall).toBeTruthy();
        expect(document.querySelector("[data-service-edit-id='1']")).toBeNull();
    });

    it("SERVICIOS-ACCESS-01: un RECEPTIONIST es redirigido a /dashboard al intentar abrir /servicios", async () => {
        vi.resetModules();
        limpiarSesion();
        guardarSesion({ usuario: "recep", rol: "RECEPTIONIST", token: createJwtWithRole("RECEPTIONIST", "recep") });
        window.appFeatureRoutes = [];
        window.location.hash = "#/servicios";

        await import("../../src/features/servicios/servicios.routes.js");
        const route = window.appFeatureRoutes.find((r) => r?.path === "/servicios");

        expect(route).toBeTruthy();
        route.handler(document.querySelector(".app__content"));

        expect(window.location.hash).toBe("#/dashboard");
        expect(document.querySelector(".service-list__title")).toBeNull();
    });
});
