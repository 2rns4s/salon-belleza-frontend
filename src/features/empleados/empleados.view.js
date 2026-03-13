import { EMPLEADOS_CATALOG_STATUS, EMPLEADOS_VALIDATION } from "./empleados.constants.js";

const WEEK_DAY_OPTIONS = [
    { value: "MONDAY", label: "Lunes" },
    { value: "TUESDAY", label: "Martes" },
    { value: "WEDNESDAY", label: "Miercoles" },
    { value: "THURSDAY", label: "Jueves" },
    { value: "FRIDAY", label: "Viernes" },
    { value: "SATURDAY", label: "Sabado" },
    { value: "SUNDAY", label: "Domingo" },
];

function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatTimeForInput(value) {
    const rawValue = String(value ?? "").trim();

    if (/^\d{2}:\d{2}:\d{2}$/.test(rawValue)) {
        return rawValue.slice(0, 5);
    }

    if (/^\d{2}:\d{2}$/.test(rawValue)) {
        return rawValue;
    }

    return "";
}

function getFieldError(fieldErrors, fieldName) {
    const value = fieldErrors?.[fieldName];
    return value ? String(value) : "";
}

function renderFeedbackMessage(message, modifier, role) {
    if (!message) {
        return "";
    }

    return `
        <p class="employees__message employees__message--${modifier}" role="${role}">
            <span class="employees__message-text">${escapeHtml(message)}</span>
        </p>
    `;
}

function renderGlobalErrorFeedback(errorFeedback) {
    if (!errorFeedback?.message) {
        return "";
    }

    const details = Array.isArray(errorFeedback.details)
        ? errorFeedback.details.filter((detail) => String(detail || "").trim())
        : [];

    const detailsHtml = details.length
        ? `
            <ul class="employees__message-details">
                ${details
        .map((detail) => `<li class="employees__message-detail">${escapeHtml(detail)}</li>`)
        .join("")}
            </ul>
        `
        : "";

    return `
        <div class="employees__message employees__message--error" role="alert">
            <p class="employees__message-text">${escapeHtml(errorFeedback.message)}</p>
            ${detailsHtml}
        </div>
    `;
}

function renderFormErrorFeedback(errorFeedback) {
    if (!errorFeedback?.message) {
        return "";
    }

    const details = Array.isArray(errorFeedback.details)
        ? errorFeedback.details.filter((detail) => String(detail || "").trim())
        : [];

    const detailsHtml = details.length
        ? `
            <ul class="employee-form__feedback-details">
                ${details
        .map((detail) => `<li class="employee-form__feedback-detail">${escapeHtml(detail)}</li>`)
        .join("")}
            </ul>
        `
        : "";

    return `
        <div class="employee-form__feedback employee-form__feedback--error" role="alert">
            <p class="employee-form__feedback-text">${escapeHtml(errorFeedback.message)}</p>
            ${detailsHtml}
        </div>
    `;
}

function renderEmployeeRows({ employees = [], loadingList = false }) {
    if (loadingList) {
        return `
            <tr class="employees__table-row employees__table-row--loading">
                <td class="employees__table-cell employees__table-cell--empty" colspan="7">Cargando empleados...</td>
            </tr>
        `;
    }

    if (!employees.length) {
        return `
            <tr class="employees__table-row employees__table-row--empty">
                <td class="employees__table-cell employees__table-cell--empty" colspan="7">No hay empleados registrados.</td>
            </tr>
        `;
    }

    return employees
        .map((employee) => `
            <tr class="employees__table-row employees__table-row--data">
                <td class="employees__table-cell">${escapeHtml(employee.id)}</td>
                <td class="employees__table-cell employees__table-cell--name">${escapeHtml(employee.fullName || "Sin nombre")}</td>
                <td class="employees__table-cell">${escapeHtml(employee.email || "Sin correo")}</td>
                <td class="employees__table-cell">${escapeHtml(employee.phone || "Sin telefono")}</td>
                <td class="employees__table-cell">${escapeHtml((employee.workShifts || []).length)}</td>
                <td class="employees__table-cell">${escapeHtml((employee.serviceIds || []).length)}</td>
                <td class="employees__table-cell employees__table-cell--actions">
                    <button
                        class="employees__action-btn employees__action-btn--edit"
                        type="button"
                        data-employee-edit-id="${escapeHtml(employee.id)}"
                    >
                        Editar
                    </button>
                    <button
                        class="employees__action-btn employees__action-btn--delete"
                        type="button"
                        data-employee-delete-id="${escapeHtml(employee.id)}"
                    >
                        Eliminar
                    </button>
                </td>
            </tr>
        `)
        .join("");
}

function renderDayOptions(selectedDay = "") {
    const selectedDayValue = String(selectedDay || "").trim().toUpperCase();

    const options = WEEK_DAY_OPTIONS
        .map((option) => {
            const selectedAttr = option.value === selectedDayValue ? " selected" : "";
            return `<option value="${option.value}"${selectedAttr}>${option.label}</option>`;
        })
        .join("");

    return `<option value="">Seleccionar dia</option>${options}`;
}

function renderShiftRows(rows = []) {
    if (!rows.length) {
        return `<p class="employee-shifts__empty">Aun no hay franjas laborales. Agrega al menos una.</p>`;
    }

    return rows
        .map((row) => `
            <div class="employee-shift-row" data-employee-shift-row-id="${escapeHtml(row.rowId)}">
                <select
                    class="employee-shift-row__select"
                    data-employee-shift-field="day"
                    aria-label="Dia de la franja"
                >
                    ${renderDayOptions(row.day)}
                </select>

                <input
                    class="employee-shift-row__input"
                    type="time"
                    value="${escapeHtml(formatTimeForInput(row.startTime))}"
                    data-employee-shift-field="startTime"
                    aria-label="Hora inicial"
                />

                <input
                    class="employee-shift-row__input"
                    type="time"
                    value="${escapeHtml(formatTimeForInput(row.endTime))}"
                    data-employee-shift-field="endTime"
                    aria-label="Hora final"
                />

                <button
                    class="employee-shift-row__remove-btn"
                    type="button"
                    data-employee-shift-remove="${escapeHtml(row.rowId)}"
                    aria-label="Quitar franja"
                >
                    Quitar
                </button>
            </div>
        `)
        .join("");
}

function renderCatalogStatusBanner(status) {
    if (status === EMPLEADOS_CATALOG_STATUS.IDLE) {
        return `<p class="employees-catalog__state employees-catalog__state--idle">Abre el formulario para cargar el catalogo de servicios.</p>`;
    }

    if (status === EMPLEADOS_CATALOG_STATUS.LOADING) {
        return `<p class="employees-catalog__state employees-catalog__state--loading">Cargando catalogo de servicios...</p>`;
    }

    if (status === EMPLEADOS_CATALOG_STATUS.EMPTY) {
        return `<p class="employees-catalog__state employees-catalog__state--empty">No hay servicios disponibles para asociar.</p>`;
    }

    if (status === EMPLEADOS_CATALOG_STATUS.ERROR) {
        return `<p class="employees-catalog__state employees-catalog__state--error">No se pudo cargar el catalogo de servicios. Cierra y vuelve a abrir el formulario para reintentar.</p>`;
    }

    return "";
}

function renderServicesCatalog({ status, servicesCatalog = [], selectedServiceIds = [] }) {
    if (status !== EMPLEADOS_CATALOG_STATUS.READY) {
        return renderCatalogStatusBanner(status);
    }

    if (!servicesCatalog.length) {
        return renderCatalogStatusBanner(EMPLEADOS_CATALOG_STATUS.EMPTY);
    }

    const selectedIds = new Set((selectedServiceIds || []).map((id) => String(id)));

    const servicesHtml = servicesCatalog
        .map((service) => {
            const serviceId = String(service.id);
            const checkedAttr = selectedIds.has(serviceId) ? " checked" : "";
            const inputId = `employees-service-${serviceId}`;

            return `
                <label class="employees-catalog__item" for="${escapeHtml(inputId)}">
                    <input
                        class="employees-catalog__checkbox"
                        id="${escapeHtml(inputId)}"
                        type="checkbox"
                        value="${escapeHtml(serviceId)}"
                        data-employee-service-checkbox
                        ${checkedAttr}
                    />
                    <span class="employees-catalog__label">${escapeHtml(service.name)}</span>
                </label>
            `;
        })
        .join("");

    return `<div class="employees-catalog__grid" id="employees-services-catalog">${servicesHtml}</div>`;
}

function renderCreateSections({ form, fieldErrors, servicesCatalogStatus, servicesCatalog }) {
    const shiftsError = getFieldError(fieldErrors, "workShifts");
    const servicesError = getFieldError(fieldErrors, "serviceIds");

    return `
        <section class="employee-form__section">
            <header class="employee-form__section-header">
                <h4 class="employee-form__section-title">Franjas laborales</h4>
                <button class="employees__button employees__button--secondary" id="employees-add-shift-btn" type="button">+ Agregar franja</button>
            </header>

            <div class="employee-shifts__rows" id="employees-shifts-container">
                ${renderShiftRows(form.workShifts || [])}
            </div>

            <span class="employees__field-error">${escapeHtml(shiftsError)}</span>
        </section>

        <section class="employee-form__section">
            <header class="employee-form__section-header">
                <h4 class="employee-form__section-title">Servicios asociados</h4>
            </header>

            ${renderServicesCatalog({
        status: servicesCatalogStatus,
        servicesCatalog,
        selectedServiceIds: form.serviceIds || [],
    })}

            <span class="employees__field-error">${escapeHtml(servicesError)}</span>
        </section>
    `;
}

function renderEditModeNote(form = {}) {
    const shiftsCount = Array.isArray(form.workShifts) ? form.workShifts.length : 0;
    const servicesCount = Array.isArray(form.serviceIds) ? form.serviceIds.length : 0;

    return `
        <section class="employee-form__section">
            <p class="employee-form__hint">
                En modo edicion solo se actualizan nombre, apellido, correo y telefono.
                Las franjas (${escapeHtml(shiftsCount)}) y los servicios asociados (${escapeHtml(servicesCount)}) se mantienen sin cambios.
            </p>
        </section>
    `;
}

function renderFormModal({ formModal, savingForm, servicesCatalog = [], servicesCatalogStatus }) {
    if (!formModal?.isOpen) {
        return "";
    }

    const isEdit = formModal.mode === "edit";
    const title = isEdit ? "Editar empleado" : "Nuevo empleado";
    const submitLabel = savingForm
        ? (isEdit ? "Guardando cambios..." : "Creando empleado...")
        : (isEdit ? "Guardar cambios" : "Crear empleado");

    const firstNameError = getFieldError(formModal.fieldErrors, "firstName");
    const lastNameError = getFieldError(formModal.fieldErrors, "lastName");
    const emailError = getFieldError(formModal.fieldErrors, "email");
    const phoneError = getFieldError(formModal.fieldErrors, "phone");

    return `
        <div class="employees__modal-overlay" data-employees-close="overlay">
            <section class="employees__modal" role="dialog" aria-modal="true" aria-labelledby="employees-form-title">
                <header class="employees__modal-header">
                    <h3 class="employees__modal-title" id="employees-form-title">${escapeHtml(title)}</h3>
                    <button
                        class="employees__button employees__button--icon"
                        id="employees-close-modal-btn"
                        type="button"
                        ${savingForm ? "disabled" : ""}
                    >
                        Cerrar
                    </button>
                </header>

                <form class="employees__form" id="employees-form" novalidate>
                    ${renderFormErrorFeedback(formModal.errorFeedback)}

                    <div class="employees__field-grid">
                        <label class="employees__field" for="employees-first-name">
                            <span class="employees__field-label">Nombre</span>
                            <input
                                class="employees__input${firstNameError ? " employees__input--invalid" : ""}"
                                id="employees-first-name"
                                name="firstName"
                                type="text"
                                minlength="${EMPLEADOS_VALIDATION.NAME_MIN}"
                                maxlength="${EMPLEADOS_VALIDATION.NAME_MAX}"
                                value="${escapeHtml(formModal.form?.firstName || "")}" 
                                autocomplete="given-name"
                                required
                            />
                            <span class="employees__field-error">${escapeHtml(firstNameError)}</span>
                        </label>

                        <label class="employees__field" for="employees-last-name">
                            <span class="employees__field-label">Apellido</span>
                            <input
                                class="employees__input${lastNameError ? " employees__input--invalid" : ""}"
                                id="employees-last-name"
                                name="lastName"
                                type="text"
                                minlength="${EMPLEADOS_VALIDATION.NAME_MIN}"
                                maxlength="${EMPLEADOS_VALIDATION.NAME_MAX}"
                                value="${escapeHtml(formModal.form?.lastName || "")}"
                                autocomplete="family-name"
                                required
                            />
                            <span class="employees__field-error">${escapeHtml(lastNameError)}</span>
                        </label>

                        <label class="employees__field" for="employees-email">
                            <span class="employees__field-label">Correo</span>
                            <input
                                class="employees__input${emailError ? " employees__input--invalid" : ""}"
                                id="employees-email"
                                name="email"
                                type="email"
                                value="${escapeHtml(formModal.form?.email || "")}" 
                                autocomplete="email"
                                required
                            />
                            <span class="employees__field-error">${escapeHtml(emailError)}</span>
                        </label>

                        <label class="employees__field" for="employees-phone">
                            <span class="employees__field-label">Telefono</span>
                            <input
                                class="employees__input${phoneError ? " employees__input--invalid" : ""}"
                                id="employees-phone"
                                name="phone"
                                type="tel"
                                value="${escapeHtml(formModal.form?.phone || "")}" 
                                pattern="^3\\d{9}$"
                                inputmode="numeric"
                                autocomplete="tel"
                                required
                            />
                            <span class="employees__field-error">${escapeHtml(phoneError)}</span>
                        </label>
                    </div>

                    ${isEdit
        ? renderEditModeNote(formModal.form)
        : renderCreateSections({
            form: formModal.form || {},
            fieldErrors: formModal.fieldErrors || {},
            servicesCatalogStatus,
            servicesCatalog,
        })}

                    <footer class="employee-form__actions">
                        <button
                            class="employees__button employees__button--secondary"
                            id="employees-cancel-btn"
                            type="button"
                            ${savingForm ? "disabled" : ""}
                        >
                            Cancelar
                        </button>
                        <button
                            class="employees__button employees__button--primary"
                            id="employees-submit-btn"
                            type="submit"
                            ${savingForm ? "disabled" : ""}
                        >
                            ${escapeHtml(submitLabel)}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    `;
}

function renderDeleteConfirm(deleteConfirm) {
    if (!deleteConfirm?.isOpen) {
        return "";
    }

    return `
        <div class="employees__modal-overlay" data-employees-close="overlay">
            <section class="employees__modal employees__modal--confirm" role="dialog" aria-modal="true">
                <p class="employees__confirm-text">
                    ¿Eliminar a <strong>${escapeHtml(deleteConfirm.employeeName || "este empleado")}</strong>? Esta accion no se puede deshacer.
                </p>
                <div class="employees__confirm-actions">
                    <button class="employees__button employees__button--secondary" id="employees-cancel-delete-btn" type="button">Cancelar</button>
                    <button class="employees__button employees__button--danger" id="employees-confirm-delete-btn" type="button">Eliminar</button>
                </div>
            </section>
        </div>
    `;
}

export function renderEmpleadosPage(state = {}) {
    const employees = Array.isArray(state.employees) ? state.employees : [];

    return `
        <section class="employees">
            <header class="employees__header">
                <div class="employees__header-copy">
                    <h2 class="employees__title">Gestion de Empleados</h2>
                    <p class="employees__subtitle">Administra datos base, franjas laborales y servicios asociados del equipo.</p>
                </div>

                <div class="employees__toolbar">
                    <button class="employees__button employees__button--secondary" id="employees-refresh-btn" type="button">Actualizar listado</button>
                    <button class="employees__button employees__button--primary" id="employees-open-create-btn" type="button">Nuevo empleado</button>
                </div>
            </header>

            ${renderGlobalErrorFeedback(state.errorFeedback)}
            ${renderFeedbackMessage(state.successMessage, "success", "status")}

            <section class="employees__panel">
                <div class="employees__table-wrapper">
                    <table class="employees__table" aria-describedby="employees-table-caption">
                        <caption class="employees__table-caption" id="employees-table-caption">Listado de empleados registrados</caption>
                        <thead class="employees__table-head">
                            <tr class="employees__table-head-row">
                                <th class="employees__table-head-cell" scope="col">ID</th>
                                <th class="employees__table-head-cell" scope="col">Nombre completo</th>
                                <th class="employees__table-head-cell" scope="col">Correo</th>
                                <th class="employees__table-head-cell" scope="col">Telefono</th>
                                <th class="employees__table-head-cell" scope="col">Franjas</th>
                                <th class="employees__table-head-cell" scope="col">Servicios</th>
                                <th class="employees__table-head-cell" scope="col">Acciones</th>
                            </tr>
                        </thead>

                        <tbody class="employees__table-body">
                            ${renderEmployeeRows({ employees, loadingList: Boolean(state.loadingList) })}
                        </tbody>
                    </table>
                </div>
            </section>

            ${renderFormModal({
        formModal: state.formModal || {},
        savingForm: Boolean(state.savingForm),
        servicesCatalog: state.servicesCatalog || [],
        servicesCatalogStatus: state.servicesCatalogStatus || EMPLEADOS_CATALOG_STATUS.IDLE,
    })}

            ${renderDeleteConfirm(state.deleteConfirm || {})}
        </section>
    `;
}
