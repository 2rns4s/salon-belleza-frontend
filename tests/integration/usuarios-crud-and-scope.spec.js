import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import createSuccessFixture from "../fixtures/usuarios/create-success.json";
import employeesCatalogFixture from "../fixtures/usuarios/employees-catalog.json";
import error409Fixture from "../fixtures/usuarios/error-409.json";
import listSuccessFixture from "../fixtures/usuarios/list-success.json";

// --- Mocks de servicio ---
const getUsersMock = vi.fn();
const createUserMock = vi.fn();
const updateUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock("../../src/features/usuarios/usuarios.service.js", () => ({
    getUsers: (...args) => getUsersMock(...args),
    createUser: (...args) => createUserMock(...args),
    updateUser: (...args) => updateUserMock(...args),
    deleteUser: (...args) => deleteUserMock(...args),
}));

// Mock de httpClient para el catálogo de empleados (scope rule: no importa empleados.service.js)
const httpClientMock = vi.fn();
vi.mock("../../src/shared/services/httpClient.js", () => ({
    httpClient: (...args) => httpClientMock(...args),
}));

function mapUserFixture(dto) {
    return {
        id: dto.idUsuario,
        username: dto.nombreUsuario,
        role: dto.rol,
        employeeId: dto.idEmpleado,
        active: dto.activo,
        mfaEnabled: dto.mfaEnabled,
    };
}

function mapEmployeeFixture(dto) {
    return {
        id: dto.idEmpleado,
        fullName: `${dto.nombre} ${dto.apellido}`,
    };
}

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

function createDeferredPromise() {
    let resolveDeferred = null;
    const promise = new Promise((resolve) => {
        resolveDeferred = resolve;
    });

    return {
        promise,
        resolve: resolveDeferred,
    };
}

describe("usuarios integration — CRUD completo", () => {
    let container;

    beforeEach(() => {
        getUsersMock.mockReset();
        createUserMock.mockReset();
        updateUserMock.mockReset();
        deleteUserMock.mockReset();
        httpClientMock.mockReset();

        container = document.createElement("section");
        document.body.appendChild(container);
    });

    // ------------------------------------------------------------------
    // LISTADO
    // ------------------------------------------------------------------

    it("USUARIOS-LIST-01: lista usuarios y renderiza tabla con datos correctos", async () => {
        getUsersMock.mockResolvedValue(listSuccessFixture.map(mapUserFixture));

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        expect(getUsersMock).toHaveBeenCalledTimes(1);

        const rows = container.querySelectorAll(".usuarios__table-row--data");
        expect(rows.length).toBe(2);
        expect(container.textContent).toContain("admin.principal");
        expect(container.textContent).toContain("recep.central");
        expect(container.textContent).toContain("OWNER");
        expect(container.textContent).toContain("RECEPTIONIST");
    });

    it("USUARIOS-LIST-02: muestra mensaje de lista vacía cuando no hay usuarios", async () => {
        getUsersMock.mockResolvedValue([]);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        expect(container.querySelector(".usuarios__table-row--empty")).not.toBeNull();
        expect(container.textContent).toContain("No hay usuarios registrados");
    });

    it("USUARIOS-LIST-03: muestra error cuando falla la carga de la lista", async () => {
        getUsersMock.mockRejectedValue({ status: 500, data: {} });

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        expect(container.querySelector(".usuarios__message--error")).not.toBeNull();
        expect(container.querySelectorAll(".usuarios__table-row--data").length).toBe(0);
    });

    // ------------------------------------------------------------------
    // CREACIÓN — catálogo de empleados (SCOPE RULE)
    // ------------------------------------------------------------------

    it("USUARIOS-CREATE-CATALOG-01: carga catálogo de empleados via httpClient directo (Scope Rule — no usa empleados.service.js)", async () => {
        getUsersMock.mockResolvedValue([]);
        // El catálogo de empleados se carga con httpClient directo, NO con empleados.service.js
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        // Abre el modal de creación
        const openBtn = container.querySelector("[data-action='open-create-modal']");
        expect(openBtn).not.toBeNull();
        openBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // El httpClient fue llamado con el endpoint de empleados
        expect(httpClientMock).toHaveBeenCalledWith("/api/v1/empleados");

        // El select de empleados se renderizó con las opciones del catálogo
        const employeeSelect = container.querySelector("#usuarios-employee-select");
        expect(employeeSelect).not.toBeNull();
        expect(employeeSelect.querySelectorAll("option").length).toBeGreaterThan(1);
        expect(container.textContent).toContain("Juan Torres");
        expect(container.textContent).toContain("Mariana Rodriguez");
    });

    it("USUARIOS-CREATE-CATALOG-02: muestra estado de carga y maneja catálogo vacío de empleados", async () => {
        getUsersMock.mockResolvedValue([]);

        const deferredCatalog = createDeferredPromise();
        httpClientMock.mockReturnValue(deferredCatalog.promise);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));

        // Mientras la promesa sigue pendiente, debe verse estado de carga
        expect(container.textContent).toContain("Cargando empleados");

        deferredCatalog.resolve([]);
        await flushPromises();
        await flushPromises();

        // Catálogo vacío: sin select y con mensaje explícito
        expect(container.querySelector("#usuarios-employee-select")).toBeNull();
        expect(container.textContent).toContain("No hay empleados disponibles");
    });

    it("USUARIOS-CREATE-01: crea usuario, muestra éxito y refresca listado", async () => {
        const initialUsers = [mapUserFixture(listSuccessFixture[0])];
        const createdUser = mapUserFixture(createSuccessFixture);

        getUsersMock
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce([...initialUsers, createdUser]);

        createUserMock.mockResolvedValue(createdUser);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        // Abre modal
        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // Completa el formulario
        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "nuevo.user";
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "RECEPTIONIST";
        createForm.querySelector("#usuarios-employee-select").value = "12";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        // Verifica que se llamó createUser con los campos correctos del CrearUsuarioRequest
        expect(createUserMock).toHaveBeenCalledWith({
            nombreUsuario: "nuevo.user",
            contrasena: "password123",
            rol: "RECEPTIONIST",
            idEmpleado: 12,
        });
        expect(getUsersMock).toHaveBeenCalledTimes(2);
        expect(container.querySelector(".usuarios__message--success")?.textContent).toContain("creado exitosamente");
        expect(container.querySelector("#usuarios-create-form")).toBeNull();
    });

    it("USUARIOS-CREATE-02: validación local bloquea envío con nombreUsuario < 4 chars", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "ab"; // < 4 chars
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "RECEPTIONIST";
        createForm.querySelector("#usuarios-employee-select").value = "10";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();

        // No debería llamar al servicio
        expect(createUserMock).not.toHaveBeenCalled();
        // Debe mostrar error de campo
        const formErrors = container.querySelectorAll(".usuarios__form-error");
        const hasUsernameError = Array.from(formErrors).some((el) => el.textContent.includes("4"));
        expect(hasUsernameError).toBe(true);
    });

    it("USUARIOS-CREATE-03: validación local bloquea si no se selecciona empleado", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "valido.user";
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "OWNER";
        // No selecciona empleado (value = "")

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();

        expect(createUserMock).not.toHaveBeenCalled();
        const formErrors = container.querySelectorAll(".usuarios__form-error");
        const hasEmployeeError = Array.from(formErrors).some((el) => el.textContent.includes("empleado"));
        expect(hasEmployeeError).toBe(true);
    });

    it("USUARIOS-CREATE-04: error 409 del backend muestra mensaje en modal y conserva formulario abierto", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);
        createUserMock.mockRejectedValue({
            status: 409,
            data: error409Fixture,
        });

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "admin.principal"; // duplicado
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "OWNER";
        createForm.querySelector("#usuarios-employee-select").value = "10";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        // El modal permanece abierto
        expect(container.querySelector("#usuarios-create-form")).not.toBeNull();
        // Se muestra el error 409
        const feedbackEl = container.querySelector(".usuarios__form-feedback--error");
        expect(feedbackEl).not.toBeNull();
        expect(feedbackEl.textContent).toContain("uso");
    });

    it("USUARIOS-CREATE-05: validación local bloquea envío con contrasena < 8 caracteres", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "valido.user";
        createForm.querySelector("#usuarios-password").value = "short7";
        createForm.querySelector("#usuarios-rol").value = "OWNER";
        createForm.querySelector("#usuarios-employee-select").value = "10";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();

        expect(createUserMock).not.toHaveBeenCalled();

        const formErrors = container.querySelectorAll(".usuarios__form-error");
        const hasPasswordError = Array.from(formErrors)
            .some((el) => el.textContent.toLowerCase().includes("contraseña") && el.textContent.includes("8"));
        expect(hasPasswordError).toBe(true);
    });

    it("USUARIOS-CREATE-06: 409 por idEmpleado ya asignado muestra error descriptivo", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);
        createUserMock.mockRejectedValue({
            status: 409,
            data: {
                ...error409Fixture,
                message: "El empleado seleccionado ya tiene un usuario asignado",
            },
        });

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "nuevo.user";
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "RECEPTIONIST";
        createForm.querySelector("#usuarios-employee-select").value = "10";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        const feedbackEl = container.querySelector(".usuarios__form-feedback--error");
        expect(feedbackEl).not.toBeNull();
        expect(feedbackEl.textContent.toLowerCase()).toContain("empleado");
    });

    // ------------------------------------------------------------------
    // EDICIÓN
    // ------------------------------------------------------------------

    it("USUARIOS-EDIT-OPEN-01: abre modal con datos precargados, placeholder y estado activo", async () => {
        const initialUsers = listSuccessFixture.map(mapUserFixture);
        initialUsers[0] = { ...initialUsers[0], active: false };

        getUsersMock.mockResolvedValue(initialUsers);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-edit-modal'][data-user-id='1']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const editForm = container.querySelector("#usuarios-edit-form");
        expect(editForm).not.toBeNull();

        const usernameInput = editForm.querySelector("#usuarios-edit-username");
        const passwordInput = editForm.querySelector("#usuarios-edit-password");
        const activeCheckbox = editForm.querySelector("#usuarios-edit-activo");

        expect(usernameInput.value).toBe("admin.principal");
        expect(passwordInput.type).toBe("password");
        expect(passwordInput.placeholder).toContain("Dejar vacío para no cambiar");
        expect(activeCheckbox.checked).toBe(false);
    });

    it("USUARIOS-EDIT-01: edita usuario, muestra éxito y refresca listado", async () => {
        const initialUsers = listSuccessFixture.map(mapUserFixture);
        const updatedUser = { ...initialUsers[0], role: "RECEPTIONIST" };

        getUsersMock
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce([updatedUser, initialUsers[1]]);
        updateUserMock.mockResolvedValue(updatedUser);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        // Abre el modal de edición para el usuario 1
        const editBtn = container.querySelector("[data-action='open-edit-modal'][data-user-id='1']");
        expect(editBtn).not.toBeNull();
        editBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const editForm = container.querySelector("#usuarios-edit-form");
        expect(editForm).not.toBeNull();

        // Cambia el rol
        editForm.querySelector("#usuarios-edit-rol").value = "RECEPTIONIST";
        // Deja contraseña vacía
        editForm.querySelector("#usuarios-edit-password").value = "";

        editForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        // El controlador pasa contrasena:"" al servicio; mapUpdateUserPayload la omite del payload HTTP
        // (verificado en usuarios-service-contract.spec.js USUARIOS-SVC-03)
        const callArgs = updateUserMock.mock.calls[0];
        expect(callArgs[0]).toBe(1); // userId
        expect(String(callArgs[1]?.contrasena ?? "")).toBe("");

        expect(container.querySelector(".usuarios__message--success")?.textContent).toContain("actualizado exitosamente");
    });

    it("USUARIOS-EDIT-02: cuando se define una nueva contraseña, se envía al servicio", async () => {
        const initialUsers = listSuccessFixture.map(mapUserFixture);
        const updatedUser = { ...initialUsers[0], role: "OWNER" };

        getUsersMock
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce([updatedUser, initialUsers[1]]);
        updateUserMock.mockResolvedValue(updatedUser);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-edit-modal'][data-user-id='1']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const editForm = container.querySelector("#usuarios-edit-form");
        editForm.querySelector("#usuarios-edit-password").value = "nuevaClave123";

        editForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        const callArgs = updateUserMock.mock.calls[0];
        expect(callArgs[0]).toBe(1);
        expect(callArgs[1]).toMatchObject({ contrasena: "nuevaClave123" });
    });

    it("USUARIOS-EDIT-03: permite reactivar usuario inactivo enviando activo=true", async () => {
        const initialUsers = listSuccessFixture.map(mapUserFixture);
        initialUsers[0] = { ...initialUsers[0], active: false };
        const reactivatedUser = { ...initialUsers[0], active: true };

        getUsersMock
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce([reactivatedUser, initialUsers[1]]);
        updateUserMock.mockResolvedValue(reactivatedUser);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-edit-modal'][data-user-id='1']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const editForm = container.querySelector("#usuarios-edit-form");
        const activeCheckbox = editForm.querySelector("#usuarios-edit-activo");
        expect(activeCheckbox.checked).toBe(false);

        activeCheckbox.checked = true;
        editForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();

        const callArgs = updateUserMock.mock.calls[0];
        expect(callArgs[0]).toBe(1);
        expect(callArgs[1]).toMatchObject({ activo: true });
        expect(container.textContent).toContain("Activo");
    });

    // ------------------------------------------------------------------
    // DESACTIVACIÓN (soft delete)
    // ------------------------------------------------------------------

    it("USUARIOS-DEACTIVATE-01: desactiva usuario tras confirmación y refresca listado", async () => {
        const initialUsers = listSuccessFixture.map(mapUserFixture);
        const usersAfterDeactivate = [
            { ...initialUsers[0], active: false },
            initialUsers[1],
        ];

        getUsersMock
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce(usersAfterDeactivate);
        deleteUserMock.mockResolvedValue(undefined);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        // Abre el modal de confirmación
        const deactivateBtn = container.querySelector("[data-action='open-deactivate-modal'][data-user-id='1']");
        expect(deactivateBtn).not.toBeNull();
        deactivateBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // Confirma la desactivación
        const confirmBtn = container.querySelector("[data-action='confirm-deactivate']");
        expect(confirmBtn).not.toBeNull();
        confirmBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();
        await flushPromises();

        expect(deleteUserMock).toHaveBeenCalledWith("1");
        expect(getUsersMock).toHaveBeenCalledTimes(2);
        expect(container.querySelector(".usuarios__message--success")?.textContent).toContain("desactivado exitosamente");
    });

    it("USUARIOS-DEACTIVATE-02: cancelar desactivación no llama a deleteUser", async () => {
        getUsersMock.mockResolvedValue(listSuccessFixture.map(mapUserFixture));

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        // Abre el modal de confirmación
        container.querySelector("[data-action='open-deactivate-modal'][data-user-id='1']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // Cancela
        container.querySelector("[data-action='cancel-deactivate']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        expect(deleteUserMock).not.toHaveBeenCalled();
        expect(container.querySelector("[data-action='confirm-deactivate']")).toBeNull();
    });

    // ------------------------------------------------------------------
    // RESTRICCIONES DE DISEÑO
    // ------------------------------------------------------------------

    it("SCOPE-RULE: el módulo usuarios NO importa nada de src/features/empleados/ y usa httpClient directo", async () => {
        const controllerFilePath = join(
            process.cwd(),
            "src/features/usuarios/usuarios.controller.js",
        );

        const controllerSource = await readFile(
            controllerFilePath,
            "utf8",
        );

        const importLines = controllerSource
            .split("\n")
            .filter((line) => line.trim().startsWith("import "))
            .join("\n");

        expect(importLines).not.toMatch(/features\/empleados|empleados\.service/i);
        expect(controllerSource).toContain("httpClient(USUARIOS_ENDPOINTS.employees)");
    });

    // ------------------------------------------------------------------
    // ESTABILIDAD DEL MODAL
    // ------------------------------------------------------------------

    it("USUARIOS-MODAL-STABLE-CREATE-01: click en input interno no cierra el modal de creación", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']").dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const overlay = container.querySelector(".usuarios__modal-overlay");
        expect(overlay).not.toBeNull();

        // Click dentro del input (burbujea hasta el overlay)
        const usernameInput = overlay.querySelector("#usuarios-username");
        expect(usernameInput).not.toBeNull();
        usernameInput.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // El modal sigue abierto
        expect(container.querySelector(".usuarios__modal-overlay")).not.toBeNull();
    });

    it("USUARIOS-MODAL-STABLE-CREATE-02: botón de cerrar explícito sí cierra el modal de creación", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']").dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        expect(container.querySelector(".usuarios__modal-overlay")).not.toBeNull();

        // Hace click en el botón de cerrar (no en el overlay)
        const closeBtn = container.querySelector(".usuarios__modal [data-action='close-create-modal']");
        expect(closeBtn).not.toBeNull();
        closeBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // El modal se cerró
        expect(container.querySelector(".usuarios__modal-overlay")).toBeNull();
    });

    it("USUARIOS-MODAL-STABLE-EDIT-01: click en input interno no cierra el modal de edición", async () => {
        getUsersMock.mockResolvedValue(listSuccessFixture.map(mapUserFixture));

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-edit-modal'][data-user-id='1']").dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const overlay = container.querySelector(".usuarios__modal-overlay");
        expect(overlay).not.toBeNull();

        // Click dentro de un input del modal (burbujea hasta el overlay)
        const editInput = overlay.querySelector("#usuarios-edit-username");
        expect(editInput).not.toBeNull();
        editInput.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // El modal sigue abierto
        expect(container.querySelector(".usuarios__modal-overlay")).not.toBeNull();
    });

    it("USUARIOS-MODAL-STABLE-EDIT-02: botón de cerrar explícito sí cierra el modal de edición", async () => {
        getUsersMock.mockResolvedValue(listSuccessFixture.map(mapUserFixture));

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-edit-modal'][data-user-id='1']").dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        expect(container.querySelector(".usuarios__modal-overlay")).not.toBeNull();

        // Hace click en el botón de cerrar explícito (dentro del diálogo)
        const closeBtn = container.querySelector(".usuarios__modal [data-action='close-edit-modal']");
        expect(closeBtn).not.toBeNull();
        closeBtn.dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        // El modal se cerró
        expect(container.querySelector(".usuarios__modal-overlay")).toBeNull();
    });

    it("USUARIOS-ROLES-01: el formulario solo acepta OWNER y RECEPTIONIST como roles válidos", async () => {
        getUsersMock.mockResolvedValue([]);
        httpClientMock.mockResolvedValue(employeesCatalogFixture);

        const { initUsuarios } = await import("../../src/features/usuarios/usuarios.controller.js");
        await initUsuarios(container);
        await flushPromises();

        container.querySelector("[data-action='open-create-modal']")
            .dispatchEvent(new Event("click", { bubbles: true }));
        await flushPromises();

        const createForm = container.querySelector("#usuarios-create-form");
        createForm.querySelector("#usuarios-username").value = "valid.user";
        createForm.querySelector("#usuarios-password").value = "password123";
        createForm.querySelector("#usuarios-rol").value = "SUPERADMIN"; // Rol inválido
        createForm.querySelector("#usuarios-employee-select").value = "10";

        createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();

        // No debe llamar al servicio con un rol inválido
        expect(createUserMock).not.toHaveBeenCalled();
    });
});
