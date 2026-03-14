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

function mockServiciosWithCatalog(catalog = []) {
    return vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
        const method = options.method || "GET";
        const requestUrl = String(url);

        if (requestUrl.includes("/api/v1/servicios") && method === "GET") {
            return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: [] }));
        }

        if (requestUrl.includes("/api/v1/recursos") && method === "GET") {
            return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: catalog }));
        }

        if (requestUrl.includes("/api/v1/servicios") && method === "POST") {
            return Promise.resolve(createJsonResponse({
                ok: true,
                status: 201,
                data: { idServicio: 99, nombre: "Servicio", duracion: 40, recursos: [] },
            }));
        }

        return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: {} }));
    });
}

async function openCreateModal() {
    const { initServicios } = await import("../../src/features/servicios/servicios.controller.js");
    initServicios(document.querySelector(".app__content"));
    await flushPromises();
    await flushPromises();

    document.querySelector("#services-open-create-btn")?.click();
    await flushPromises();
    await flushPromises();
}

describe("servicios recursos requeridos dinámicos", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });
    });

    it("SERVICIOS-ROWS-ADD-01: agrega filas dinámicas con rowId único", async () => {
        mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();
        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        const rows = document.querySelectorAll("[data-required-resource-row-id]");
        expect(rows.length).toBe(2);
        const ids = Array.from(rows).map((r) => r.getAttribute("data-required-resource-row-id"));
        expect(new Set(ids).size).toBe(2);
    });

    it("SERVICIOS-ROWS-REMOVE-01: elimina una fila específica sin afectar las demás", async () => {
        mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        const firstRemoveButton = document.querySelector("[data-required-resource-remove]");
        const removedRowId = firstRemoveButton.getAttribute("data-required-resource-remove");
        firstRemoveButton.click();
        await flushPromises();

        const rows = document.querySelectorAll("[data-required-resource-row-id]");
        expect(rows.length).toBe(1);
        expect(rows[0].getAttribute("data-required-resource-row-id")).not.toBe(removedRowId);
    });

    it("SERVICIOS-ROWS-PRESERVE-01: conserva valores existentes al agregar nuevas filas", async () => {
        mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        let select = document.querySelector("[data-required-resource-field='resourceId']");
        let qty = document.querySelector("[data-required-resource-field='quantity']");
        select.value = "2";
        qty.value = "3";

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        const firstRow = document.querySelectorAll("[data-required-resource-row-id]")[0];
        const firstRowSelect = firstRow.querySelector("[data-required-resource-field='resourceId']");
        const firstRowQty = firstRow.querySelector("[data-required-resource-field='quantity']");

        expect(firstRowSelect.value).toBe("2");
        expect(firstRowQty.value).toBe("3");
    });

    it("SERVICIOS-BOUNDARY-READFORM-01: al agregar fila conserva nombre y duracion capturados desde DOM", async () => {
        mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        document.querySelector("#services-name").value = "Servicio premium";
        document.querySelector("#services-duration").value = "55";

        const firstRow = document.querySelector("[data-required-resource-row-id]");
        firstRow.querySelector("[data-required-resource-field='resourceId']").value = "2";
        firstRow.querySelector("[data-required-resource-field='quantity']").value = "3";

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        expect(document.querySelector("#services-name")?.value).toBe("Servicio premium");
        expect(document.querySelector("#services-duration")?.value).toBe("55");

        const rows = document.querySelectorAll("[data-required-resource-row-id]");
        const firstRowSelect = rows[0].querySelector("[data-required-resource-field='resourceId']");
        const firstRowQty = rows[0].querySelector("[data-required-resource-field='quantity']");

        expect(rows.length).toBe(2);
        expect(firstRowSelect.value).toBe("2");
        expect(firstRowQty.value).toBe("3");
    });

    it("SERVICIOS-VALIDATION-NOROWS: rechaza submit sin recursos requeridos", async () => {
        mockServiciosWithCatalog([{ idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 }]);

        await openCreateModal();

        document.querySelector("#services-name").value = "Corte";
        document.querySelector("#services-duration").value = "30";

        document.querySelector("#services-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expect(document.querySelector(".service-form__field-error")?.textContent).toContain("al menos un recurso");
    });

    it("SERVICIOS-VALIDATION-DUPLICATE: rechaza recursos repetidos en distintas filas", async () => {
        mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        document.querySelector("#services-name").value = "Corte";
        document.querySelector("#services-duration").value = "30";

        const selects = document.querySelectorAll("[data-required-resource-field='resourceId']");
        const qtys = document.querySelectorAll("[data-required-resource-field='quantity']");
        selects[0].value = "1";
        selects[1].value = "1";
        qtys[0].value = "1";
        qtys[1].value = "2";

        document.querySelector("#services-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expect(document.querySelector(".service-form__field-error")?.textContent).toContain("No puedes repetir");
    });

    it("SERVICIOS-VALIDATION-QTYINVALID: rechaza cantidades requeridas menores a 1", async () => {
        mockServiciosWithCatalog([{ idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 }]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        document.querySelector("#services-name").value = "Corte";
        document.querySelector("#services-duration").value = "30";

        document.querySelector("[data-required-resource-field='resourceId']").value = "1";
        document.querySelector("[data-required-resource-field='quantity']").value = "0";

        document.querySelector("#services-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expect(document.querySelector(".service-form__field-error")?.textContent).toContain("al menos 1");
    });

    it("SERVICIOS-SERIAL-01: serializa múltiples filas a recursos[] con idRecurso y cantidadRequerida", async () => {
        const fetchSpy = mockServiciosWithCatalog([
            { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
            { idRecurso: 2, nombre: "Tinte", cantidadTotal: 6 },
        ]);

        await openCreateModal();

        document.querySelector("#services-add-resource-btn")?.click();
        document.querySelector("#services-add-resource-btn")?.click();
        await flushPromises();

        document.querySelector("#services-name").value = "Servicio completo";
        document.querySelector("#services-duration").value = "75";

        const selects = document.querySelectorAll("[data-required-resource-field='resourceId']");
        const qtys = document.querySelectorAll("[data-required-resource-field='quantity']");

        selects[0].value = "1";
        qtys[0].value = "2";
        selects[1].value = "2";
        qtys[1].value = "4";

        document.querySelector("#services-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/servicios") && options?.method === "POST");
        expect(postCall).toBeTruthy();

        const body = JSON.parse(postCall[1].body);
        expect(body).toEqual({
            nombre: "Servicio completo",
            duracion: 75,
            recursos: [
                { idRecurso: 1, cantidadRequerida: 2 },
                { idRecurso: 2, cantidadRequerida: 4 },
            ],
        });
        expect(JSON.stringify(body)).not.toContain("rowId");
    });
});
