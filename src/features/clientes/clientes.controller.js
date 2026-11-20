import {
  CLIENTES_UI_MESSAGES,
  CLIENTES_VALIDATION_RULES,
} from "./clientes.constants.js";
import {
  mapClientFieldErrors,
  normalizeClientForm,
  normalizeClientesHttpError,
  normalizeClientUpdateError,
} from "./clientes.mappers.js";
import { createClient, getClients, updateClient } from "./clientes.service.js";
import { renderClientesPage } from "./clientes.view.js";

let domContainer = null;
let state = createInitialState();

const listenersRegistry = {
  submit: null,
  click: null,
};

function createEmptyForm() {
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
    savingForm: false,
    clients: [],
    errorMessage: "",
    successMessage: "",
    isFormOpen: false,
    editingClient: null,
    formErrorMessage: "",
    fieldErrors: {},
    form: createEmptyForm(),
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

    if (!["clients-create-form", "clients-edit-form"].includes(formElement.id)) {
      return;
    }

    event.preventDefault();
    void handleFormSubmit(new FormData(formElement));
  };

  listenersRegistry.click = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const refreshButton = target.closest("#clients-refresh-btn");
    if (refreshButton) {
      event.preventDefault();
      if (!state.isFormOpen && !state.loadingList) void loadClients();
      return;
    }

    const openModalButton = target.closest("#clients-open-create-btn");
    if (openModalButton) {
      event.preventDefault();
      handleOpenForm();
      return;
    }

    const editButton = target.closest('[data-clients-action="edit"]');
    if (editButton) {
      const client = state.clients.find((item) => String(item.id) === editButton.dataset.clientId);
      if (client) handleOpenForm(client);
      return;
    }

    const closeModalButton = target.closest("#clients-close-modal-btn, #clients-cancel-create-btn");
    if (closeModalButton) {
      event.preventDefault();
      handleCloseForm();
      return;
    }

    if (target.classList.contains("clients__modal-overlay")) {
      event.preventDefault();
      handleCloseForm();
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

function validateForm(form, editingClient) {
  const validationErrors = {};

  if (!form.firstName) {
    validationErrors.firstName = "El nombre es obligatorio.";
  } else if (
    form.firstName.length < CLIENTES_VALIDATION_RULES.firstNameMinLength
    || form.firstName.length > CLIENTES_VALIDATION_RULES.firstNameMaxLength
  ) {
    validationErrors.firstName = "El nombre debe tener entre 3 y 100 caracteres.";
  }

  if (!form.lastName) {
    validationErrors.lastName = "El apellido es obligatorio.";
  } else if (
    form.lastName.length < CLIENTES_VALIDATION_RULES.lastNameMinLength
    || form.lastName.length > CLIENTES_VALIDATION_RULES.lastNameMaxLength
  ) {
    validationErrors.lastName = "El apellido debe tener entre 3 y 100 caracteres.";
  }

  if (!CLIENTES_VALIDATION_RULES.phonePattern.test(form.phone)) {
    validationErrors.phone = "El telefono debe iniciar en 3 y tener 10 digitos.";
  }

  if (!editingClient && !CLIENTES_VALIDATION_RULES.documentPattern.test(form.documentNumber)) {
    validationErrors.documentNumber = "El documento debe tener entre 8 y 10 digitos.";
  }

  return validationErrors;
}

function resetFormFeedback() {
  state.formErrorMessage = "";
  state.fieldErrors = {};
}

async function loadClients({ preserveSuccessMessage = false } = {}) {
  const activeState = state;
  state.loadingList = true;
  state.errorMessage = "";

  if (!preserveSuccessMessage) {
    state.successMessage = "";
  }

  renderClientesScreen();

  try {
    const response = await getClients();
    if (state !== activeState) return;
    state.clients = Array.isArray(response?.items) ? response.items : [];
  } catch (error) {
    if (state !== activeState) return;
    const normalizedError = normalizeClientesHttpError(error);
    state.errorMessage = normalizedError.message;
    state.clients = [];
  } finally {
    if (state === activeState) {
      state.loadingList = false;
      renderClientesScreen();
    }
  }
}

function handleOpenForm(client = null) {
  if (state.isFormOpen) return;
  state.isFormOpen = true;
  state.editingClient = client;
  state.form = client ? normalizeClientForm(client) : createEmptyForm();
  resetFormFeedback();
  renderClientesScreen();
}

function handleCloseForm() {
  if (state.savingForm) return;
  resetForm();
  renderClientesScreen();
}

function resetForm() {
  state.isFormOpen = false;
  state.editingClient = null;
  state.form = createEmptyForm();
  state.savingForm = false;
  resetFormFeedback();
}

async function handleFormSubmit(formData) {
  if (!state.isFormOpen || state.savingForm) return;
  const activeState = state;
  const editingClient = state.editingClient;
  const { documentNumber, ...editableFields } = normalizeClientForm(Object.fromEntries(formData));
  state.form = editingClient ? editableFields : { ...editableFields, documentNumber };

  const validationErrors = validateForm(state.form, editingClient);
  if (Object.keys(validationErrors).length > 0) {
    state.fieldErrors = validationErrors;
    state.formErrorMessage = CLIENTES_UI_MESSAGES.localValidation;
    renderClientesScreen();
    return;
  }

  state.savingForm = true;
  state.successMessage = "";
  state.errorMessage = "";
  state.formErrorMessage = "";
  state.fieldErrors = {};

  renderClientesScreen();

  try {
    if (editingClient) {
      const updated = await updateClient(editingClient.id, state.form);
      if (state !== activeState) return;

      // PUT returns the authoritative row, so a second list request is unnecessary.
      state.clients = state.clients.map((client) => client.id === editingClient.id ? updated : client);
      state.successMessage = CLIENTES_UI_MESSAGES.updateSuccess;
      resetForm();
    } else {
      const createdClient = await createClient(state.form);
      if (state !== activeState) return;

      const fullName = String(
        createdClient?.fullName || `${state.form.firstName} ${state.form.lastName}`,
      ).trim();

      state.successMessage = fullName
        ? `Cliente ${fullName} registrado correctamente.`
        : CLIENTES_UI_MESSAGES.createSuccess;

      resetForm();
      await loadClients({ preserveSuccessMessage: true });
    }
  } catch (error) {
    if (state !== activeState) return;
    const normalizedError = editingClient
      ? normalizeClientUpdateError(error)
      : normalizeClientesHttpError(error);

    state.formErrorMessage = normalizedError.message;
    state.fieldErrors = normalizedError.status === 400 || (editingClient && normalizedError.status === 409)
      ? mapClientFieldErrors(normalizedError.fieldErrors)
      : {};
  } finally {
    if (state === activeState) {
      state.savingForm = false;
      renderClientesScreen();
    }
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
