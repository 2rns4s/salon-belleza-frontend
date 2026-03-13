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

function waitForController(ms = 240) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getOptionTexts(selectElement) {
    return Array.from(selectElement.querySelectorAll("option")).map((opt) => opt.textContent.trim());
}

describe("citas catalog retry integration", () => {
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

        getAppointmentsMock.mockResolvedValue([]);
        getAvailabilityMock.mockResolvedValue([]);
        searchClientsMock.mockResolvedValue({ items: [], total: 0 });

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    it("muestra Error al cargar en catalogos y Recargar reintenta exitosamente", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        getServicesMock
            .mockRejectedValueOnce(new Error("network down"))
            .mockResolvedValueOnce([{ id: 5, name: "Lavado Premium", duration: 30 }]);

        getEmployeesMock
            .mockRejectedValueOnce(new Error("network down"))
            .mockResolvedValueOnce([{ id: 2, firstName: "Ana", lastName: "Lopez", fullName: "Ana Lopez", serviceIds: [5] }]);

        await initCitas(container);
        await waitForController(80);

        const serviceSelect = container.querySelector("#citas-service-select");
        const employeeSelect = container.querySelector("#citas-employee-select");

        expect(serviceSelect.disabled).toBe(true);
        expect(employeeSelect.disabled).toBe(true);
        expect(getOptionTexts(serviceSelect)).toContain("Error al cargar");
        expect(getOptionTexts(employeeSelect)).toContain("Error al cargar");

        const refreshButton = container.querySelector("#citas-refresh-btn");
        refreshButton.dispatchEvent(new Event("click", { bubbles: true }));
        await waitForController();

        expect(getServicesMock).toHaveBeenCalledTimes(2);
        expect(getEmployeesMock).toHaveBeenCalledTimes(2);
        expect(serviceSelect.disabled).toBe(false);
        expect(getOptionTexts(serviceSelect)).toContain("Lavado Premium");
    });
});
