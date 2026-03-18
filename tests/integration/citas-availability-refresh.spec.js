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
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function waitForControllerWithFakeTimers(ms = 260) {
    await vi.advanceTimersByTimeAsync(ms);
}

// Simula enviar el formulario de filtros con fecha y servicio dados.
function submitFilters(container, { date = "2026-03-11", serviceId = "5", employeeId = "2" } = {}) {
    const form = container.querySelector("#citas-filter-form");
    form.querySelector("input[name='selectedDate']").value = date;

    const serviceSelect = form.querySelector("select[name='selectedServiceId']");
    serviceSelect.value = serviceId;
    // Dispara change para que el controller pueble las opciones de empleado
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

    form.querySelector("select[name='selectedEmployeeId']").value = employeeId;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("citas - disponibilidad y actualizacion del panel (D1, D2, D3, D5)", () => {
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
            { slotDateTime: "2026-03-11T09:00:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:30:00", isSelectable: true },
            { slotDateTime: "2026-03-11T10:00:00", isSelectable: true },
        ]);
        getAppointmentsMock.mockResolvedValue([]);
        searchClientsMock.mockResolvedValue({ items: [], total: 0 });
        createClientMock.mockResolvedValue({ id: 10, fullName: "Cliente Demo", phone: "3001234567" });
        createAppointmentMock.mockResolvedValue({ id: 55 });
        updateAppointmentMock.mockResolvedValue({ id: 55 });
        deleteAppointmentMock.mockResolvedValue({ success: true });

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    it("renderiza los slots disponibles en el grid tras cargar disponibilidad", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        submitFilters(container);
        await waitForController();

        const slots = container.querySelectorAll(".citas__slot--available");
        expect(slots.length).toBe(3);
        expect(slots[0].textContent.trim()).toBe("09:00");
        expect(slots[1].textContent.trim()).toBe("09:30");
        expect(slots[2].textContent.trim()).toBe("10:00");
    });

    it("D2: no reconsulta la API con los mismos filtros (usa cache con TTL)", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        submitFilters(container);
        await waitForController();

        const callCountAfterFirst = getAvailabilityMock.mock.calls.length;

        submitFilters(container);
        await waitForController();

        expect(getAvailabilityMock.mock.calls.length).toBe(callCountAfterFirst);
    });

    it("D2: reconsulta la API con filtros diferentes", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        submitFilters(container, { serviceId: "5" });
        await waitForController();

        const callCountAfterFirst = getAvailabilityMock.mock.calls.length;

        submitFilters(container, { serviceId: "7" });
        await waitForController();

        expect(getAvailabilityMock.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
    });

    it("D2: el boton Recargar invalida cache y vuelve a llamar la API", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);

        submitFilters(container);
        await waitForController();

        const callCountAfterFirst = getAvailabilityMock.mock.calls.length;

        const refreshBtn = container.querySelector("#citas-refresh-btn");
        refreshBtn.dispatchEvent(new Event("click"));
        await waitForController();

        expect(getAvailabilityMock.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
    });

    it("D5: click en un slot lo marca con la clase --selected", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        submitFilters(container);
        await waitForController();

        const firstSlot = container.querySelector(".citas__slot--available");
        expect(firstSlot).not.toBeNull();

        firstSlot.dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController(20);

        const selectedSlots = container.querySelectorAll(".citas__slot--selected");
        expect(selectedSlots.length).toBe(1);
        expect(selectedSlots[0].getAttribute("data-slot-datetime")).toBe("2026-03-11T09:00:00");
    });

    it("muestra mensaje cuando no hay slots disponibles", async () => {
        getAvailabilityMock.mockResolvedValue([]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        submitFilters(container);
        await waitForController();

        const emptyMsg = container.querySelector(".citas__slots-empty");
        expect(emptyMsg).not.toBeNull();
        expect(emptyMsg.textContent).toContain("No hay horarios disponibles");
    });

    it("D3: no deja el panel en error si la request es cancelada", async () => {
        const abortError = new DOMException("Aborted", "AbortError");
        getAvailabilityMock.mockRejectedValueOnce(abortError);
        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-11T09:00:00", isSelectable: true },
        ]);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        submitFilters(container);

        // Cambio rapido de filtros para gatillar cancelacion por AbortController.
        submitFilters(container, { serviceId: "9" });
        await waitForController();

        const errorMsg = container.querySelector(".citas__message--error");
        expect(errorMsg).toBeNull();
    });

    it("muestra error cuando la API falla con error de red", async () => {
        const networkError = Object.assign(new Error("Network error"), { status: 0 });
        getAvailabilityMock.mockRejectedValue(networkError);

        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        submitFilters(container);
        await waitForController();

        const errorMsg = container.querySelector(".citas__message--error");
        expect(errorMsg).not.toBeNull();
    });

    it("CITAS-NOW-01: para hoy oculta slots de horas anteriores y mantiene la hora en curso", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-11T09:30:00"));

        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-11T08:30:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:00:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:30:00", isSelectable: true },
            { slotDateTime: "2026-03-11T10:00:00", isSelectable: true },
        ]);

        try {
            const { initCitas } = await import("../../src/features/citas/citas.controller.js");

            await initCitas(container);
            submitFilters(container, { date: "2026-03-11", serviceId: "5", employeeId: "2" });
            await waitForControllerWithFakeTimers();

            const visibleTimes = Array.from(container.querySelectorAll(".citas__slot--available"))
                .map((slot) => slot.textContent.trim());

            expect(visibleTimes).toEqual(["09:00", "09:30", "10:00"]);
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it("CITAS-NOW-02: incluye slots de la hora en curso cuando now esta a mitad de hora", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-11T09:30:00"));

        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-11T08:30:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:00:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:30:00", isSelectable: true },
            { slotDateTime: "2026-03-11T10:00:00", isSelectable: true },
        ]);

        try {
            const { initCitas } = await import("../../src/features/citas/citas.controller.js");

            await initCitas(container);
            submitFilters(container, { date: "2026-03-11", serviceId: "5", employeeId: "2" });
            await waitForControllerWithFakeTimers();

            const visibleSlots = Array.from(container.querySelectorAll(".citas__slot--available"));
            const exactNowSlot = visibleSlots.find((slot) => slot.textContent.trim() === "09:30");
            const currentHourSlot = visibleSlots.find((slot) => slot.textContent.trim() === "09:00");

            expect(exactNowSlot).toBeTruthy();
            expect(currentHourSlot).toBeTruthy();
            expect(visibleSlots.some((slot) => slot.textContent.trim() === "08:30")).toBe(false);
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it("CITAS-NOW-03: para fecha futura conserva todos los slots retornados", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-11T09:30:00"));

        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-12T09:00:00", isSelectable: true },
            { slotDateTime: "2026-03-12T09:30:00", isSelectable: true },
            { slotDateTime: "2026-03-12T10:00:00", isSelectable: true },
        ]);

        try {
            const { initCitas } = await import("../../src/features/citas/citas.controller.js");

            await initCitas(container);
            submitFilters(container, { date: "2026-03-12", serviceId: "5", employeeId: "2" });
            await waitForControllerWithFakeTimers();

            const visibleTimes = Array.from(container.querySelectorAll(".citas__slot--available"))
                .map((slot) => slot.textContent.trim());

            expect(visibleTimes).toEqual(["09:00", "09:30", "10:00"]);
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it("CITAS-NOW-04: en cache-hit para hoy re-filtra slots al avanzar el reloj", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-11T09:58:00"));

        try {
            const { initCitas } = await import("../../src/features/citas/citas.controller.js");

            await initCitas(container);
            submitFilters(container, { date: "2026-03-11", serviceId: "5", employeeId: "2" });
            await waitForControllerWithFakeTimers();

            const callCountAfterFirst = getAvailabilityMock.mock.calls.length;
            let visibleTimes = Array.from(container.querySelectorAll(".citas__slot--available"))
                .map((slot) => slot.textContent.trim());

            expect(visibleTimes).toEqual(["09:00", "09:30", "10:00"]);

            vi.setSystemTime(new Date("2026-03-11T10:02:00"));
            submitFilters(container, { date: "2026-03-11", serviceId: "5", employeeId: "2" });
            await waitForControllerWithFakeTimers();

            expect(getAvailabilityMock.mock.calls.length).toBe(callCountAfterFirst);

            visibleTimes = Array.from(container.querySelectorAll(".citas__slot--available"))
                .map((slot) => slot.textContent.trim());

            expect(visibleTimes).toEqual(["10:00"]);
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });
});
