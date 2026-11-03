// Escape HTML compartido contra XSS (fuente unica en shared/ui/escapeHtml.js).
import { escapeHtml } from "../../shared/ui/escapeHtml.js";

function toAppointmentsBEMClassName(cssClassName) {
    if (cssClassName === "citas") {
        return "appointments";
    }

    if (cssClassName.startsWith("citas__")) {
        return cssClassName.replace("citas__", "appointments__");
    }

    return "";
}

// Mantiene clases legacy (citas) y agrega alias en ingles (appointments) durante la migracion.
function appendAppointmentsBEMAliases(htmlTemplate) {
    return String(htmlTemplate).replace(/class="([^"]+)"/g, (fullMatch, classTokens) => {
        const currentClasses = String(classTokens)
            .split(/\s+/)
            .map((cssClassName) => cssClassName.trim())
            .filter(Boolean);

        if (!currentClasses.length) {
            return fullMatch;
        }

        const mergedClasses = [...currentClasses];

        currentClasses
            .map(toAppointmentsBEMClassName)
            .filter(Boolean)
            .forEach((aliasClassName) => {
                if (!mergedClasses.includes(aliasClassName)) {
                    mergedClasses.push(aliasClassName);
                }
            });

        return `class="${mergedClasses.join(" ")}"`;
    });
}

function getFieldError(fieldErrors, aliases = []) {
    for (const alias of aliases) {
        const errorMessage = fieldErrors?.[alias];
        if (errorMessage) {
            return String(errorMessage);
        }
    }

    return "";
}

// Extrae HH:mm de YYYY-MM-DDTHH:mm:ss.
function formatSlotTime(slotDateTime) {
    if (!slotDateTime) {
        return "Sin hora";
    }

    const timePart = String(slotDateTime).split("T")[1] || "";
    if (!timePart) {
        return "Sin hora";
    }

    return timePart.substring(0, 5);
}

function formatSlotDate(slotDateTime) {
    if (!slotDateTime) {
        return "Sin fecha";
    }

    const datePart = String(slotDateTime).split("T")[0] || "";
    if (datePart.length < 10) {
        return "Sin fecha";
    }

    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) {
        return "Sin fecha";
    }

    return `${day}/${month}/${year}`;
}

function formatMetric(metricValue) {
    if (typeof metricValue !== "number" || Number.isNaN(metricValue)) {
        return "--";
    }

    return `${metricValue.toFixed(2)} ms`;
}

// Genera las opciones del dropdown de servicios.
export function renderServiceOptions({ services = [], selectedServiceId = "", hasCatalogError = false }) {
    if (hasCatalogError) {
        return '<option value="">Error al cargar</option>';
    }

    const defaultOption = '<option value="">Seleccionar servicio</option>';

    if (!services.length) {
        return `${defaultOption}<option value="" disabled>Sin servicios disponibles</option>`;
    }

    const optionsHtml = services
        .map((service) => {
            const selectedAttr = String(service.id) === String(selectedServiceId) ? " selected" : "";
            return `<option value="${escapeHtml(service.id)}"${selectedAttr}>${escapeHtml(service.name)}</option>`;
        })
        .join("");

    return `${defaultOption}${optionsHtml}`;
}

// Genera las opciones del dropdown de empleados filtrados por servicio.
export function renderEmployeeOptions({
    employees = [],
    selectedEmployeeId = "",
    hasService = false,
    hasCatalogError = false,
}) {
    if (hasCatalogError) {
        return '<option value="">Error al cargar</option>';
    }

    if (!hasService) {
        return '<option value="">Selecciona un servicio primero</option>';
    }

    const defaultOption = '<option value="">Seleccionar empleado</option>';

    if (!employees.length) {
        return `${defaultOption}<option value="" disabled>Sin empleados disponibles</option>`;
    }

    const optionsHtml = employees
        .map((emp) => {
            const selectedAttr = String(emp.id) === String(selectedEmployeeId) ? " selected" : "";
            return `<option value="${escapeHtml(emp.id)}"${selectedAttr}>${escapeHtml(emp.fullName)}</option>`;
        })
        .join("");

    return `${defaultOption}${optionsHtml}`;
}

function renderLoadingMessage(loadingAgenda) {
    if (!loadingAgenda) {
        return "";
    }

    return '<p class="citas__message citas__message--info">Cargando agenda...</p>';
}

function renderErrorMessage(errorMessage) {
    if (!errorMessage) {
        return "";
    }

    return `<p class="citas__message citas__message--error" role="alert">${escapeHtml(errorMessage)}</p>`;
}

function renderSuccessMessage(successMessage) {
    if (!successMessage) {
        return "";
    }

    return `<p class="citas__message citas__message--success" role="status">${escapeHtml(successMessage)}</p>`;
}

// La metrica de rendimiento es instrumentacion de RNF, no informacion para el
// recepcionista. Se mantiene la medicion subyacente pero no se muestra en
// produccion; solo se renderiza si se habilita explicitamente el flag debug.
function isPerformanceMetricsDebugEnabled() {
    try {
        return (
            typeof window !== "undefined" &&
            window.localStorage?.getItem("citas:debug-metrics") === "true"
        );
    } catch (storageError) {
        return false;
    }
}

function renderPerformanceMetrics(metrics = {}) {
    return `
        <p class="citas__metrics" aria-live="polite">
            Carga agenda: <strong>${formatMetric(metrics.agendaLoadMs)}</strong>
            | Refresco disponibilidad: <strong>${formatMetric(metrics.availabilityRefreshMs)}</strong>
        </p>
    `;
}

// Render de slots disponibles para seleccion en agenda.
function renderAvailableSlotsGrid(availabilitySlots = [], selectedSlot = null, isBlocked = false) {
    if (!availabilitySlots.length) {
        return '<div class="citas__slots-empty">No hay horarios disponibles para los filtros seleccionados.</div>';
    }

    const slotsHtml = availabilitySlots
        .map((slot) => {
            const isSelected = slot.slotDateTime === selectedSlot;
            const selectedClass = isSelected ? " citas__slot--selected" : "";
            const disabledAttr = isBlocked || !slot.isSelectable ? " disabled" : "";

            return `
                <button
                    class="citas__slot citas__slot--available${selectedClass}"
                    data-slot-datetime="${escapeHtml(slot.slotDateTime)}"
                    type="button"
                    aria-label="Seleccionar horario ${escapeHtml(formatSlotTime(slot.slotDateTime))}"
                    ${disabledAttr}
                >
                    <span class="citas__slot-time">${escapeHtml(formatSlotTime(slot.slotDateTime))}</span>
                </button>
            `;
        })
        .join("");

    return `<div class="citas__slots-grid">${slotsHtml}</div>`;
}

// Icono de check SVG monocromo (hereda currentColor) para pasos completados.
const CITAS_CHECK_ICON = `
    <svg class="citas__step-check" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M6.2 11.3 2.9 8l1-1 2.3 2.3L12 3.5l1 1z" fill="currentColor" />
    </svg>
`;

function renderClientSearchForm(state) {
    return `
        <form class="citas__search-form" id="citas-client-search-form" novalidate>
            <div class="citas__search-grid">
                <label class="citas__field">
                    <span class="citas__field-label">Documento</span>
                    <input
                        class="citas__input"
                        type="text"
                        name="documentNumber"
                        value="${escapeHtml(state.clientSearch.documentNumber)}"
                        placeholder="Ej: 10203040"
                    />
                </label>

                <label class="citas__field">
                    <span class="citas__field-label">Telefono</span>
                    <input
                        class="citas__input"
                        type="text"
                        name="phone"
                        value="${escapeHtml(state.clientSearch.phone)}"
                        placeholder="Ej: 3001234567"
                    />
                </label>

                <label class="citas__field">
                    <span class="citas__field-label">Nombre</span>
                    <input
                        class="citas__input"
                        type="text"
                        name="name"
                        value="${escapeHtml(state.clientSearch.name)}"
                        placeholder="Ej: Ana"
                    />
                </label>
            </div>

            <div class="citas__actions citas__actions--inline">
                <button
                    class="citas__button citas__button--secondary"
                    id="citas-search-client-btn"
                    type="submit"
                    ${state.loadingClients ? "disabled" : ""}
                >
                    ${state.loadingClients ? "Buscando..." : "Buscar cliente"}
                </button>
            </div>

            ${state.clientSearch.errorMessage
                ? `<p class="citas__inline-error">${escapeHtml(state.clientSearch.errorMessage)}</p>`
                : ""}
        </form>
    `;
}

function renderClientSearchResults(state) {
    if (state.loadingClients) {
        return '<p class="citas__empty-text">Consultando clientes...</p>';
    }

    if (state.clientSearch.results.length > 0) {
        const resultsHtml = state.clientSearch.results
            .map((client) => `
                <li class="citas__search-item">
                    <div class="citas__search-item-main">
                        <strong>${escapeHtml(client.fullName || "Cliente sin nombre")}</strong>
                        <span>${escapeHtml(client.documentNumber || "Sin documento")}</span>
                        <span>${escapeHtml(client.phone || "Sin telefono")}</span>
                    </div>
                    <button
                        class="citas__button citas__button--ghost citas__client-select-btn"
                        type="button"
                        data-client-id="${escapeHtml(client.id)}"
                    >
                        Seleccionar
                    </button>
                </li>
            `)
            .join("");

        return `
            <ul class="citas__search-results">
                ${resultsHtml}
            </ul>
        `;
    }

    if (!state.clientSearch.searched) {
        return '<p class="citas__empty-text">Busca por documento, telefono o nombre para seleccionar cliente.</p>';
    }

    return `
        <div class="citas__empty-actions">
            <p class="citas__empty-text">No hubo coincidencias. Puedes crear el cliente en alta rapida.</p>
            <button class="citas__button citas__button--ghost" id="citas-show-quick-add-btn" type="button">
                Abrir alta rapida
            </button>
        </div>
    `;
}

function renderQuickAddForm(state) {
    if (!state.clientSearch.showQuickAdd) {
        return "";
    }

    const quickAddErrors = state.quickAddErrors || {};

    return `
        <section class="citas__quick-add">
            <h4 class="citas__section-title">Alta rapida de cliente</h4>

            <form id="citas-quick-add-form" novalidate>
                <div class="citas__quick-add-grid">
                    <label class="citas__field">
                        <span class="citas__field-label">Nombre</span>
                        <input
                            class="citas__input"
                            id="quickAddFirstName"
                            name="firstName"
                            value="${escapeHtml(state.quickAddForm.firstName)}"
                            required
                        />
                        <span class="citas__input-error">${escapeHtml(
                            getFieldError(quickAddErrors, ["firstName", "nombre"]),
                        )}</span>
                    </label>

                    <label class="citas__field">
                        <span class="citas__field-label">Apellido</span>
                        <input
                            class="citas__input"
                            id="quickAddLastName"
                            name="lastName"
                            value="${escapeHtml(state.quickAddForm.lastName)}"
                            required
                        />
                        <span class="citas__input-error">${escapeHtml(
                            getFieldError(quickAddErrors, ["lastName", "apellido"]),
                        )}</span>
                    </label>

                    <label class="citas__field">
                        <span class="citas__field-label">Telefono</span>
                        <input
                            class="citas__input"
                            id="quickAddPhone"
                            name="phone"
                            value="${escapeHtml(state.quickAddForm.phone)}"
                            required
                        />
                        <span class="citas__input-error">${escapeHtml(
                            getFieldError(quickAddErrors, ["phone", "telefono"]),
                        )}</span>
                    </label>

                    <label class="citas__field">
                        <span class="citas__field-label">Documento</span>
                        <input
                            class="citas__input"
                            id="quickAddDocumentNumber"
                            name="documentNumber"
                            value="${escapeHtml(state.quickAddForm.documentNumber)}"
                            required
                        />
                        <span class="citas__input-error">${escapeHtml(
                            getFieldError(quickAddErrors, ["documentNumber", "documento"]),
                        )}</span>
                    </label>
                </div>

                <div class="citas__actions citas__actions--inline">
                    <button
                        class="citas__button citas__button--primary"
                        id="citas-quick-add-submit"
                        type="submit"
                        ${state.savingAction === "quick-add" ? "disabled" : ""}
                    >
                        ${state.savingAction === "quick-add" ? "Guardando cliente..." : "Guardar cliente"}
                    </button>
                </div>
            </form>
        </section>
    `;
}

// Deriva el paso activo del wizard a partir de lo ya seleccionado. El controller
// mantiene state.wizardStep; si no esta disponible se recalcula aqui para la vista.
export function deriveWizardStep(state = {}) {
    if (!state.selectedServiceId || !state.selectedDate) {
        return 1;
    }

    if (!state.selectedSlot) {
        return 2;
    }

    if (!state.selectedClient) {
        return 3;
    }

    return 4;
}

function resolveWizardActiveStep(state = {}) {
    const derived = deriveWizardStep(state);
    const requested = Number(state.wizardStep);

    if (!Number.isInteger(requested) || requested < 1 || requested > 4) {
        return derived;
    }

    // El usuario no puede abrir un paso mas adelante de lo que permite su progreso.
    return Math.min(requested, derived);
}

function resolveSelectedServiceName(state, services = []) {
    if (!state.selectedServiceId) {
        return "";
    }

    const serviceEntry = services.find((service) => String(service.id) === String(state.selectedServiceId));
    return serviceEntry?.name || `Servicio ${state.selectedServiceId}`;
}

function resolveSelectedEmployeeName(state, employees = []) {
    if (!state.selectedEmployeeId) {
        return "";
    }

    const employeeEntry = employees.find((emp) => String(emp.id) === String(state.selectedEmployeeId));
    return employeeEntry?.fullName || `Empleado ${state.selectedEmployeeId}`;
}

function renderStepStatusClass(stepId, activeStep) {
    if (stepId === activeStep) {
        return "citas__step--active";
    }

    if (stepId < activeStep) {
        return "citas__step--done";
    }

    return "citas__step--locked";
}

function renderStepHeader(stepId, activeStep, label, collapsedValue) {
    const isDone = stepId < activeStep;
    const isLocked = stepId > activeStep;
    const canEdit = isDone && !isLocked;

    const marker = isDone
        ? CITAS_CHECK_ICON
        : `<span class="citas__step-number">${stepId}</span>`;

    const editButton = canEdit
        ? `<button class="citas__step-edit" type="button" data-wizard-step="${stepId}">Editar</button>`
        : "";

    const collapsedValueHtml = (isDone && collapsedValue)
        ? `<span class="citas__step-value">${escapeHtml(collapsedValue)}</span>`
        : "";

    return `
        <div class="citas__step-header">
            <span class="citas__step-marker">${marker}</span>
            <span class="citas__step-heading">
                <span class="citas__step-label">${escapeHtml(label)}</span>
                ${collapsedValueHtml}
            </span>
            ${editButton}
        </div>
    `;
}

function renderStepServiceSummary(state, services = []) {
    const serviceName = resolveSelectedServiceName(state, services) || "Sin servicio";
    const dateText = state.selectedDate ? formatSlotDate(`${state.selectedDate}T00:00:00`) : "Sin fecha";

    return `
        <p class="citas__step-hint">Selecciona el servicio y la fecha en el panel de filtros superior.</p>
        <dl class="citas__step-recap">
            <div class="citas__step-recap-row">
                <dt class="citas__step-recap-label">Servicio</dt>
                <dd class="citas__step-recap-value">${escapeHtml(serviceName)}</dd>
            </div>
            <div class="citas__step-recap-row">
                <dt class="citas__step-recap-label">Fecha</dt>
                <dd class="citas__step-recap-value">${escapeHtml(dateText)}</dd>
            </div>
        </dl>
    `;
}

function renderStepSlot(state, filteredEmployees = [], catalogLoadError = false) {
    const employeeOptionsHtml = renderEmployeeOptions({
        employees: filteredEmployees,
        selectedEmployeeId: state.selectedEmployeeId,
        hasService: Boolean(state.selectedServiceId),
        hasCatalogError: catalogLoadError,
    });

    return `
        <p class="citas__step-hint">Elegi el empleado y luego un horario disponible.</p>

        <label class="citas__field">
            <span class="citas__field-label">Empleado</span>
            <select
                class="citas__select"
                id="citas-booking-employee-select"
                ${catalogLoadError || !state.selectedServiceId ? "disabled" : ""}
            >
                ${employeeOptionsHtml}
            </select>
        </label>

        <h3 class="citas__panel-title">Horarios disponibles</h3>
        ${renderAvailableSlotsGrid(state.availabilitySlots, state.selectedSlot, state.conflictBlocked)}
    `;
}

function renderStepClient(state) {
    return `
        <p class="citas__step-hint">Busca el cliente por documento, telefono o nombre. Si no existe, usa alta rapida.</p>
        ${renderClientSearchForm(state)}
        ${renderClientSearchResults(state)}
        ${renderQuickAddForm(state)}
    `;
}

function renderStepConfirm(state, services = [], employees = []) {
    const bookingErrors = state.bookingErrors || {};

    const createDisabled = Boolean(
        state.loadingAgenda
        || state.conflictBlocked
        || state.savingAction === "create"
        || !state.selectedSlot
        || !state.selectedClient
        || !state.selectedEmployeeId,
    );

    const serviceName = resolveSelectedServiceName(state, services) || "Sin servicio";
    const employeeName = resolveSelectedEmployeeName(state, employees) || "Sin empleado asignado";
    const slotText = state.selectedSlot
        ? `${formatSlotDate(state.selectedSlot)} · ${formatSlotTime(state.selectedSlot)}`
        : "Sin horario";
    const clientText = state.selectedClient
        ? `${state.selectedClient.fullName || "Cliente sin nombre"} (${state.selectedClient.phone || "Sin telefono"})`
        : "Sin cliente";

    return `
        <p class="citas__step-hint">Revisa el resumen y confirma la cita.</p>

        <dl class="citas__confirm-recap">
            <div class="citas__confirm-row">
                <dt class="citas__confirm-label">Servicio</dt>
                <dd class="citas__confirm-value">${escapeHtml(serviceName)}</dd>
            </div>
            <div class="citas__confirm-row">
                <dt class="citas__confirm-label">Horario</dt>
                <dd class="citas__confirm-value">${escapeHtml(slotText)}</dd>
            </div>
            <div class="citas__confirm-row">
                <dt class="citas__confirm-label">Empleado</dt>
                <dd class="citas__confirm-value">${escapeHtml(employeeName)}</dd>
            </div>
            <div class="citas__confirm-row">
                <dt class="citas__confirm-label">Cliente</dt>
                <dd class="citas__confirm-value">${escapeHtml(clientText)}</dd>
            </div>
        </dl>

        <div class="citas__booking-actions">
            <p class="citas__inline-error">${escapeHtml(
                getFieldError(bookingErrors, ["idCliente", "idServicio", "idEmpleado", "fechaInicio"]),
            )}</p>

            <button
                class="citas__button citas__button--primary"
                id="citas-create-appointment-btn"
                type="button"
                ${createDisabled ? "disabled" : ""}
            >
                ${state.savingAction === "create" ? "Confirmando reserva..." : "Confirmar cita"}
            </button>
        </div>
    `;
}

// Columna izquierda: wizard secuencial de 4 pasos. El contenido interactivo de cada
// paso se mantiene siempre en el DOM; el CSS colapsa el cuerpo de los pasos no activos.
function renderBookingWizard(state, filteredEmployees = [], catalogLoadError = false, services = [], employees = []) {
    const activeStep = resolveWizardActiveStep(state);

    const serviceCollapsed = resolveSelectedServiceName(state, services)
        ? `${resolveSelectedServiceName(state, services)}${state.selectedDate ? ` · ${formatSlotDate(`${state.selectedDate}T00:00:00`)}` : ""}`
        : "Sin servicio";
    const slotCollapsed = state.selectedSlot
        ? `${formatSlotTime(state.selectedSlot)}${state.selectedEmployeeId ? ` · ${resolveSelectedEmployeeName(state, employees)}` : ""}`
        : "Sin horario";
    const clientCollapsed = state.selectedClient
        ? (state.selectedClient.fullName || "Cliente sin nombre")
        : "Sin cliente";

    return `
        <section class="citas__panel citas__wizard" aria-label="Reservar cita">
            <ol class="citas__steps">
                <li class="citas__step ${renderStepStatusClass(1, activeStep)}">
                    ${renderStepHeader(1, activeStep, "Servicio y fecha", serviceCollapsed)}
                    <div class="citas__step-body">
                        ${renderStepServiceSummary(state, services)}
                    </div>
                </li>

                <li class="citas__step ${renderStepStatusClass(2, activeStep)}">
                    ${renderStepHeader(2, activeStep, "Elegi horario", slotCollapsed)}
                    <div class="citas__step-body">
                        ${renderStepSlot(state, filteredEmployees, catalogLoadError)}
                    </div>
                </li>

                <li class="citas__step ${renderStepStatusClass(3, activeStep)}">
                    ${renderStepHeader(3, activeStep, "Cliente", clientCollapsed)}
                    <div class="citas__step-body">
                        ${renderStepClient(state)}
                    </div>
                </li>

                <li class="citas__step ${renderStepStatusClass(4, activeStep)}">
                    ${renderStepHeader(4, activeStep, "Confirmar", "")}
                    <div class="citas__step-body">
                        ${renderStepConfirm(state, services, employees)}
                    </div>
                </li>
            </ol>
        </section>
    `;
}

function renderStatusOptions(statuses = [], currentStatus = "") {
    return statuses
        .map((status) => {
            const selectedAttr = status === currentStatus ? " selected" : "";
            return `<option value="${status}"${selectedAttr}>${status}</option>`;
        })
        .join("");
}

// Constantes para estados activos e historial
const ACTIVE_STATUSES = ["PENDIENTE", "CONFIRMADA"];
const HISTORY_STATUSES = ["REALIZADA", "CANCELADA"];

function renderAppointmentsSectionTabs(appointments = [], currentTab = "active") {
    const activeAppointments = appointments.filter((apt) => ACTIVE_STATUSES.includes(apt.status));
    const historyAppointments = appointments.filter((apt) => HISTORY_STATUSES.includes(apt.status));

    const activeTabClass = currentTab === "active" ? " citas__section-tab--active" : "";
    const historyTabClass = currentTab === "history" ? " citas__section-tab--active" : "";

    return `
        <div class="citas__section-tabs" role="tablist">
            <button
                class="citas__section-tab${activeTabClass}"
                type="button"
                data-citas-view="active"
            >
                Activas
                <span class="citas__section-tab-count">${activeAppointments.length}</span>
            </button>
            <button
                class="citas__section-tab${historyTabClass}"
                type="button"
                data-citas-view="history"
            >
                Historial
                <span class="citas__section-tab-count">${historyAppointments.length}</span>
            </button>
        </div>
    `;
}

// Transiciones de estado validas (mismas reglas que valida el controller).
const APPOINTMENT_STATUS_TRANSITIONS = {
    PENDIENTE: [
        { status: "CONFIRMADA", label: "Confirmar", variant: "primary" },
        { status: "CANCELADA", label: "Cancelar", variant: "danger" },
    ],
    CONFIRMADA: [
        { status: "REALIZADA", label: "Marcar realizada", variant: "primary" },
        { status: "CANCELADA", label: "Cancelar", variant: "danger" },
    ],
};

// Acciones de cambio de estado directas por cita activa. Se conserva el select
// #citas-status-<id> (contrato de tests/controller); los botones directos fijan
// su valor antes de disparar la actualizacion.
function renderAppointmentStatusActions(appointment, appointmentStatus, appointmentStatuses, isUpdating, isDeleting) {
    const transitions = APPOINTMENT_STATUS_TRANSITIONS[appointmentStatus] || [];
    const busy = isUpdating || isDeleting;

    const directButtonsHtml = transitions
        .map((transition) => {
            const danger = transition.variant === "danger";
            const variantClass = danger
                ? "citas__button--danger"
                : "citas__button--primary";

            return `
                <button
                    class="citas__button ${variantClass} citas__appointment-update-btn"
                    type="button"
                    data-appointment-id="${escapeHtml(appointment.id)}"
                    data-target-status="${escapeHtml(transition.status)}"
                    ${busy ? "disabled" : ""}
                >
                    ${isUpdating ? "Actualizando..." : escapeHtml(transition.label)}
                </button>
            `;
        })
        .join("");

    return `
        <label class="citas__field citas__field--hidden">
            <span class="citas__field-label">Estado</span>
            <select class="citas__select citas__select--compact" id="citas-status-${escapeHtml(appointment.id)}">
                ${renderStatusOptions(appointmentStatuses, appointment.status)}
            </select>
        </label>

        <div class="citas__item-buttons">
            ${directButtonsHtml}

            <button
                class="citas__button citas__button--danger citas__appointment-delete-btn"
                type="button"
                data-appointment-id="${escapeHtml(appointment.id)}"
                ${busy ? "disabled" : ""}
            >
                ${isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
        </div>
    `;
}

function renderAppointmentsList(appointments = [], appointmentStatuses = [], state, catalogs = {}) {
    if (!appointments.length) {
        return '<li class="citas__list-item citas__list-item--empty">No hay citas registradas para los filtros seleccionados.</li>';
    }

    const catalogServices = Array.isArray(catalogs.services) ? catalogs.services : [];
    const catalogEmployees = Array.isArray(catalogs.employees) ? catalogs.employees : [];

    return appointments
        .map((appointment) => {
            const isUpdating = state.savingAction === `update-${appointment.id}`;
            const isDeleting = state.savingAction === `delete-${appointment.id}`;
            const appointmentStatus = appointment.status || "PENDIENTE";
            const isHistory = HISTORY_STATUSES.includes(appointmentStatus);

            const serviceEntry = appointment.service?.id
                ? catalogServices.find((s) => s.id === appointment.service.id)
                : null;
            const serviceName = serviceEntry?.name || appointment.service?.name || "Servicio no definido";

            const employeeEntry = appointment.employee?.id
                ? catalogEmployees.find((e) => e.id === appointment.employee.id)
                : null;
            const employeeName = employeeEntry?.fullName || appointment.employee?.name || "Empleado no definido";

            const clientName = appointment.client?.fullName || "Cliente sin nombre";

            return `
                <li class="citas__list-item citas__list-item--status-${appointmentStatus}">
                    <div class="citas__item-lead">
                        <p class="citas__item-time">${escapeHtml(formatSlotTime(appointment.slotDateTime))}</p>
                        <p class="citas__item-date">${escapeHtml(formatSlotDate(appointment.slotDateTime))}</p>
                    </div>

                    <div class="citas__item-main">
                        <p class="citas__item-title">Cliente: ${escapeHtml(clientName)}</p>
                        <p class="citas__item-subtitle">
                            Servicio: ${escapeHtml(serviceName)}
                            | Empleado: ${escapeHtml(employeeName)}
                        </p>
                        <p class="citas__item-subtitle citas__item-ref">Cita #${escapeHtml(appointment.id || "-")}</p>
                    </div>

                    <div class="citas__item-meta">
                        <span class="citas__item-status citas__item-status--${appointmentStatus}">${escapeHtml(appointmentStatus)}</span>
                    </div>

                    ${isHistory
        ? `<div class="citas__item-actions citas__item-actions--closed"><p class="citas__empty-text">Registro cerrado</p></div>`
        : `<div class="citas__item-actions">
                            ${renderAppointmentStatusActions(appointment, appointmentStatus, appointmentStatuses, isUpdating, isDeleting)}
                        </div>`}
                </li>
            `;
        })
        .join("");
}

// SHELL estatica renderizada una vez al inicializar la feature.
export function renderCitasShell({
    state,
    viewModes,
    serviceCatalog = [],
    filteredEmployees = [],
    catalogLoadError = false,
}) {
    const viewModeOptions = Object.values(viewModes)
        .map((viewMode) => {
            const optionLabel = viewMode === "day" ? "Dia" : "Semana";
            const selectedAttr = state.currentView === viewMode ? " selected" : "";
            return `<option value="${viewMode}"${selectedAttr}>${optionLabel}</option>`;
        })
        .join("");

    const serviceOptionsHtml = renderServiceOptions({
        services: serviceCatalog,
        selectedServiceId: state.selectedServiceId,
        hasCatalogError: catalogLoadError,
    });

    const employeeOptionsHtml = renderEmployeeOptions({
        employees: filteredEmployees,
        selectedEmployeeId: state.selectedEmployeeId,
        hasService: Boolean(state.selectedServiceId),
        hasCatalogError: catalogLoadError,
    });

    const serviceDisabled = catalogLoadError ? " disabled" : "";
    const employeeDisabled = catalogLoadError || !state.selectedServiceId ? " disabled" : "";

    return appendAppointmentsBEMAliases(`
        <section class="citas">
            <header class="citas__header">
                <h2 class="citas__title">Agenda de citas</h2>
                <p class="citas__subtitle">Gestiona disponibilidad, clientes y reservas sin salir de la agenda.</p>
            </header>

            <form class="citas__filters" id="citas-filter-form">
                <label class="citas__field">
                    <span class="citas__field-label">Fecha</span>
                    <input
                        class="citas__input"
                        type="date"
                        name="selectedDate"
                        value="${escapeHtml(state.selectedDate)}"
                        required
                    />
                </label>

                <label class="citas__field">
                    <span class="citas__field-label">Servicio</span>
                    <select
                        class="citas__select"
                        id="citas-service-select"
                        name="selectedServiceId"
                        ${serviceDisabled}
                    >
                        ${serviceOptionsHtml}
                    </select>
                </label>

                <label class="citas__field">
                    <span class="citas__field-label">Empleado</span>
                    <select
                        class="citas__select"
                        id="citas-employee-select"
                        name="selectedEmployeeId"
                        ${employeeDisabled}
                    >
                        ${employeeOptionsHtml}
                    </select>
                </label>

                <label class="citas__field">
                    <span class="citas__field-label">Vista</span>
                    <select class="citas__select" id="citas-view-mode" name="selectedViewMode">
                        ${viewModeOptions}
                    </select>
                </label>

                <div class="citas__actions">
                    <button class="citas__button citas__button--primary" type="submit">Actualizar agenda</button>
                    <button class="citas__button citas__button--secondary" id="citas-refresh-btn" type="button">
                        Recargar
                    </button>
                </div>
            </form>

            <div id="citas-agenda-panel"></div>
        </section>
    `);
}

// PANEL dinamico actualizado en cada carga o accion del usuario.
export function renderAgendaPanel({
    state,
    appointmentStatuses,
    serviceCatalog = [],
    employeeCatalog = [],
    filteredEmployees = [],
    catalogLoadError = false,
}) {
    const resolveAppointmentStatus = (appointment) => appointment?.status || "PENDIENTE";

    // Filter appointments based on active tab
    const currentTab = state.appointmentsTab || "active";
    const filteredAppointments = currentTab === "history"
        ? state.appointments.filter((apt) => HISTORY_STATUSES.includes(resolveAppointmentStatus(apt)))
        : state.appointments.filter((apt) => ACTIVE_STATUSES.includes(resolveAppointmentStatus(apt)));

    return appendAppointmentsBEMAliases(`
        ${renderLoadingMessage(state.loadingAgenda)}
        ${renderErrorMessage(state.errorMessage)}
        ${renderSuccessMessage(state.successMessage)}
        ${isPerformanceMetricsDebugEnabled() ? renderPerformanceMetrics(state.metrics) : ""}

        <div class="citas__workspace">
            ${renderBookingWizard(state, filteredEmployees, catalogLoadError, serviceCatalog, employeeCatalog)}

            <section class="citas__panel citas__day-panel">
                <h3 class="citas__panel-title">Citas del dia</h3>
                ${renderAppointmentsSectionTabs(state.appointments, currentTab)}
                <ul class="citas__list">
                    ${renderAppointmentsList(filteredAppointments, appointmentStatuses, state, { services: serviceCatalog, employees: employeeCatalog })}
                </ul>
            </section>
        </div>
    `);
}
