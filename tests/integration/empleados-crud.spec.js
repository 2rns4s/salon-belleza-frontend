import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/empleados/create-success.json";
import error409Fixture from "../fixtures/empleados/error-409.json";
import listSuccessFixture from "../fixtures/empleados/list-success.json";
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

describe("empleados CRUD integration", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createJwtWithRole("OWNER", "owner") });
    });

    it("EMPLEADOS-LIST-01: carga y muestra el listado inicial de empleados", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            createJsonResponse({ ok: true, status: 200, data: listSuccessFixture }),
        );

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        expect(document.querySelector("[data-employee-edit-id='21']")).not.toBeNull();
        expect(document.querySelector("[data-employee-edit-id='22']")).not.toBeNull();
        expect(document.querySelector(".employees__table-cell--name")?.textContent).toContain("Laura Diaz");
    });

    it("EMPLEADOS-CREATE-01: crea un empleado con franja y servicio, luego refresca listado", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [
                    { idServicio: 1, nombre: "Corte" },
                    { idServicio: 2, nombre: "Color" },
                ],
            }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 201, data: createSuccessFixture }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [createSuccessFixture] }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-first-name").value = "Marta";
        document.querySelector("#employees-last-name").value = "Ruiz";
        document.querySelector("#employees-email").value = "marta.ruiz@salon.com";
        document.querySelector("#employees-phone").value = "3007778899";

        document.querySelector("[data-employee-shift-field='day']").value = "FRIDAY";
        document.querySelector("[data-employee-shift-field='startTime']").value = "10:00";
        document.querySelector("[data-employee-shift-field='endTime']").value = "16:00";

        const firstServiceCheckbox = document.querySelector("[data-employee-service-checkbox][value='1']");
        firstServiceCheckbox.checked = true;

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();
        await flushPromises();

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeTruthy();

        const postBody = JSON.parse(postCall[1].body);
        expect(postBody).toEqual({
            nombre: "Marta",
            apellido: "Ruiz",
            correo: "marta.ruiz@salon.com",
            telefono: "3007778899",
            franjasLaborales: [
                {
                    dia: "FRIDAY",
                    horaInicio: "10:00:00",
                    horaFin: "16:00:00",
                },
            ],
            serviciosIds: [1],
        });
        expect(JSON.stringify(postBody)).not.toContain("rowId");
        expect(document.querySelector("[data-employee-edit-id='23']")).not.toBeNull();
    });

    it("EMPLEADOS-CREATE-02: conflicto 409 mantiene modal, muestra details y conserva estado", async () => {
        window.location.hash = "#/empleados";

        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [{ idServicio: 1, nombre: "Corte" }],
            }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: false,
                status: 409,
                data: error409Fixture,
            }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-open-create-btn")?.click();
        await flushPromises();
        await flushPromises();

        document.querySelector("#employees-first-name").value = "Marta";
        document.querySelector("#employees-last-name").value = "Ruiz";
        document.querySelector("#employees-email").value = "marta.ruiz@salon.com";
        document.querySelector("#employees-phone").value = "3007778899";

        document.querySelector("[data-employee-shift-field='day']").value = "FRIDAY";
        document.querySelector("[data-employee-shift-field='startTime']").value = "10:00";
        document.querySelector("[data-employee-shift-field='endTime']").value = "16:00";

        const firstServiceCheckbox = document.querySelector("[data-employee-service-checkbox][value='1']");
        firstServiceCheckbox.checked = true;

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();
        await flushPromises();

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeTruthy();

        expect(document.querySelector(".employees__modal-overlay")).not.toBeNull();
        expect(document.querySelector("#employees-form")).not.toBeNull();
        expect(document.querySelector(".employee-form__feedback-text")?.textContent).toContain(error409Fixture.message);

        const renderedDetails = Array.from(document.querySelectorAll(".employee-form__feedback-detail"))
            .map((node) => (node.textContent || "").trim())
            .filter(Boolean);
        expect(renderedDetails).toEqual(expect.arrayContaining(error409Fixture.details));

        expect(document.querySelector(".employees__table-row--empty")?.textContent).toContain("No hay empleados registrados");
        expect(document.querySelector(".employees__title")).not.toBeNull();
        expect(window.location.hash).toBe("#/empleados");

        const listGetCalls = fetchSpy.mock.calls.filter(([url, options]) =>
            String(url).includes("/api/v1/empleados") && (!options?.method || options?.method === "GET"),
        );
        expect(listGetCalls).toHaveLength(1);
    });

    it("EMPLEADOS-EDIT-01: edita datos parciales y envia payload permitido para PUT", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [listSuccessFixture[0]] }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: { ...listSuccessFixture[0], nombre: "Laura Editada" },
            }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: [{ ...listSuccessFixture[0], nombre: "Laura Editada" }],
            }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-employee-edit-id='21']")?.click();
        await flushPromises();

        document.querySelector("#employees-first-name").value = "Laura Editada";
        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();
        await flushPromises();
        await flushPromises();

        const putCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados/21") && options?.method === "PUT");
        expect(putCall).toBeTruthy();

        const putBody = JSON.parse(putCall[1].body);
        expect(putBody).toEqual({
            nombre: "Laura Editada",
            apellido: "Diaz",
            correo: "laura.diaz@salon.com",
            telefono: "3001112233",
        });
        expect(JSON.stringify(putBody)).not.toContain("franjasLaborales");
        expect(JSON.stringify(putBody)).not.toContain("serviciosIds");

        expect(document.querySelector(".employees__table-cell--name")?.textContent).toContain("Laura Editada Diaz");
    });

    it("EMPLEADOS-DELETE-01: confirma eliminacion, ejecuta DELETE y refresca el listado", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [listSuccessFixture[0]] }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 204, data: null }))
            .mockResolvedValueOnce(createJsonResponse({ ok: true, status: 200, data: [] }));

        const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
        initEmpleados(document.querySelector(".app__content"));
        await flushPromises();
        await flushPromises();

        document.querySelector("[data-employee-delete-id='21']")?.click();
        await flushPromises();
        document.querySelector("#employees-confirm-delete-btn")?.click();
        await flushPromises();
        await flushPromises();
        await flushPromises();

        const deleteCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados/21") && options?.method === "DELETE");
        expect(deleteCall).toBeTruthy();
        expect(document.querySelector("[data-employee-edit-id='21']")).toBeNull();
    });

    it("EMPLEADOS-ACCESS-01: RECEPTIONIST es redirigido a /dashboard al usar empleados.routes", async () => {
        vi.resetModules();
        limpiarSesion();
        guardarSesion({ usuario: "recep", rol: "RECEPTIONIST", token: createJwtWithRole("RECEPTIONIST", "recep") });

        window.appFeatureRoutes = [];
        window.location.hash = "#/empleados";
        document.body.innerHTML = "<main class=\"app__content\"></main>";

        await import("../../src/features/empleados/empleados.routes.js");
        const route = window.appFeatureRoutes.find((entry) => entry?.path === "/empleados");

        expect(route).toBeTruthy();
        route.handler(document.querySelector(".app__content"));

        expect(window.location.hash).toBe("#/dashboard");
        expect(document.querySelector(".employees__title")).toBeNull();
    });
});
