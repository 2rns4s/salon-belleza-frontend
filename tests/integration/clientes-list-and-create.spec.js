import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/clientes/create-success.json";
import error400Fixture from "../fixtures/clientes/error-400.json";
import error409Fixture from "../fixtures/clientes/error-409.json";
import listSuccessFixture from "../fixtures/clientes/list-success.json";

const getClientsMock = vi.fn();
const createClientMock = vi.fn();
const updateClientMock = vi.fn();

vi.mock("../../src/features/clientes/clientes.service.js", () => ({
  getClients: (...args) => getClientsMock(...args),
  createClient: (...args) => createClientMock(...args),
  updateClient: (...args) => updateClientMock(...args),
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
    updateClientMock.mockReset();

    container = document.createElement("section");
    document.body.appendChild(container);
  });

  async function openEditForm() {
    const client = mapClientFixture(listSuccessFixture[0]);
    getClientsMock.mockResolvedValue({ items: [client], total: 1 });
    const { initClientes } = await import("../../src/features/clientes/clientes.controller.js");

    await initClientes(container);
    container.querySelector('[data-clients-action="edit"]').click();
    return { client, form: container.querySelector("#clients-edit-form") };
  }

  it("precarga el cliente, guarda la edicion y actualiza la fila", async () => {
    const { client, form } = await openEditForm();
    expect(form.elements.firstName.value).toBe(client.firstName);
    expect(form.elements.lastName.value).toBe(client.lastName);
    expect(form.elements.phone.value).toBe(client.phone);
    expect(form.elements.namedItem("documentNumber")).toBeNull();
    expect(form.textContent).toContain(client.documentNumber);

    const updated = { ...client, firstName: "Alicia", fullName: `Alicia ${client.lastName}` };
    updateClientMock.mockResolvedValue(updated);
    form.elements.firstName.value = " Alicia ";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(updateClientMock).toHaveBeenCalledWith(client.id, {
      firstName: "Alicia", lastName: client.lastName, phone: client.phone,
    });
    expect(container.querySelector("#clients-edit-form")).toBeNull();
    expect(container.querySelector(".clients__table-row--data").textContent).toContain(updated.fullName);
    expect(container.querySelector('[role="status"]').textContent).toContain("actualizado");
  });

  it.each([
    [400, { details: ["telefono: Formato incorrecto"] }, "Formato incorrecto"],
    [404, {}, "no se encontro"],
    [409, {}, "otro cliente"],
    [500, {}, "Intenta nuevamente"],
  ])("conserva los datos y muestra el error HTTP %i", async (status, data, message) => {
    const { form } = await openEditForm();
    updateClientMock.mockRejectedValue({ status, data });
    form.elements.phone.value = "3007776655";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();

    const editForm = container.querySelector("#clients-edit-form");
    expect(editForm.elements.phone.value).toBe("3007776655");
    expect(editForm.textContent).toContain(message);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("valida los tres campos de la edicion antes de llamar a la API", async () => {
    const { form } = await openEditForm();
    form.elements.firstName.value = " ";
    form.elements.lastName.value = " ";
    form.elements.phone.value = "123";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(updateClientMock).not.toHaveBeenCalled();
    expect(container.querySelector("#clients-edit-form").textContent).toContain("Corrige los campos");
  });

  it("acepta nombres de 3 y 100 caracteres y un celular nacional", async () => {
    const { client, form } = await openEditForm();
    const firstName = "Ana";
    const lastName = "A".repeat(100);
    updateClientMock.mockResolvedValue(client);
    form.elements.firstName.value = firstName;
    form.elements.lastName.value = lastName;
    form.elements.phone.value = "3000000000";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(updateClientMock).toHaveBeenCalledWith(client.id, {
      firstName, lastName, phone: "3000000000",
    });
  });

  it("rechaza nombres fuera del rango y un celular con prefijo internacional", async () => {
    const { form } = await openEditForm();
    form.elements.firstName.value = "An";
    form.elements.lastName.value = "A".repeat(101);
    form.elements.phone.value = "+573000000000";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    const fieldErrors = container.querySelectorAll("#clients-edit-form .clients__field-error");
    expect(fieldErrors[0].textContent).toContain("3 y 100");
    expect(fieldErrors[1].textContent).toContain("3 y 100");
    expect(fieldErrors[2].textContent).toContain("10 digitos");
    expect(updateClientMock).not.toHaveBeenCalled();
  });

  it("permite cancelar la edicion sin guardar", async () => {
    const { client, form } = await openEditForm();
    form.elements.firstName.value = "Alicia";
    form.querySelector("#clients-cancel-create-btn").click();

    expect(updateClientMock).not.toHaveBeenCalled();
    expect(container.querySelector("#clients-edit-form")).toBeNull();
    expect(container.querySelector(".clients__table-row--data").textContent).toContain(client.fullName);
  });

  it("evita un segundo guardado mientras el PUT esta pendiente", async () => {
    const { client, form } = await openEditForm();
    let finishUpdate;
    updateClientMock.mockReturnValue(new Promise((resolve) => { finishUpdate = resolve; }));
    const submit = new Event("submit", { bubbles: true, cancelable: true });

    form.dispatchEvent(submit);
    const pendingForm = container.querySelector("#clients-edit-form");
    expect(pendingForm.querySelector('button[type="submit"]').disabled).toBe(true);
    pendingForm.dispatchEvent(submit);
    expect(updateClientMock).toHaveBeenCalledTimes(1);

    finishUpdate(client);
    await flushPromises();
    expect(container.querySelector("#clients-edit-form")).toBeNull();
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
    createForm.querySelector("#clients-first-name").value = " Maria ";
    createForm.querySelector("#clients-last-name").value = " Gomez ";
    createForm.querySelector("#clients-phone").value = " 3007776655 ";
    createForm.querySelector("#clients-document").value = " 12345678 ";

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
