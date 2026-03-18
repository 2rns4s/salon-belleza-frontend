import { beforeEach, describe, expect, it, vi } from "vitest";

const getAvailabilityMock = vi.fn();
const getAppointmentsMock = vi.fn();
const getClientByIdMock = vi.fn();
const searchClientsMock = vi.fn();
const createClientMock = vi.fn();
const createAppointmentMock = vi.fn();
const updateAppointmentMock = vi.fn();
const deleteAppointmentMock = vi.fn();
const getServicesMock = vi.fn();
const getEmployeesMock = vi.fn();

vi.mock("../../src/features/citas/citas.service.js", () => ({
    getAvailability: (...args) => getAvailabilityMock(...args),
    getAppointments: (...args) => getAppointmentsMock(...args),
    getClientById: (...args) => getClientByIdMock(...args),
    searchClients: (...args) => searchClientsMock(...args),
    createClient: (...args) => createClientMock(...args),
    createAppointment: (...args) => createAppointmentMock(...args),
    updateAppointment: (...args) => updateAppointmentMock(...args),
    deleteAppointment: (...args) => deleteAppointmentMock(...args),
    getServices: (...args) => getServicesMock(...args),
    getEmployees: (...args) => getEmployeesMock(...args),
}));

function waitForController(ms = 260) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function findAppointmentRowById(container, appointmentId) {
    return Array.from(container.querySelectorAll(".citas__list-item"))
        .find((row) => row.textContent.includes(`Cita #${appointmentId}`));
}

describe("citas UX hotfix", () => {
    let container;

    beforeEach(() => {
        getAvailabilityMock.mockReset();
        getAppointmentsMock.mockReset();
        getClientByIdMock.mockReset();
        searchClientsMock.mockReset();
        createClientMock.mockReset();
        createAppointmentMock.mockReset();
        updateAppointmentMock.mockReset();
        deleteAppointmentMock.mockReset();
        getServicesMock.mockReset();

        getClientByIdMock.mockImplementation(async (clientId) => ({
            id: Number(clientId),
            fullName: `Cliente ${clientId}`,
            phone: "",
        }));
        getEmployeesMock.mockReset();

        getServicesMock.mockResolvedValue([
            { id: 5, name: "Lavado Premium", duration: 30 },
            { id: 7, name: "Corte Clasico", duration: 45 },
        ]);
        getEmployeesMock.mockResolvedValue([
            { id: 2, firstName: "Ana", lastName: "Lopez", fullName: "Ana Lopez", serviceIds: [5, 7] },
        ]);
        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-15T10:00:00", isSelectable: true },
        ]);
        getAppointmentsMock.mockResolvedValue([]);
        searchClientsMock.mockResolvedValue({ items: [], total: 0 });

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    // --- Fix 1: Disponibilidad automática ---

    it("CITAS-AUTODISPATCH-01: cambiar servicio sin submit dispara disponibilidad automáticamente", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        // Sin enviar el formulario: cambia solo el servicio
        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        // Debe haber disparado getAvailability aunque no se hizo submit
        expect(getAvailabilityMock).toHaveBeenCalled();
        const lastCall = getAvailabilityMock.mock.calls[getAvailabilityMock.mock.calls.length - 1][0];
        expect(String(lastCall.serviceId)).toBe("5");
    });

    it("CITAS-AUTODISPATCH-02: cambiar la fecha sin submit dispara disponibilidad si ya hay servicio", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        // Primero seleccionar servicio para que quede en state
        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await waitForController();

        const callsAfterService = getAvailabilityMock.mock.calls.length;

        // Ahora cambiar la fecha sin hacer submit
        const dateInput = container.querySelector("input[name='selectedDate']");
        dateInput.value = "2026-04-01";
        dateInput.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        // Debe haber disparado una nueva consulta de disponibilidad
        expect(getAvailabilityMock.mock.calls.length).toBeGreaterThan(callsAfterService);
        const lastCall = getAvailabilityMock.mock.calls[getAvailabilityMock.mock.calls.length - 1][0];
        expect(lastCall.date).toBe("2026-04-01");
        expect(String(lastCall.serviceId)).toBe("5");
    });

    it("CITAS-AUTODISPATCH-03: el idEmpleado es opcional en la query de disponibilidad", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        // Seleccionar servicio sin empleado
        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        expect(getAvailabilityMock).toHaveBeenCalled();
        const callArgs = getAvailabilityMock.mock.calls[getAvailabilityMock.mock.calls.length - 1][0];
        // serviceId debe estar presente
        expect(String(callArgs.serviceId)).toBe("5");
        // employeeId debe ser vacío o undefined (no obligatorio)
        expect(callArgs.employeeId === "" || callArgs.employeeId === undefined || callArgs.employeeId === null).toBe(true);
    });

    it("CITAS-AUTODISPATCH-04: cambiar fecha sin servicio seleccionado NO dispara disponibilidad", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        // State inicial: sin servicio seleccionado

        const callsBeforeDate = getAvailabilityMock.mock.calls.length;

        const dateInput = container.querySelector("input[name='selectedDate']");
        dateInput.value = "2026-04-10";
        dateInput.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        // Sin servicio, no debe disparar disponibilidad
        expect(getAvailabilityMock.mock.calls.length).toBe(callsBeforeDate);
    });

    it("CITAS-AUTODISPATCH-05: limpiar empleado seleccionado dispara disponibilidad sin idEmpleado", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const form = container.querySelector("#citas-filter-form");
        const serviceSelect = form.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        const employeeSelect = form.querySelector("#citas-employee-select");
        employeeSelect.value = "2";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await waitForController();

        employeeSelect.value = "";
        employeeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await waitForController();

        const lastCallArgs = getAvailabilityMock.mock.calls[getAvailabilityMock.mock.calls.length - 1][0];
        expect(lastCallArgs.employeeId === "" || lastCallArgs.employeeId === undefined || lastCallArgs.employeeId === null).toBe(true);
    });

    // --- Fix 2: Nombres reales desde catálogos ---

    it("CITAS-SEARCH-01: búsqueda por nombre usa debounce y mantiene foco/caret", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        searchClientsMock.mockResolvedValue({
            items: [
                {
                    id: 201,
                    fullName: "Ana Serrano",
                    phone: "3001112233",
                    documentNumber: "10293847",
                },
            ],
            total: 1,
        });

        await initCitas(container);

        let nameInput = container.querySelector("#citas-client-search-form input[name='name']");
        expect(nameInput).not.toBeNull();

        nameInput.focus();
        nameInput.value = "A";
        nameInput.setSelectionRange(1, 1);
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));

        await waitForController(120);

        nameInput = container.querySelector("#citas-client-search-form input[name='name']");
        nameInput.focus();
        nameInput.value = "Ana";
        nameInput.setSelectionRange(2, 2);
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));

        await waitForController(430);

        expect(searchClientsMock).toHaveBeenCalledTimes(1);
        expect(searchClientsMock).toHaveBeenCalledWith({
            documentNumber: "",
            phone: "",
            name: "Ana",
        });

        const refreshedInput = container.querySelector("#citas-client-search-form input[name='name']");
        expect(document.activeElement).toBe(refreshedInput);
        expect(refreshedInput.selectionStart).toBe(2);
        expect(refreshedInput.selectionEnd).toBe(2);
        expect(container.querySelectorAll(".citas__client-select-btn").length).toBe(1);
    });

    it("CITAS-NAMES-01: la lista muestra nombre real del servicio consultando el catálogo", async () => {
        // El service retorna datos ya mapeados con nombres de fallback ("Servicio #5")
        // La view debe reemplazarlos con el nombre real del catálogo
        getAppointmentsMock.mockResolvedValue([{
            id: 42,
            slotDateTime: "2026-03-15T10:00:00",
            durationMinutes: 0,
            service: { id: 5, name: "Servicio #5" },
            employee: { id: 2, name: "Empleado #2" },
            client: { id: 99, fullName: "Cliente #99", phone: "" },
            resourceSummary: [],
            status: "PENDIENTE",
        }]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        const subtitles = container.querySelectorAll(".citas__item-subtitle");
        const subtitleTexts = Array.from(subtitles).map((el) => el.textContent.trim());

        // Debe mostrar el nombre real del servicio, no "Servicio #5"
        expect(subtitleTexts.some((t) => t.includes("Lavado Premium"))).toBe(true);
        expect(subtitleTexts.some((t) => t.includes("Servicio #5"))).toBe(false);
    });

    it("CITAS-NAMES-02: la lista muestra nombre real del empleado consultando el catálogo", async () => {
        // El service retorna datos ya mapeados con nombres de fallback ("Empleado #2")
        // La view debe reemplazarlos con el nombre real del catálogo
        getAppointmentsMock.mockResolvedValue([{
            id: 43,
            slotDateTime: "2026-03-15T10:00:00",
            durationMinutes: 0,
            service: { id: 5, name: "Servicio #5" },
            employee: { id: 2, name: "Empleado #2" },
            client: { id: 99, fullName: "Cliente #99", phone: "" },
            resourceSummary: [],
            status: "CONFIRMADA",
        }]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        const subtitles = container.querySelectorAll(".citas__item-subtitle");
        const subtitleTexts = Array.from(subtitles).map((el) => el.textContent.trim());

        // Debe mostrar el nombre real del empleado, no "Empleado #2"
        expect(subtitleTexts.some((t) => t.includes("Ana Lopez"))).toBe(true);
        expect(subtitleTexts.some((t) => t.includes("Empleado #2"))).toBe(false);
    });

    it("CITAS-NAMES-03: el título del item muestra el prefijo 'Cliente:'", async () => {
        // El service retorna datos ya mapeados; el cliente tiene su nombre real
        getAppointmentsMock.mockResolvedValue([{
            id: 44,
            slotDateTime: "2026-03-15T10:00:00",
            durationMinutes: 0,
            service: { id: 5, name: "Servicio #5" },
            employee: { id: 2, name: "Empleado #2" },
            client: { id: 77, fullName: "Maria Gomez", phone: "3001234567" },
            resourceSummary: [],
            status: "PENDIENTE",
        }]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

        await waitForController();

        const title = container.querySelector(".citas__item-title");
        expect(title).not.toBeNull();
        expect(title.textContent.trim()).toMatch(/^Cliente:/);
        expect(title.textContent).toContain("Maria Gomez");
    });

    it("CITAS-NAMES-04: resuelve nombre de cliente por id y evita mostrar 'Cliente #id'", async () => {
        getClientByIdMock.mockResolvedValueOnce({
            id: 99,
            fullName: "Laura Torres",
            phone: "3008882233",
        });

        getAppointmentsMock.mockResolvedValue([{
            id: 45,
            slotDateTime: "2026-03-15T10:00:00",
            durationMinutes: 0,
            service: { id: 5, name: "Servicio #5" },
            employee: { id: 2, name: "Empleado #2" },
            client: { id: 99, fullName: "Cliente #99", phone: "" },
            resourceSummary: [],
            status: "PENDIENTE",
        }]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await waitForController();

        const title = container.querySelector(".citas__item-title");
        expect(title).not.toBeNull();
        expect(title.textContent).toContain("Laura Torres");
        expect(title.textContent).not.toContain("Cliente #99");
    });

    it("CITAS-NAMES-05: la sección de citas registradas muestra la fecha de la cita", async () => {
        getAppointmentsMock.mockResolvedValue([{
            id: 46,
            slotDateTime: "2026-03-15T10:00:00",
            durationMinutes: 0,
            service: { id: 5, name: "Lavado Premium" },
            employee: { id: 2, name: "Ana Lopez" },
            client: { id: 77, fullName: "Maria Gomez", phone: "3001234567" },
            resourceSummary: [],
            status: "CONFIRMADA",
        }]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        const serviceSelect = container.querySelector("#citas-service-select");
        serviceSelect.value = "5";
        serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await waitForController();

        const dateNode = container.querySelector(".citas__item-date");
        expect(dateNode).not.toBeNull();
        expect(dateNode.textContent.trim()).toBe("15/03/2026");
    });

    it("CITAS-STATUS-01: aplica clases de estado y fallback a PENDIENTE", async () => {
        getAppointmentsMock.mockResolvedValue([
            {
                id: 71,
                slotDateTime: "2026-03-15T10:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 400, fullName: "Sofia Perez", phone: "3001231234" },
                resourceSummary: [],
                status: "PENDIENTE",
            },
            {
                id: 72,
                slotDateTime: "2026-03-15T11:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 401, fullName: "Daniel Ruiz", phone: "3002342345" },
                resourceSummary: [],
                status: "CONFIRMADA",
            },
            {
                id: 73,
                slotDateTime: "2026-03-15T12:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 402, fullName: "Lina Mora", phone: "3003453456" },
                resourceSummary: [],
            },
        ]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");
        await initCitas(container);
        await waitForController();

        const pendingRow = findAppointmentRowById(container, 71);
        const confirmedRow = findAppointmentRowById(container, 72);
        const fallbackRow = findAppointmentRowById(container, 73);

        expect(pendingRow).not.toBeUndefined();
        expect(confirmedRow).not.toBeUndefined();
        expect(fallbackRow).not.toBeUndefined();

        expect(pendingRow.className).toContain("citas__list-item--status-PENDIENTE");
        expect(confirmedRow.className).toContain("citas__list-item--status-CONFIRMADA");
        expect(fallbackRow.className).toContain("citas__list-item--status-PENDIENTE");

        const fallbackStatus = fallbackRow.querySelector(".citas__item-status");
        expect(fallbackStatus.className).toContain("citas__item-status--PENDIENTE");
        expect(fallbackStatus.textContent.trim()).toBe("PENDIENTE");
    });

    it("CITAS-SECTION-01: separa activas/historial y bloquea acciones en historial", async () => {
        getAppointmentsMock.mockResolvedValue([
            {
                id: 81,
                slotDateTime: "2026-03-15T10:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 500, fullName: "Paula Arias", phone: "3002223344" },
                resourceSummary: [],
                status: "PENDIENTE",
            },
            {
                id: 82,
                slotDateTime: "2026-03-15T11:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 501, fullName: "Mauro Diaz", phone: "3003334455" },
                resourceSummary: [],
                status: "CONFIRMADA",
            },
            {
                id: 83,
                slotDateTime: "2026-03-15T12:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 502, fullName: "Elena Rocha", phone: "3004445566" },
                resourceSummary: [],
                status: "REALIZADA",
            },
            {
                id: 84,
                slotDateTime: "2026-03-15T13:00:00",
                service: { id: 5, name: "Lavado Premium" },
                employee: { id: 2, name: "Ana Lopez" },
                client: { id: 503, fullName: "Hugo Salas", phone: "3005556677" },
                resourceSummary: [],
                status: "CANCELADA",
            },
        ]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");
        await initCitas(container);
        await waitForController();

        const activeStatuses = Array.from(container.querySelectorAll(".citas__item-status"))
            .map((node) => node.textContent.trim());

        expect(activeStatuses).toContain("PENDIENTE");
        expect(activeStatuses).toContain("CONFIRMADA");
        expect(activeStatuses).not.toContain("REALIZADA");
        expect(activeStatuses).not.toContain("CANCELADA");
        expect(container.querySelectorAll(".citas__appointment-update-btn").length).toBeGreaterThan(0);
        expect(container.querySelectorAll(".citas__appointment-delete-btn").length).toBeGreaterThan(0);

        const historyTab = container.querySelector(".citas__section-tab[data-citas-view='history']");
        historyTab.dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController(20);

        const historyStatuses = Array.from(container.querySelectorAll(".citas__item-status"))
            .map((node) => node.textContent.trim());

        expect(historyStatuses).toContain("REALIZADA");
        expect(historyStatuses).toContain("CANCELADA");
        expect(historyStatuses).not.toContain("PENDIENTE");
        expect(historyStatuses).not.toContain("CONFIRMADA");

        const realizedRow = findAppointmentRowById(container, 83);
        const canceledRow = findAppointmentRowById(container, 84);

        expect(realizedRow.className).toContain("citas__list-item--status-REALIZADA");
        expect(canceledRow.className).toContain("citas__list-item--status-CANCELADA");

        const realizedBadge = realizedRow.querySelector(".citas__item-status");
        const canceledBadge = canceledRow.querySelector(".citas__item-status");

        expect(realizedBadge.className).toContain("citas__item-status--REALIZADA");
        expect(canceledBadge.className).toContain("citas__item-status--CANCELADA");

        expect(container.querySelectorAll(".citas__appointment-update-btn").length).toBe(0);
        expect(container.querySelectorAll(".citas__appointment-delete-btn").length).toBe(0);
    });
});
