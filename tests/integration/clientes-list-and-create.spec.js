import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/clientes/create-success.json";
import error400Fixture from "../fixtures/clientes/error-400.json";
import error409Fixture from "../fixtures/clientes/error-409.json";
import listSuccessFixture from "../fixtures/clientes/list-success.json";

const getClientsMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("../../src/features/clientes/clientes.service.js", () => ({
    getClients: (...args) => getClientsMock(...args),
    createClient: (...args) => createClientMock(...args),
}));

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

function mapClientFixture(clientDto) {
    return {
        id: clientDto.idCliente,
        firstName: clientDto.nombre,
        lastName: clientDto.apellido,
        fullName: `${clientDto.nombre} ${clientDto.apellido}`,
        documentNumber: clientDto.documento,
        phone: clientDto.telefono,
    };
}

describe("clientes integration", () => {
    let container;

    beforeEach(() => {
        getClientsMock.mockReset();
        createClientMock.mockReset();

        container = document.createElement("section");
        document.body.appendChild(container);
    });

    it("CLIENTES-LIST-01: lista clientes desde el servicio y renderiza tabla", async () => {
        getClientsMock.mockResolvedValue({
            items: listSuccessFixture.map((item) => mapClientFixture(item)),
            total: listSuccessFixture.length,
        });

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        expect(getClientsMock).toHaveBeenCalledTimes(1);
        expect(container.querySelectorAll(".clients__table-row--data").length).toBe(2);
        expect(container.textContent).toContain("Ana Lopez");
        expect(container.textContent).toContain("Carlos Perez");
    });

    it("CLIENTES-LIST-01: muestra error entendible y evita render parcial cuando falla el listado", async () => {
        getClientsMock.mockRejectedValue({
            status: 500,
            data: {},
        });

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        expect(getClientsMock).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".clients__message--error")?.textContent).toContain("No fue posible completar la operacion");
        expect(container.querySelectorAll(".clients__table-row--data").length).toBe(0);
        expect(container.querySelector(".clients__table-row--empty")?.textContent).toContain("Aun no hay clientes registrados");
    });

    it("CLIENTES-CREATE-01: crea cliente, muestra exito y refresca listado", async () => {
        const initialClients = [mapClientFixture(listSuccessFixture[0])];
        const createdClient = mapClientFixture(createSuccessFixture);

        getClientsMock
            .mockResolvedValueOnce({ items: initialClients, total: 1 })
            .mockResolvedValueOnce({ items: [...initialClients, createdClient], total: 2 });

        createClientMock.mockResolvedValue(createdClient);

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        container.querySelector("#clients-open-create-btn")
            .dispatchEvent(new Event("click", { bubbles: true }));

        const createForm = container.querySelector("#clients-create-form");
        createForm.querySelector("#clients-first-name").value = "Maria";
        createForm.querySelector("#clients-last-name").value = "Gomez";
        createForm.querySelector("#clients-phone").value = "3007776655";
        createForm.querySelector("#clients-document").value = "12345678";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();
        await flushPromises();

        expect(createClientMock).toHaveBeenCalledWith({
            firstName: "Maria",
            lastName: "Gomez",
            phone: "3007776655",
            documentNumber: "12345678",
        });
        expect(getClientsMock).toHaveBeenCalledTimes(2);
        expect(container.querySelector(".clients__message--success")?.textContent).toContain("registrado correctamente");
        expect(container.querySelector(".clients__modal-overlay")).toBeNull();
    });

    it("CLIENTES-CREATE-01: error 400 mantiene modal con errores y conserva formulario", async () => {
        getClientsMock.mockResolvedValue({ items: [], total: 0 });

        createClientMock.mockRejectedValue({
            status: 400,
            data: error400Fixture,
        });

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        container.querySelector("#clients-open-create-btn")
            .dispatchEvent(new Event("click", { bubbles: true }));

        const createForm = container.querySelector("#clients-create-form");
        createForm.querySelector("#clients-first-name").value = "Ana";
        createForm.querySelector("#clients-last-name").value = "Lopez";
        createForm.querySelector("#clients-phone").value = "3001234567";
        createForm.querySelector("#clients-document").value = "10203040";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();
        await flushPromises();

        expect(createClientMock).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".clients__form-message--error")?.textContent).toContain("validacion");
        expect(container.querySelector("#clients-phone")?.value).toBe("3001234567");
        expect(container.querySelector("#clients-document")?.value).toBe("10203040");
        expect(container.querySelector(".clients__modal-overlay")).not.toBeNull();
    });

    it("CLIENTES-CREATE-01: validacion local bloquea POST y muestra errores por campo", async () => {
        getClientsMock.mockResolvedValue({ items: [], total: 0 });

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        container.querySelector("#clients-open-create-btn")
            .dispatchEvent(new Event("click", { bubbles: true }));

        const createForm = container.querySelector("#clients-create-form");
        createForm.querySelector("#clients-first-name").value = "Maria";
        createForm.querySelector("#clients-last-name").value = "Gomez";
        createForm.querySelector("#clients-phone").value = "123";
        createForm.querySelector("#clients-document").value = "12A";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        const fieldErrors = Array.from(container.querySelectorAll(".clients__field-error"))
            .map((errorNode) => errorNode.textContent || "")
            .join(" ");

        expect(createClientMock).toHaveBeenCalledTimes(0);
        expect(container.querySelector(".clients__form-message--error")?.textContent).toContain("Corrige los campos marcados");
        expect(fieldErrors).toContain("telefono");
        expect(fieldErrors).toContain("documento");
    });

    it("CLIENTES-CREATE-01: error 409 muestra conflicto y conserva contexto", async () => {
        getClientsMock.mockResolvedValue({ items: [], total: 0 });

        createClientMock.mockRejectedValue({
            status: 409,
            data: error409Fixture,
        });

        const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

        await initClientes(container);
        await flushPromises();

        container.querySelector("#clients-open-create-btn")
            .dispatchEvent(new Event("click", { bubbles: true }));

        const createForm = container.querySelector("#clients-create-form");
        createForm.querySelector("#clients-first-name").value = "Maria";
        createForm.querySelector("#clients-last-name").value = "Gomez";
        createForm.querySelector("#clients-phone").value = "3007776655";
        createForm.querySelector("#clients-document").value = "12345678";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();
        await flushPromises();

        expect(createClientMock).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".clients__form-message--error")?.textContent).toContain("Cliente ya registrado");
        expect(container.querySelector("#clients-first-name")?.value).toBe("Maria");
        expect(container.querySelector(".clients__modal-overlay")).not.toBeNull();
    });
});
