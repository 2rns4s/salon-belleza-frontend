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

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

function waitForController(ms = 260) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function changeService(container, serviceId) {
    const serviceSelect = container.querySelector("#citas-service-select");
    serviceSelect.value = String(serviceId);
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function getOptionTexts(selectElement) {
    return Array.from(selectElement.querySelectorAll("option")).map((opt) => opt.textContent.trim());
}

describe("citas employee dropdown integration", () => {
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
        getEmployeesMock.mockReset();

        getClientByIdMock.mockImplementation(async (clientId) => ({
            id: Number(clientId),
            fullName: `Cliente ${clientId}`,
            phone: "",
        }));

        getServicesMock.mockResolvedValue([
            { id: 5, name: "Lavado Premium", duration: 30 },
            { id: 3, name: "Corte Clasico", duration: 45 },
            { id: 9, name: "Color", duration: 60 },
        ]);

        getEmployeesMock.mockResolvedValue([
            { id: 2, firstName: "Ana", lastName: "Lopez", fullName: "Ana Lopez", serviceIds: [5, 10] },
            { id: 3, firstName: "Bruno", lastName: "Diaz", fullName: "Bruno Diaz", serviceIds: [3, 7] },
            { id: 4, firstName: "Carla", lastName: "Ruiz", fullName: "Carla Ruiz", serviceIds: [5] },
        ]);

        getAppointmentsMock.mockResolvedValue([]);
        getAvailabilityMock.mockResolvedValue([]);
        searchClientsMock.mockResolvedValue({ items: [], total: 0 });

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    it("CITAS-EMPLOYEE-DROPDOWN-01: estado inicial mantiene empleado deshabilitado", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        await flushPromises();

        const serviceSelect = container.querySelector("#citas-service-select");
        const employeeSelect = container.querySelector("#citas-employee-select");

        expect(serviceSelect).not.toBeNull();
        expect(employeeSelect).not.toBeNull();
        expect(serviceSelect.value).toBe("");
        expect(getOptionTexts(serviceSelect)).toContain("Seleccionar servicio");
        expect(getOptionTexts(serviceSelect)).toContain("Lavado Premium");
        expect(employeeSelect.disabled).toBe(true);
        expect(getOptionTexts(employeeSelect)).toContain("Selecciona un servicio primero");

        const bookingEmployeeSelect = container.querySelector("#citas-booking-employee-select");
        expect(bookingEmployeeSelect).not.toBeNull();
        expect(bookingEmployeeSelect.disabled).toBe(true);
        expect(getOptionTexts(bookingEmployeeSelect)).toContain("Selecciona un servicio primero");

        expect(getServicesMock).toHaveBeenCalledTimes(1);
        expect(getEmployeesMock).toHaveBeenCalledTimes(1);
    });

    it("CITAS-EMPLOYEE-DROPDOWN-01: filtra empleados elegibles por servicio", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        await flushPromises();

        changeService(container, 5);

        const employeeSelect = container.querySelector("#citas-employee-select");
        const options = getOptionTexts(employeeSelect);

        expect(employeeSelect.disabled).toBe(false);
        expect(options).toContain("Ana Lopez");
        expect(options).toContain("Carla Ruiz");
        expect(options).not.toContain("Bruno Diaz");

        await waitForController();

        const bookingEmployeeSelect = container.querySelector("#citas-booking-employee-select");
        const bookingOptions = getOptionTexts(bookingEmployeeSelect);

        expect(bookingEmployeeSelect.disabled).toBe(false);
        expect(bookingOptions).toContain("Ana Lopez");
        expect(bookingOptions).toContain("Carla Ruiz");
        expect(bookingOptions).not.toContain("Bruno Diaz");
    });

    it("CITAS-EMPLOYEE-DROPDOWN-01: limpia seleccion incompatible y maneja vacios", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        await initCitas(container);
        await flushPromises();

        changeService(container, 5);

        const employeeSelect = container.querySelector("#citas-employee-select");
        employeeSelect.value = "2";
        expect(employeeSelect.value).toBe("2");

        changeService(container, 3);

        const optionsServiceThree = getOptionTexts(employeeSelect);
        expect(employeeSelect.value).toBe("");
        expect(optionsServiceThree).toContain("Bruno Diaz");
        expect(optionsServiceThree).not.toContain("Ana Lopez");

        changeService(container, 9);

        const optionsServiceNine = getOptionTexts(employeeSelect);
        expect(optionsServiceNine).toContain("Sin empleados disponibles");
    });
});
