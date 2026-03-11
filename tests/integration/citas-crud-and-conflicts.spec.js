import { beforeEach, describe, expect, it, vi } from "vitest";

const getAvailabilityMock = vi.fn();
const getAppointmentsMock = vi.fn();
const searchClientsMock = vi.fn();
const createClientMock = vi.fn();
const createAppointmentMock = vi.fn();
const updateAppointmentMock = vi.fn();
const deleteAppointmentMock = vi.fn();

vi.mock("../../src/features/citas/citas.service.js", () => ({
    getAvailability: (...args) => getAvailabilityMock(...args),
    getAppointments: (...args) => getAppointmentsMock(...args),
    searchClients: (...args) => searchClientsMock(...args),
    createClient: (...args) => createClientMock(...args),
    createAppointment: (...args) => createAppointmentMock(...args),
    updateAppointment: (...args) => updateAppointmentMock(...args),
    deleteAppointment: (...args) => deleteAppointmentMock(...args),
}));

function waitForController(ms = 280) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function submitFilters(container, { date = "2026-03-11", serviceId = "5", employeeId = "2" } = {}) {
    const form = container.querySelector("#citas-filter-form");
    form.querySelector("input[name='selectedDate']").value = date;
    form.querySelector("input[name='selectedServiceId']").value = serviceId;
    form.querySelector("input[name='selectedEmployeeId']").value = employeeId;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function clickFirstAvailableSlot(container) {
    const slot = container.querySelector(".citas__slot--available");
    expect(slot).not.toBeNull();
    slot.dispatchEvent(new Event("click", { bubbles: true }));
}

function searchClient(container, { documentNumber = "", phone = "", name = "" } = {}) {
    const searchForm = container.querySelector("#citas-client-search-form");
    searchForm.querySelector("input[name='documentNumber']").value = documentNumber;
    searchForm.querySelector("input[name='phone']").value = phone;
    searchForm.querySelector("input[name='name']").value = name;
    searchForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("citas - CRUD, quick-add y conflictos 409", () => {
    let container;

    beforeEach(() => {
        getAvailabilityMock.mockReset();
        getAppointmentsMock.mockReset();
        searchClientsMock.mockReset();
        createClientMock.mockReset();
        createAppointmentMock.mockReset();
        updateAppointmentMock.mockReset();
        deleteAppointmentMock.mockReset();

        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: "2026-03-11T09:00:00", isSelectable: true },
            { slotDateTime: "2026-03-11T09:30:00", isSelectable: true },
        ]);
        getAppointmentsMock.mockResolvedValue([]);
        searchClientsMock.mockResolvedValue({ items: [], total: 0 });
        createClientMock.mockResolvedValue({
            id: 41,
            fullName: "Maria Perez",
            documentNumber: "10203040",
            phone: "3001234567",
        });
        createAppointmentMock.mockResolvedValue({ id: 91 });
        updateAppointmentMock.mockResolvedValue({ id: 91, status: "CONFIRMADA" });
        deleteAppointmentMock.mockResolvedValue({ success: true });

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    it("quick-add invalido (400) mantiene contexto y formulario para correccion", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        searchClientsMock.mockResolvedValue({ items: [], total: 0 });
        createClientMock.mockRejectedValue({
            status: 400,
            data: {
                mensaje: "Hay errores de validacion.",
                fieldErrors: {
                    nombre: "El nombre es obligatorio",
                    telefono: "Telefono invalido",
                },
            },
        });

        initCitas(container);
        submitFilters(container);
        await waitForController();

        clickFirstAvailableSlot(container);
        searchClient(container, { documentNumber: "10203040" });
        await waitForController(120);

        const quickAddForm = container.querySelector("#citas-quick-add-form");
        expect(quickAddForm).not.toBeNull();

        quickAddForm.querySelector("input[name='firstName']").value = "";
        quickAddForm.querySelector("input[name='lastName']").value = "Perez";
        quickAddForm.querySelector("input[name='phone']").value = "300";
        quickAddForm.querySelector("input[name='documentNumber']").value = "10203040";
        quickAddForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await waitForController(120);

        const errorBanner = container.querySelector(".citas__message--error");
        expect(errorBanner).not.toBeNull();
        expect(errorBanner.textContent).toContain("validacion");

        expect(container.querySelector("#quickAddLastName").value).toBe("Perez");
        expect(container.querySelector("#quickAddPhone").value).toBe("300");
        expect(container.querySelectorAll(".citas__slot--selected").length).toBe(1);
    });

    it("conflicto 409 bloquea confirmacion y reconcilia agenda+disponibilidad", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        searchClientsMock.mockResolvedValue({
            items: [
                {
                    id: 77,
                    fullName: "Ana Lopez",
                    documentNumber: "77889900",
                    phone: "3009998877",
                },
            ],
            total: 1,
        });

        createAppointmentMock.mockRejectedValue({
            status: 409,
            data: {
                mensaje: "El horario seleccionado ya no esta disponible",
            },
        });

        initCitas(container);
        submitFilters(container);
        await waitForController();

        clickFirstAvailableSlot(container);

        searchClient(container, { documentNumber: "77889900" });
        await waitForController(120);

        const selectClientBtn = container.querySelector(".citas__client-select-btn");
        expect(selectClientBtn).not.toBeNull();
        selectClientBtn.dispatchEvent(new Event("click", { bubbles: true }));

        const createBtn = container.querySelector("#citas-create-appointment-btn");
        expect(createBtn).not.toBeNull();
        createBtn.dispatchEvent(new Event("click", { bubbles: true }));

        // Debe bloquear mientras procesa la confirmacion.
        expect(container.querySelector("#citas-create-appointment-btn").disabled).toBe(true);

        await waitForController();

        const errorBanner = container.querySelector(".citas__message--error");
        expect(errorBanner).not.toBeNull();
        expect(errorBanner.textContent).toContain("ya no esta disponible");

        expect(createAppointmentMock).toHaveBeenCalledTimes(1);
        expect(getAppointmentsMock.mock.calls.length).toBeGreaterThanOrEqual(3);
        expect(getAvailabilityMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("refresh post-CRUD: crear, actualizar estado y eliminar refrescan agenda", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        const baseAppointment = {
            id: 91,
            slotDateTime: "2026-03-11T09:00:00",
            service: {
                id: 5,
                name: "Lavado Premium",
            },
            employee: {
                id: 2,
                name: "Ana Lopez",
            },
            client: {
                id: 77,
                fullName: "Ana Lopez",
                phone: "3009998877",
            },
            resourceSummary: [],
            status: "PENDIENTE",
        };

        getAppointmentsMock
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([baseAppointment])
            .mockResolvedValueOnce([baseAppointment])
            .mockResolvedValueOnce([{ ...baseAppointment, status: "CONFIRMADA" }])
            .mockResolvedValueOnce([]);

        searchClientsMock.mockResolvedValue({
            items: [
                {
                    id: 77,
                    fullName: "Ana Lopez",
                    documentNumber: "77889900",
                    phone: "3009998877",
                },
            ],
            total: 1,
        });

        createAppointmentMock.mockResolvedValue({ id: 91 });
        updateAppointmentMock.mockResolvedValue({ id: 91, status: "CONFIRMADA" });
        deleteAppointmentMock.mockResolvedValue({ success: true });

        initCitas(container);
        submitFilters(container);
        await waitForController();

        clickFirstAvailableSlot(container);
        searchClient(container, { documentNumber: "77889900" });
        await waitForController(120);

        container.querySelector(".citas__client-select-btn").dispatchEvent(new Event("click", { bubbles: true }));

        container.querySelector("#citas-create-appointment-btn").dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController();

        const statusSelect = container.querySelector("#citas-status-91");
        expect(statusSelect).not.toBeNull();
        statusSelect.value = "CONFIRMADA";

        container.querySelector(".citas__appointment-update-btn[data-appointment-id='91']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController();

        container.querySelector(".citas__appointment-delete-btn[data-appointment-id='91']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController();

        expect(createAppointmentMock).toHaveBeenCalledTimes(1);
        expect(updateAppointmentMock).toHaveBeenCalledTimes(1);
        expect(deleteAppointmentMock).toHaveBeenCalledTimes(1);

        expect(getAppointmentsMock.mock.calls.length).toBeGreaterThanOrEqual(5);
        expect(getAvailabilityMock.mock.calls.length).toBeGreaterThanOrEqual(4);

        const emptyRow = container.querySelector(".citas__list-item--empty");
        expect(emptyRow).not.toBeNull();
    });
});
