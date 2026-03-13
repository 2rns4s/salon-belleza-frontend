import { EMPLEADOS_CATALOG_STATUS, EMPLEADOS_VALIDATION } from "./empleados.constants.js";
import { normalizeEmpleadosHttpError } from "./empleados.mappers.js";
import {
    createEmployee,
    deleteEmployee,
    getEmployees,
    getServicesCatalog,
    updateEmployee,
} from "./empleados.service.js";
import { renderEmpleadosPage } from "./empleados.view.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let domContainer = null;
let state = createInitialState();
let shiftRowCounter = 0;

const listenersRegistry = {
    submit: null,
    click: null,
};

function nextShiftRowId() {
    shiftRowCounter += 1;
    return `shift-row-${shiftRowCounter}`;
}

function createEmptyShift() {
    return {
        rowId: nextShiftRowId(),
        day: "",
        startTime: "",
        endTime: "",
    };
}

function createEmptyForm({ withDefaultShift = false } = {}) {
    return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        workShifts: withDefaultShift ? [createEmptyShift()] : [],
        serviceIds: [],
    };
}

function createInitialState() {
    return {
        loadingList: false,
        savingForm: false,
        employees: [],
        errorFeedback: null,
        successMessage: "",
        servicesCatalog: [],
        servicesCatalogStatus: EMPLEADOS_CATALOG_STATUS.IDLE,
        formModal: {
            isOpen: false,
            mode: "create",
            employeeId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorFeedback: null,
        },
        deleteConfirm: {
            isOpen: false,
            employeeId: null,
            employeeName: "",
        },
    };
}

function resolveEmpleadosContainer(container) {
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

function renderEmpleadosScreen() {
    if (!domContainer) {
        return;
    }

    domContainer.innerHTML = renderEmpleadosPage(state);
}

function normalizeErrorFeedback(error) {
    const normalizedError = normalizeEmpleadosHttpError(error);

    return {
        status: Number(normalizedError?.status || 0),
        message: String(normalizedError?.message || ""),
        details: Array.isArray(normalizedError?.details)
            ? normalizedError.details.filter((detail) => String(detail || "").trim())
            : [],
    };
}

function normalizeTimeInputValue(value) {
    const rawValue = String(value ?? "").trim();

    if (/^\d{2}:\d{2}:\d{2}$/.test(rawValue)) {
        return rawValue.slice(0, 5);
    }

    if (/^\d{2}:\d{2}$/.test(rawValue)) {
        return rawValue;
    }

    return "";
}

function toMinutes(timeValue) {
    const normalized = normalizeTimeInputValue(timeValue);

    if (!normalized) {
        return -1;
    }

    const [hours, minutes] = normalized.split(":").map((item) => Number(item));

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return -1;
    }

    return (hours * 60) + minutes;
}

function validateEmployeeForm(formState, mode) {
    const errors = {};

    const firstName = String(formState.firstName || "").trim();
    const lastName = String(formState.lastName || "").trim();
    const email = String(formState.email || "").trim();
    const phone = String(formState.phone || "").trim();

    if (!firstName) {
        errors.firstName = "El nombre es obligatorio.";
    } else if (
        firstName.length < EMPLEADOS_VALIDATION.NAME_MIN
        || firstName.length > EMPLEADOS_VALIDATION.NAME_MAX
    ) {
        errors.firstName = `El nombre debe tener entre ${EMPLEADOS_VALIDATION.NAME_MIN} y ${EMPLEADOS_VALIDATION.NAME_MAX} caracteres.`;
    }

    if (!lastName) {
        errors.lastName = "El apellido es obligatorio.";
    } else if (
        lastName.length < EMPLEADOS_VALIDATION.NAME_MIN
        || lastName.length > EMPLEADOS_VALIDATION.NAME_MAX
    ) {
        errors.lastName = `El apellido debe tener entre ${EMPLEADOS_VALIDATION.NAME_MIN} y ${EMPLEADOS_VALIDATION.NAME_MAX} caracteres.`;
    }

    if (!email) {
        errors.email = "El correo es obligatorio.";
    } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = "Ingresa un correo valido.";
    }

    if (!phone) {
        errors.phone = "El telefono es obligatorio.";
    } else if (!EMPLEADOS_VALIDATION.PHONE_PATTERN.test(phone)) {
        errors.phone = "El telefono debe iniciar en 3 y tener 10 digitos.";
    }

    if (mode === "create") {
        const workShifts = Array.isArray(formState.workShifts) ? formState.workShifts : [];
        const serviceIds = Array.isArray(formState.serviceIds) ? formState.serviceIds : [];

        if (!workShifts.length) {
            errors.workShifts = "Debes registrar al menos una franja laboral.";
        } else {
            for (let index = 0; index < workShifts.length; index += 1) {
                const shift = workShifts[index] || {};
                const day = String(shift.day || "").trim();
                const startTime = normalizeTimeInputValue(shift.startTime);
                const endTime = normalizeTimeInputValue(shift.endTime);

                if (!day || !startTime || !endTime) {
                    errors.workShifts = `Completa dia, hora inicio y hora fin en la franja ${index + 1}.`;
                    break;
                }

                if (toMinutes(startTime) >= toMinutes(endTime)) {
                    errors.workShifts = `La hora de inicio debe ser menor a la hora de fin en la franja ${index + 1}.`;
                    break;
                }
            }
        }

        if (!serviceIds.length) {
            errors.serviceIds = "Debes seleccionar al menos un servicio.";
        }
    }

    return errors;
}

function syncFormFromDom() {
    if (!domContainer || !state.formModal.isOpen) {
        return;
    }

    const firstNameInput = domContainer.querySelector("#employees-first-name");
    const lastNameInput = domContainer.querySelector("#employees-last-name");
    const emailInput = domContainer.querySelector("#employees-email");
    const phoneInput = domContainer.querySelector("#employees-phone");

    const updatedForm = {
        ...state.formModal.form,
        firstName: String(firstNameInput?.value || "").trim(),
        lastName: String(lastNameInput?.value || "").trim(),
        email: String(emailInput?.value || "").trim(),
        phone: String(phoneInput?.value || "").trim(),
    };

    if (state.formModal.mode === "create") {
        const shiftRows = domContainer.querySelectorAll("[data-employee-shift-row-id]");
        updatedForm.workShifts = Array.from(shiftRows).map((rowElement) => {
            const rowId = String(rowElement.getAttribute("data-employee-shift-row-id") || nextShiftRowId());
            const dayInput = rowElement.querySelector("[data-employee-shift-field='day']");
            const startTimeInput = rowElement.querySelector("[data-employee-shift-field='startTime']");
            const endTimeInput = rowElement.querySelector("[data-employee-shift-field='endTime']");

            return {
                rowId,
                day: String(dayInput?.value || "").trim().toUpperCase(),
                startTime: normalizeTimeInputValue(startTimeInput?.value),
                endTime: normalizeTimeInputValue(endTimeInput?.value),
            };
        });

        updatedForm.serviceIds = Array.from(domContainer.querySelectorAll("[data-employee-service-checkbox]:checked"))
            .map((checkbox) => Number(checkbox.value))
            .filter((value) => Number.isFinite(value) && value > 0);
    }

    state.formModal = {
        ...state.formModal,
        form: updatedForm,
    };
}

async function loadServicesCatalog() {
    state.servicesCatalogStatus = EMPLEADOS_CATALOG_STATUS.LOADING;
    renderEmpleadosScreen();

    try {
        const catalog = await getServicesCatalog();
        state.servicesCatalog = catalog;
        state.servicesCatalogStatus = catalog.length
            ? EMPLEADOS_CATALOG_STATUS.READY
            : EMPLEADOS_CATALOG_STATUS.EMPTY;
    } catch {
        state.servicesCatalog = [];
        state.servicesCatalogStatus = EMPLEADOS_CATALOG_STATUS.ERROR;
    }

    renderEmpleadosScreen();
}

async function loadEmployees({ preserveSuccessMessage = false } = {}) {
    state.loadingList = true;
    state.errorFeedback = null;

    if (!preserveSuccessMessage) {
        state.successMessage = "";
    }

    renderEmpleadosScreen();

    try {
        state.employees = await getEmployees();
    } catch (error) {
        state.employees = [];
        state.errorFeedback = normalizeErrorFeedback(error);
    } finally {
        state.loadingList = false;
        renderEmpleadosScreen();
    }
}

function openCreateModal() {
    state.formModal = {
        isOpen: true,
        mode: "create",
        employeeId: null,
        form: createEmptyForm({ withDefaultShift: true }),
        fieldErrors: {},
        errorFeedback: null,
    };
    state.successMessage = "";
    renderEmpleadosScreen();

    if (
        state.servicesCatalogStatus === EMPLEADOS_CATALOG_STATUS.IDLE
        || state.servicesCatalogStatus === EMPLEADOS_CATALOG_STATUS.EMPTY
        || state.servicesCatalogStatus === EMPLEADOS_CATALOG_STATUS.ERROR
    ) {
        void loadServicesCatalog();
    }
}

function openEditModal(employee) {
    state.formModal = {
        isOpen: true,
        mode: "edit",
        employeeId: employee.id,
        form: {
            firstName: String(employee.firstName || "").trim(),
            lastName: String(employee.lastName || "").trim(),
            email: String(employee.email || "").trim(),
            phone: String(employee.phone || "").trim(),
            workShifts: Array.isArray(employee.workShifts)
                ? employee.workShifts.map((shift) => ({
                    rowId: nextShiftRowId(),
                    day: String(shift.day || "").trim().toUpperCase(),
                    startTime: normalizeTimeInputValue(shift.startTime),
                    endTime: normalizeTimeInputValue(shift.endTime),
                }))
                : [],
            serviceIds: Array.isArray(employee.serviceIds)
                ? employee.serviceIds
                : [],
        },
        fieldErrors: {},
        errorFeedback: null,
    };
    state.successMessage = "";
    renderEmpleadosScreen();
}

function closeFormModal() {
    state.formModal = {
        isOpen: false,
        mode: "create",
        employeeId: null,
        form: createEmptyForm(),
        fieldErrors: {},
        errorFeedback: null,
    };
    renderEmpleadosScreen();
}

async function handleFormSubmit(event) {
    const targetForm = event.target;

    if (!(targetForm instanceof HTMLFormElement) || targetForm.id !== "employees-form") {
        return;
    }

    event.preventDefault();
    syncFormFromDom();

    const formState = { ...state.formModal.form };
    const validationErrors = validateEmployeeForm(formState, state.formModal.mode);

    if (Object.keys(validationErrors).length > 0) {
        state.formModal = {
            ...state.formModal,
            fieldErrors: validationErrors,
            errorFeedback: null,
        };
        renderEmpleadosScreen();
        return;
    }

    state.savingForm = true;
    state.formModal = {
        ...state.formModal,
        fieldErrors: {},
        errorFeedback: null,
    };
    renderEmpleadosScreen();

    try {
        if (state.formModal.mode === "edit" && state.formModal.employeeId != null) {
            await updateEmployee(state.formModal.employeeId, formState);
            state.successMessage = "Empleado actualizado correctamente.";
        } else {
            await createEmployee(formState);
            state.successMessage = "Empleado creado correctamente.";
        }

        state.formModal = {
            isOpen: false,
            mode: "create",
            employeeId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorFeedback: null,
        };

        await loadEmployees({ preserveSuccessMessage: true });
    } catch (error) {
        state.formModal = {
            ...state.formModal,
            errorFeedback: normalizeErrorFeedback(error),
        };
        renderEmpleadosScreen();
    } finally {
        state.savingForm = false;
        renderEmpleadosScreen();
    }
}

async function handleConfirmDelete() {
    const { employeeId } = state.deleteConfirm;

    if (employeeId == null) {
        return;
    }

    try {
        await deleteEmployee(employeeId);
        state.successMessage = "Empleado eliminado correctamente.";
        state.deleteConfirm = {
            isOpen: false,
            employeeId: null,
            employeeName: "",
        };

        await loadEmployees({ preserveSuccessMessage: true });
    } catch (error) {
        state.errorFeedback = normalizeErrorFeedback(error);
        state.deleteConfirm = {
            isOpen: false,
            employeeId: null,
            employeeName: "",
        };
        renderEmpleadosScreen();
    }
}

function handleContainerClick(event) {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    if (target.closest("#employees-open-create-btn")) {
        openCreateModal();
        return;
    }

    if (target.closest("#employees-refresh-btn")) {
        void loadEmployees();
        return;
    }

    if (target.closest("#employees-add-shift-btn")) {
        syncFormFromDom();

        const workShifts = Array.isArray(state.formModal.form.workShifts)
            ? state.formModal.form.workShifts
            : [];

        state.formModal = {
            ...state.formModal,
            form: {
                ...state.formModal.form,
                workShifts: [...workShifts, createEmptyShift()],
            },
            fieldErrors: {
                ...state.formModal.fieldErrors,
                workShifts: "",
            },
        };

        renderEmpleadosScreen();
        return;
    }

    const removeShiftBtn = target.closest("[data-employee-shift-remove]");
    if (removeShiftBtn) {
        syncFormFromDom();

        const rowId = String(removeShiftBtn.getAttribute("data-employee-shift-remove") || "").trim();
        const currentShifts = Array.isArray(state.formModal.form.workShifts)
            ? state.formModal.form.workShifts
            : [];

        state.formModal = {
            ...state.formModal,
            form: {
                ...state.formModal.form,
                workShifts: currentShifts.filter((shift) => String(shift.rowId) !== rowId),
            },
            fieldErrors: {
                ...state.formModal.fieldErrors,
                workShifts: "",
            },
        };

        renderEmpleadosScreen();
        return;
    }

    const editButton = target.closest("[data-employee-edit-id]");
    if (editButton) {
        const employeeId = Number(editButton.getAttribute("data-employee-edit-id"));
        const employee = state.employees.find((item) => item.id === employeeId);

        if (!employee) {
            return;
        }

        openEditModal(employee);
        return;
    }

    const deleteButton = target.closest("[data-employee-delete-id]");
    if (deleteButton) {
        const employeeId = Number(deleteButton.getAttribute("data-employee-delete-id"));
        const employee = state.employees.find((item) => item.id === employeeId);

        if (!employee) {
            return;
        }

        state.deleteConfirm = {
            isOpen: true,
            employeeId,
            employeeName: employee.fullName || "empleado seleccionado",
        };
        state.successMessage = "";
        renderEmpleadosScreen();
        return;
    }

    if (target.closest("#employees-confirm-delete-btn")) {
        void handleConfirmDelete();
        return;
    }

    if (target.closest("#employees-cancel-delete-btn")) {
        state.deleteConfirm = {
            isOpen: false,
            employeeId: null,
            employeeName: "",
        };
        renderEmpleadosScreen();
        return;
    }

    if (target.closest("#employees-cancel-btn") || target.closest("#employees-close-modal-btn")) {
        closeFormModal();
        return;
    }

    if (target.matches("[data-employees-close='overlay']")) {
        state.formModal = {
            isOpen: false,
            mode: "create",
            employeeId: null,
            form: createEmptyForm(),
            fieldErrors: {},
            errorFeedback: null,
        };
        state.deleteConfirm = {
            isOpen: false,
            employeeId: null,
            employeeName: "",
        };
        renderEmpleadosScreen();
    }
}

function attachContainerListeners() {
    if (!domContainer) {
        return;
    }

    listenersRegistry.submit = handleFormSubmit;
    listenersRegistry.click = handleContainerClick;

    domContainer.addEventListener("submit", listenersRegistry.submit);
    domContainer.addEventListener("click", listenersRegistry.click);
}

export function initEmpleados(container) {
    cleanupEmpleados();

    domContainer = resolveEmpleadosContainer(container);
    if (!domContainer) {
        return;
    }

    state = createInitialState();
    renderEmpleadosScreen();
    attachContainerListeners();
    void loadEmployees();
}

export function cleanupEmpleados() {
    removeContainerListeners();
    domContainer = null;
    state = createInitialState();
}
