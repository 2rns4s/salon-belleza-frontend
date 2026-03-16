import {
    createAppointment,
    createClient,
    deleteAppointment,
    getAppointments,
    getAvailability,
    getClientById,
    getEmployees,
    getServices,
    searchClients,
    updateAppointment,
} from "./citas.service.js";
import { normalizeHttpError } from "./citas.mappers.js";
import {
    APPOINTMENT_STATUSES,
    CITAS_CACHE_TTL_MS,
    CITAS_FILTER_DEBOUNCE_MS,
    CITAS_PERFORMANCE_THRESHOLDS_MS,
    CITAS_UI_MESSAGES,
    CITAS_VIEW_MODES,
} from "./citas.constants.js";
import {
    renderAgendaPanel,
    renderCitasShell,
    renderEmployeeOptions,
    renderServiceOptions,
} from "./citas.view.js";

let currentAbortController = null;
let filterDebounceTimer = null;
let domContainer = null;
let agendaPanelContainer = null;

const listenersRegistry = {
    shellSubmit: null,
    shellClick: null,
    shellChange: null,
    panelSubmit: null,
    panelClick: null,
};

const availabilityCache = new Map();
const CATALOG_LOAD_ERROR_MESSAGE = "Error al cargar los catalogos. Pulsa Recargar para reintentar.";

// Catalogo de servicios y empleados cargado al inicializar.
let serviceCatalog = [];
let employeeCatalog = [];
let filteredEmployees = [];
let catalogLoadError = false;
let knownClientsById = new Map();

function getTodayDate() {
    const today = new Date();
    const localIso = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
    return localIso.slice(0, 10);
}

function getNowMs() {
    if (globalThis.performance && typeof globalThis.performance.now === "function") {
        return globalThis.performance.now();
    }

    return Date.now();
}

function createInitialState() {
    return {
        currentView: CITAS_VIEW_MODES.DAY,
        selectedDate: getTodayDate(),
        selectedServiceId: "",
        selectedEmployeeId: "",
        selectedSlot: null,
        selectedClient: null,
        loadingAgenda: false,
        loadingClients: false,
        savingAction: null,
        conflictBlocked: false,
        errorMessage: null,
        successMessage: null,
        bookingErrors: {},
        quickAddErrors: {},
        appointments: [],
        availabilitySlots: [],
        clientSearch: {
            documentNumber: "",
            phone: "",
            name: "",
            searched: false,
            results: [],
            showQuickAdd: false,
            errorMessage: null,
        },
        quickAddForm: {
            firstName: "",
            lastName: "",
            phone: "",
            documentNumber: "",
        },
        metrics: {
            agendaLoadMs: null,
            availabilityRefreshMs: null,
        },
    };
}

let state = createInitialState();

function resolveCitasContainer(container) {
    if (container instanceof Element) {
        return container;
    }

    if (typeof document === "undefined") {
        return null;
    }

    const appContent = document.querySelector(".app__content");
    return appContent instanceof Element ? appContent : null;
}

function removeShellListeners() {
    if (!domContainer) {
        return;
    }

    if (listenersRegistry.shellSubmit) {
        domContainer.removeEventListener("submit", listenersRegistry.shellSubmit);
        listenersRegistry.shellSubmit = null;
    }

    if (listenersRegistry.shellClick) {
        domContainer.removeEventListener("click", listenersRegistry.shellClick, true);
        listenersRegistry.shellClick = null;
    }

    if (listenersRegistry.shellChange) {
        domContainer.removeEventListener("change", listenersRegistry.shellChange);
        listenersRegistry.shellChange = null;
    }
}

function removePanelListeners() {
    if (!agendaPanelContainer) {
        return;
    }

    if (listenersRegistry.panelSubmit) {
        agendaPanelContainer.removeEventListener("submit", listenersRegistry.panelSubmit);
        listenersRegistry.panelSubmit = null;
    }

    if (listenersRegistry.panelClick) {
        agendaPanelContainer.removeEventListener("click", listenersRegistry.panelClick);
        listenersRegistry.panelClick = null;
    }
}

function registerShellListeners(handlers = {}) {
    if (!domContainer) {
        return;
    }

    listenersRegistry.shellSubmit = (event) => {
        const formElement = event.target;
        if (!(formElement instanceof HTMLFormElement) || formElement.id !== "citas-filter-form") {
            return;
        }

        event.preventDefault();
        handlers.onFilterSubmit?.(new FormData(formElement));
    };

    listenersRegistry.shellClick = (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const refreshButton = target.closest("#citas-refresh-btn");
        if (!refreshButton) {
            return;
        }

        event.preventDefault();
        handlers.onRefreshClick?.();
    };

    listenersRegistry.shellChange = (event) => {
        const targetElement = event.target;

        if (targetElement instanceof HTMLInputElement && targetElement.name === "selectedDate") {
            handlers.onDateChange?.(String(targetElement.value || ""));
            return;
        }

        if (!(targetElement instanceof HTMLSelectElement)) {
            return;
        }

        if (targetElement.id === "citas-service-select") {
            handlers.onServiceChange?.(String(targetElement.value || ""));
            return;
        }

        if (targetElement.id === "citas-employee-select") {
            handlers.onEmployeeChange?.(String(targetElement.value || ""));
            return;
        }

        if (targetElement.id === "citas-view-mode") {
            handlers.onViewModeChange?.(String(targetElement.value || ""));
        }
    };

    domContainer.addEventListener("submit", listenersRegistry.shellSubmit);
    domContainer.addEventListener("click", listenersRegistry.shellClick, true);
    domContainer.addEventListener("change", listenersRegistry.shellChange);
}

function parseNumericAttributeValue(element, attributeName) {
    if (!element) {
        return 0;
    }

    return Number(element.getAttribute(attributeName) || 0);
}

function resolveAppointmentStatusValue(appointmentId) {
    if (!agendaPanelContainer) {
        return "";
    }

    const statusSelect = agendaPanelContainer.querySelector(`#citas-status-${appointmentId}`);
    return statusSelect instanceof HTMLSelectElement
        ? String(statusSelect.value || "")
        : "";
}

function handlePanelClick(target, event, handlers = {}) {
    const slotButton = target.closest(".citas__slot");
    if (slotButton) {
        event.preventDefault();
        handlers.onSlotSelect?.(slotButton.getAttribute("data-slot-datetime"));
        return;
    }

    const selectClientButton = target.closest(".citas__client-select-btn");
    if (selectClientButton) {
        event.preventDefault();
        handlers.onClientSelect?.(parseNumericAttributeValue(selectClientButton, "data-client-id"));
        return;
    }

    const showQuickAddButton = target.closest("#citas-show-quick-add-btn");
    if (showQuickAddButton) {
        event.preventDefault();
        handlers.onShowQuickAdd?.();
        return;
    }

    const createButton = target.closest("#citas-create-appointment-btn");
    if (createButton) {
        event.preventDefault();
        handlers.onCreateAppointment?.();
        return;
    }

    const updateButton = target.closest(".citas__appointment-update-btn");
    if (updateButton) {
        event.preventDefault();

        const appointmentId = parseNumericAttributeValue(updateButton, "data-appointment-id");
        handlers.onUpdateAppointment?.(appointmentId, resolveAppointmentStatusValue(appointmentId));
        return;
    }

    const deleteButton = target.closest(".citas__appointment-delete-btn");
    if (deleteButton) {
        event.preventDefault();
        handlers.onDeleteAppointment?.(parseNumericAttributeValue(deleteButton, "data-appointment-id"));
    }
}

function registerPanelListeners(handlers = {}) {
    if (!agendaPanelContainer) {
        return;
    }

    listenersRegistry.panelSubmit = (event) => {
        const formElement = event.target;
        if (!(formElement instanceof HTMLFormElement)) {
            return;
        }

        if (formElement.id === "citas-client-search-form") {
            event.preventDefault();
            handlers.onClientSearchSubmit?.(new FormData(formElement));
            return;
        }

        if (formElement.id === "citas-quick-add-form") {
            event.preventDefault();
            handlers.onQuickAddSubmit?.(new FormData(formElement));
        }
    };

    listenersRegistry.panelClick = (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        handlePanelClick(target, event, handlers);
    };

    agendaPanelContainer.addEventListener("submit", listenersRegistry.panelSubmit);
    agendaPanelContainer.addEventListener("click", listenersRegistry.panelClick);
}

function cleanupCitasView() {
    removePanelListeners();
    removeShellListeners();

    if (domContainer instanceof Element) {
        domContainer.innerHTML = "";
    }

    agendaPanelContainer = null;
    domContainer = null;
}

function mountCitasView({
    container,
    state: nextState,
    viewModes,
    appointmentStatuses,
    serviceCatalog,
    filteredEmployees,
    catalogLoadError,
    handlers,
}) {
    cleanupCitasView();

    domContainer = resolveCitasContainer(container);
    if (!domContainer) {
        return false;
    }

    domContainer.innerHTML = renderCitasShell({
        state: nextState,
        viewModes,
        serviceCatalog,
        filteredEmployees,
        catalogLoadError,
    });

    agendaPanelContainer = domContainer.querySelector("#citas-agenda-panel");

    registerShellListeners(handlers);
    registerPanelListeners(handlers);

    if (agendaPanelContainer) {
        agendaPanelContainer.innerHTML = renderAgendaPanel({
            state: nextState,
            appointmentStatuses,
        });
    }

    return true;
}

function syncCatalogFilters({
    serviceCatalog: nextServiceCatalog = [],
    filteredEmployees: nextFilteredEmployees = [],
    selectedServiceId = "",
    selectedEmployeeId = "",
    catalogLoadError: hasCatalogError = false,
} = {}) {
    if (!domContainer) {
        return;
    }

    const serviceSelect = domContainer.querySelector("#citas-service-select");
    if (serviceSelect instanceof HTMLSelectElement) {
        serviceSelect.innerHTML = renderServiceOptions({
            services: nextServiceCatalog,
            selectedServiceId,
            hasCatalogError,
        });
        serviceSelect.disabled = hasCatalogError;
        serviceSelect.value = String(selectedServiceId || "");
    }

    const employeeSelect = domContainer.querySelector("#citas-employee-select");
    if (employeeSelect instanceof HTMLSelectElement) {
        employeeSelect.innerHTML = renderEmployeeOptions({
            employees: nextFilteredEmployees,
            selectedEmployeeId,
            hasService: Boolean(selectedServiceId),
            hasCatalogError,
        });
        employeeSelect.disabled = hasCatalogError || !selectedServiceId;
        employeeSelect.value = String(selectedEmployeeId || "");
    }
}

function getCacheKey(date, serviceId, employeeId) {
    return `${date}|${serviceId || "none"}|${employeeId || "none"}`;
}

function readAvailabilityCache(cacheKey) {
    const cachedEntry = availabilityCache.get(cacheKey);
    if (!cachedEntry) {
        return null;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
        availabilityCache.delete(cacheKey);
        return null;
    }

    return cachedEntry.slots;
}

function writeAvailabilityCache(cacheKey, slots) {
    availabilityCache.set(cacheKey, {
        slots,
        expiresAt: Date.now() + CITAS_CACHE_TTL_MS,
    });
}

function invalidateCache() {
    availabilityCache.clear();
}

function warnSlowMetric(metricName, metricValue, thresholdMs) {
    if (metricValue <= thresholdMs) {
        return;
    }

    console.warn(
        `[citas] ${metricName} supero el umbral: ${metricValue.toFixed(2)}ms > ${thresholdMs}ms`,
    );
}

function clearFormErrors() {
    state.bookingErrors = {};
    state.quickAddErrors = {};
    state.clientSearch.errorMessage = null;
}

function clearMessages() {
    state.errorMessage = null;
    state.successMessage = null;
}

function isPlaceholderClientName(clientName, clientId = 0) {
    const normalizedName = String(clientName || "").trim();

    if (!normalizedName || normalizedName === "Cliente sin nombre") {
        return true;
    }

    if (clientId > 0 && normalizedName === `Cliente #${clientId}`) {
        return true;
    }

    return /^Cliente\s*#\d+$/i.test(normalizedName);
}

function cacheKnownClient(clientData = {}) {
    const clientId = Number(clientData.id);
    if (!Number.isFinite(clientId) || clientId <= 0) {
        return;
    }

    knownClientsById.set(clientId, {
        id: clientId,
        fullName: String(clientData.fullName || "").trim(),
        phone: String(clientData.phone || "").trim(),
    });
}

async function hydrateAppointmentsClients(appointments = [], signal) {
    const normalizedAppointments = Array.isArray(appointments) ? appointments : [];
    const pendingClientIds = new Set();

    normalizedAppointments.forEach((appointment) => {
        const clientId = Number(appointment?.client?.id);
        if (!Number.isFinite(clientId) || clientId <= 0) {
            return;
        }

        const appointmentClientName = String(appointment.client?.fullName || "").trim();
        if (!isPlaceholderClientName(appointmentClientName, clientId)) {
            cacheKnownClient(appointment.client);
            return;
        }

        const cachedClient = knownClientsById.get(clientId);
        if (cachedClient && !isPlaceholderClientName(cachedClient.fullName, clientId)) {
            return;
        }

        pendingClientIds.add(clientId);
    });

    if (pendingClientIds.size > 0) {
        await Promise.allSettled(
            [...pendingClientIds].map(async (clientId) => {
                const resolvedClient = await getClientById(clientId, { signal });
                cacheKnownClient(resolvedClient);
            }),
        );
    }

    return normalizedAppointments.map((appointment) => {
        const clientId = Number(appointment?.client?.id);
        if (!Number.isFinite(clientId) || clientId <= 0) {
            return appointment;
        }

        const cachedClient = knownClientsById.get(clientId);
        if (!cachedClient || isPlaceholderClientName(cachedClient.fullName, clientId)) {
            return appointment;
        }

        return {
            ...appointment,
            client: {
                ...appointment.client,
                id: clientId,
                fullName: cachedClient.fullName,
                phone: cachedClient.phone || String(appointment.client?.phone || "").trim(),
            },
        };
    });
}

function renderAgendaPanelOnly() {
    if (!agendaPanelContainer) {
        return;
    }

    agendaPanelContainer.innerHTML = renderAgendaPanel({
        state,
        appointmentStatuses: APPOINTMENT_STATUSES,
        serviceCatalog,
        employeeCatalog,
    });
}

// Filtra empleados elegibles segun el servicio seleccionado.
function filterEmployeesByService(serviceId) {
    const numericServiceId = Number(serviceId);

    if (!numericServiceId) {
        filteredEmployees = [];
        return;
    }

    filteredEmployees = employeeCatalog.filter(
        (emp) => emp.serviceIds.includes(numericServiceId),
    );
}

// Carga los catalogos de servicios y empleados en paralelo.
async function loadCatalogs() {
    try {
        const [services, employees] = await Promise.all([
            getServices(),
            getEmployees(),
        ]);

        const hadCatalogError = catalogLoadError;
        serviceCatalog = services;
        employeeCatalog = employees;
        catalogLoadError = false;

        const selectedServiceStillExists = serviceCatalog.some(
            (service) => String(service.id) === state.selectedServiceId,
        );
        if (state.selectedServiceId && !selectedServiceStillExists) {
            state.selectedServiceId = "";
        }

        if (hadCatalogError && state.errorMessage === CATALOG_LOAD_ERROR_MESSAGE) {
            state.errorMessage = null;
        }
    } catch {
        serviceCatalog = [];
        employeeCatalog = [];
        filteredEmployees = [];
        catalogLoadError = true;
        state.selectedServiceId = "";
        state.selectedEmployeeId = "";
        state.errorMessage = CATALOG_LOAD_ERROR_MESSAGE;

        return;
    }

    filterEmployeesByService(state.selectedServiceId);

    if (state.selectedEmployeeId) {
        const stillEligible = filteredEmployees.some(
            (emp) => String(emp.id) === state.selectedEmployeeId,
        );

        if (!stillEligible) {
            state.selectedEmployeeId = "";
        }
    }
}

async function loadAgendaData({ forceRefresh = false, preserveErrorMessage = false } = {}) {
    const agendaStart = getNowMs();

    state.loadingAgenda = true;
    state.metrics.agendaLoadMs = null;
    state.metrics.availabilityRefreshMs = null;
    state.successMessage = null;

    if (!preserveErrorMessage) {
        state.errorMessage = null;
    }

    renderAgendaPanelOnly();

    try {
        currentAbortController?.abort();
        currentAbortController = new AbortController();

        const requestSignal = currentAbortController.signal;
        const appointmentsPromise = getAppointments({
            date: state.selectedDate,
            serviceId: state.selectedServiceId,
            employeeId: state.selectedEmployeeId,
            signal: requestSignal,
        });

        let availabilitySlots = [];

        if (state.selectedServiceId) {
            const availabilityStart = getNowMs();
            const cacheKey = getCacheKey(
                state.selectedDate,
                state.selectedServiceId,
                state.selectedEmployeeId,
            );

            const cachedSlots = forceRefresh ? null : readAvailabilityCache(cacheKey);

            if (cachedSlots) {
                availabilitySlots = cachedSlots;
            } else {
                availabilitySlots = await getAvailability({
                    date: state.selectedDate,
                    serviceId: state.selectedServiceId,
                    employeeId: state.selectedEmployeeId,
                    signal: requestSignal,
                });

                writeAvailabilityCache(cacheKey, availabilitySlots);
            }

            state.metrics.availabilityRefreshMs = getNowMs() - availabilityStart;
            warnSlowMetric(
                "availabilityRefreshMs",
                state.metrics.availabilityRefreshMs,
                CITAS_PERFORMANCE_THRESHOLDS_MS.availabilityRefreshMs,
            );
        }

        const appointments = await appointmentsPromise;

        if (requestSignal.aborted) {
            return;
        }

        const hydratedAppointments = await hydrateAppointmentsClients(appointments, requestSignal);

        if (requestSignal.aborted) {
            return;
        }

        state.appointments = hydratedAppointments;
        state.availabilitySlots = availabilitySlots;

        if (
            state.selectedSlot
            && !availabilitySlots.some((slot) => slot.slotDateTime === state.selectedSlot)
        ) {
            state.selectedSlot = null;
        }

        state.metrics.agendaLoadMs = getNowMs() - agendaStart;
        warnSlowMetric(
            "agendaLoadMs",
            state.metrics.agendaLoadMs,
            CITAS_PERFORMANCE_THRESHOLDS_MS.agendaLoadMs,
        );
    } catch (error) {
        if (error?.name === "AbortError") {
            return;
        }

        const normalizedError = normalizeHttpError(error);
        state.errorMessage = normalizedError.message;
        state.availabilitySlots = [];
    } finally {
        if (currentAbortController && !currentAbortController.signal.aborted) {
            state.loadingAgenda = false;
            if (state.conflictBlocked) {
                state.conflictBlocked = false;
            }
            renderAgendaPanelOnly();
        }
    }
}

function scheduleDebouncedAgendaLoad(options = {}) {
    clearTimeout(filterDebounceTimer);

    filterDebounceTimer = setTimeout(() => {
        void loadAgendaData(options);
    }, CITAS_FILTER_DEBOUNCE_MS);
}

function updateFiltersState(formData) {
    state.selectedDate = String(formData.get("selectedDate") || getTodayDate());
    state.selectedServiceId = String(formData.get("selectedServiceId") || "").trim();
    state.selectedEmployeeId = String(formData.get("selectedEmployeeId") || "").trim();
}

function handleFilterSubmit(formData) {
    updateFiltersState(formData);
    state.selectedSlot = null;

    filterEmployeesByService(state.selectedServiceId);

    // Limpia empleado si ya no es elegible para el servicio seleccionado
    if (state.selectedEmployeeId) {
        const stillEligible = filteredEmployees.some(
            (emp) => String(emp.id) === state.selectedEmployeeId,
        );

        if (!stillEligible) {
            state.selectedEmployeeId = "";
        }
    }

    clearFormErrors();
    clearMessages();

    scheduleDebouncedAgendaLoad();
}

async function handleRefreshClick() {
    clearTimeout(filterDebounceTimer);
    invalidateCache();
    clearMessages();

    await loadCatalogs();
    syncCatalogFilters({
        serviceCatalog,
        filteredEmployees,
        selectedServiceId: state.selectedServiceId,
        selectedEmployeeId: state.selectedEmployeeId,
        catalogLoadError,
    });

    await loadAgendaData({ forceRefresh: true });
}

function handleServiceChange(serviceId) {
    if (catalogLoadError) {
        state.selectedServiceId = "";
        state.selectedEmployeeId = "";
        filteredEmployees = [];
        return;
    }

    state.selectedServiceId = String(serviceId || "").trim();
    filterEmployeesByService(state.selectedServiceId);

    // Limpia empleado si ya no es elegible
    if (state.selectedEmployeeId) {
        const stillEligible = filteredEmployees.some(
            (emp) => String(emp.id) === state.selectedEmployeeId,
        );

        if (!stillEligible) {
            state.selectedEmployeeId = "";
        }
    }

    // Auto-refresca la disponibilidad cuando ya hay fecha + servicio seleccionados
    if (state.selectedDate && state.selectedServiceId) {
        state.selectedSlot = null;
        scheduleDebouncedAgendaLoad();
    }
}

function handleEmployeeChange(employeeId) {
    if (catalogLoadError) {
        state.selectedEmployeeId = "";
        return;
    }

    state.selectedEmployeeId = String(employeeId || "").trim();

    if (state.selectedEmployeeId) {
        const stillEligible = filteredEmployees.some(
            (emp) => String(emp.id) === state.selectedEmployeeId,
        );

        if (!stillEligible) {
            state.selectedEmployeeId = "";
        }
    }

    state.selectedSlot = null;

    if (state.selectedDate && state.selectedServiceId) {
        scheduleDebouncedAgendaLoad();
    }
}

function handleViewModeChange(nextViewMode) {
    state.currentView = nextViewMode === CITAS_VIEW_MODES.WEEK
        ? CITAS_VIEW_MODES.WEEK
        : CITAS_VIEW_MODES.DAY;

    renderAgendaPanelOnly();
}

// Auto-refresca disponibilidad cuando el usuario cambia la fecha y ya hay servicio seleccionado.
function handleDateChange(newDate) {
    const parsedDate = String(newDate || "").trim();
    if (!parsedDate || parsedDate === state.selectedDate) {
        return;
    }

    state.selectedDate = parsedDate;
    state.selectedSlot = null;

    if (state.selectedDate && state.selectedServiceId) {
        scheduleDebouncedAgendaLoad();
    }
}

function selectSlot(slotDateTime) {
    if (!slotDateTime || state.conflictBlocked) {
        return;
    }

    state.selectedSlot = slotDateTime;
    delete state.bookingErrors.fechaInicio;
    clearMessages();

    renderAgendaPanelOnly();
}

function prefillQuickAddFromSearch() {
    if (state.clientSearch.documentNumber && !state.quickAddForm.documentNumber) {
        state.quickAddForm.documentNumber = state.clientSearch.documentNumber;
    }

    if (state.clientSearch.phone && !state.quickAddForm.phone) {
        state.quickAddForm.phone = state.clientSearch.phone;
    }

    if (state.clientSearch.name && !state.quickAddForm.firstName) {
        const [firstName = "", ...rest] = state.clientSearch.name.split(" ");
        state.quickAddForm.firstName = firstName.trim();
        state.quickAddForm.lastName = rest.join(" ").trim();
    }
}

function markSearchWithoutResults() {
    state.clientSearch.results = [];
    state.clientSearch.showQuickAdd = true;
    prefillQuickAddFromSearch();
}

async function handleClientSearchSubmit(formData) {
    state.clientSearch.documentNumber = String(formData.get("documentNumber") || "").trim();
    state.clientSearch.phone = String(formData.get("phone") || "").trim();
    state.clientSearch.name = String(formData.get("name") || "").trim();
    state.clientSearch.searched = true;
    state.clientSearch.errorMessage = null;

    clearMessages();

    if (!state.clientSearch.documentNumber && !state.clientSearch.phone && !state.clientSearch.name) {
        state.clientSearch.errorMessage = CITAS_UI_MESSAGES.searchCriteriaRequired;
        renderAgendaPanelOnly();
        return;
    }

    state.loadingClients = true;
    state.clientSearch.results = [];
    state.clientSearch.showQuickAdd = false;
    state.quickAddErrors = {};

    renderAgendaPanelOnly();

    try {
        const response = await searchClients({
            documentNumber: state.clientSearch.documentNumber,
            phone: state.clientSearch.phone,
            name: state.clientSearch.name,
        });

        const items = Array.isArray(response?.items) ? response.items : [];
        state.clientSearch.results = items;
        items.forEach((client) => cacheKnownClient(client));

        if (items.length === 0) {
            markSearchWithoutResults();
        } else {
            state.clientSearch.showQuickAdd = false;

            if (state.selectedClient) {
                const selectedClientExists = items.some((client) => client.id === state.selectedClient.id);
                if (!selectedClientExists) {
                    state.selectedClient = null;
                }
            }
        }
    } catch (error) {
        const normalizedError = normalizeHttpError(error);

        if (normalizedError.status === 404) {
            markSearchWithoutResults();
        } else {
            state.errorMessage = normalizedError.message;
        }
    } finally {
        state.loadingClients = false;
        renderAgendaPanelOnly();
    }
}

function handleClientSelect(clientId) {
    const selectedClient = state.clientSearch.results.find((client) => client.id === clientId);
    if (!selectedClient) {
        return;
    }

    state.selectedClient = selectedClient;
    cacheKnownClient(selectedClient);
    delete state.bookingErrors.idCliente;

    clearMessages();
    state.successMessage = `Cliente seleccionado: ${selectedClient.fullName}`;

    renderAgendaPanelOnly();
}

function mapQuickAddFormData(formData) {
    return {
        firstName: String(formData.get("firstName") || "").trim(),
        lastName: String(formData.get("lastName") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        documentNumber: String(formData.get("documentNumber") || "").trim(),
    };
}

async function handleQuickAddSubmit(formData) {
    state.quickAddForm = mapQuickAddFormData(formData);
    state.quickAddErrors = {};

    clearMessages();

    state.savingAction = "quick-add";
    renderAgendaPanelOnly();

    try {
        const createdClient = await createClient(state.quickAddForm);

        state.selectedClient = createdClient;
        state.clientSearch.results = [createdClient];
        cacheKnownClient(createdClient);
        state.clientSearch.showQuickAdd = false;

        state.quickAddForm = {
            firstName: "",
            lastName: "",
            phone: createdClient.phone || "",
            documentNumber: createdClient.documentNumber || "",
        };

        state.successMessage = CITAS_UI_MESSAGES.quickAddSuccess;
    } catch (error) {
        const normalizedError = normalizeHttpError(error);

        if (normalizedError.status === 400) {
            state.quickAddErrors = normalizedError.fieldErrors || {};
        }

        state.errorMessage = normalizedError.message;
    } finally {
        state.savingAction = null;
        renderAgendaPanelOnly();
    }
}

function validateCreateAppointmentInput() {
    const validationErrors = {};

    if (!state.selectedSlot) {
        validationErrors.fechaInicio = CITAS_UI_MESSAGES.slotRequired;
    }

    if (!state.selectedClient?.id) {
        validationErrors.idCliente = CITAS_UI_MESSAGES.clientRequired;
    }

    if (!state.selectedServiceId) {
        validationErrors.idServicio = CITAS_UI_MESSAGES.serviceRequired;
    }

    if (!state.selectedEmployeeId) {
        validationErrors.idEmpleado = CITAS_UI_MESSAGES.employeeRequired;
    }

    return validationErrors;
}

async function reconcileAfterConflict(conflictMessage) {
    state.conflictBlocked = true;
    state.errorMessage = conflictMessage;
    state.successMessage = null;

    invalidateCache();
    renderAgendaPanelOnly();

    await loadAgendaData({
        forceRefresh: true,
        preserveErrorMessage: true,
    });
}

async function refreshAfterMutation(successMessage) {
    invalidateCache();
    await loadAgendaData({ forceRefresh: true });

    state.successMessage = successMessage;
}

async function handleCreateAppointment() {
    if (state.loadingAgenda || state.conflictBlocked || state.savingAction) {
        return;
    }

    const validationErrors = validateCreateAppointmentInput();
    if (Object.keys(validationErrors).length > 0) {
        state.bookingErrors = validationErrors;
        state.errorMessage = Object.values(validationErrors)[0];
        state.successMessage = null;
        renderAgendaPanelOnly();
        return;
    }

    clearMessages();
    state.bookingErrors = {};

    state.savingAction = "create";
    renderAgendaPanelOnly();

    try {
        await createAppointment({
            clientId: state.selectedClient.id,
            serviceId: state.selectedServiceId,
            employeeId: state.selectedEmployeeId,
            startDateTime: state.selectedSlot,
        });

        state.selectedSlot = null;
        await refreshAfterMutation(CITAS_UI_MESSAGES.appointmentCreated);
    } catch (error) {
        const normalizedError = normalizeHttpError(error);

        if (normalizedError.status === 400) {
            state.bookingErrors = normalizedError.fieldErrors || {};
            state.errorMessage = normalizedError.message;
        } else if (normalizedError.status === 409) {
            await reconcileAfterConflict(normalizedError.message);
        } else {
            state.errorMessage = normalizedError.message;
        }
    } finally {
        state.savingAction = null;
        renderAgendaPanelOnly();
    }
}

async function handleUpdateAppointment(appointmentId, nextStatus) {
    if (!appointmentId || !nextStatus || state.savingAction || state.conflictBlocked) {
        return;
    }

    state.savingAction = `update-${appointmentId}`;
    clearMessages();
    renderAgendaPanelOnly();

    try {
        await updateAppointment(appointmentId, { status: nextStatus });
        await refreshAfterMutation(CITAS_UI_MESSAGES.appointmentUpdated);
    } catch (error) {
        const normalizedError = normalizeHttpError(error);

        if (normalizedError.status === 409) {
            await reconcileAfterConflict(normalizedError.message);
        } else {
            state.errorMessage = normalizedError.message;
        }
    } finally {
        state.savingAction = null;
        renderAgendaPanelOnly();
    }
}

async function handleDeleteAppointment(appointmentId) {
    if (!appointmentId || state.savingAction || state.conflictBlocked) {
        return;
    }

    state.savingAction = `delete-${appointmentId}`;
    clearMessages();
    renderAgendaPanelOnly();

    try {
        await deleteAppointment(appointmentId);
        await refreshAfterMutation(CITAS_UI_MESSAGES.appointmentDeleted);
    } catch (error) {
        const normalizedError = normalizeHttpError(error);

        if (normalizedError.status === 409) {
            await reconcileAfterConflict(normalizedError.message);
        } else {
            state.errorMessage = normalizedError.message;
        }
    } finally {
        state.savingAction = null;
        renderAgendaPanelOnly();
    }
}

function handleShowQuickAdd() {
    state.clientSearch.showQuickAdd = true;
    prefillQuickAddFromSearch();
    renderAgendaPanelOnly();
}

export async function initCitas(container) {
    cleanupCitasView();
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = null;

    currentAbortController?.abort();
    currentAbortController = null;

    state = createInitialState();
    invalidateCache();
    catalogLoadError = false;
    knownClientsById = new Map();

    // Cargar catalogos antes de renderizar la shell
    await loadCatalogs();

    const mounted = mountCitasView({
        container,
        state,
        viewModes: CITAS_VIEW_MODES,
        appointmentStatuses: APPOINTMENT_STATUSES,
        serviceCatalog,
        filteredEmployees,
        catalogLoadError,
        handlers: {
            onFilterSubmit: handleFilterSubmit,
            onRefreshClick: () => {
                void handleRefreshClick();
            },
            onViewModeChange: handleViewModeChange,
            onServiceChange: (serviceId) => {
                handleServiceChange(serviceId);
                syncCatalogFilters({
                    serviceCatalog,
                    filteredEmployees,
                    selectedServiceId: state.selectedServiceId,
                    selectedEmployeeId: state.selectedEmployeeId,
                    catalogLoadError,
                });
            },
            onEmployeeChange: handleEmployeeChange,
            onDateChange: handleDateChange,
            onClientSearchSubmit: (formData) => {
                void handleClientSearchSubmit(formData);
            },
            onQuickAddSubmit: (formData) => {
                void handleQuickAddSubmit(formData);
            },
            onSlotSelect: selectSlot,
            onClientSelect: handleClientSelect,
            onShowQuickAdd: handleShowQuickAdd,
            onCreateAppointment: () => {
                void handleCreateAppointment();
            },
            onUpdateAppointment: (appointmentId, nextStatus) => {
                if (APPOINTMENT_STATUSES.includes(nextStatus)) {
                    void handleUpdateAppointment(appointmentId, nextStatus);
                }
            },
            onDeleteAppointment: (appointmentId) => {
                void handleDeleteAppointment(appointmentId);
            },
        },
    });

    if (!mounted) {
        return;
    }

    void loadAgendaData();
}
