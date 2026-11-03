import {
    USUARIOS_CATALOG_STATUS,
    USUARIOS_ENDPOINTS,
    USUARIOS_UI_MESSAGES,
    USUARIOS_VALIDATION_RULES,
} from "./usuarios.constants.js";
import {
    mapEmployeesCatalog,
    mapUserFieldErrors,
    normalizeUsuariosHttpError,
} from "./usuarios.mappers.js";
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
} from "./usuarios.service.js";
import { renderUsuariosPage } from "./usuarios.view.js";
import { httpClient } from "../../shared/services/httpClient.js";
import { obtenerToken } from "../../shared/state/authStore.js";
import { createPaginatedList } from "../../components/PaginatedList.js";
import { createFeatureMount } from "../../shared/components/featureMount.js";

let state = createInitialState();

// Montaje compartido: resuelve el contenedor y gestiona los listeners delegados
// click/submit (ver shared/components/featureMount.js).
const featureMount = createFeatureMount({
    render: () => renderUsuariosPage(state),
    onClick: (event) => handleContainerClick(event),
    onSubmit: (event) => handleContainerSubmit(event),
});

function createEmptyCreateForm() {
    return {
        nombreUsuario: "",
        contrasena: "",
        rol: "RECEPTIONIST",
        idEmpleado: null,
    };
}

function createEmptyEditForm() {
    return {
        nombreUsuario: "",
        contrasena: "",
        rol: "",
        activo: true,
    };
}

// Decode JWT to get current user ID
function getCurrentUserIdFromToken() {
    try {
        const token = obtenerToken();
        if (!token) {
            return null;
        }

        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
            return null;
        }

        // Decode base64url payload
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padding = "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(base64 + padding);
        
        const payload = JSON.parse(decodeURIComponent(
            decoded.split("").map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
        ));

        return payload.id || payload.idUsuario || null;
    } catch {
        return null;
    }
}

function createInitialState() {
    return {
        loadingList: false,
        users: [],
        errorFeedback: null,
        successMessage: "",
        employeesCatalog: [],
        employeesCatalogStatus: USUARIOS_CATALOG_STATUS.IDLE,
        // Pagination state
        pagination: {
            currentPage: 1,
            pageSize: 50,
            totalItems: 0,
        },
        createModal: {
            isOpen: false,
            form: createEmptyCreateForm(),
            fieldErrors: {},
            errorFeedback: null,
            saving: false,
        },
        editModal: {
            isOpen: false,
            userId: null,
            form: createEmptyEditForm(),
            fieldErrors: {},
            errorFeedback: null,
            saving: false,
        },
        deactivateConfirm: {
            isOpen: false,
            userId: null,
            userName: "",
        },
    };
}

// Create paginated list controller for users
const usersPagination = createPaginatedList({
    pageSize: 50,
    onPageChange: (page) => {
        state.pagination.currentPage = page;
    },
});

// Manejador del submit delegado del contenedor (formularios de crear/editar usuario).
function handleContainerSubmit(event) {
    const formElement = event.target;

    if (!(formElement instanceof HTMLFormElement)) {
        return;
    }

    if (formElement.dataset.form === "create-user") {
        event.preventDefault();
        void handleCreateSubmit(new FormData(formElement));
        return;
    }

    if (formElement.dataset.form === "edit-user") {
        event.preventDefault();
        void handleEditSubmit(new FormData(formElement));
    }
}

// Manejador del click delegado del contenedor (botones con data-action).
function handleContainerClick(event) {
    const btn = event.target instanceof Element
        ? event.target.closest("[data-action]")
        : null;

    if (!btn) {
        return;
    }

    // Si el elemento resuelto con data-action es el overlay del modal,
    // pero el click se originó dentro del diálogo interno, ignorarlo
    if (
        btn.classList.contains("usuarios__modal-overlay")
        && event.target.closest(".usuarios__modal")
    ) {
        return;
    }

    const action = btn.dataset.action;

    switch (action) {
        case "open-create-modal":
            event.preventDefault();
            handleOpenCreateModal();
            break;
        case "close-create-modal":
            event.preventDefault();
            handleCloseCreateModal();
            break;
        case "open-edit-modal":
            event.preventDefault();
            handleOpenEditModal(btn.dataset.userId);
            break;
        case "close-edit-modal":
            event.preventDefault();
            handleCloseEditModal();
            break;
        case "open-deactivate-modal":
            event.preventDefault();
            handleOpenDeactivateModal(btn.dataset.userId, btn.dataset.userName);
            break;
        case "cancel-deactivate":
            event.preventDefault();
            handleCancelDeactivate();
            break;
        case "confirm-deactivate":
            event.preventDefault();
            void handleConfirmDeactivate();
            break;
        case "pagination-prev":
            event.preventDefault();
            handlePageChange(usersPagination.prevPage() ? usersPagination.getState().currentPage : 1);
            break;
        case "pagination-next":
            event.preventDefault();
            handlePageChange(usersPagination.getState().currentPage + 1);
            break;
        default:
            break;
    }
}

function renderUsuariosScreen() {
    featureMount.renderScreen();
}

// Carga el catálogo de empleados para el select del modal de creación
async function loadEmployeesCatalog() {
    state.employeesCatalogStatus = USUARIOS_CATALOG_STATUS.LOADING;
    renderUsuariosScreen();

    try {
        // SCOPE RULE: se llama httpClient directamente sin importar empleados.service.js
        const rawData = await httpClient(USUARIOS_ENDPOINTS.employees);
        const catalog = mapEmployeesCatalog(rawData);

        state.employeesCatalog = catalog;
        state.employeesCatalogStatus = catalog.length
            ? USUARIOS_CATALOG_STATUS.READY
            : USUARIOS_CATALOG_STATUS.EMPTY;
    } catch {
        state.employeesCatalogStatus = USUARIOS_CATALOG_STATUS.ERROR;
    }

    renderUsuariosScreen();
}

// Carga la lista de usuarios
async function loadUsersList({ preserveSuccessMessage = false, page = 1 } = {}) {
    state.loadingList = true;
    state.errorFeedback = null;
    state.pagination.currentPage = page;

    if (!preserveSuccessMessage) {
        state.successMessage = "";
    }

    renderUsuariosScreen();

    try {
        const users = await getUsers();
        const usersArray = Array.isArray(users) ? users : [];
        
        // Update pagination controller with all users
        usersPagination.setItems(usersArray);
        
        // Get paginated users for current page
        const paginationState = usersPagination.getState();
        state.users = paginationState.paginatedItems;
        state.pagination.totalItems = paginationState.totalItems;
    } catch (error) {
        const normalizedError = normalizeUsuariosHttpError(error);
        state.errorFeedback = normalizedError.message;
        state.users = [];
    } finally {
        state.loadingList = false;
        renderUsuariosScreen();
    }
}

// Abre el modal de creación y dispara la carga del catálogo de empleados
function handleOpenCreateModal() {
    state.createModal = {
        isOpen: true,
        form: createEmptyCreateForm(),
        fieldErrors: {},
        errorFeedback: null,
        saving: false,
    };
    renderUsuariosScreen();

    // Carga lazy del catálogo de empleados
    void loadEmployeesCatalog();
}

function handleCloseCreateModal() {
    state.createModal = {
        isOpen: false,
        form: createEmptyCreateForm(),
        fieldErrors: {},
        errorFeedback: null,
        saving: false,
    };
    renderUsuariosScreen();
}

// Abre el modal de edición precargando los datos del usuario seleccionado
function handleOpenEditModal(userId) {
    const user = state.users.find((u) => String(u.id) === String(userId));

    if (!user) {
        return;
    }

    state.editModal = {
        isOpen: true,
        userId: user.id,
        form: {
            nombreUsuario: user.username,
            contrasena: "",
            rol: user.role,
            activo: user.active,
        },
        fieldErrors: {},
        errorFeedback: null,
        saving: false,
    };

    renderUsuariosScreen();
}

function handleCloseEditModal() {
    state.editModal = {
        isOpen: false,
        userId: null,
        form: createEmptyEditForm(),
        fieldErrors: {},
        errorFeedback: null,
        saving: false,
    };
    renderUsuariosScreen();
}

// Abre el modal de confirmación de desactivación
function handleOpenDeactivateModal(userId, userName) {
    state.deactivateConfirm = {
        isOpen: true,
        userId,
        userName: String(userName || ""),
    };
    renderUsuariosScreen();
}

function handleCancelDeactivate() {
    state.deactivateConfirm = {
        isOpen: false,
        userId: null,
        userName: "",
    };
    renderUsuariosScreen();
}

// Handle page change from pagination controls
function handlePageChange(page) {
    state.pagination.currentPage = page;
    const paginationState = usersPagination.getState();
    state.users = paginationState.paginatedItems;
    renderUsuariosScreen();
}

// Ejecuta el soft delete del usuario
async function handleConfirmDeactivate() {
    const userIdToDeactivate = state.deactivateConfirm.userId;

    if (!userIdToDeactivate) {
        return;
    }

    // Prevent self-deactivation
    const currentUserId = getCurrentUserIdFromToken();
    if (currentUserId && String(currentUserId) === String(userIdToDeactivate)) {
        state.errorFeedback = "No puedes desactivar tu propia cuenta";
        state.deactivateConfirm.isOpen = false;
        renderUsuariosScreen();
        return;
    }

    state.deactivateConfirm.isOpen = false;
    renderUsuariosScreen();

    try {
        await deleteUser(userIdToDeactivate);
        state.successMessage = USUARIOS_UI_MESSAGES.deactivateSuccess;
        await loadUsersList({ preserveSuccessMessage: true });
    } catch (error) {
        const normalizedError = normalizeUsuariosHttpError(error);
        state.errorFeedback = normalizedError.message;
        renderUsuariosScreen();
    }
}

// Extrae los datos del formulario de creación
function mapCreateFormData(formData) {
    return {
        nombreUsuario: String(formData.get("nombreUsuario") || "").trim(),
        contrasena: String(formData.get("contrasena") || "").trim(),
        rol: String(formData.get("rol") || "").trim(),
        idEmpleado: Number(formData.get("idEmpleado") || 0),
    };
}

// Extrae los datos del formulario de edición
function mapEditFormData(formData) {
    return {
        nombreUsuario: String(formData.get("nombreUsuario") || "").trim(),
        contrasena: String(formData.get("contrasena") || "").trim(),
        rol: String(formData.get("rol") || "").trim(),
        activo: formData.get("activo") === "on" || formData.get("activo") === "true",
    };
}

// Valida el formulario de creación y retorna un mapa de errores de campo
function validateCreateForm(form) {
    const errors = {};

    if (!form.nombreUsuario) {
        errors.nombreUsuario = "El nombre de usuario es obligatorio.";
    } else if (
        form.nombreUsuario.length < USUARIOS_VALIDATION_RULES.usernameMin
        || form.nombreUsuario.length > USUARIOS_VALIDATION_RULES.usernameMax
    ) {
        errors.nombreUsuario = `El nombre de usuario debe tener entre ${USUARIOS_VALIDATION_RULES.usernameMin} y ${USUARIOS_VALIDATION_RULES.usernameMax} caracteres.`;
    }

    if (!form.contrasena) {
        errors.contrasena = "La contraseña es obligatoria.";
    } else if (
        form.contrasena.length < USUARIOS_VALIDATION_RULES.passwordMin
        || form.contrasena.length > USUARIOS_VALIDATION_RULES.passwordMax
    ) {
        errors.contrasena = `La contraseña debe tener entre ${USUARIOS_VALIDATION_RULES.passwordMin} y ${USUARIOS_VALIDATION_RULES.passwordMax} caracteres.`;
    }

    if (!form.rol || !USUARIOS_VALIDATION_RULES.roles.includes(form.rol)) {
        errors.rol = "Debe seleccionar un rol válido (OWNER o RECEPTIONIST).";
    }

    if (!form.idEmpleado || form.idEmpleado <= 0) {
        errors.idEmpleado = "Debe seleccionar un empleado.";
    }

    return errors;
}

// Valida el formulario de edición (todos los campos son opcionales)
function validateUpdateForm(form) {
    const errors = {};

    if (form.nombreUsuario && (
        form.nombreUsuario.length < USUARIOS_VALIDATION_RULES.usernameMin
        || form.nombreUsuario.length > USUARIOS_VALIDATION_RULES.usernameMax
    )) {
        errors.nombreUsuario = `El nombre de usuario debe tener entre ${USUARIOS_VALIDATION_RULES.usernameMin} y ${USUARIOS_VALIDATION_RULES.usernameMax} caracteres.`;
    }

    if (form.contrasena && (
        form.contrasena.length < USUARIOS_VALIDATION_RULES.passwordMin
        || form.contrasena.length > USUARIOS_VALIDATION_RULES.passwordMax
    )) {
        errors.contrasena = `La contraseña debe tener entre ${USUARIOS_VALIDATION_RULES.passwordMin} y ${USUARIOS_VALIDATION_RULES.passwordMax} caracteres.`;
    }

    if (form.rol && !USUARIOS_VALIDATION_RULES.roles.includes(form.rol)) {
        errors.rol = "Rol inválido. Debe ser OWNER o RECEPTIONIST.";
    }

    return errors;
}

// Maneja el envío del formulario de creación
async function handleCreateSubmit(formData) {
    const form = mapCreateFormData(formData);
    state.createModal.form = form;

    const validationErrors = validateCreateForm(form);

    if (Object.keys(validationErrors).length > 0) {
        state.createModal.fieldErrors = validationErrors;
        state.createModal.errorFeedback = USUARIOS_UI_MESSAGES.localValidation;
        renderUsuariosScreen();
        return;
    }

    state.createModal.saving = true;
    state.createModal.fieldErrors = {};
    state.createModal.errorFeedback = null;
    state.successMessage = "";
    state.errorFeedback = null;

    renderUsuariosScreen();

    try {
        await createUser(form);
        state.successMessage = USUARIOS_UI_MESSAGES.createSuccess;
        state.createModal = {
            isOpen: false,
            form: createEmptyCreateForm(),
            fieldErrors: {},
            errorFeedback: null,
            saving: false,
        };

        await loadUsersList({ preserveSuccessMessage: true });
    } catch (error) {
        const normalizedError = normalizeUsuariosHttpError(error);
        state.createModal.errorFeedback = normalizedError.message;
        state.createModal.fieldErrors = normalizedError.status === 400
            ? mapUserFieldErrors(normalizedError.fieldErrors ?? {})
            : {};
        state.createModal.isOpen = true;
        state.createModal.saving = false;
        renderUsuariosScreen();
    }
}

// Maneja el envío del formulario de edición
async function handleEditSubmit(formData) {
    const form = mapEditFormData(formData);
    state.editModal.form = form;

    const validationErrors = validateUpdateForm(form);

    if (Object.keys(validationErrors).length > 0) {
        state.editModal.fieldErrors = validationErrors;
        state.editModal.errorFeedback = USUARIOS_UI_MESSAGES.localValidation;
        renderUsuariosScreen();
        return;
    }

    state.editModal.saving = true;
    state.editModal.fieldErrors = {};
    state.editModal.errorFeedback = null;
    state.successMessage = "";
    state.errorFeedback = null;

    renderUsuariosScreen();

    try {
        const userId = state.editModal.userId;
        await updateUser(userId, form);
        state.successMessage = USUARIOS_UI_MESSAGES.updateSuccess;
        state.editModal = {
            isOpen: false,
            userId: null,
            form: createEmptyEditForm(),
            fieldErrors: {},
            errorFeedback: null,
            saving: false,
        };

        await loadUsersList({ preserveSuccessMessage: true });
    } catch (error) {
        const normalizedError = normalizeUsuariosHttpError(error);
        state.editModal.errorFeedback = normalizedError.message;
        state.editModal.fieldErrors = normalizedError.status === 400
            ? mapUserFieldErrors(normalizedError.fieldErrors ?? {})
            : {};
        state.editModal.isOpen = true;
        state.editModal.saving = false;
        renderUsuariosScreen();
    }
}

// Punto de entrada del módulo de usuarios
export async function initUsuarios(container) {
    cleanupUsuarios();

    state = createInitialState();
    const mounted = featureMount.mount(container);
    if (!mounted) {
        return;
    }

    renderUsuariosScreen();

    await loadUsersList();
}

export function cleanupUsuarios() {
    featureMount.unmount();
    state = createInitialState();
}
