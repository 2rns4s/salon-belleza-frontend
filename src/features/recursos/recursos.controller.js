import { RECURSOS_VALIDATION, DEFAULT_RECURSOS_ERROR_MESSAGE } from "./recursos.constants.js";
/**
 * Controller de recursos. Patron de todos los modulos de gestion:
 *  1. Hay un unico objeto `state` con todo lo que la pantalla necesita mostrar.
 *  2. Cada vez que el estado cambia, se vuelve a pintar TODA la pantalla
 *     (render completo del HTML), no se actualizan nodos sueltos.
 *  3. Los clicks y submits NO se enganchan boton por boton: hay un solo listener
 *     de click y uno de submit en el contenedor (delegacion de eventos), que
 *     identifican el boton/formulario por su id o data-*. Eso lo gestiona el
 *     helper compartido featureMount.
 */
import { normalizeRecursosHttpError } from "./recursos.mappers.js";
import { getResources, createResource, updateResource, deleteResource } from "./recursos.service.js";
import { renderRecursosPage } from "./recursos.view.js";
import { createFeatureMount } from "../../shared/components/featureMount.js";

let state = createInitialState();

// Montaje compartido: resuelve el contenedor y gestiona los listeners delegados
// click/submit (ver shared/components/featureMount.js). Los manejadores concretos
// (handleContainerClick / handleFormSubmit) y el render siguen definidos abajo.
const featureMount = createFeatureMount({
    render: () => renderRecursosPage(state),
    onClick: (event) => handleContainerClick(event),
    onSubmit: (event) => handleFormSubmit(event),
});

function createEmptyForm() {
    return { name: "", totalQuantity: "" };
}

function createInitialState() {
    return {
        loadingList: false,
        savingForm: false,
        resources: [],
        errorMessage: "",
        successMessage: "",
        formModal: {
            isOpen: false,
            mode: "create", // "create" | "edit"
            resourceId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorMessage: "",
        },
        deleteConfirm: {
            isOpen: false,
            resourceId: null,
            resourceName: "",
        },
    };
}

function renderRecursosScreen() {
    featureMount.renderScreen();
}

function validateResourceForm(form) {
    const errors = {};
    const name = String(form.name ?? "").trim();
    const qty = Number(form.totalQuantity);

    if (name.length < RECURSOS_VALIDATION.NOMBRE_MIN) {
        errors.name = `El nombre debe tener al menos ${RECURSOS_VALIDATION.NOMBRE_MIN} caracteres.`;
    } else if (name.length > RECURSOS_VALIDATION.NOMBRE_MAX) {
        errors.name = `El nombre no puede superar ${RECURSOS_VALIDATION.NOMBRE_MAX} caracteres.`;
    }

    if (!form.totalQuantity && form.totalQuantity !== 0) {
        errors.totalQuantity = "La cantidad es obligatoria.";
    } else if (isNaN(qty) || qty < RECURSOS_VALIDATION.CANTIDAD_MIN) {
        errors.totalQuantity = `La cantidad mínima es ${RECURSOS_VALIDATION.CANTIDAD_MIN}.`;
    }

    return errors;
}

async function loadResources() {
    let hasLoadedList = false;

    state.loadingList = true;
    state.errorMessage = "";
    renderRecursosScreen();
    try {
        state.resources = await getResources();
        hasLoadedList = true;
    } catch (err) {
        const normalizedError = normalizeRecursosHttpError(err);
        state.errorMessage = normalizedError.message;
    } finally {
        state.loadingList = false;
        renderRecursosScreen();
    }

    return hasLoadedList;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const container = featureMount.getContainer();
    const formEl = container?.querySelector("#resources-form");
    if (!formEl) return;

    const formData = new FormData(formEl);
    const formState = {
        name: formData.get("name") ?? "",
        totalQuantity: formData.get("totalQuantity") ?? "",
    };

    const errors = validateResourceForm(formState);
    if (Object.keys(errors).length) {
        state.formModal = { ...state.formModal, fieldErrors: errors, form: formState };
        renderRecursosScreen();
        return;
    }

    state.savingForm = true;
    state.formModal = { ...state.formModal, fieldErrors: {}, errorMessage: "", form: formState };
    renderRecursosScreen();

    try {
        let savedResource = null;

        if (state.formModal.mode === "edit" && state.formModal.resourceId != null) {
            savedResource = await updateResource(state.formModal.resourceId, formState);
            state.successMessage = "Recurso actualizado correctamente.";
        } else {
            savedResource = await createResource(formState);
            state.successMessage = "Recurso creado correctamente.";
        }

        const listLoaded = await loadResources();
        if (!listLoaded) {
            state.formModal = {
                ...state.formModal,
                form: formState,
                errorMessage: "Se guardo el recurso, pero no se pudo refrescar el listado. Pulsa Actualizar para confirmar.",
            };
            renderRecursosScreen();
            return;
        }

        if (
            state.formModal.mode === "create"
            && savedResource?.id
            && !state.resources.some((resource) => Number(resource.id) === Number(savedResource.id))
        ) {
            state.formModal = {
                ...state.formModal,
                form: formState,
                errorMessage: "No se pudo confirmar la creacion en el listado. Pulsa Actualizar para validar.",
            };
            renderRecursosScreen();
            return;
        }

        state.formModal = {
            isOpen: false,
            mode: "create",
            resourceId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorMessage: "",
        };
        renderRecursosScreen();
    } catch (err) {
        const normalizedError = normalizeRecursosHttpError(err);
        state.formModal = { 
            ...state.formModal, 
            errorMessage: normalizedError.message,
            fieldErrors: normalizedError.fieldErrors || {}
        };
        renderRecursosScreen();
    } finally {
        state.savingForm = false;
    }
}

async function handleConfirmDelete() {
    const { resourceId } = state.deleteConfirm;
    if (resourceId == null) return;

    try {
        await deleteResource(resourceId);
        state.successMessage = "Recurso eliminado correctamente.";
        state.deleteConfirm = { isOpen: false, resourceId: null, resourceName: "" };
        await loadResources();
    } catch (err) {
        const normalizedError = normalizeRecursosHttpError(err);
        state.errorMessage = normalizedError.message;
        state.deleteConfirm = { isOpen: false, resourceId: null, resourceName: "" };
        renderRecursosScreen();
    }
}

function handleContainerClick(event) {
    const target = event.target;

    // Abrir modal de creación
    if (target.closest("#resources-open-create-btn")) {
        state.formModal = { isOpen: true, mode: "create", resourceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        state.successMessage = "";
        renderRecursosScreen();
        return;
    }

    // Actualizar lista
    if (target.closest("#resources-refresh-btn")) {
        loadResources();
        return;
    }

    // Abrir modal de edición
    const editBtn = target.closest("[data-resource-edit-id]");
    if (editBtn) {
        const resourceId = Number(editBtn.getAttribute("data-resource-edit-id"));
        const resource = state.resources.find((r) => r.id === resourceId);
        if (!resource) return;
        state.formModal = {
            isOpen: true,
            mode: "edit",
            resourceId,
            form: { name: resource.name, totalQuantity: resource.totalQuantity },
            fieldErrors: {},
            errorMessage: "",
        };
        state.successMessage = "";
        renderRecursosScreen();
        return;
    }

    // Abrir confirmación de eliminación
    const deleteBtn = target.closest("[data-resource-delete-id]");
    if (deleteBtn) {
        const resourceId = Number(deleteBtn.getAttribute("data-resource-delete-id"));
        const resource = state.resources.find((r) => r.id === resourceId);
        if (!resource) return;
        state.deleteConfirm = { isOpen: true, resourceId, resourceName: resource.name };
        state.successMessage = "";
        renderRecursosScreen();
        return;
    }

    // Confirmar eliminación
    if (target.closest("#resources-confirm-delete-btn")) {
        handleConfirmDelete();
        return;
    }

    // Cancelar eliminación o modal
    if (target.closest("#resources-cancel-delete-btn")) {
        state.deleteConfirm = { isOpen: false, resourceId: null, resourceName: "" };
        renderRecursosScreen();
        return;
    }

    if (target.closest("#resources-cancel-btn") || target.closest("#resources-close-modal-btn")) {
        state.formModal = { isOpen: false, mode: "create", resourceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        renderRecursosScreen();
        return;
    }

    // Click en overlay (fuera del dialog)
    if (target.matches("[data-resources-close='overlay']")) {
        state.formModal = { isOpen: false, mode: "create", resourceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        state.deleteConfirm = { isOpen: false, resourceId: null, resourceName: "" };
        renderRecursosScreen();
    }
}

export function initRecursos(container) {
    state = createInitialState();
    featureMount.mount(container);
    loadResources();
}
