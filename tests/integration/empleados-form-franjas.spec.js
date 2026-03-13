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

function mockEmployeesWithCatalog(catalog = []) {
    return vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
        const method = options.method || "GET";
        const requestUrl = String(url);

        if (requestUrl.includes("/api/v1/empleados") && method === "GET") {
            return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: [] }));
        }

        if (requestUrl.includes("/api/v1/servicios") && method === "GET") {
            return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: catalog }));
        }

        if (requestUrl.includes("/api/v1/empleados") && method === "POST") {
            return Promise.resolve(createJsonResponse({
                ok: true,
                status: 201,
                data: {
                    idEmpleado: 70,
                    nombre: "Marta",
                    apellido: "Ruiz",
                    correo: "marta.ruiz@salon.com",
                    telefono: "3007778899",
                    franjasLaborales: [],
                    serviciosIds: [],
                },
            }));
        }

        return Promise.resolve(createJsonResponse({ ok: true, status: 200, data: {} }));
    });
}

function fillCreateMainFields({ email = "marta.ruiz@salon.com", phone = "3007778899" } = {}) {
    document.querySelector("#employees-first-name").value = "Marta";
    document.querySelector("#employees-last-name").value = "Ruiz";
    document.querySelector("#employees-email").value = email;
    document.querySelector("#employees-phone").value = phone;
}

function selectFirstService() {
    const firstServiceCheckbox = document.querySelector("[data-employee-service-checkbox]");
    if (!firstServiceCheckbox) {
        return;
    }

    firstServiceCheckbox.checked = true;
}

function expectAnyFieldErrorContains(expectedText) {
    const errors = Array.from(document.querySelectorAll(".employees__field-error"))
        .map((node) => (node.textContent || "").trim())
        .filter(Boolean);

    expect(errors.some((message) => message.includes(expectedText))).toBe(true);
}

async function openCreateModal() {
    const { initEmpleados } = await import("../../src/features/empleados/empleados.controller.js");
    initEmpleados(document.querySelector(".app__content"));
    await flushPromises();
    await flushPromises();

    document.querySelector("#employees-open-create-btn")?.click();
    await flushPromises();
    await flushPromises();
}

describe("empleados franjas laborales dinamicas", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        limpiarSesion();
        document.body.innerHTML = "<main class=\"app__content\"></main>";
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createOwnerJwt() });
    });

    it("EMPLEADOS-FRANJAS-ADD-01: agrega filas con rowId unico", async () => {
        mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        document.querySelector("#employees-add-shift-btn")?.click();
        await flushPromises();
        document.querySelector("#employees-add-shift-btn")?.click();
        await flushPromises();

        const rows = document.querySelectorAll("[data-employee-shift-row-id]");
        const rowIds = Array.from(rows).map((row) => row.getAttribute("data-employee-shift-row-id"));

        expect(rows.length).toBe(3);
        expect(new Set(rowIds).size).toBe(3);
    });

    it("EMPLEADOS-FRANJAS-REMOVE-01: elimina una fila especifica", async () => {
        mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        document.querySelector("#employees-add-shift-btn")?.click();
        document.querySelector("#employees-add-shift-btn")?.click();
        await flushPromises();

        const removeButtons = document.querySelectorAll("[data-employee-shift-remove]");
        const removedRowId = removeButtons[1].getAttribute("data-employee-shift-remove");
        removeButtons[1].dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const rows = document.querySelectorAll("[data-employee-shift-row-id]");
        expect(rows.length).toBe(2);
        expect(Array.from(rows).some((row) => row.getAttribute("data-employee-shift-row-id") === removedRowId)).toBe(false);
    });

    it("EMPLEADOS-FRANJAS-VALIDATION-NONE: rechaza submit sin franjas", async () => {
        const fetchSpy = mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        fillCreateMainFields();
        selectFirstService();

        let removeButton = document.querySelector("[data-employee-shift-remove]");
        while (removeButton) {
            removeButton.dispatchEvent(new Event("click", { bubbles: true }));
            await flushPromises();
            removeButton = document.querySelector("[data-employee-shift-remove]");
        }

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expectAnyFieldErrorContains("al menos una franja laboral");

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeUndefined();
    });

    it("EMPLEADOS-FRANJAS-VALIDATION-RANGE: rechaza franja cuando inicio es mayor o igual a fin", async () => {
        const fetchSpy = mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        fillCreateMainFields();
        document.querySelector("[data-employee-shift-field='day']").value = "MONDAY";
        document.querySelector("[data-employee-shift-field='startTime']").value = "14:00";
        document.querySelector("[data-employee-shift-field='endTime']").value = "10:00";
        selectFirstService();

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        expectAnyFieldErrorContains("hora de inicio debe ser menor");

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeUndefined();
    });

    it("EMPLEADOS-FRANJAS-VALIDATION-PHONE: telefono invalido bloquea submit", async () => {
        const fetchSpy = mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        fillCreateMainFields({ phone: "12345" });
        document.querySelector("[data-employee-shift-field='day']").value = "MONDAY";
        document.querySelector("[data-employee-shift-field='startTime']").value = "08:00";
        document.querySelector("[data-employee-shift-field='endTime']").value = "12:00";
        selectFirstService();

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        const phoneError = document.querySelector("#employees-phone")
            ?.closest(".employees__field")
            ?.querySelector(".employees__field-error")
            ?.textContent;
        expect(phoneError).toContain("debe iniciar en 3 y tener 10 digitos");

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeUndefined();
    });

    it("EMPLEADOS-FRANJAS-VALIDATION-EMAIL: correo invalido bloquea submit", async () => {
        const fetchSpy = mockEmployeesWithCatalog([{ idServicio: 1, nombre: "Corte" }]);
        await openCreateModal();

        fillCreateMainFields({ email: "correo-invalido" });
        document.querySelector("[data-employee-shift-field='day']").value = "MONDAY";
        document.querySelector("[data-employee-shift-field='startTime']").value = "08:00";
        document.querySelector("[data-employee-shift-field='endTime']").value = "12:00";
        selectFirstService();

        document.querySelector("#employees-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
        await flushPromises();

        const emailError = document.querySelector("#employees-email")
            ?.closest(".employees__field")
            ?.querySelector(".employees__field-error")
            ?.textContent;
        expect(emailError).toContain("correo valido");

        const postCall = fetchSpy.mock.calls.find(([url, options]) => String(url).includes("/api/v1/empleados") && options?.method === "POST");
        expect(postCall).toBeUndefined();
    });
});
