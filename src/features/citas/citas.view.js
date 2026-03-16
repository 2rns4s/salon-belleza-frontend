function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

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

function renderSelectedSummary(state) {
    const selectedClientText = state.selectedClient
        ? `${state.selectedClient.fullName || "Cliente sin nombre"} (${state.selectedClient.phone || "Sin telefono"})`
        : "Sin cliente seleccionado";

    return `
        <div class="citas__booking-summary">
            <article class="citas__summary-card">
                <span class="citas__summary-label">Horario</span>
                <strong class="citas__summary-value">${escapeHtml(
                    state.selectedSlot ? `${state.selectedSlot.replace("T", " ")}` : "Sin horario seleccionado",
                )}</strong>
            </article>
            <article class="citas__summary-card">
                <span class="citas__summary-label">Cliente</span>
                <strong class="citas__summary-value">${escapeHtml(selectedClientText)}</strong>
            </article>
        </div>
    `;
}

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

function renderBookingPanel(state) {
    const bookingErrors = state.bookingErrors || {};

    const createDisabled = Boolean(
        state.loadingAgenda
        || state.conflictBlocked
        || state.savingAction === "create"
        || !state.selectedSlot
        || !state.selectedClient,
    );

    return `
        <section class="citas__panel">
            <h3 class="citas__panel-title">Reserva y quick-add</h3>
            ${renderSelectedSummary(state)}

            ${renderClientSearchForm(state)}
            ${renderClientSearchResults(state)}
            ${renderQuickAddForm(state)}

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
                <li class="citas__list-item">
                    <div class="citas__item-main">
                        <p class="citas__item-title">Cliente: ${escapeHtml(clientName)}</p>
                        <p class="citas__item-subtitle">
                            Servicio: ${escapeHtml(serviceName)}
                            | Empleado: ${escapeHtml(employeeName)}
                        </p>
                        <p class="citas__item-subtitle">Cita #${escapeHtml(appointment.id || "-")}</p>
                    </div>

                    <div class="citas__item-meta">
                        <p class="citas__item-date">${escapeHtml(formatSlotDate(appointment.slotDateTime))}</p>
                        <p class="citas__item-time">${escapeHtml(formatSlotTime(appointment.slotDateTime))}</p>
                        <p class="citas__item-status">${escapeHtml(appointment.status || "PENDIENTE")}</p>
                    </div>

                    <div class="citas__item-actions">
                        <label class="citas__field">
                            <span class="citas__field-label">Estado</span>
                            <select class="citas__select citas__select--compact" id="citas-status-${escapeHtml(appointment.id)}">
                                ${renderStatusOptions(appointmentStatuses, appointment.status)}
                            </select>
                        </label>

                        <button
                            class="citas__button citas__button--secondary citas__appointment-update-btn"
                            type="button"
                            data-appointment-id="${escapeHtml(appointment.id)}"
                            ${isUpdating || isDeleting ? "disabled" : ""}
                        >
                            ${isUpdating ? "Actualizando..." : "Actualizar"}
                        </button>

                        <button
                            class="citas__button citas__button--danger citas__appointment-delete-btn"
                            type="button"
                            data-appointment-id="${escapeHtml(appointment.id)}"
                            ${isUpdating || isDeleting ? "disabled" : ""}
                        >
                            ${isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                    </div>
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
export function renderAgendaPanel({ state, appointmentStatuses, serviceCatalog = [], employeeCatalog = [] }) {
    return appendAppointmentsBEMAliases(`
        ${renderLoadingMessage(state.loadingAgenda)}
        ${renderErrorMessage(state.errorMessage)}
        ${renderSuccessMessage(state.successMessage)}
        ${renderPerformanceMetrics(state.metrics)}

        <div class="citas__workspace">
            <section class="citas__panel">
                <h3 class="citas__panel-title">Disponibilidad dual</h3>
                ${renderAvailableSlotsGrid(state.availabilitySlots, state.selectedSlot, state.conflictBlocked)}
            </section>

            ${renderBookingPanel(state)}
        </div>

        <section class="citas__panel">
            <h3 class="citas__panel-title">Citas registradas</h3>
            <ul class="citas__list">
                ${renderAppointmentsList(state.appointments, appointmentStatuses, state, { services: serviceCatalog, employees: employeeCatalog })}
            </ul>
        </section>
    `);
}
