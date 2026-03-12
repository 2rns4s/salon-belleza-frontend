import {
    CLIENTES_UI_MESSAGES,
    CLIENTES_VALIDATION_RULES,
} from "./clientes.constants.js";
import { mapClientFieldErrors, normalizeClientesHttpError } from "./clientes.mappers.js";
import { createClient, getClients } from "./clientes.service.js";
import { renderClientesPage } from "./clientes.view.js";

let domContainer = null;
let state = createInitialState();

const listenersRegistry = {
    submit: null,
    click: null,
};

function createEmptyCreateForm() {
    return {
        firstName: "",
        lastName: "",
        phone: "",
        documentNumber: "",
    };
}

function createInitialState() {
    return {
        loadingList: false,
        savingCreate: false,
        clients: [],
        errorMessage: "",
        successMessage: "",
        isCreateModalOpen: false,
        createErrorMessage: "",
        fieldErrors: {},
        createForm: createEmptyCreateForm(),
    };
}

function resolveClientesContainer(container) {
    if (container instanceof Element) {
        return container;
    }

    if (typeof document === "undefined") {
        return null;
    }

    const appContent = document.querySelector(".app__content");
    return appContent instanceof Element ? appContent : null;
}

function removeContainerListeners() {
    if (!domContainer) {
        return;
    }

    if (listenersRegistry.submit) {
        domContainer.removeEventListener("submit", listenersRegistry.submit);
        listenersRegistry.submit = null;
    }

    if (listenersRegistry.click) {
        domContainer.removeEventListener("click", listenersRegistry.click);
        listenersRegistry.click = null;
    }
}

function assignContainerListeners() {
    if (!domContainer) {
        return;
    }

    removeContainerListeners();

    listenersRegistry.submit = (event) => {
        const formElement = event.target;

        if (!(formElement instanceof HTMLFormElement)) {
            return;
        }

        if (formElement.id !== "clients-create-form") {
            return;
        }

        event.preventDefault();
        void handleCreateSubmit(new FormData(formElement));
    };

    listenersRegistry.click = (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const refreshButton = target.closest("#clients-refresh-btn");
        if (refreshButton) {
            event.preventDefault();
            void loadClients();
            return;
        }

        const openModalButton = target.closest("#clients-open-create-btn");
        if (openModalButton) {
            event.preventDefault();
            handleOpenCreateModal();
            return;
        }

        const closeModalButton = target.closest("#clients-close-modal-btn, #clients-cancel-create-btn");
        if (closeModalButton) {
            event.preventDefault();
            handleCloseCreateModal();
            return;
        }

        if (target.classList.contains("clients__modal-overlay")) {
            event.preventDefault();
            handleCloseCreateModal();
        }
    };

    domContainer.addEventListener("submit", listenersRegistry.submit);
    domContainer.addEventListener("click", listenersRegistry.click);
}

function renderClientesScreen() {
    if (!domContainer) {
        return;
    }

    domContainer.innerHTML = renderClientesPage(state);
    assignContainerListeners();
}

function mapCreateFormData(formData) {
    return {
        firstName: String(formData.get("firstName") || "").trim(),
        lastName: String(formData.get("lastName") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        documentNumber: String(formData.get("documentNumber") || "").trim(),
    };
}

function validateCreateInput(createForm) {
    const validationErrors = {};

    if (!createForm.firstName) {
        validationErrors.firstName = "El nombre es obligatorio.";
    } else if (
        createForm.firstName.length < CLIENTES_VALIDATION_RULES.firstNameMinLength
        || createForm.firstName.length > CLIENTES_VALIDATION_RULES.firstNameMaxLength
    ) {
        validationErrors.firstName = "El nombre debe tener entre 3 y 100 caracteres.";
    }

    if (!createForm.lastName) {
        validationErrors.lastName = "El apellido es obligatorio.";
    } else if (
        createForm.lastName.length < CLIENTES_VALIDATION_RULES.lastNameMinLength
        || createForm.lastName.length > CLIENTES_VALIDATION_RULES.lastNameMaxLength
    ) {
        validationErrors.lastName = "El apellido debe tener entre 3 y 100 caracteres.";
    }

    if (!CLIENTES_VALIDATION_RULES.phonePattern.test(createForm.phone)) {
        validationErrors.phone = "El telefono debe iniciar en 3 y tener 10 digitos.";
    }

    if (!CLIENTES_VALIDATION_RULES.documentPattern.test(createForm.documentNumber)) {
        validationErrors.documentNumber = "El documento debe tener entre 8 y 10 digitos.";
    }

    return validationErrors;
}

function resetCreateFeedback() {
    state.createErrorMessage = "";
    state.fieldErrors = {};
}

async function loadClients({ preserveSuccessMessage = false } = {}) {
    state.loadingList = true;
    state.errorMessage = "";

    if (!preserveSuccessMessage) {
        state.successMessage = "";
    }

    renderClientesScreen();

    try {
        const response = await getClients();
        state.clients = Array.isArray(response?.items) ? response.items : [];
    } catch (error) {
        const normalizedError = normalizeClientesHttpError(error);
        state.errorMessage = normalizedError.message;
        state.clients = [];
    } finally {
        state.loadingList = false;
        renderClientesScreen();
    }
}

function handleOpenCreateModal() {
    state.isCreateModalOpen = true;
    state.createForm = createEmptyCreateForm();
    resetCreateFeedback();
    renderClientesScreen();
}

function handleCloseCreateModal() {
    state.isCreateModalOpen = false;
    state.createForm = createEmptyCreateForm();
    state.savingCreate = false;
    resetCreateFeedback();
    renderClientesScreen();
}

async function handleCreateSubmit(formData) {
    state.createForm = mapCreateFormData(formData);

    const validationErrors = validateCreateInput(state.createForm);
    if (Object.keys(validationErrors).length > 0) {
        state.fieldErrors = validationErrors;
        state.createErrorMessage = CLIENTES_UI_MESSAGES.localValidation;
        renderClientesScreen();
        return;
    }

    state.savingCreate = true;
    state.successMessage = "";
    state.errorMessage = "";
    state.createErrorMessage = "";
    state.fieldErrors = {};

    renderClientesScreen();

    try {
        const createdClient = await createClient(state.createForm);
        const fullName = String(
            createdClient?.fullName
                || `${state.createForm.firstName} ${state.createForm.lastName}`,
        ).trim();

        state.successMessage = fullName
            ? `Cliente ${fullName} registrado correctamente.`
            : CLIENTES_UI_MESSAGES.createSuccess;

        state.isCreateModalOpen = false;
        state.createForm = createEmptyCreateForm();
        resetCreateFeedback();

        await loadClients({ preserveSuccessMessage: true });
    } catch (error) {
        const normalizedError = normalizeClientesHttpError(error);

        state.createErrorMessage = normalizedError.message;
        state.fieldErrors = normalizedError.status === 400
            ? mapClientFieldErrors(normalizedError.fieldErrors)
            : {};
        state.isCreateModalOpen = true;
        renderClientesScreen();
    } finally {
        state.savingCreate = false;
        renderClientesScreen();
    }
}

export async function initClientes(container) {
    cleanupClientes();

    domContainer = resolveClientesContainer(container);
    if (!domContainer) {
        return;
    }

    state = createInitialState();
    renderClientesScreen();

    await loadClients();
}

export function cleanupClientes() {
    removeContainerListeners();
    domContainer = null;
    state = createInitialState();
}
