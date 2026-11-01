import { beforeEach, describe, expect, it, vi } from "vitest";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";

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

const TEST_DATE = "2099-03-11";
const TEST_SLOT_0900 = `${TEST_DATE}T09:00:00`;
const TEST_SLOT_0930 = `${TEST_DATE}T09:30:00`;

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

function waitForController(ms = 280) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function submitFilters(container, { date = TEST_DATE, serviceId = "5", employeeId = "2" } = {}) {
    const form = container.querySelector("#citas-filter-form");
    form.querySelector("input[name='selectedDate']").value = date;

    const serviceSelect = form.querySelector("select[name='selectedServiceId']");
    serviceSelect.value = serviceId;
    // Dispara change para que el controller pueble las opciones de empleado
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));

    form.querySelector("select[name='selectedEmployeeId']").value = employeeId;
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

// Trazabilidad SRS (ver docs/desarrollo/trazabilidad-requisitos.md):
// @requisito RF-008 Registrar cita | RF-009 Gestión de clientes en el flujo
// @rnf RNF-008 Integridad/anti-overbooking (409) | RNF-015 Mensajes de error accionables
// @hu HU-08, HU-09
// @narrativa Como Recepcionista, quiero seleccionar un horario válido y registrar la cita,
//            para que el sistema la guarde y la quite de la disponibilidad futura.
describe("RF-008 / RF-009 / HU-08 / HU-09 — Registro de cita, quick-add de cliente y conflictos 409 (RNF-008/RNF-015)", () => {
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
        ]);
        getEmployeesMock.mockResolvedValue([
            { id: 2, firstName: "Ana", lastName: "Lopez", fullName: "Ana Lopez", serviceIds: [5] },
        ]);

        getAvailabilityMock.mockResolvedValue([
            { slotDateTime: TEST_SLOT_0900, isSelectable: true },
            { slotDateTime: TEST_SLOT_0930, isSelectable: true },
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

    // @rnf RNF-015 — Dado un quick-add con datos inválidos, cuando el backend responde 400,
    // entonces se muestra un mensaje accionable y se conserva el contexto (slot + formulario).
    it("RNF-015 — Dado un quick-add inválido (400), cuando falla, entonces mantiene contexto y formulario para corrección", async () => {
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

        await initCitas(container);
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

    // @rnf RNF-015 — Dado un 400 con details[], cuando se procesa, entonces mapea errores por campo
    // y conserva el slot seleccionado para que la recepcionista corrija sin rehacer el flujo.
    it("RNF-015 — Dado un 400 con details[], cuando se procesa, entonces mapea errores por campo y conserva el slot seleccionado", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        searchClientsMock.mockResolvedValue({ items: [], total: 0 });
        createClientMock.mockRejectedValue({
            status: 400,
            data: createErrorResponseFixture(400, {
                message: "Hay errores de validacion.",
                details: [
                    "nombre: El nombre es obligatorio",
                    "telefono: Telefono invalido",
                ],
            }),
        });

        await initCitas(container);
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

        const banner = container.querySelector(".citas__message--error");
        expect(banner).not.toBeNull();
        expect(banner.textContent).toContain("validacion");

        expect(container.textContent).toContain("El nombre es obligatorio");
        expect(container.textContent).toContain("Telefono invalido");
        expect(container.querySelectorAll(".citas__slot--selected").length).toBe(1);
    });

    // @requisito RF-009 — Dado que el cliente no existe (404), cuando se busca,
    // entonces se habilita el quick-add para crear y asociar un cliente nuevo a la cita.
    it("RF-009 / HU-09 — Dado que la búsqueda de cliente da 404, cuando se procesa, entonces habilita quick-add y conserva el slot", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        searchClientsMock.mockRejectedValue({
            status: 404,
            data: createErrorResponseFixture(404, {
                message: "No se encontraron resultados para la busqueda realizada.",
                details: ["documento: sin coincidencias"],
            }),
        });

        await initCitas(container);
        submitFilters(container);
        await waitForController();

        clickFirstAvailableSlot(container);
        searchClient(container, { documentNumber: "00000000" });
        await waitForController(120);

        expect(container.querySelector("#citas-quick-add-form")).not.toBeNull();
        expect(container.querySelector("#quickAddDocumentNumber")?.value).toBe("00000000");
        expect(container.querySelectorAll(".citas__slot--selected").length).toBe(1);
        expect(container.querySelector(".citas__message--error")).toBeNull();
    });

    // @rnf RNF-008 — Dado un horario ya ocupado, cuando el backend responde 409, entonces
    // se bloquea la confirmación y se reconcilia agenda+disponibilidad (anti-overbooking).
    it("RNF-008 / HU-06 — Dado un 409, cuando se intenta confirmar, entonces bloquea la confirmación y reconcilia agenda+disponibilidad", async () => {
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

        await initCitas(container);
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

    // @requisito RF-008 — Dado un CRUD de cita (crear/actualizar/eliminar), cuando se completa,
    // entonces la agenda se refresca para reflejar la ocupación actualizada.
    it("RF-008 / HU-08 — Dado crear, actualizar estado y eliminar, cuando se completan, entonces refrescan la agenda", async () => {
        const { initCitas } = await import("../../src/features/citas/citas.controller.js");

        const baseAppointment = {
            id: 91,
            slotDateTime: TEST_SLOT_0900,
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

        await initCitas(container);
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
