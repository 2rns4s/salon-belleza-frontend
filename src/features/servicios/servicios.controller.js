import { SERVICIOS_VALIDATION, RESOURCE_CATALOG_STATUS } from "./servicios.constants.js";
import { normalizeServiciosHttpError } from "./servicios.mappers.js";
import { getServices, createService, updateService, deleteService, getResourcesCatalog } from "./servicios.service.js";
import { renderServiciosPage, readServicesFormState } from "./servicios.view.js";
import { createFeatureMount } from "../../shared/components/featureMount.js";

let state = createInitialState();

// Montaje compartido: resuelve el contenedor y gestiona los listeners delegados
// click/submit (ver shared/components/featureMount.js).
const featureMount = createFeatureMount({
    render: () => renderServiciosPage(state),
    onClick: (event) => handleContainerClick(event),
    onSubmit: (event) => handleFormSubmit(event),
});

let rowIdCounter = 0;

function nextRowId() {
    rowIdCounter += 1;
    return `row-${rowIdCounter}`;
}

function createEmptyForm() {
    return { name: "", duration: "", requiredResources: [] };
}

function createInitialState() {
    return {
        loadingList: false,
        savingForm: false,
        services: [],
        errorMessage: "",
        successMessage: "",
        resourcesCatalog: [],
        resourcesCatalogStatus: RESOURCE_CATALOG_STATUS.IDLE,
        formModal: {
            isOpen: false,
            mode: "create",
            serviceId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorMessage: "",
        },
        deleteConfirm: {
            isOpen: false,
            serviceId: null,
            serviceName: "",
        },
    };
}

function renderServiciosScreen() {
    featureMount.renderScreen();
}

function validateServiceForm(form) {
    const errors = {};
    const name = String(form.name ?? "").trim();
    const duration = Number(form.duration);

    if (name.length < SERVICIOS_VALIDATION.NOMBRE_MIN) {
        errors.name = `El nombre debe tener al menos ${SERVICIOS_VALIDATION.NOMBRE_MIN} caracteres.`;
    } else if (name.length > SERVICIOS_VALIDATION.NOMBRE_MAX) {
        errors.name = `El nombre no puede superar ${SERVICIOS_VALIDATION.NOMBRE_MAX} caracteres.`;
    }

    if (!form.duration && form.duration !== 0) {
        errors.duration = "La duración es obligatoria.";
    } else if (isNaN(duration) || duration < SERVICIOS_VALIDATION.DURACION_MIN) {
        errors.duration = `La duración mínima es ${SERVICIOS_VALIDATION.DURACION_MIN} minuto.`;
    }

    const rows = form.requiredResources ?? [];
    if (!rows.length) {
        errors.requiredResources = "Debe agregar al menos un recurso requerido.";
    } else {
        // Verificar duplicados por idRecurso
        const ids = rows.map((r) => String(r.resourceId)).filter(Boolean);
        const uniqueIds = new Set(ids);
        if (uniqueIds.size < ids.length) {
            errors.requiredResources = "No puedes repetir el mismo recurso en la lista.";
        }
        // Verificar cantidades inválidas
        for (const row of rows) {
            if (!row.resourceId) {
                errors.requiredResources = "Selecciona un recurso en cada fila.";
                break;
            }
            if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) < 1) {
                errors.requiredResources = "La cantidad requerida debe ser al menos 1.";
                break;
            }
        }
    }

    return errors;
}

async function loadCatalog() {
    state.resourcesCatalogStatus = RESOURCE_CATALOG_STATUS.LOADING;
    renderServiciosScreen();
    try {
        const catalog = await getResourcesCatalog();
        state.resourcesCatalog = catalog;
        state.resourcesCatalogStatus = catalog.length ? RESOURCE_CATALOG_STATUS.READY : RESOURCE_CATALOG_STATUS.EMPTY;
    } catch {
        state.resourcesCatalogStatus = RESOURCE_CATALOG_STATUS.ERROR;
    }
    renderServiciosScreen();
}

async function loadServices() {
    let hasLoadedList = false;

    state.loadingList = true;
    state.errorMessage = "";
    renderServiciosScreen();
    try {
        state.services = await getServices();
        hasLoadedList = true;
    } catch (err) {
        const normalizedError = normalizeServiciosHttpError(err);
        state.errorMessage = normalizedError.message;
    } finally {
        state.loadingList = false;
        renderServiciosScreen();
    }

    return hasLoadedList;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = state.formModal.form;
    const formState = readServicesFormState(featureMount.getContainer(), form);

    const errors = validateServiceForm(formState);
    if (Object.keys(errors).length) {
        state.formModal = { ...state.formModal, fieldErrors: errors, form: formState };
        renderServiciosScreen();
        return;
    }

    state.savingForm = true;
    state.formModal = { ...state.formModal, fieldErrors: {}, errorMessage: "", form: formState };
    renderServiciosScreen();

    try {
        let savedService = null;

        if (state.formModal.mode === "edit" && state.formModal.serviceId != null) {
            savedService = await updateService(state.formModal.serviceId, formState);
            state.successMessage = "Servicio actualizado correctamente.";
        } else {
            savedService = await createService(formState);
            state.successMessage = "Servicio creado correctamente.";
        }

        const listLoaded = await loadServices();
        if (!listLoaded) {
            state.formModal = {
                ...state.formModal,
                form: formState,
                errorMessage: "Se guardo el servicio, pero no se pudo refrescar el listado. Pulsa Actualizar para confirmar.",
            };
            renderServiciosScreen();
            return;
        }

        if (
            state.formModal.mode === "create"
            && savedService?.id
            && !state.services.some((service) => Number(service.id) === Number(savedService.id))
        ) {
            state.formModal = {
                ...state.formModal,
                form: formState,
                errorMessage: "No se pudo confirmar la creacion en el listado. Pulsa Actualizar para validar.",
            };
            renderServiciosScreen();
            return;
        }

        state.formModal = {
            isOpen: false,
            mode: "create",
            serviceId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorMessage: "",
        };
        renderServiciosScreen();
    } catch (err) {
        const normalizedError = normalizeServiciosHttpError(err);
        state.formModal = { 
            ...state.formModal, 
            errorMessage: normalizedError.message,
            fieldErrors: normalizedError.fieldErrors || {}
        };
        renderServiciosScreen();
    } finally {
        state.savingForm = false;
    }
}

async function handleConfirmDelete() {
    const { serviceId } = state.deleteConfirm;
    if (serviceId == null) return;

    try {
        await deleteService(serviceId);
        state.successMessage = "Servicio eliminado correctamente.";
        state.deleteConfirm = { isOpen: false, serviceId: null, serviceName: "" };
        await loadServices();
    } catch (err) {
        const normalizedError = normalizeServiciosHttpError(err);
        state.errorMessage = normalizedError.message;
        state.deleteConfirm = { isOpen: false, serviceId: null, serviceName: "" };
        renderServiciosScreen();
    }
}

function handleContainerClick(event) {
    const target = event.target;

    if (target.closest("#services-open-create-btn")) {
        state.formModal = { isOpen: true, mode: "create", serviceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        state.successMessage = "";
        renderServiciosScreen();
        if (
            state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.IDLE
            || state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.ERROR
            || state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.EMPTY
        ) {
            loadCatalog();
        }
        return;
    }

    if (target.closest("#services-refresh-btn")) {
        loadServices();
        return;
    }

    // Agregar fila de recurso
    if (target.closest("#services-add-resource-btn")) {
        const syncedForm = readServicesFormState(featureMount.getContainer(), state.formModal.form);
        const newRow = { rowId: nextRowId(), resourceId: "", quantity: "" };
        state.formModal = {
            ...state.formModal,
            form: {
                ...syncedForm,
                requiredResources: [...(syncedForm.requiredResources ?? []), newRow],
            },
        };
        renderServiciosScreen();
        return;
    }

    // Quitar fila de recurso
    const removeBtn = target.closest("[data-required-resource-remove]");
    if (removeBtn) {
        const syncedForm = readServicesFormState(featureMount.getContainer(), state.formModal.form);
        const rowId = removeBtn.getAttribute("data-required-resource-remove");
        state.formModal = {
            ...state.formModal,
            form: {
                ...syncedForm,
                requiredResources: (syncedForm.requiredResources ?? []).filter((r) => r.rowId !== rowId),
            },
        };
        renderServiciosScreen();
        return;
    }

    // Abrir modal de edición
    const editBtn = target.closest("[data-service-edit-id]");
    if (editBtn) {
        const serviceId = Number(editBtn.getAttribute("data-service-edit-id"));
        const service = state.services.find((s) => s.id === serviceId);
        if (!service) return;
        state.formModal = {
            isOpen: true,
            mode: "edit",
            serviceId,
            form: {
                name: service.name,
                duration: service.duration,
                requiredResources: service.resources.map((r) => ({
                    rowId: nextRowId(),
                    resourceId: String(r.resourceId),
                    quantity: String(r.requiredQuantity),
                })),
            },
            fieldErrors: {},
            errorMessage: "",
        };
        state.successMessage = "";
        renderServiciosScreen();
        if (
            state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.IDLE
            || state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.ERROR
            || state.resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.EMPTY
        ) {
            loadCatalog();
        }
        return;
    }

    // Abrir confirmación de eliminación
    const deleteBtn = target.closest("[data-service-delete-id]");
    if (deleteBtn) {
        const serviceId = Number(deleteBtn.getAttribute("data-service-delete-id"));
        const service = state.services.find((s) => s.id === serviceId);
        if (!service) return;
        state.deleteConfirm = { isOpen: true, serviceId, serviceName: service.name };
        state.successMessage = "";
        renderServiciosScreen();
        return;
    }

    if (target.closest("#services-confirm-delete-btn")) {
        handleConfirmDelete();
        return;
    }

    if (target.closest("#services-cancel-delete-btn")) {
        state.deleteConfirm = { isOpen: false, serviceId: null, serviceName: "" };
        renderServiciosScreen();
        return;
    }

    if (target.closest("#services-cancel-btn") || target.closest("#services-close-modal-btn")) {
        state.formModal = { isOpen: false, mode: "create", serviceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        renderServiciosScreen();
        return;
    }

    if (target.matches("[data-services-close='overlay']")) {
        state.formModal = { isOpen: false, mode: "create", serviceId: null, form: createEmptyForm(), fieldErrors: {}, errorMessage: "" };
        state.deleteConfirm = { isOpen: false, serviceId: null, serviceName: "" };
        renderServiciosScreen();
    }
}

export function initServicios(container) {
    state = createInitialState();
    featureMount.mount(container);
    loadServices();
}
